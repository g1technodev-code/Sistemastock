import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users as UsersIcon, KeyRound, Copy, Check, Trash2, AlertCircle, Power } from "lucide-react";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { FullPageSpinner } from "../components/ui/Spinner";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useUsers, useUserMutations } from "../hooks/useUsers";
import { useMySubscription } from "../hooks/usePlans";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatDate, initials } from "../lib/formatters";
import { ROLE_LABEL } from "../lib/permissions";
import type { ManagedUser } from "../lib/types";

const createSchema = z.object({
  name: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});
type CreateFormValues = z.infer<typeof createSchema>;

export default function Users() {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUsers({ page, limit: 10 });
  const { data: subData } = useMySubscription(!!currentUser && currentUser.role !== "SUPERADMIN" && !!currentUser.localId);
  const { create, update, resetPassword } = useUserMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    setValue,
    formState: { errors },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema), defaultValues: { role: "EMPLOYEE" } });

  // Plan quotas & limits calculation
  const plan = subData?.plan;
  const maxAdmins = plan?.maxAdmins ?? 1;
  const maxEmployees = plan?.maxEmployees ?? 3;

  const currentAdmins = data?.items.filter((u) => u.isActive && (u.role === "ADMIN" || u.role === "MANAGER")).length ?? 0;
  const currentEmployees = data?.items.filter((u) => u.isActive && u.role === "EMPLOYEE").length ?? 0;

  const adminLimitReached = currentAdmins >= maxAdmins;
  const employeeLimitReached = currentEmployees >= maxEmployees;
  const allLimitsReached = adminLimitReached && employeeLimitReached;

  const onCreate = async (values: CreateFormValues) => {
    try {
      await create.mutateAsync(values);
      showSuccess("Usuario creado correctamente");
      resetForm({ name: "", email: "", password: "", role: "EMPLOYEE" });
      setFormOpen(false);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo crear el usuario"));
    }
  };

  const handleToggleActive = async (targetUser: ManagedUser) => {
    if (targetUser.id === currentUser?.id) {
      showError("No puedes desactivar tu propia cuenta");
      return;
    }

    try {
      await update.mutateAsync({ id: targetUser.id, input: { isActive: !targetUser.isActive } });
      showSuccess(targetUser.isActive ? "Usuario desactivado" : "Usuario activado");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo actualizar el usuario"));
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.id === currentUser?.id) {
      showError("No puedes eliminar tu propia cuenta");
      setDeleteTarget(null);
      return;
    }

    try {
      // Soft-delete by setting isActive: false
      await update.mutateAsync({ id: deleteTarget.id, input: { isActive: false } });
      showSuccess(`El usuario ${deleteTarget.name} ha sido desactivado/eliminado correctamente.`);
      setDeleteTarget(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo eliminar el usuario"));
    }
  };

  const handleResetPassword = async () => {
    if (!resetTarget) return;
    try {
      const result = await resetPassword.mutateAsync({ id: resetTarget.id });
      setTempPassword(result.temporaryPassword);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo resetear la contraseña"));
    }
  };

  const copyPassword = () => {
    if (!tempPassword) return;
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOpenCreateModal = () => {
    if (adminLimitReached && !employeeLimitReached) {
      setValue("role", "EMPLOYEE");
    } else if (!adminLimitReached) {
      setValue("role", "EMPLOYEE");
    }
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Usuarios</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Administra los accesos de tu equipo. Plan: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{plan?.name ?? "Cargando..."}</span> (Admins: {currentAdmins}/{maxAdmins} • Empleados: {currentEmployees}/{maxEmployees})
          </p>
        </div>
        <Button onClick={handleOpenCreateModal} disabled={allLimitsReached}>
          <Plus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <Card>
        {isLoading && !data ? (
          <FullPageSpinner />
        ) : !data || data.items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Sin usuarios" />
        ) : (
          <>
            <Table>
              <THead>
                <tr>
                  <TH>Usuario</TH>
                  <TH>Rol</TH>
                  <TH>Estado</TH>
                  <TH>Creado</TH>
                  <TH className="text-right">Acciones</TH>
                </tr>
              </THead>
              <TBody>
                {data.items.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <TR key={u.id}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {initials(u.name)}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{u.name}</p>
                            <p className="text-xs text-neutral-400">{u.email}</p>
                          </div>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone="info" className="font-semibold">
                          {ROLE_LABEL[u.role] ?? u.role}
                        </Badge>
                      </TD>
                      <TD>
                        <Badge tone={u.isActive ? "success" : "neutral"} className="select-none">
                          {u.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TD>
                      <TD className="text-xs text-neutral-400">{formatDate(u.createdAt)}</TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => handleToggleActive(u)}
                            className={u.isActive ? "text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10" : "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10"}
                            title={isSelf ? "No puedes cambiar tu propio estado" : u.isActive ? "Desactivar usuario" : "Activar usuario"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setResetTarget(u)}
                            title="Resetear contraseña"
                          >
                            <KeyRound className="h-4 w-4" /> Resetear
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isSelf}
                            onClick={() => setDeleteTarget(u)}
                            className="text-danger-600 hover:text-danger-700 hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
                            title={isSelf ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TD>

                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Modal Nuevo Usuario con Límites */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo usuario" size="sm">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input label="Nombre completo" required error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
          <Input label="Contraseña temporal" type="text" required error={errors.password?.message} {...register("password")} />
          
          <div>
            <Select label="Rol" required {...register("role")}>
              <option value="EMPLOYEE" disabled={employeeLimitReached}>
                Empleado {employeeLimitReached ? "(Límite del plan alcanzado)" : ""}
              </option>
              <option value="ADMIN" disabled={adminLimitReached}>
                Administrador {adminLimitReached ? "(Límite del plan alcanzado)" : ""}
              </option>
            </Select>
            {adminLimitReached && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" /> Límite de Administradores alcanzado ({maxAdmins}/{maxAdmins}).
              </p>
            )}
            {employeeLimitReached && (
              <p className="mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" /> Límite de Empleados alcanzado ({maxEmployees}/{maxEmployees}).
              </p>
            )}
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={create.isPending}>
              Crear usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmación para Eliminar Usuario */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteUser}
        title={`Eliminar a ${deleteTarget?.name ?? ""}`}
        message="El usuario perderá el acceso al sistema inmediatamente. Todo el historial de ventas y registros generados por este usuario se mantendrán preservados por auditoría contable."
        confirmLabel="Sí, eliminar usuario"
        danger
        isLoading={update.isPending}
      />


      {/* Resetear Contraseña */}
      <Modal
        open={!!resetTarget}
        onClose={() => {
          setResetTarget(null);
          setTempPassword(null);
        }}
        title={`Resetear contraseña de ${resetTarget?.name ?? ""}`}
        size="sm"
      >
        {!tempPassword ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Se generará una contraseña temporal y se cerrarán todas las sesiones activas de este usuario. Comunícasela de forma segura.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetTarget(null)}>
                Cancelar
              </Button>
              <Button onClick={handleResetPassword} isLoading={resetPassword.isPending}>
                Generar nueva contraseña
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">Contraseña temporal generada. Cópiala y compártela de forma segura — no se volverá a mostrar.</p>
            <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-800">
              <span className="flex-1">{tempPassword}</span>
              <button onClick={copyPassword} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <Button
              onClick={() => {
                setResetTarget(null);
                setTempPassword(null);
              }}
            >
              Listo
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
