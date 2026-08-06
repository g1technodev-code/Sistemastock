import { cn } from "../../lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60", className)} />;
}

export function TableSkeleton({ columns, rows = 6 }: { columns: number; rows?: number }) {
  return (
    <div className="flex flex-col gap-4 p-5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-6">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={cn("h-4", c === 0 ? "w-1/3" : c === 1 ? "w-1/4" : "w-1/6", c > 1 && "hidden sm:block")} />
          ))}
        </div>
      ))}
    </div>
  );
}
