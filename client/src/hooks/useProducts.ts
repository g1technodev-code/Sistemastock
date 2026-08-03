import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as productsApi from "../api/products";
import type { ListProductsParams, ProductInput } from "../api/products";

export function useProducts(params: ListProductsParams) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => productsApi.listProducts(params),
    placeholderData: (prev) => prev,
  });
}

export function useProduct(id: string | null) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productsApi.getProduct(id as string),
    enabled: !!id,
  });
}

function useInvalidateProducts() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
    qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
  };
}

export function useProductMutations() {
  const invalidate = useInvalidateProducts();
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: (input: ProductInput) => productsApi.createProduct(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => productsApi.updateProduct(id, input),
    onSuccess: (product) => {
      invalidate();
      qc.invalidateQueries({ queryKey: ["product", product.id] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
