import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ShieldAlert, CheckCircle, DollarSign, Search, Power, AlertCircle, Sparkles } from "lucide-react";
import { getSuperAdminMetrics, listLocales, updateLocalStatus } from "../actions/superadmin.api";
import { Card, CardHeader, CardBody } from "../../../components/ui/Card";
import { StatCard } from "../../../components/ui/StatCard";
import { Badge } from "../../../components/ui/Badge";
import { Input, Select } from "../../../components/ui/Field";
import { Button } from "../../../components/ui/Button";
import { DataTable, type DataTableColumn } from "../../../components/ui/DataTable";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useToast } from "../../../context/ToastContext";
import { formatCurrency, formatDate } from "../../../lib/formatters";
import type { LocalItem, LocalStatus } from "../../../lib/types";

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

  const { metrics } = metricsData;

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
        <Badge tone={item.plan === "PRO" ? "success" : "neutral"} className="font-semibold">
          Kipo {item.plan}
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
        <Badge tone="success" className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider shrink-0">
          Modo Administrador Máximo
        </Badge>
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

    </div>
  );
}
