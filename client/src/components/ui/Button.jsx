import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-brand-600 text-white shadow-[0_1px_2px_rgb(79_70_229/0.3),inset_0_1px_0_rgb(255_255_255/0.12)] hover:bg-brand-700 disabled:bg-brand-600/60 disabled:shadow-none",
  secondary: "bg-white text-ink border border-line shadow-[0_1px_1px_rgb(28_26_58/0.04)] hover:border-[#d6d4e4] hover:bg-canvas disabled:text-ink-faint",
  ghost: "text-ink-soft hover:bg-brand-50 hover:text-brand-700",
  danger: "bg-expense text-white hover:bg-[#cc3a3f] disabled:bg-expense/60",
};

const sizes = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-[10px]",
  lg: "h-11 px-5 text-[15px] gap-2 rounded-[10px]",
  icon: "h-9 w-9 justify-center rounded-lg",
};

export const buttonClass = (variant = "primary", size = "md", className = "") =>
  `inline-flex shrink-0 items-center justify-center font-semibold transition-[background-color,border-color,color,box-shadow] active:translate-y-px disabled:active:translate-y-0 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon: Icon,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </button>
  );
}
