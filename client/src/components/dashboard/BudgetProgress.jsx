import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import { formatMoney } from "../../lib/format";

/** Status of spending against a budget. Status color always ships with icon + label. */
export function budgetStatus(percent) {
  if (percent > 100) return { tone: "over", label: "Over budget", icon: OctagonAlert, bar: "bg-expense", text: "text-expense" };
  if (percent >= 80) return { tone: "near", label: "Close to limit", icon: AlertTriangle, bar: "bg-warn", text: "text-warn" };
  return { tone: "ok", label: "On track", icon: CheckCircle2, bar: "bg-brand-600", text: "text-income" };
}

export function BudgetProgress({ budget, size = "md" }) {
  const { amount, spent, remaining, percent } = budget;
  const status = budgetStatus(percent);
  const StatusIcon = status.icon;
  const h = size === "lg" ? "h-3.5" : "h-2.5";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-ink-soft">
          <span className="text-lg font-extrabold text-ink">{formatMoney(spent)}</span> of {formatMoney(amount)}
        </p>
        <span className="text-sm font-bold text-ink">{percent}%</span>
      </div>
      <div
        className={`mt-2.5 ${h} overflow-hidden rounded-full bg-canvas`}
        role="progressbar"
        aria-label="Budget used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, Math.round(percent))}
        aria-valuetext={`${percent}% of budget used`}
      >
        <div className={`h-full rounded-full ${status.bar}`} style={{ width: `${Math.min(100, percent)}%` }} />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3 text-sm">
        <span className={`inline-flex items-center gap-1.5 font-semibold ${status.text}`}>
          <StatusIcon className="size-4" aria-hidden />
          {status.label}
        </span>
        <span className="text-ink-soft">
          {remaining >= 0 ? (
            <>
              <span className="font-bold text-ink">{formatMoney(remaining)}</span> left
            </>
          ) : (
            <>
              <span className="font-bold text-expense">{formatMoney(-remaining)}</span> over
            </>
          )}
        </span>
      </div>
    </div>
  );
}
