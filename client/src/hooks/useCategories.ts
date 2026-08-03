import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as categoriesApi from "../api/categories";
import type { CategoryInput } from "../api/categories";

export function useCategories() {
  return useQuery({ queryKey: ["categories"], queryFn: () => categoriesApi.listCategories() });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["categories"] });

  const create = useMutation({
    mutationFn: (input: CategoryInput) => categoriesApi.createCategory(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) => categoriesApi.updateCategory(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
