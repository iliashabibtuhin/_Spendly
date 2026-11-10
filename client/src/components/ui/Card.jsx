export function Card({ className = "", children, ...props }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line/70 bg-white shadow-card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-5 pt-5 sm:px-6 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-bold leading-6 text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-ink-faint">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Small brand-colored text link used in card headers ("View all", "Edit"). */
export const cardLinkClass =
  "inline-flex items-center gap-1 rounded-md text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline underline-offset-4";
