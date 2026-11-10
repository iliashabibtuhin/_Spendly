import { formatMoney } from "../../lib/format";
import { CategoryIcon } from "../ui/CategoryIcon";

const MAX_SEGMENTS = 5;
const OTHER_COLOR = "#B4B3C8";

/**
 * Expense share per category: a headline total, one part-to-whole bar, then a
 * ranked, directly-labelled list. Category identity never depends on color
 * alone, and each category keeps its own color.
 */
export function CategoryBreakdown({ items, total }) {
  const top = items.slice(0, MAX_SEGMENTS);
  const rest = items.slice(MAX_SEGMENTS);
  const segments = rest.length
    ? [
        ...top,
        {
          id: "other",
          name: `${rest.length} other${rest.length === 1 ? "" : "s"}`,
          color: OTHER_COLOR,
          total: rest.reduce((s, i) => s + i.total, 0),
          percent: Math.round(rest.reduce((s, i) => s + i.percent, 0) * 10) / 10,
        },
      ]
    : top;
  const max = Math.max(...items.map((i) => i.total), 1);

  return (
    <div>
      <p className="text-xs font-semibold text-ink-faint">Total spent</p>
      <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{formatMoney(total)}</p>

      {/* Part-to-whole bar; segments are separated by a 2px surface gap. */}
      <div className="mt-4 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {segments.map((s) => (
          <div
            key={s.id}
            className="h-full first:rounded-l-full last:rounded-r-full"
            style={{ flexGrow: s.total, flexBasis: 0, minWidth: 4, backgroundColor: s.color }}
            title={`${s.name}: ${s.percent}%`}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-3.5">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <CategoryIcon icon={item.icon} color={item.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-semibold">{item.name}</span>
                <span className="shrink-0 font-bold">{formatMoney(item.total)}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-canvas" aria-hidden>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(2, (item.total / max) * 100)}%`, backgroundColor: item.color }}
                  />
                </div>
                <span className="w-11 shrink-0 text-right text-xs font-semibold text-ink-faint">{item.percent}%</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
