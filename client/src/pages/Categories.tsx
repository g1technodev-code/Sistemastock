import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Tags, Pencil, Trash2 } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { FullPageSpinner } from "../components/ui/Spinner";
import { useCategories, useCategoryMutations } from "../hooks/useCategories";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { permissions } from "../lib/permissions";
import { extractErrorMessage } from "../api/client";
import type { Category } from "../lib/types";

const COLORS = ["#2a78d6", "#008300", "#e87ba4", "#eda100", "#1baf7a", "#eb6834", "#4a3aa7", "#e34948"];

const schema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  color: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export default function Categories() {
  const { user } = useAuth();
  const canManage = user ? permissions.canManageCatalog(user.role) : false;
  const { showSuccess, showError } = useToast();

  const { data, isLoading } = useCategories();
  const { create, update, remove } = useCategoryMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "", description: "", color: COLORS[0] } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", description: "", color: COLORS[0] });
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    reset({ name: category.name, description: category.description ?? "", color: category.color ?? COLORS[0] });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        showSuccess("Categoría actualizada");
      } else {
        await create.mutateAsync(values);
        showSuccess("Categoría creada");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar la categoría"));
    }
  };

  const toggleActive = async (category: Category) => {
    try {
      await update.mutateAsync({ id: category.id, input: { name: category.name, isActive: !category.isActive } });
      showSuccess(category.isActive ? "Categoría desactivada" : "Categoría activada");
    } catch (error) {
      showError(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showSuccess("Categoría eliminada");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar la categoría"));
    }
  };

  const selectedColor = watch("color");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Categorías</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Organiza tus productos por categoría.</p>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva categoría
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={Tags} title="Sin categorías" description="Crea tu primera categoría para organizar productos." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Nombre</TH>
                <TH>Descripción</TH>
                <TH>Productos</TH>
                <TH>Estado</TH>
                {canManage && <TH className="text-right">Acciones</TH>}
              </tr>
            </THead>
            <TBody>
              {data.map((category) => (
                <TR key={category.id}>
                  <TD>
                    <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color ?? "#a3a3a3" }} />
                      {category.name}
                    </div>
                  </TD>
                  <TD className="text-neutral-500 dark:text-neutral-400">{category.description || "—"}</TD>
                  <TD>{category._count?.products ?? 0}</TD>
                  <TD>
                    <button onClick={() => canManage && toggleActive(category)} disabled={!canManage}>
                      <Badge tone={category.isActive ? "success" : "neutral"}>{category.isActive ? "Activa" : "Inactiva"}</Badge>
                    </button>
                  </TD>
                  {canManage && (
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(category)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar categoría" : "Nueva categoría"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre" required error={errors.name?.message} {...register("name")} />
          <Textarea label="Descripción" rows={2} {...register("description")} />
          <div>
            <p className="mb-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300">Color</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setValue("color", c)}
                  className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-white transition dark:ring-offset-neutral-900 ${selectedColor === c ? "ring-2 ring-neutral-900 dark:ring-neutral-100" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear categoría"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Esto no es posible si tiene productos asociados.`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
