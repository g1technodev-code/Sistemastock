/**
 * Prisma Decimal fields serialize as objects, not plain numbers. This walks any
 * controller response payload and converts Decimal-like values (anything exposing
 * `.toNumber()`) into rounded JS numbers so the frontend always receives plain JSON.
 */
export function serializeDecimals<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === "object" && value !== null && "toNumber" in (value as Record<string, unknown>)) {
    const asNumber = (value as unknown as { toNumber: () => number }).toNumber();
    return Math.round(asNumber * 100) / 100 as unknown as T;
  }

  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map((item) => serializeDecimals(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeDecimals(val);
    }
    return result as unknown as T;
  }

  return value;
}
