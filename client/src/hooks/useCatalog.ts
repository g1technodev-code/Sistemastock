import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as catalogApi from "../api/catalog";
import type { ImportCatalogProductInput } from "../api/catalog";

export function useCatalogBrowse() {
  return useQuery({ queryKey: ["catalog"], queryFn: () => catalogApi.browseCatalog() });
}

export function useImportCatalogProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ImportCatalogProductInput }) =>
      catalogApi.importCatalogProduct(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
  });
}
