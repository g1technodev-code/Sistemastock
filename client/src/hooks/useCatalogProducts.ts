import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as catalogProductsApi from "../api/superadminCatalogProducts";
import type { CatalogProductInput } from "../api/superadminCatalogProducts";

export function useCatalogProducts() {
  return useQuery({
    queryKey: ["catalog-products"],
    queryFn: () => catalogProductsApi.listCatalogProducts(),
  });
}

export function useCatalogProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["catalog-products"] });

  const create = useMutation({
    mutationFn: (input: CatalogProductInput) => catalogProductsApi.createCatalogProduct(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CatalogProductInput }) =>
      catalogProductsApi.updateCatalogProduct(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => catalogProductsApi.deleteCatalogProduct(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
