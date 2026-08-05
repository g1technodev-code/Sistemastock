import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center animate-in fade-in duration-700">
      <div className="rounded-2xl bg-neutral-100/50 p-4 ring-1 ring-neutral-200/50 dark:bg-neutral-800/30 dark:ring-white/5 transition-transform hover:scale-105 duration-300">
        <Icon className="h-8 w-8 text-neutral-400" strokeWidth={1.5} />
      </div>
      <div>
        <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">{title}</p>
        {description && <p className="mt-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
