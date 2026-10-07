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

export function useSupplierAccount(id: string | null) {
  return useQuery({
    queryKey: ["supplierAccount", id],
    queryFn: () => suppliersApi.getSupplierAccount(id!),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useSupplierMovements(id: string | null, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ["supplierMovements", id, params],
    queryFn: () => suppliersApi.listSupplierMovements(id!, params),
    enabled: !!id,
    staleTime: 1000 * 60,
  });
}

export function useSupplierAccountMutations() {
  const qc = useQueryClient();
  
  const registerPayment = useMutation({
    mutationFn: ({ id, input }: { id: string; input: suppliersApi.SupplierPaymentInput }) => suppliersApi.registerSupplierPayment(id, input),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["supplierAccount", variables.id] });
      qc.invalidateQueries({ queryKey: ["supplierMovements", variables.id] });
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      qc.invalidateQueries({ queryKey: ["cash"] }); // since payment might affect cash
    },
  });

  return { registerPayment };
}
