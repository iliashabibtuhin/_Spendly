import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";

const tones = {
  income: "bg-income-soft text-income",
  expense: "bg-expense-soft text-expense",
  brand: "bg-brand-50 text-brand-600",
};

/**
 * Month-over-month change. `goodWhen` says whether a rise is good ("up") or bad
 * ("down"), which picks the color; the arrow and text carry the meaning too.
 */
export function Delta({ current, previous, previousLabel, goodWhen = "up" }) {
  if (!previous) return <p className="mt-2 text-xs text-ink-faint">Nothing recorded in {previousLabel}</p>;
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.abs(change) < 10 ? Math.round(Math.abs(change) * 10) / 10 : Math.round(Math.abs(change));
  const up = change > 0;
  const flat = rounded === 0;
  const good = flat ? null : up === (goodWhen === "up");
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const color = good === null ? "bg-canvas text-ink-soft" : good ? "bg-income-soft text-income" : "bg-expense-soft text-expense";
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-bold ${color}`}>
        {!flat && <Icon className="size-3.5" aria-hidden />}
        {flat ? "No change" : `${rounded}%`}
        <span className="sr-only">{flat ? "" : up ? " higher" : " lower"}</span>
      </span>
      vs {previousLabel}
    </p>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "brand", footer, className = "" }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line/70 bg-white p-4 shadow-card sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13px] font-semibold text-ink-soft">{label}</p>
        <span className={`grid size-9 shrink-0 place-items-center rounded-full sm:size-10 ${tones[tone]}`}>
          <Icon className="size-[18px] sm:size-5" strokeWidth={2.4} aria-hidden />
        </span>
      </div>
      <p className="-mt-1 truncate text-xl font-extrabold tracking-tight sm:text-[26px] sm:leading-8">{value}</p>
      {footer}
    </div>
  );
}

/** The one emphasised card on the dashboard: overall balance. */
export function BalanceCard({ balance, net }) {
  return (
    <div className="relative col-span-2 min-w-0 overflow-hidden rounded-2xl bg-brand-600 p-4 text-white shadow-brand sm:col-span-1 sm:p-5">
      {/* Decorative rings */}
      <span className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full border-[18px] border-white/[0.07]" aria-hidden />
      <span className="pointer-events-none absolute -bottom-16 right-8 size-28 rounded-full bg-white/[0.06]" aria-hidden />
      <div className="relative flex items-start justify-between gap-3">
        <p className="pt-0.5 text-[13px] font-semibold text-brand-100">Current balance</p>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/15 sm:size-10">
          <Wallet className="size-[18px] sm:size-5" aria-hidden />
        </span>
      </div>
      <p className="relative -mt-1 truncate text-2xl font-extrabold tracking-tight sm:text-[28px] sm:leading-8">{balance}</p>
      <p className="relative mt-2 text-xs text-brand-100">
        Net this month <span className="ml-0.5 rounded-full bg-white/15 px-1.5 py-0.5 font-bold text-white">{net}</span>
      </p>
    </div>
  );
}
