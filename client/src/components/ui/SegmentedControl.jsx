/** A compact radio-group styled as pills. options: [{ value, label, icon? }] */
export function SegmentedControl({ value, onChange, options, label, tone = "brand", size = "md", className = "" }) {
  const pad = size === "lg" ? "px-4 py-2.5 text-[15px]" : size === "sm" ? "px-2.5 py-1 text-[13px]" : "px-3 py-1.5 text-sm";
  const activeCls = {
    brand: "bg-white text-brand-700 shadow-[0_1px_3px_rgb(28_26_58/0.12)]",
    INCOME: "bg-income text-white shadow-[0_2px_6px_-2px_rgb(14_159_110/0.6)]",
    EXPENSE: "bg-expense text-white shadow-[0_2px_6px_-2px_rgb(229_72_77/0.6)]",
  };
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex gap-0.5 rounded-xl border border-line/60 bg-canvas p-1 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        const Icon = opt.icon;
        const cls = active ? activeCls[tone === "type" ? opt.value : "brand"] ?? activeCls.brand : "text-ink-soft hover:text-ink";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg ${pad} font-semibold transition-all ${cls}`}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
