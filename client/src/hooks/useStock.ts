import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as stockApi from "../api/stock";
import type { CreateMovementInput, ListMovementsParams } from "../api/stock";

export function useMovements(params: ListMovementsParams) {
  return useQuery({
    queryKey: ["movements", params],
    queryFn: () => stockApi.listMovements(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMovementInput) => stockApi.createMovement(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
