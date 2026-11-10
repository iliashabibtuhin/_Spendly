import { formatDay, formatTxAmount } from "../../lib/format";
import { CategoryIcon } from "../ui/CategoryIcon";

/** Compact row used in the dashboard's recent list and the mobile transaction list. */
export function TransactionListItem({ tx, onClick, actions }) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <div className="group flex items-center gap-2 py-1">
      <Wrapper
        {...(onClick && { type: "button", onClick })}
        className={`${actions ? "-ml-2" : "-mx-2"} flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2.5 text-left ${
          onClick ? "transition-colors hover:bg-canvas/80" : ""
        }`}
      >
        <CategoryIcon icon={tx.category?.icon} color={tx.category?.color} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{tx.description || tx.category?.name}</p>
          <p className="truncate text-xs text-ink-faint">
            {tx.description ? `${tx.category?.name} · ` : ""}
            {formatDay(tx.date)}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-bold ${tx.type === "INCOME" ? "text-income" : "text-expense"}`}>
          {formatTxAmount(tx)}
        </span>
      </Wrapper>
      {actions}
    </div>
  );
}
