import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white shadow-md dark:border-white/10 dark:bg-neutral-900/60 dark:backdrop-blur-xl dark:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5 dark:border-neutral-800/60", className)}>
      <div>
        <h2 className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h2>
        {description && <p className="mt-1 text-sm font-medium text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
