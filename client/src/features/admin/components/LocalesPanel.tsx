import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Power, CheckCircle, Plus, RefreshCw, Trash2, Store, Users } from "lucide-react";
import { listLocales, updateLocalStatus, createLocal, updateLocalPlan, updateLocalRubro, deleteLocal } from "../actions/superadmin.api";

import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Input, Select } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { useToast } from "../../../context/ToastContext";
import { usePlans } from "../../../hooks/usePlans";
import { useRubros } from "../../../hooks/useRubros";
import { formatCurrency, formatDate } from "../../../lib/formatters";
import type { LocalItem, LocalStatus } from "../../../lib/types";

export const STATUS_TONE: Record<LocalStatus, "success" | "danger" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  DUE_SOON: "warning",
};

export const STATUS_LABEL: Record<LocalStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  DUE_SOON: "Por Vencer",
};

export function LocalesPanel({ onViewUsers }: { onViewUsers: (local: LocalItem) => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalItem | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [planId, setPlanId] = useState("");
  const [rubroId, setRubroId] = useState("");
  const [changePlanTarget, setChangePlanTarget] = useState<LocalItem | null>(null);
  const [changePlanId, setChangePlanId] = useState("");
  const [changeRubroTarget, setChangeRubroTarget] = useState<LocalItem | null>(null);
  const [changeRubroId, setChangeRubroId] = useState("");

  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data: plansData } = usePlans(false);
  const activePlans = plansData ?? [];
  const { data: rubrosData } = useRubros(false);
  const activeRubros = rubrosData ?? [];

  const { data: localesData, isLoading: localesLoading } = useQuery({
    queryKey: ["superadmin-locales", page, search, statusFilter],
    queryFn: () => listLocales({ page, limit: 10, q: search || undefined, status: statusFilter || undefined }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["superadmin-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["superadmin-locales"] });
    queryClient.invalidateQueries({ queryKey: ["superadmin-users"] });
  };

  const createMutation = useMutation({
    mutationFn: createLocal,
    onSuccess: () => {
      showSuccess("Local y usuario administrador registrados exitosamente");
      setCreateModalOpen(false);
      setName("");
      setOwnerEmail("");
      setAdminPassword("");
      setPlanId("");
      setRubroId("");
      invalidate();
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo registrar el local");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocalStatus }) => updateLocalStatus(id, status),
    onSuccess: () => {
      showSuccess("Estado del local actualizado correctamente");
      invalidate();
    },
    onError: () => {
      showError("No se pudo actualizar el estado del local");
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: ({ id, planId }: { id: string; planId: string }) => updateLocalPlan(id, planId),
    onSuccess: () => {
      showSuccess("Plan del local actualizado correctamente");
      setChangePlanTarget(null);
      invalidate();
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo cambiar el plan del local");
    },
  });

  const changeRubroMutation = useMutation({
    mutationFn: ({ id, rubroId }: { id: string; rubroId: string | null }) => updateLocalRubro(id, rubroId),
    onSuccess: () => {
      showSuccess("Rubro del local actualizado correctamente");
      setChangeRubroTarget(null);
      invalidate();
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo cambiar el rubro del local");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLocal(id),
    onSuccess: () => {
      showSuccess("Local y todos sus datos asociados fueron eliminados permanentemente");
      setDeleteTarget(null);
      setConfirmName("");
      invalidate();
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo eliminar el local");
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPlanId = planId || activePlans[0]?.id;
    if (!name || !ownerEmail || !adminPassword || !selectedPlanId) {
      showError("Completa todos los campos obligatorios");
      return;
    }
    createMutation.mutate({ name, ownerEmail, adminPassword, planId: selectedPlanId, rubroId: rubroId || undefined });
  };

  const openChangePlan = (item: LocalItem) => {
    setChangePlanTarget(item);
    setChangePlanId(item.plan.id);
  };

  const openChangeRubro = (item: LocalItem) => {
    setChangeRubroTarget(item);
    setChangeRubroId(item.rubroId ?? "");
  };

  const handleDeleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTarget) return;
    if (confirmName.trim() !== deleteTarget.name.trim()) {
      showError("El nombre ingresado no coincide con el nombre del local");
      return;
    }
    deleteMutation.mutate(deleteTarget.id);
  };

  const columns: DataTableColumn<LocalItem>[] = [
    {
      key: "name",
      header: "Nombre del Negocio",
      render: (item) => (
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.ownerEmail}</p>
          <p className="font-mono text-[10px] text-neutral-400 dark:text-neutral-500">{item.id}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan Actual",
      render: (item) => (
        <button onClick={() => openChangePlan(item)} className="text-left">
          <Badge tone={item.isTrial ? "warning" : "success"} className="font-semibold">
            {item.isTrial ? `Prueba (${item.plan.trialDays ?? "-"} días)` : item.plan.name}
          </Badge>
        </button>
      ),
    },
    {
      key: "rubro",
      header: "Rubro",
      render: (item) => (
        <button onClick={() => openChangeRubro(item)} className="text-left">
          <Badge tone={item.rubro ? "info" : "neutral"} className="font-semibold">
            {item.rubro?.name ?? "Sin asignar"}
          </Badge>
        </button>
      ),
    },
    {
      key: "users",
      header: "Usuarios",
      render: (item) => (
        <button
          onClick={() => onViewUsers(item)}
          className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
          title="Ver usuarios de este local"
        >
          <Users className="h-3.5 w-3.5" />
          {item._count?.users ?? 0}
          <span className="text-xs font-normal text-neutral-500 dark:text-neutral-400">
            / {item.plan.maxAdmins + item.plan.maxEmployees}
          </span>
        </button>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (item) => (
        <Badge tone={STATUS_TONE[item.status]} className="font-semibold">
          {STATUS_LABEL[item.status]}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      header: "Vencimiento",
      render: (item) => (
        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
          {formatDate(item.dueDate)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Acciones",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          {item.status === "ACTIVE" ? (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 border-red-500/30 hover:bg-red-500/10 dark:text-red-400"
              isLoading={statusMutation.isPending && statusMutation.variables?.id === item.id}
              onClick={() => statusMutation.mutate({ id: item.id, status: "SUSPENDED" })}
            >
              <Power className="h-3.5 w-3.5 mr-1" /> Suspender
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10 dark:text-emerald-400"
              isLoading={statusMutation.isPending && statusMutation.variables?.id === item.id}
              onClick={() => statusMutation.mutate({ id: item.id, status: "ACTIVE" })}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activar
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            className="text-neutral-600 border-neutral-300 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-600 dark:text-neutral-400 dark:border-neutral-800 dark:hover:text-red-400"
            onClick={() => {
              setDeleteTarget(item);
              setConfirmName("");
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card>
        <CardHeader
          title="Gestión de Locales"
          description="Control de estados, suscripciones y accesos por negocio"
          action={
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Registrar Nuevo Local
            </Button>
          }
        />
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar negocio por nombre, ID o email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-48"
            >
              <option value="">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="DUE_SOON">Por Vencer</option>
              <option value="SUSPENDED">Suspendidos</option>
            </Select>
          </div>

          <DataTable
            columns={columns}
            data={localesData?.items}
            isLoading={localesLoading}
            keyField={(item) => item.id}
            emptyState="No se encontraron locales registrados."
            pagination={localesData?.pagination}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>

      {/* Modal Registrar Nuevo Local */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Registrar Nuevo Local" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <Input
            label="Nombre del Local / Negocio"
            placeholder="Ej. Ferretería Central"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email del Administrador"
            type="email"
            placeholder="admin@negocio.com"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña Inicial"
            type="password"
            placeholder="••••••••"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            required
          />
          <Select label="Plan Inicial" value={planId || activePlans[0]?.id || ""} onChange={(e) => setPlanId(e.target.value)}>
            {activePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isTrial
                  ? `${p.name} (${p.trialDays ?? "-"} Días - ${p.maxAdmins} Admin y ${p.maxEmployees} Empleados)`
                  : `${p.name} (${formatCurrency(p.monthlyPrice)} ARS/mes - ${p.maxAdmins} Admin(es) y ${p.maxEmployees} Empleados)`}
              </option>
            ))}
          </Select>
          <Select label="Rubro (opcional)" value={rubroId} onChange={(e) => setRubroId(e.target.value)}>
            <option value="">Sin rubro asignado</option>
            {activeRubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Registrar Local
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Cambiar Plan */}
      <Modal
        open={!!changePlanTarget}
        onClose={() => setChangePlanTarget(null)}
        title={`Cambiar plan de ${changePlanTarget?.name ?? ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <Select label="Nuevo plan" value={changePlanId} onChange={(e) => setChangePlanId(e.target.value)}>
            {activePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.isTrial ? `${p.name} (${p.trialDays ?? "-"} Días)` : `${p.name} (${formatCurrency(p.monthlyPrice)} ARS/mes)`}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setChangePlanTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={changePlanMutation.isPending}
              onClick={() => changePlanTarget && changePlanMutation.mutate({ id: changePlanTarget.id, planId: changePlanId })}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" /> Cambiar Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cambiar Rubro */}
      <Modal
        open={!!changeRubroTarget}
        onClose={() => setChangeRubroTarget(null)}
        title={`Cambiar rubro de ${changeRubroTarget?.name ?? ""}`}
        size="sm"
      >
        <div className="space-y-4">
          <Select label="Rubro" value={changeRubroId} onChange={(e) => setChangeRubroId(e.target.value)}>
            <option value="">Sin rubro asignado</option>
            {activeRubros.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setChangeRubroTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              isLoading={changeRubroMutation.isPending}
              onClick={() =>
                changeRubroTarget && changeRubroMutation.mutate({ id: changeRubroTarget.id, rubroId: changeRubroId || null })
              }
            >
              <Store className="h-4 w-4 mr-1.5" /> Cambiar Rubro
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Confirmación de Eliminación Estricta */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="⚠️ Eliminar Local Permanentemente" size="md">
        <form onSubmit={handleDeleteSubmit} className="space-y-4">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-600 dark:text-red-400 space-y-2">
            <p className="text-sm font-bold">¡ADVERTENCIA DE ACCIÓN IRREVERSIBLE!</p>
            <p className="text-xs leading-relaxed text-neutral-700 dark:text-neutral-300">
              Estás a punto de eliminar el local{" "}
              <strong className="text-neutral-900 dark:text-white font-mono">{deleteTarget?.name}</strong> (ID: {deleteTarget?.id}).
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              Esta acción eliminará de forma PERMANENTE todos los productos, ventas, categorías, clientes, caja e historiales asociados a este negocio.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Para confirmar, escribe exactamente el nombre del local:{" "}
              <span className="font-mono font-bold text-neutral-900 dark:text-white">{deleteTarget?.name}</span>
            </label>
            <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={deleteTarget?.name} required />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={deleteMutation.isPending}
              disabled={confirmName.trim() !== deleteTarget?.name.trim()}
            >
              Eliminar Definitivamente
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
