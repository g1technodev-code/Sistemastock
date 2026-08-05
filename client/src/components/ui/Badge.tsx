import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100/80 text-neutral-800 border border-neutral-200 dark:bg-neutral-800/80 dark:text-neutral-200 dark:border-neutral-700",
  success: "bg-success-100 text-success-800 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/20",
  warning: "bg-warning-100 text-warning-800 border border-warning-200 dark:bg-warning-500/10 dark:text-warning-400 dark:border-warning-500/20",
  danger: "bg-danger-100 text-danger-800 border border-danger-200 dark:bg-danger-500/10 dark:text-danger-400 dark:border-danger-500/20",
  info: "bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-500/20",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase", toneClasses[tone], className)}>
      {children}
    </span>
  );
}
