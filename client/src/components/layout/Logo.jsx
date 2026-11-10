export function Logo({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img src="/favicon.svg" alt="" className="size-8" />
      <span className="text-lg font-extrabold tracking-tight text-ink">Spendly</span>
    </span>
  );
}
