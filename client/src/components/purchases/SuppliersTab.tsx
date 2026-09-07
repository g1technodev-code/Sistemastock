import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Truck, Pencil, Trash2, FileText } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Field";
import { Badge } from "../ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import { Modal } from "../ui/Modal";
import { EmptyState } from "../ui/EmptyState";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { FullPageSpinner } from "../ui/Spinner";
import { useSuppliers, useSupplierMutations } from "../../hooks/useSuppliers";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../lib/api";
import { formatCurrency } from "../../lib/formatters";
import type { Supplier } from "../../lib/types";
import { SupplierAccountDrawer } from "./SupplierAccountDrawer";

const schema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  contactName: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function SuppliersTab({ canManage }: { canManage: boolean }) {
  const { showSuccess, showError } = useToast();

  const { data, isLoading } = useSuppliers();
  const { create, update, remove } = useSupplierMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", contactName: "", email: "", phone: "", address: "", taxId: "", notes: "" });
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    reset({
      name: supplier.name,
      contactName: supplier.contactName ?? "",
      email: supplier.email ?? "",
      phone: supplier.phone ?? "",
      address: supplier.address ?? "",
      taxId: supplier.taxId ?? "",
      notes: supplier.notes ?? "",
    });
    setFormOpen(true);
  };

  const openAccount = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setAccountDrawerOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, input: values });
        showSuccess("Proveedor actualizado");
      } else {
        await create.mutateAsync(values);
        showSuccess("Proveedor creado");
      }
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo guardar el proveedor"));
    }
  };

  const toggleActive = async (supplier: Supplier) => {
    try {
      await update.mutateAsync({ id: supplier.id, input: { name: supplier.name, isActive: !supplier.isActive } });
      showSuccess(supplier.isActive ? "Proveedor desactivado" : "Proveedor activado");
    } catch (error) {
      showError(extractErrorMessage(error));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync(deleteTarget.id);
      showSuccess("Proveedor eliminado");
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el proveedor"));
    }
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Proveedores</h2>
        </div>
        {canManage && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo proveedor
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <FullPageSpinner />
        ) : !data || data.length === 0 ? (
          <EmptyState icon={Truck} title="Sin proveedores" description="Registra tu primer proveedor." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Nombre</TH>
                <TH>Contacto</TH>
                <TH>Teléfono</TH>
                <TH className="text-right">Saldo (Deuda)</TH>
                <TH>Estado</TH>
                {canManage && <TH className="text-right">Acciones</TH>}
              </tr>
            </THead>
            <TBody>
              {data.map((supplier) => (
                <TR key={supplier.id}>
                  <TD>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">{supplier.name}</div>
                    <div className="text-xs text-neutral-400">{supplier.email || "—"}</div>
                  </TD>
                  <TD>{supplier.contactName || "—"}</TD>
                  <TD>{supplier.phone || "—"}</TD>
                  <TD className="text-right">
                    <span className={supplier.currentBalance > 0 ? "text-danger-600 font-semibold" : ""}>
                      {formatCurrency(supplier.currentBalance)}
                    </span>
                  </TD>
                  <TD>
                    <button onClick={() => canManage && toggleActive(supplier)} disabled={!canManage}>
                      <Badge tone={supplier.isActive ? "success" : "neutral"}>{supplier.isActive ? "Activo" : "Inactivo"}</Badge>
                    </button>
                  </TD>
                  {canManage && (
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openAccount(supplier.id)} title="Ver cuenta corriente">
                          <FileText className="h-4 w-4 text-primary-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(supplier)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(supplier)}>
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editing ? "Editar proveedor" : "Nuevo proveedor"} size="md">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input label="Nombre" required error={errors.name?.message} {...register("name")} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Persona de contacto" {...register("contactName")} />
            <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Teléfono" {...register("phone")} />
            <Input label="RUC / ID fiscal" {...register("taxId")} />
          </div>
          <Input label="Dirección" {...register("address")} />
          <Textarea label="Notas" rows={2} {...register("notes")} />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending || update.isPending}>
              {editing ? "Guardar cambios" : "Crear proveedor"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar proveedor"
        message={`¿Seguro que deseas eliminar "${deleteTarget?.name}"? Esto no es posible si tiene productos o movimientos asociados.`}
        confirmLabel="Eliminar"
        danger
        isLoading={remove.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <SupplierAccountDrawer 
        supplierId={selectedSupplierId}
        open={accountDrawerOpen} 
        onClose={() => setAccountDrawerOpen(false)} 
      />
    </div>
  );
}
