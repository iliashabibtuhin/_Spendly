// One-off import of data from the old SQLite database (dev.db) into the
// PostgreSQL database in DATABASE_URL. Keeps every id, so relations, sessions
// (JWT `sub`) and timestamps survive unchanged.
//
//   npm run db:import-sqlite              # reads ./dev.db
//   npm run db:import-sqlite -- path/to.db
//
// The SQLite file is opened read-only and is never modified. Run it once, on a
// freshly migrated database: it refuses to run if any user being imported
// already exists in PostgreSQL. All rows are written in a single transaction,
// so a failure leaves PostgreSQL unchanged.
// Needs Node 22.13+ (built-in node:sqlite); no SQLite package is required.

import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { prisma } from "../src/lib/prisma.js";

const file = path.resolve(import.meta.dirname, "..", process.argv[2] ?? "dev.db");
const sqlite = new DatabaseSync(file, { readOnly: true });
const rows = (table) => sqlite.prepare(`SELECT * FROM "${table}"`).all();

// Prisma's SQLite storage: DateTime as ISO text (or epoch ms), Boolean as 0/1.
const toDate = (v) => (v == null ? v : new Date(typeof v === "number" ? v : String(v)));
const withDates = (r) => ({ ...r, createdAt: toDate(r.createdAt), updatedAt: toDate(r.updatedAt) });

const users = rows("User").map(withDates);
const categories = rows("Category").map((r) => ({ ...withDates(r), isDefault: Boolean(r.isDefault) }));
const transactions = rows("Transaction").map((r) => ({ ...withDates(r), date: toDate(r.date) }));
const budgets = rows("Budget").map(withDates);
sqlite.close();

async function main() {
  console.log(`Reading ${file}`);
  console.log(
    `Found ${users.length} users, ${categories.length} categories, ` +
      `${transactions.length} transactions, ${budgets.length} budgets.`,
  );

  const clashes = await prisma.user.findMany({
    where: { OR: [{ id: { in: users.map((u) => u.id) } }, { email: { in: users.map((u) => u.email) } }] },
    select: { email: true },
  });
  if (clashes.length) {
    console.error(
      `Aborted: these users already exist in PostgreSQL: ${clashes.map((u) => u.email).join(", ")}.\n` +
        "Import into an empty, freshly migrated database (or delete those users first).",
    );
    process.exitCode = 1;
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({ data: users });
      await tx.category.createMany({ data: categories });
      await tx.transaction.createMany({ data: transactions });
      await tx.budget.createMany({ data: budgets });
    },
    { timeout: 60_000 },
  );

  const [u, c, t, b] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.transaction.count(),
    prisma.budget.count(),
  ]);
  console.log(`Imported. PostgreSQL now has ${u} users, ${c} categories, ${t} transactions, ${b} budgets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
