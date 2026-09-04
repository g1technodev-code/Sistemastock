import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as rubrosApi from "../api/superadminRubros";
import type { RubroInput } from "../api/superadminRubros";

export function useRubros(includeInactive = true) {
  return useQuery({ queryKey: ["rubros", includeInactive], queryFn: () => rubrosApi.listRubros(includeInactive) });
}

export function useRubroMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rubros"] });

  const create = useMutation({
    mutationFn: (input: RubroInput) => rubrosApi.createRubro(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RubroInput }) => rubrosApi.updateRubro(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => rubrosApi.deleteRubro(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
