import type { ReactNode } from "react";
import { useDarkMode } from "../../hooks/useDarkMode";
import { getChrome } from "../../lib/chartColors";

/** Shared legend renderer: swatch carries identity, text always stays in a neutral ink token. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  const isDark = useDarkMode();
  const chrome = getChrome(isDark);
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-xs" style={{ color: chrome.secondaryInk }}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function ChartTooltip({ active, label, children }: { active?: boolean; label?: ReactNode; children: ReactNode }) {
  const isDark = useDarkMode();
  if (!active) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: isDark ? "#1a1a19" : "#fcfcfb",
        borderColor: isDark ? "#2c2c2a" : "#e1e0d9",
        color: isDark ? "#ffffff" : "#0b0b0b",
      }}
    >
      {label && <div className="mb-1 font-medium">{label}</div>}
      {children}
    </div>
  );
}
