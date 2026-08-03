import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as suppliersApi from "../api/suppliers";
import type { SupplierInput } from "../api/suppliers";

export function useSuppliers() {
  return useQuery({ queryKey: ["suppliers"], queryFn: () => suppliersApi.listSuppliers() });
}

export function useSupplierMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["suppliers"] });

  const create = useMutation({
    mutationFn: (input: SupplierInput) => suppliersApi.createSupplier(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: SupplierInput }) => suppliersApi.updateSupplier(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => suppliersApi.deleteSupplier(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
