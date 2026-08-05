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
    <Card className="px-6 py-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-float dark:hover:shadow-primary-900/20 group relative overflow-hidden">
      <div className="relative z-10 flex items-center justify-between">
        <span className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{label}</span>
        <div className={cn("rounded-xl p-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300", iconToneClass)}>
          <Icon className="h-5 w-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10 mt-4 flex items-end justify-between">
        <span className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">{value}</span>
      </div>
      {delta && (
        <div className="relative z-10 mt-3 flex items-center gap-1.5">
          <span
            className={cn(
              "flex items-center rounded-full px-2 py-0.5 text-xs font-bold",
              delta.isGood 
                ? "bg-success-100/50 text-success-700 dark:bg-success-500/10 dark:text-success-400" 
                : "bg-danger-100/50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400",
            )}
          >
            {delta.direction === "up" ? <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" strokeWidth={3} /> : <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" strokeWidth={3} />}
            {delta.value}
          </span>
          <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500">vs ayer</span>
        </div>
      )}
      <div className="absolute -bottom-6 -right-6 z-0 opacity-[0.03] dark:opacity-[0.02] transition-transform duration-500 group-hover:scale-110">
        <Icon className="h-32 w-32" strokeWidth={1} />
      </div>
    </Card>
  );
}
