import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, shiftMonth, thisMonth } from "../../lib/format";

/** Previous / next month stepper. Future months are not selectable. */
export function MonthPicker({ value, onChange }) {
  const atCurrent = value >= thisMonth();
  const btn =
    "grid size-9 place-items-center rounded-lg text-ink-soft transition-colors hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-35";
  return (
    <div className="inline-flex h-11 items-center gap-0.5 rounded-xl border border-line bg-white p-1 shadow-card">
      <button type="button" className={btn} onClick={() => onChange(shiftMonth(value, -1))} aria-label="Previous month">
        <ChevronLeft className="size-4" />
      </button>
      <span className="flex min-w-40 items-center justify-center gap-2 text-sm font-semibold" aria-live="polite">
        <CalendarDays className="size-4 text-brand-600" aria-hidden />
        {formatMonth(value)}
      </span>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(shiftMonth(value, 1))}
        disabled={atCurrent}
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
