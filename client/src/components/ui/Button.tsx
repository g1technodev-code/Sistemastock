import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "success";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
};

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-500 disabled:bg-primary-300 shadow-float hover:shadow-lg hover:-translate-y-0.5",
  secondary:
    "bg-white border border-neutral-200 text-neutral-800 hover:bg-neutral-50 shadow-sm dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-800 hover:shadow",
  outline:
    "border-2 border-primary-200 bg-transparent text-primary-700 hover:bg-primary-50 hover:border-primary-300 dark:border-primary-900/50 dark:text-primary-400 dark:hover:bg-primary-950/50",
  ghost: "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800",
  danger: "bg-danger-500 text-white hover:bg-danger-400 disabled:bg-danger-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5",
  success: "bg-success-600 text-white hover:bg-success-500 disabled:bg-success-300 shadow-float hover:shadow-lg hover:-translate-y-0.5",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-xs gap-1.5",
  md: "h-11 px-6 text-sm gap-2",
  lg: "h-14 px-8 text-base gap-3",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed dark:focus-visible:ring-offset-neutral-950 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
