import { type HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type AlertVariant = "default" | "destructive" | "success" | "warning";

const variantClasses: Record<AlertVariant, string> = {
  default:
    "border-neutral-200 bg-white text-neutral-900 [&>svg]:text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:[&>svg]:text-neutral-400",
  destructive:
    "border-danger-200 bg-danger-50 text-danger-800 [&>svg]:text-danger-500 dark:border-danger-900/50 dark:bg-danger-950/40 dark:text-danger-300",
  success:
    "border-success-200 bg-success-50 text-success-800 [&>svg]:text-success-600 dark:border-success-900/50 dark:bg-success-950/40 dark:text-success-300",
  warning:
    "border-warning-200 bg-warning-50 text-warning-800 [&>svg]:text-warning-600 dark:border-warning-900/50 dark:bg-warning-950/40 dark:text-warning-300",
};

export function Alert({
  variant = "default",
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn(
        "relative grid w-full grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-xl border px-4 py-3 text-sm shadow-sm [&>svg]:mt-0.5 [&>svg]:h-4 [&>svg]:w-4",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h5 className={cn("col-start-2 font-semibold leading-none tracking-tight", className)} {...props} />;
}

export function AlertDescription({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("col-start-2 text-sm leading-relaxed opacity-90 [&_p]:leading-relaxed", className)} {...props} />;
}
