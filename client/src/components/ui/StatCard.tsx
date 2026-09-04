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
  onClick,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: { value: string; direction: "up" | "down"; isGood: boolean };
  tone?: "neutral" | "warning" | "danger";
  onClick?: () => void;
}) {
  const iconToneClass =
    tone === "warning"
      ? "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
      : tone === "danger"
        ? "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400";

  return (
    <Card
      onClick={onClick}
      className={cn(
        "p-3.5 sm:px-6 sm:py-5 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between",
        onClick
          ? "cursor-pointer hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-indigo-900/20 active:scale-[0.99]"
          : ""
      )}
    >
      <div className="relative z-10 flex items-center justify-between gap-1.5">
        <span className="text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 truncate" title={label}>
          {label}
        </span>
        <div
          className={cn(
            "shrink-0 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform group-hover:scale-110 duration-300",
            iconToneClass
          )}
        >
          <Icon className="h-3.5 w-3.5 sm:h-5 sm:w-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10 mt-2 sm:mt-4 flex items-end justify-between">
        <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white truncate">
          {value}
        </span>
      </div>
      {delta && (
        <div className="relative z-10 mt-1.5 sm:mt-3 flex items-center gap-1 sm:gap-1.5 flex-wrap">
          <span
            className={cn(
              "flex items-center rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-bold",
              delta.isGood 
                ? "bg-success-100/50 text-success-700 dark:bg-success-500/10 dark:text-success-400" 
                : "bg-danger-100/50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400",
            )}
          >
            {delta.direction === "up" ? <ArrowUpRight className="mr-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} /> : <ArrowDownRight className="mr-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={3} />}
            {delta.value}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-neutral-400 dark:text-neutral-500">vs ayer</span>
        </div>
      )}
      <div className="absolute -bottom-6 -right-6 z-0 opacity-[0.03] dark:opacity-[0.02] transition-transform duration-500 group-hover:scale-110 pointer-events-none">
        <Icon className="h-24 w-24 sm:h-32 sm:w-32" strokeWidth={1} />
      </div>
    </Card>

  );
}
