import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as plansApi from "../api/superadminPlans";
import type { PlanInput } from "../api/superadminPlans";

export function usePlans(includeInactive = true) {
  return useQuery({ queryKey: ["plans", includeInactive], queryFn: () => plansApi.listPlans(includeInactive) });
}

export function usePlanMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["plans"] });

  const create = useMutation({
    mutationFn: (input: PlanInput) => plansApi.createPlan(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: PlanInput }) => plansApi.updatePlan(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => plansApi.deletePlan(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
