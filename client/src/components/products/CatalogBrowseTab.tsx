import { useState } from "react";
import { PackageSearch, Download } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { FullPageSpinner } from "../ui/Spinner";
import { ImportCatalogModal } from "./ImportCatalogModal";
import { useCatalogBrowse, useImportCatalogProduct } from "../../hooks/useCatalog";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import type { CatalogProduct } from "../../lib/types";

export function CatalogBrowseTab({ canManage }: { canManage: boolean }) {
  const { data, isLoading } = useCatalogBrowse();
  const importMutation = useImportCatalogProduct();
  const { showSuccess, showError } = useToast();
  const [selected, setSelected] = useState<CatalogProduct | null>(null);

  const handleImport = async (values: { categoryId: string | null }) => {
    if (!selected) return;
    try {
      await importMutation.mutateAsync({ id: selected.id, input: values });
      showSuccess(`"${selected.name}" importado a tu inventario`);
      setSelected(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo importar el producto"));
    }
  };

  if (isLoading) return <FullPageSpinner />;

  if (!data || data.length === 0) {
    return (
      <Card className="shadow-float">
        <EmptyState
          icon={PackageSearch}
          title="No hay productos de catálogo disponibles"
          description="Esto puede ser porque tu negocio todavía no tiene un rubro asignado, o porque el rubro asignado aún no tiene productos precargados. Contactá a soporte si creés que esto es un error."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((item) => (
          <Card key={item.id} className="flex flex-col gap-3 p-4 shadow-sm">
            <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</p>
            {item.description && <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">{item.description}</p>}
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                <Download className="h-4 w-4 mr-1.5" /> Importar
              </Button>
            )}
          </Card>
        ))}
      </div>

      <ImportCatalogModal
        item={selected}
        onClose={() => setSelected(null)}
        onSubmit={handleImport}
        isSubmitting={importMutation.isPending}
      />
    </>
  );
}
