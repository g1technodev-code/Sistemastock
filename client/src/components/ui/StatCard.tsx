import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "./Card";
import { cn } from "../../lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: { value: string; direction: "up" | "down"; isGood: boolean };
  tone?: "neutral" | "warning" | "danger";
}) {
  const iconToneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
      : tone === "danger"
        ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400";

  return (
    <Card className="p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-black/50">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</span>
        <div className={cn("rounded-lg p-2", iconToneClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</span>
        {delta && (
          <span
            className={cn(
              "flex items-center text-xs font-medium",
              delta.isGood ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
            )}
          >
            {delta.direction === "up" ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {delta.value}
          </span>
        )}
      </div>
    </Card>
  );
}
