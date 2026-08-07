import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ShieldAlert, CheckCircle, DollarSign, Search, Power, AlertCircle, Sparkles, Plus, Clock, UserCheck } from "lucide-react";
import { getSuperAdminMetrics, listLocales, updateLocalStatus, createLocal } from "../actions/superadmin.api";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { Badge } from "../../../components/ui/Badge";
import { Input, Select } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useToast } from "../../../context/ToastContext";
import { formatCurrency, formatDate } from "../../../lib/formatters";
import type { LocalItem, LocalStatus, PlanType } from "../../../lib/types";

const STATUS_TONE: Record<LocalStatus, "success" | "danger" | "warning"> = {
  ACTIVE: "success",
  SUSPENDED: "danger",
  DUE_SOON: "warning",
};

const STATUS_LABEL: Record<LocalStatus, string> = {
  ACTIVE: "Activo",
  SUSPENDED: "Suspendido",
  DUE_SOON: "Por Vencer",
};

export default function SuperAdminDashboard() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [plan, setPlan] = useState<PlanType>("TRIAL");

  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["superadmin-metrics"],
    queryFn: getSuperAdminMetrics,
  });

  const { data: localesData, isLoading: localesLoading } = useQuery({
    queryKey: ["superadmin-locales", page, search, statusFilter],
    queryFn: () => listLocales({ page, limit: 10, q: search || undefined, status: statusFilter || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: createLocal,
    onSuccess: () => {
      showSuccess("Local y usuario administrador registrados exitosamente");
      setCreateModalOpen(false);
      setName("");
      setOwnerEmail("");
      setAdminPassword("");
      setPlan("TRIAL");
      queryClient.invalidateQueries({ queryKey: ["superadmin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-locales"] });
    },
    onError: (err: any) => {
      showError(err?.response?.data?.message || "No se pudo registrar el local");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: LocalStatus }) => updateLocalStatus(id, status),
    onSuccess: () => {
      showSuccess("Estado del local actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["superadmin-metrics"] });
      queryClient.invalidateQueries({ queryKey: ["superadmin-locales"] });
    },
    onError: () => {
      showError("No se pudo actualizar el estado del local");
    },
  });

  if (metricsLoading || localesLoading || !metricsData || !localesData) {
    return <FullPageSpinner />;
  }

  const { metrics, conversionAlerts } = metricsData;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !ownerEmail || !adminPassword) {
      showError("Completa todos los campos obligatorios");
      return;
    }
    createMutation.mutate({ name, ownerEmail, adminPassword, plan });
  };

  const columns: DataTableColumn<LocalItem>[] = [
    {
      key: "id",
      header: "ID Local",
      render: (item) => (
        <span className="font-mono text-xs font-semibold text-neutral-400">{item.id}</span>
      ),
    },
    {
      key: "name",
      header: "Nombre del Negocio",
      render: (item) => (
        <div>
          <p className="font-bold text-neutral-900 dark:text-white">{item.name}</p>
          <p className="text-xs text-neutral-400">{item.ownerEmail}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan Actual",
      render: (item) => (
        <Badge tone={item.plan === "PRO" ? "success" : item.plan === "TRIAL" ? "warning" : "neutral"} className="font-semibold">
          {item.plan === "TRIAL" ? "Prueba (7 días)" : `Kipo ${item.plan}`}
        </Badge>
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
        <span className="text-xs font-medium text-neutral-300">
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
              className="text-red-400 border-red-500/30 hover:bg-red-500/10"
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: item.id, status: "SUSPENDED" })}
            >
              <Power className="h-3.5 w-3.5 mr-1" /> Suspender
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              isLoading={statusMutation.isPending}
              onClick={() => statusMutation.mutate({ id: item.id, status: "ACTIVE" })}
            >
              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Activar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 animate-in fade-in duration-500">
      {/* SuperAdmin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-500" />
            <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
              Control Global SaaS — SuperAdmin
            </h1>
          </div>
          <p className="mt-1 text-sm text-neutral-400">
            Administración centralizada de todos los locales registrados en Kipo.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Registrar Nuevo Local
          </Button>
          <Badge tone="success" className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider shrink-0">
            Modo Administrador Máximo
          </Badge>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ingreso Mensual (MRR)"
          value={formatCurrency(metrics.mrr)}
          icon={DollarSign}
          tone="neutral"
        />
        <StatCard
          label="Locales Totales"
          value={metrics.totalLocales.toString()}
          icon={Building2}
        />
        <StatCard
          label="Locales Activos"
          value={metrics.activeLocales.toString()}
          icon={CheckCircle}
          tone="neutral"
        />
        <StatCard
          label="Suspendidos / Por Vencer"
          value={(metrics.suspendedLocales + metrics.dueSoonLocales).toString()}
          icon={ShieldAlert}
          tone={metrics.suspendedLocales > 0 ? "danger" : "warning"}
        />
      </div>

      {/* Conversion Alerts Section */}
      {conversionAlerts && conversionAlerts.length > 0 && (
        <Card>
          <CardHeader
            title="Alertas de Conversión & Pruebas"
            description="Estado de locales en prueba de 7 días y vencimientos recientes"
          />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {conversionAlerts.map((alert) => (
                <div
                  key={alert.localId}
                  className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">{alert.name}</h4>
                      <p className="text-xs text-neutral-400">{alert.ownerEmail}</p>
                    </div>
                    {alert.alertStatus === "CONVERTED" ? (
                      <Badge tone="success" className="text-[10px]">
                        <UserCheck className="h-3 w-3 mr-1 inline" /> Convertido ({alert.plan})
                      </Badge>
                    ) : alert.alertStatus === "SUSPENDED_EXPIRED" ? (
                      <Badge tone="danger" className="text-[10px]">
                        <AlertCircle className="h-3 w-3 mr-1 inline" /> Vencido / Suspendido
                      </Badge>
                    ) : (
                      <Badge tone="warning" className="text-[10px]">
                        <Clock className="h-3 w-3 mr-1 inline" /> Trial Activo
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                    <span>Vence: {formatDate(alert.dueDate)}</span>
                    <span className="font-semibold text-neutral-300">Plan: {alert.plan}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Locales List */}
      <Card>
        <CardHeader
          title="Gestión de Locales"
          description="Control de estados, suscripciones y accesos por negocio"
        />
        <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar negocio por nombre, ID o email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            data={localesData.items}
            keyField={(item) => item.id}
            emptyState="No se encontraron locales registrados."
          />
        </CardBody>
      </Card>

      {/* Modal Registrar Nuevo Local */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Registrar Nuevo Local"
        size="md"
      >
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
          <Select
            label="Plan Inicial"
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanType)}
          >
            <option value="TRIAL">Prueba Gratis (7 Días)</option>
            <option value="BASICO">Plan Básico ($24.900 ARS/mes - máx 3 usuarios)</option>
            <option value="PRO">Plan Pro ($39.900 ARS/mes - usuarios ilimitados)</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending}
            >
              Registrar Local
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

