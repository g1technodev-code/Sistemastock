import type { ReactNode } from "react";
import { Card } from "./Card";

export function ChartCard({
  title,
  description,
  action,
  children,
  height = 280,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  height?: number;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>}
        </div>
        {action}
      </div>
      <div style={{ height }}>{children}</div>
    </Card>
  );
}
