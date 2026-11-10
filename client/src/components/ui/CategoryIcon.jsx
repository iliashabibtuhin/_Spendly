import { createElement } from "react";
import { iconFor } from "../../lib/icons";

/** Rounded tile with the category's icon on a tint of its color. */
export function CategoryIcon({ icon, color = "#6366F1", size = "md" }) {
  const dims = {
    xs: "size-7 rounded-md",
    sm: "size-8 rounded-lg",
    md: "size-9 rounded-[10px]",
    lg: "size-11 rounded-xl",
  }[size];
  const iconDims = size === "xs" ? "size-3.5" : size === "sm" ? "size-4" : "size-[18px]";
  return (
    <span className={`grid shrink-0 place-items-center ${dims}`} style={{ backgroundColor: `${color}1f`, color }}>
      {createElement(iconFor(icon), { className: iconDims, "aria-hidden": true })}
    </span>
  );
}

export function CategoryPill({ category }) {
  if (!category) return null;
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${category.color}1a`, color: category.color }}
    >
      {createElement(iconFor(category.icon), { className: "size-3.5 shrink-0", "aria-hidden": true })}
      <span className="truncate text-ink">{category.name}</span>
    </span>
  );
}
