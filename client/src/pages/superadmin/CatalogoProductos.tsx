import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, PackageSearch, Pencil, Trash2, Upload } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea, Select } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { BulkUploadModal } from "../../components/common/BulkUploadModal";
import { useRubros } from "../../hooks/useRubros";
import { useCatalogProducts, useCatalogProductMutations } from "../../hooks/useCatalogProducts";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import { downloadCatalogProductTemplate, bulkUploadCatalogProducts } from "../../api/superadminCatalogProducts";
import type { CatalogProduct } from "../../lib/types";

const schema = z.object({
  rubroId: z.string().min(1, "Elegí un rubro"),
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  unit: z.string().min(1),
  barcode: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const emptyValues = (rubroId: string): FormInput => ({
  rubroId,
  name: "",
  description: "",
  unit: "unidad",
  barcode: "",
});

export default function SuperAdminCatalogoProductos() {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const { data: rubros } = useRubros(false);
  const [rubroFilter, setRubroFilter] = useState("");
  const { data, isLoading } = useCatalogProducts(rubroFilter || undefined);
  const { create, update, remove } = useCatalogProductMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CatalogProduct | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues(rubroFilter) });

  const openCreate = () => {
    setEditing(null);
    reset(emptyValues(rubroFilter));
    setFormOpen(true);
  };

  const openEdit = (item: CatalogProduct) => {
    setEditing(item);
    reset({
      rubroId: item.rubroId,
      name: item.name,
      description: item.description ?? "",
      unit: item.unit,
      barcode: item.barcode ?? "",
    });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const input = {
      rubroId: values.rubroId,
      name: values.name,
      description: values.description || null,
      unit: values.unit,
      barcode: values.barcode || null,
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
        showSuccess("Producto de catálogo actualizado");
      } else {
        await create.mutateAsync(input);
        showSuccess("Producto de catálogo creado");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el producto"));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showSuccess("Producto de catálogo eliminado");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el producto"));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <PackageSearch className="h-7 w-7 text-primary-500" />
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Catálogo de Productos</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Productos sugeridos por rubro que cada Local puede importar a su inventario. El precio lo define cada Local.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <Upload className="h-4 w-4 mr-1.5" /> Carga masiva
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Nuevo Producto
          </Button>
        </div>
      </div>

      <Card className="p-2">
        <div className="flex items-center gap-3 p-2">
          <Select className="w-64 h-10" value={rubroFilter} onChange={(e) => setRubroFilter(e.target.value)}>
            <option value="">Todos los rubros</option>
            {rubros?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <CardHeader title="Productos de catálogo" description="No afectan stock ni ventas hasta que un Local los importa" />
        <CardBody>
          {isLoading ? (
            <FullPageSpinner />
          ) : !data || data.length === 0 ? (
            <EmptyState icon={PackageSearch} title="Sin productos" description="Agregá el primer producto de catálogo para este rubro." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH>Código de barras</TH>
                  <TH>Rubro</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </tr>
              </THead>
              <TBody>
                {data.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">{item.name}</div>
                      {item.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.description}</p>
                      )}
                    </TD>
                    <TD className="font-mono text-xs text-neutral-500 dark:text-neutral-400">{item.barcode ?? "-"}</TD>
                    <TD>
                      <Badge tone="info">{item.rubro?.name ?? "-"}</Badge>
                    </TD>
                    <TD>
                      <Badge tone={item.isActive ? "success" : "neutral"}>{item.isActive ? "Activo" : "Inactivo"}</Badge>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(item)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar producto de catálogo" : "Nuevo producto de catálogo"} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Select label="Rubro" required error={errors.rubroId?.message} {...register("rubroId")}>
            <option value="">Seleccionar rubro...</option>
            {rubros?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Input label="Nombre" required error={errors.name?.message} {...register("name")} />
          <Textarea label="Descripción" rows={2} {...register("description")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Unidad" error={errors.unit?.message} {...register("unit")} />
            <Input label="Código de barras (opcional)" {...register("barcode")} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear producto"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto de catálogo"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}" del catálogo?`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Carga masiva de productos de catálogo"
        columnsHint="nombre, descripcion, codigo_barras, rubro"
        onDownloadTemplate={downloadCatalogProductTemplate}
        onUpload={bulkUploadCatalogProducts}
        onDone={() => {
          showSuccess("Carga masiva completada");
          queryClient.invalidateQueries({ queryKey: ["catalog-products"] });
        }}
      />
    </div>
  );
}
