import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Store, Pencil, Trash2 } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../../components/ui/Table";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useRubros, useRubroMutations } from "../../hooks/useRubros";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import type { Rubro } from "../../lib/types";

const schema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  description: z.string().optional(),
  icon: z.string().optional(),
});
type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

const emptyValues: FormInput = { name: "", description: "", icon: "" };

export default function SuperAdminRubros() {
  const { showSuccess, showError } = useToast();
  const { data, isLoading } = useRubros();
  const { create, update, remove } = useRubroMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Rubro | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Rubro | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues });

  const openCreate = () => {
    setEditing(null);
    reset(emptyValues);
    setFormOpen(true);
  };

  const openEdit = (rubro: Rubro) => {
    setEditing(rubro);
    reset({ name: rubro.name, description: rubro.description ?? "", icon: rubro.icon ?? "" });
    setFormOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    const input = {
      name: values.name,
      description: values.description || null,
      icon: values.icon || null,
    };

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input });
        showSuccess("Rubro actualizado");
      } else {
        await create.mutateAsync(input);
        showSuccess("Rubro creado");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el rubro"));
    }
  };

  const toggleActive = async (rubro: Rubro) => {
    try {
      await update.mutateAsync({
        id: rubro.id,
        input: { name: rubro.name, description: rubro.description, icon: rubro.icon, isActive: !rubro.isActive },
      });
      showSuccess(rubro.isActive ? "Rubro desactivado" : "Rubro activado");
    } catch (error) {
      showError(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showSuccess("Rubro eliminado");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el rubro"));
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <Store className="h-7 w-7 text-primary-500" />
          <div>
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Rubros</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Tipos de negocio (Kiosco, Ferretería, etc.) usados para el catálogo de productos precargados
            </p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> Nuevo Rubro
        </Button>
      </div>

      <Card>
        <CardHeader title="Rubros de negocio" description="Se usan al dar de alta un Local y para organizar el catálogo de productos" />
        <CardBody>
          {isLoading ? (
            <FullPageSpinner />
          ) : !data || data.length === 0 ? (
            <EmptyState icon={Store} title="Sin rubros" description="Crea el primer rubro de negocio." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Rubro</TH>
                  <TH>Estado</TH>
                  <TH className="text-right">Acciones</TH>
                </tr>
              </THead>
              <TBody>
                {data.map((rubro) => (
                  <TR key={rubro.id}>
                    <TD>
                      <div className="font-bold text-neutral-900 dark:text-neutral-100">{rubro.name}</div>
                      {rubro.description && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{rubro.description}</p>
                      )}
                    </TD>
                    <TD>
                      <button onClick={() => toggleActive(rubro)}>
                        <Badge tone={rubro.isActive ? "success" : "neutral"}>{rubro.isActive ? "Activo" : "Inactivo"}</Badge>
                      </button>
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(rubro)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(rubro)}>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar rubro" : "Nuevo rubro"} size="sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre" required error={errors.name?.message} {...register("name")} />
          <Textarea label="Descripción" rows={2} {...register("description")} />
          <Input label="Ícono (opcional)" placeholder="ej. store, hammer" {...register("icon")} />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear rubro"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar rubro"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Esto no es posible si hay locales o productos de catálogo usándolo.`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
