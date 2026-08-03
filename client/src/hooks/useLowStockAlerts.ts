import { useQuery } from "@tanstack/react-query";
import { listProducts } from "../api/products";

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ["low-stock-alerts"],
    queryFn: () => listProducts({ lowStock: true, limit: 8, isActive: true }),
    refetchInterval: 60_000,
  });
}
