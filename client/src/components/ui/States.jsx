import { AlertCircle, Loader2, RotateCw } from "lucide-react";
import { Button } from "./Button";

export function Spinner({ label = "Loading", className = "" }) {
  return (
    <div role="status" className={`flex items-center justify-center gap-2 py-10 text-sm text-ink-soft ${className}`}>
      <Loader2 className="size-5 animate-spin text-brand-600" aria-hidden />
      <span>{label}…</span>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-shimmer rounded-lg bg-[#ecebf4] ${className}`} aria-hidden />;
}

/** Placeholder rows for lists: icon tile, two text lines, trailing amount. */
export function ListSkeleton({ rows = 5, className = "" }) {
  return (
    <div role="status" aria-label="Loading" className={`divide-y divide-line/60 ${className}`}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="size-9 shrink-0 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center px-6 py-12 text-center ${className}`}>
      {Icon && (
        <div className="relative mb-4 grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 ring-8 ring-brand-50/50">
          <Icon className="size-6" aria-hidden />
        </div>
      )}
      <p className="text-[15px] font-bold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-sm leading-relaxed text-ink-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className = "" }) {
  return (
    <div role="alert" className={`flex flex-col items-center px-6 py-10 text-center ${className}`}>
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-expense-soft text-expense">
        <AlertCircle className="size-6" aria-hidden />
      </div>
      <p className="text-[15px] font-bold text-ink">Couldn't load this</p>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{error?.message ?? "Something went wrong."}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
