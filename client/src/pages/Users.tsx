import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users as UsersIcon, KeyRound, Copy, Check } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Modal } from "../components/ui/Modal";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { FullPageSpinner } from "../components/ui/Spinner";
import { useUsers, useUserMutations } from "../hooks/useUsers";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatDate, initials } from "../lib/formatters";
import { ROLE_LABEL } from "../lib/permissions";
import type { ManagedUser, Role } from "../lib/types";

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
  const { create, update, resetPassword } = useUserMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<ManagedUser | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createSchema), defaultValues: { role: "EMPLOYEE" } });

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

  const handleRoleChange = async (targetUser: ManagedUser, role: Role) => {
    try {
      await update.mutateAsync({ id: targetUser.id, input: { role } });
      showSuccess("Rol actualizado");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo actualizar el rol"));
    }
  };

  const handleToggleActive = async (targetUser: ManagedUser) => {
    try {
      await update.mutateAsync({ id: targetUser.id, input: { isActive: !targetUser.isActive } });
      showSuccess(targetUser.isActive ? "Usuario desactivado" : "Usuario activado");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo actualizar el usuario"));
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Usuarios</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Administra el acceso y los permisos de tu equipo.</p>
        </div>
        <Button onClick={() => setFormOpen(true)}>
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
                {data.items.map((u) => (
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
                      <Select
                        className="h-8 w-40 py-1 text-xs"
                        value={u.role}
                        disabled={u.id === currentUser?.id}
                        onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                      >
                        {(Object.keys(ROLE_LABEL) as Role[])
                          .filter((r) => r === "ADMIN" || r === "EMPLOYEE")
                          .map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                      </Select>
                    </TD>
                    <TD>
                      <button onClick={() => u.id !== currentUser?.id && handleToggleActive(u)} disabled={u.id === currentUser?.id}>
                        <Badge tone={u.isActive ? "success" : "neutral"}>{u.isActive ? "Activo" : "Inactivo"}</Badge>
                      </button>
                    </TD>
                    <TD className="text-xs text-neutral-400">{formatDate(u.createdAt)}</TD>
                    <TD>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => setResetTarget(u)}>
                          <KeyRound className="h-4 w-4" /> Resetear contraseña
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} total={data.pagination.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nuevo usuario" size="sm">
        <form onSubmit={handleSubmit(onCreate)} className="flex flex-col gap-4">
          <Input label="Nombre completo" required error={errors.name?.message} {...register("name")} />
          <Input label="Email" type="email" required error={errors.email?.message} {...register("email")} />
          <Input label="Contraseña temporal" type="text" required error={errors.password?.message} {...register("password")} />
          <Select label="Rol" required {...register("role")}>
            <option value="EMPLOYEE">Empleado</option>
            <option value="ADMIN">Administrador</option>
          </Select>

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
