import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Power, CheckCircle, KeyRound, LogOut, X, Copy } from "lucide-react";
import { listAllUsers, updateUserStatus, resetUserPassword, revokeUserSessions } from "../actions/superadmin.api";

import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input, Select } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { useToast } from "../../../context/ToastContext";
import { ROLE_LABEL } from "../../../lib/permissions";
import { formatDate } from "../../../lib/formatters";
import type { SuperAdminUser } from "../../../lib/types";
import { STATUS_LABEL, STATUS_TONE } from "./LocalesPanel";

type PendingAction = { kind: "reset" | "revoke"; user: SuperAdminUser };

export function UsuariosPanel({
  localFilter,
  onClearLocalFilter,
}: {
  localFilter: { id: string; name: string } | null;
  onClearLocalFilter: () => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState<"" | "true" | "false">("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [tempPassword, setTempPassword] = useState<{ user: SuperAdminUser; password: string } | null>(null);

  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["superadmin-users", page, search, roleFilter, activeFilter, localFilter?.id],
    queryFn: () =>
      listAllUsers({
        page,
        limit: 15,
        q: search || undefined,
        role: roleFilter || undefined,
        isActive: activeFilter || undefined,
        localId: localFilter?.id,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateUserStatus(id, isActive),
    onSuccess: (_, { isActive }) => {
      showSuccess(isActive ? "Usuario activado" : "Usuario desactivado y sesiones cerradas");
      queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo actualizar el usuario");
    },
  });

  const resetMutation = useMutation({
    mutationFn: (user: SuperAdminUser) => resetUserPassword(user.id),
    onSuccess: (result, user) => {
      setPendingAction(null);
      setTempPassword({ user, password: result.temporaryPassword });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo restablecer la contraseña");
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (user: SuperAdminUser) => revokeUserSessions(user.id),
    onSuccess: () => {
      setPendingAction(null);
      showSuccess("Sesiones del usuario cerradas");
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudieron cerrar las sesiones");
    },
  });

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const columns: DataTableColumn<SuperAdminUser>[] = [
    {
      key: "name",
      header: "Usuario",
      render: (u) => (
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{u.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{u.email}</p>
        </div>
      ),
    },
    {
      key: "local",
      header: "Local",
      render: (u) =>
        u.local ? (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{u.local.name}</span>
            {u.local.status !== "ACTIVE" && (
              <Badge tone={STATUS_TONE[u.local.status]} className="text-[10px]">
                {STATUS_LABEL[u.local.status]}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-400">Sin local</span>
        ),
    },
    {
      key: "role",
      header: "Rol",
      render: (u) => <Badge tone={u.role === "EMPLOYEE" ? "neutral" : "info"}>{ROLE_LABEL[u.role]}</Badge>,
    },
    {
      key: "isActive",
      header: "Estado",
      render: (u) => <Badge tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Activo" : "Inactivo"}</Badge>,
    },
    {
      key: "createdAt",
      header: "Alta",
      render: (u) => <span className="text-xs text-neutral-600 dark:text-neutral-400">{formatDate(u.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (u) => {
        const busy = statusMutation.isPending && statusMutation.variables?.id === u.id;
        return (
          <div className="flex items-center justify-end gap-2">
            {u.isActive ? (
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-500/30 hover:bg-red-500/10 dark:text-red-400"
                isLoading={busy}
                onClick={() => statusMutation.mutate({ id: u.id, isActive: false })}
              >
                <Power className="h-3.5 w-3.5 mr-1" /> Desactivar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400"
                isLoading={busy}
                onClick={() => statusMutation.mutate({ id: u.id, isActive: true })}
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activar
              </Button>
            )}
            <Button size="sm" variant="outline" title="Restablecer contraseña" onClick={() => setPendingAction({ kind: "reset", user: u })}>
              <KeyRound className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" title="Cerrar todas las sesiones" onClick={() => setPendingAction({ kind: "revoke", user: u })}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <Card>
        <CardHeader title="Usuarios de todos los locales" description="Activación, contraseñas y sesiones de cada usuario" />
        <CardBody className="space-y-4">
          {localFilter && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              Filtrando por local:
              <button
                onClick={() => {
                  onClearLocalFilter();
                  setPage(1);
                }}
                className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400"
                title="Quitar filtro"
              >
                {localFilter.name}
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre, email o local..."
                value={search}
                onChange={(e) => resetPage(setSearch)(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onChange={(e) => resetPage(setRoleFilter)(e.target.value)} className="w-full sm:w-44">
              <option value="">Todos los roles</option>
              <option value="ADMIN">Administrador</option>
              <option value="MANAGER">Gerente</option>
              <option value="EMPLOYEE">Empleado</option>
            </Select>
            <Select
              value={activeFilter}
              onChange={(e) => resetPage(setActiveFilter)(e.target.value as "" | "true" | "false")}
              className="w-full sm:w-40"
            >
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={data?.items}
            isLoading={isLoading}
            keyField={(u) => u.id}
            emptyState="No se encontraron usuarios."
            pagination={data?.pagination}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      <ConfirmDialog
        open={pendingAction?.kind === "reset"}
        title="Restablecer contraseña"
        message={`Se generará una contraseña temporal para ${pendingAction?.user.email ?? ""} y se cerrarán todas sus sesiones.`}
        confirmLabel="Restablecer"
        danger
        isLoading={resetMutation.isPending}
        onConfirm={() => pendingAction && resetMutation.mutate(pendingAction.user)}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingAction?.kind === "revoke"}
        title="Cerrar sesiones"
        message={`${pendingAction?.user.email ?? ""} tendrá que volver a iniciar sesión en todos sus dispositivos.`}
        confirmLabel="Cerrar sesiones"
        isLoading={revokeMutation.isPending}
        onConfirm={() => pendingAction && revokeMutation.mutate(pendingAction.user)}
        onCancel={() => setPendingAction(null)}
      />

      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title="Contraseña temporal generada" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Compartí esta contraseña con <strong>{tempPassword?.user.email}</strong>. No se vuelve a mostrar.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900">
            <code className="flex-1 font-mono text-sm font-bold text-neutral-900 dark:text-white">{tempPassword?.password}</code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!tempPassword) return;
                navigator.clipboard.writeText(tempPassword.password).then(
                  () => showSuccess("Contraseña copiada"),
                  () => showError("No se pudo copiar"),
                );
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setTempPassword(null)}>Listo</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
