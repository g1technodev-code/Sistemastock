import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, CheckCircle, Search, RefreshCw, CreditCard } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { listPayments, type SubscriptionPayment } from "../../api/superadminPayments";
import { formatCurrency, formatDate } from "../../lib/formatters";

export default function SuperAdminPagos() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-payments", page, search, statusFilter],
    queryFn: () => listPayments({ page, limit: 10, search, status: statusFilter }),
  });

  const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
    APPROVED: "success",
    PENDING: "warning",
    REJECTED: "danger",
    REFUNDED: "neutral",
  };

  const STATUS_LABEL: Record<string, string> = {
    APPROVED: "Aprobado",
    PENDING: "Pendiente",
    REJECTED: "Rechazado",
    REFUNDED: "Reembolsado",
  };

  const columns: DataTableColumn<SubscriptionPayment>[] = [
    {
      key: "createdAt",
      header: "Fecha",
      render: (item: SubscriptionPayment) => (
        <span className="font-medium text-neutral-900 dark:text-neutral-100">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: "local",
      header: "Local",
      render: (item: SubscriptionPayment) => (
        <div>
          <p className="font-bold text-neutral-900 dark:text-neutral-100">{item.local?.name ?? "N/A"}</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.local?.ownerEmail}</p>
        </div>
      ),
    },
    {
      key: "plan",
      header: "Plan Facturado",
      render: (item: SubscriptionPayment) => (
        <Badge tone="info" className="font-semibold">
          {item.plan?.name ?? "Kipo Pro"}
        </Badge>
      ),
    },
    {
      key: "amount",
      header: "Monto",
      render: (item: SubscriptionPayment) => (
        <span className="font-bold text-neutral-900 dark:text-neutral-100">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Estado",
      render: (item: SubscriptionPayment) => (
        <Badge tone={STATUS_TONE[item.status] ?? "neutral"}>
          {STATUS_LABEL[item.status] ?? item.status}
        </Badge>
      ),
    },
    {
      key: "mpPaymentId",
      header: "ID Transacción MP",
      render: (item: SubscriptionPayment) => (
        <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
          {item.mpPaymentId ?? "MANUAL-TX"}
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">Pagos e Ingresos</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Historial de suscripciones e ingresos generados vía Mercado Pago</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Ingresos del Mes"
          value={formatCurrency(data?.metrics.monthlyIncome ?? 0)}
          icon={CreditCard}
        />
        <StatCard
          label="MRR Estimado"
          value={formatCurrency(data?.metrics.estimatedMrr ?? 0)}
          icon={TrendingUp}
        />
        <StatCard
          label="Tasa de Éxito"
          value={`${data?.metrics.successRate ?? 100}%`}
          icon={CheckCircle}
        />
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader
          title="Historial de Transacciones"
          description="Detalle de cobros procesados por el sistema de pagos"
        />
        <CardBody className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Buscar por local o ID de Mercado Pago..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-2 text-sm font-medium text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 focus:border-primary-500 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300"
              >
                <option value="ALL">Todos los estados</option>
                <option value="APPROVED">Aprobados</option>
                <option value="PENDING">Pendientes</option>
                <option value="REJECTED">Rechazados</option>
              </select>
            </div>
          </div>

          <DataTable
            columns={columns}
            data={data?.items}
            keyField={(row) => row.id}
            isLoading={isLoading}
            emptyState={<EmptyState title="No hay pagos" description="No se encontraron registros de pagos con los filtros seleccionados." icon={CreditCard} />}
            pagination={data?.pagination}
            onPageChange={setPage}
          />
        </CardBody>
      </Card>
    </div>
  );
}
