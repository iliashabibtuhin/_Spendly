# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Spendly is a personal expense tracker (BDT / ৳). Two independent npm projects, no root package.json:
- `server/`: Express 5 + Prisma 7 (PostgreSQL via `@prisma/adapter-pg`; Neon in production), JWT + bcryptjs, Zod 4. Plain JS ESM.
- `client/`: React 19 + Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`, theme in `src/index.css` `@theme`), React Router v8 (declarative mode, imports from `react-router`), Recharts 3, Zod 4. Plain JSX.

## Commands

Server (run from `server/`):
- `npm run dev`: API on :4000 with reload (`tsx watch src/index.js`)
- `npx prisma migrate dev --name <name>`: after editing `prisma/schema.prisma`. Prisma 7 does **not** auto-generate on migrate; run `npx prisma generate` afterwards (also runs on `npm install` via postinstall).
- `npm run db:seed`: recreates the demo user `demo@spendly.app` / `demo1234` with 6 months of data
- `npx prisma migrate status`, `npm run db:studio`
- `npm run db:deploy` (`prisma migrate deploy`): production migrations (Render build). Never `migrate dev` against Neon production.
- `npm run db:import-sqlite [path]`: one-off copy of the old SQLite `dev.db` into an empty Postgres DB

Client (run from `client/`):
- `npm run dev`: :5173; Vite proxies `/api` to `API_PROXY_TARGET` (default http://localhost:4000)
- `npm run build`, `npm run lint` (oxlint)

There is no test suite. Verify API changes with curl against `/api`, and UI changes by running both dev servers.

## Architecture

### Server
Request flow: `routes/index.js`, then `validate(schema, source)` middleware, then a thin controller, then a service. Things to know:
- **Prisma 7 specifics:** the generator is `prisma-client` with output `src/generated/prisma` (TypeScript, gitignored). It's imported as `../generated/prisma/client.ts`, which is why the server runs through `tsx` instead of plain `node`. The CLI config lives in `prisma.config.ts` (schema path, `DATABASE_URL`, seed command). The datasource block in the schema has no `url`.
- **Environment:** `src/config/env.js` validates env with Zod and exits on failure. It rejects the `.env.example` placeholder JWT secret and requires `DATABASE_URL` to be a `postgres(ql)://` URL. `prisma.config.ts` reads `process.env.DATABASE_URL` (not `env()`) so `prisma generate` works without a database.
- **Search** uses `contains` with `mode: "insensitive"` (Postgres is case-sensitive). `server/dev.db` and `prisma/archive/sqlite-migrations/` are the pre-Postgres SQLite data and history, kept only for `npm run db:import-sqlite`.
- **Validated input:** `validate` stores parsed data on `req.valid.body|query|params`. Controllers must read from `req.valid`, never `req.body`/`req.query`.
- **Zod 4 gotchas** (each one has caused a real bug here):
  - `.default()` still applies inside `.partial()`. Build PATCH schemas from fields that have no defaults, otherwise omitted fields get overwritten. See `updateTransactionSchema` and `updateCategorySchema`.
  - `z.email().trim()` checks the format before trimming. Use `z.string().trim().pipe(z.email())`.
  - Don't use `z.coerce.number()` for money: it turns `true` into 1. `amountSchema` in `validators/common.js` accepts only numbers and numeric strings.
- **Async errors:** Express 5 forwards rejected promises, so there's no asyncHandler. Throw `AppError` (`utils/AppError.js`). `middleware/errorHandler.js` turns every error into `{ error: { code, message, details?: { fields } } }`. Per-field validation errors go in `details.fields`, and the client maps them onto form inputs.
- **Ownership:** every service query includes `userId`. To touch a single record, use `findFirst({ where: { id, userId } })` or `deleteMany({ where: { id, userId } })` and return 404 for records the user doesn't own. Transactions must reference a category owned by the same user whose `type` matches (`assertCategory` in `transaction.service.js`).
- **Money:** stored as integer minor units (poisha). Convert only at the service boundary with `utils/money.js` (`toMinor`/`toMajor`). The API speaks taka with ≤2 decimals.
- **Dates:** transaction dates are calendar days stored as UTC midnight. Use `utils/dates.js` (`parseDay`, `formatDay`, `monthRange` with an exclusive end, `shiftMonth`). Months are `"YYYY-MM"` strings, and that is also the Budget key (`@@unique([userId, month])`).
- **Server-side totals:** totals are never accepted from the client. `summary.service.js` builds the dashboard (monthly totals, all-time balance, category breakdown, 6-month trend, recent transactions, budget status) from aggregates.
- **Default categories:** `DEFAULT_CATEGORIES` in `category.service.js` are copied per user at registration (inside the same `$transaction`) and by the seed. They have `isDefault: true` and can't be edited or deleted. Category `icon` is a key into the client's `lib/icons.js` map.

### Client
- **API client:** `lib/api.js` sends the Bearer token from localStorage (`spendly.token`) and throws `ApiError` with `.fields` (null unless there are per-field errors). A 401 while holding a token triggers logout via `setUnauthorizedHandler`, which `AuthContext` registers.
- **Data fetching:** `hooks/useApi(path, query)` refetches when the path or the JSON-serialized query changes, keeps stale data during refetch, and exposes `reload()`.
- **Transaction modal:** one shared add/edit modal lives in `context/TransactionModalContext.jsx` (`openCreate`, `openEdit`, `version`). Pages call `reload()` in an effect when `version` changes, so any page refreshes after a transaction is saved anywhere. Any new page that shows transaction-derived data needs this effect, because the add button in the layout is available on every page.
- **Routes:** `ProtectedRoute` / `PublicOnlyRoute` (`components/layout/RouteGuards.jsx`) guard routes. The dashboard and budget pages keep the selected month in `?month=` via `hooks/useMonthParam`.
- **Validation:** forms validate with the Zod schemas in `lib/schemas.js` through `check()`, which returns `{ data }` or `{ errors }`, then also apply server `err.fields`. The server remains the source of truth.
- **UI primitives:** these are in `components/ui/`.
  - `Field` is a render-prop that passes `id` and `aria-*` attributes to its control.
  - `Modal` is built on the native `<dialog>` element.
  - `buttonClass()` styles a `Link` as a button. Never nest `<button>` inside `<Link>`.
  - `Modal` is a bottom sheet below `sm` and a centered card above it.
  - `Input` and `Select` take `size` (`md` | `lg`) and `prefix` (text or an element such as `CategoryIcon size="xs"`). `Select` draws its own chevron because `index.css` sets `appearance: none` on all selects.
  - Every page starts with `PageHeader` (`title`, `description`, `actions`). Card header links ("View all", "Edit") use `cardLinkClass` from `Card.jsx`.
  - Loading states use skeletons shaped like the final content (`Skeleton`, `ListSkeleton` in `States.jsx`), not spinners. `Spinner` is kept for the full-screen session check.
- **Formatting:** `lib/format.js` handles money as `৳` with en-IN (lakh) grouping. Day/month strings are formatted from the string itself, not `Date` in local time.

### Design conventions
- Light theme, indigo primary (`brand-*`), with tokens in `src/index.css`.
- Income is `income` (#0E9F6E) and expense is `expense` (#E5484D) everywhere, including the trend chart and transaction amounts (expense amounts are red, not ink).
- That green/red pair is weak for red-green colorblind readers, so charts using it must keep a secondary encoding: the legend, named tooltips and the table view in `TrendChart`.
- The solid-indigo balance card is the only emphasized element; everything else is white cards.
- Stat-card deltas (`Delta` in `StatCard.jsx`) compare against the previous month, taken from `summary.trend.at(-2)`. They are colored good/bad with `goodWhen`, and always show an arrow and a number too.
- Category spending is a total, a part-to-whole bar (top 5 plus "others") and a ranked list, deliberately not a donut. Each category keeps its own color.
- Font is Manrope. Noto Sans Bengali is loaded only to supply the ৳ glyph, which Manrope lacks.
- Budget status colors always ship with an icon and a label (`budgetStatus()` in `BudgetProgress.jsx`).
- UI inspiration images are in `design-references/`.
