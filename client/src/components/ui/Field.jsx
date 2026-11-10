import { ChevronDown } from "lucide-react";
import { useId } from "react";

const control =
  "w-full rounded-[10px] border bg-white px-3 text-sm text-ink shadow-[0_1px_1px_rgb(28_26_58/0.03)] placeholder:text-ink-faint transition-[border-color,box-shadow] hover:border-[#d6d4e4] focus:outline-none focus:ring-4 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-faint";
const stateCls = (error) =>
  error ? "border-expense hover:border-expense focus:border-expense focus:ring-expense/15" : "border-line focus:border-brand-500";
const heights = { md: "h-10", lg: "h-12 text-base" };

/** Label + control + error message. Render-prop passes id/aria attributes to the control. */
export function Field({ label, error, hint, children, className = "" }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-ink">
          {label}
        </label>
      )}
      {children({ id, "aria-invalid": !!error || undefined, "aria-describedby": error ? errorId : undefined })}
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-expense">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
      )}
    </div>
  );
}

/** `prefix` is a short text/element shown inside the left edge (e.g. ৳ or an icon). */
export function Input({ error, prefix, size = "md", className = "", ...props }) {
  const base = `${control} ${stateCls(error)} ${heights[size]}`;
  if (prefix) {
    return (
      <div className="relative">
        <span
          className={`pointer-events-none absolute inset-y-0 left-3 flex items-center font-semibold text-ink-soft ${size === "lg" ? "text-base" : "text-sm"}`}
        >
          {prefix}
        </span>
        <input className={`${base} ${size === "lg" ? "pl-9" : "pl-8"} ${className}`} {...props} />
      </div>
    );
  }
  return <input className={`${base} ${className}`} {...props} />;
}

/** Native select with a consistent chevron. `prefix` is an element shown inside the left edge. */
export function Select({ error, prefix, size = "md", className = "", children, ...props }) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">{prefix}</span>}
      <select
        className={`${control} ${stateCls(error)} ${heights[size]} cursor-pointer pr-9 ${prefix ? "pl-11" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
        aria-hidden
      />
    </div>
  );
}

export function Textarea({ error, className = "", ...props }) {
  return <textarea className={`${control} ${stateCls(error)} min-h-20 resize-y py-2.5 ${className}`} {...props} />;
}

/** Non-field form error (e.g. "Email or password is incorrect"). */
export function FormError({ children }) {
  if (!children) return null;
  return (
    <div role="alert" className="rounded-[10px] border border-expense/20 bg-expense-soft px-3 py-2.5 text-sm font-medium text-expense">
      {children}
    </div>
  );
}
