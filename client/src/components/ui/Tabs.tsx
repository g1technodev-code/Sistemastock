import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export type TabItem<T extends string> = {
  value: T;
  label: string;
  icon?: LucideIcon;
};

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  tabs: TabItem<T>[];
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex gap-2 border-b border-neutral-200 dark:border-neutral-800", className)}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950",
              active
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300",
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
