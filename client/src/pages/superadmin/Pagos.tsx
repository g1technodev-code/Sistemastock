import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DollarSign, TrendingUp, CheckCircle, Search, RefreshCw, CreditCard, Plus, HandCoins } from "lucide-react";
import { Card, CardHeader, CardBody } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { StatCard } from "../../components/ui/StatCard";
import { DataTable, type DataTableColumn } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { Input, Select } from "../../components/ui/Field";
import { listPayments, createManualPayment, type SubscriptionPayment } from "../../api/superadminPayments";
import { listLocales } from "../../features/admin/actions/superadmin.api";
import { listPublicPlans } from "../../api/plans";
import { formatCurrency, formatDate } from "../../lib/formatters";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";

export default function SuperAdminPagos() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);

  const { showSuccess, showError } = useToast();

  // Form states for manual payment
  const [selectedLocalId, setSelectedLocalId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"EFECTIVO" | "TRANSFERENCIA">("EFECTIVO");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-payments", page, search, statusFilter],
    queryFn: () => listPayments({ page, limit: 10, search, status: statusFilter }),
  });

  const { data: localesData } = useQuery({
    queryKey: ["superadmin-locales-all"],
    queryFn: () => listLocales({ limit: 100 }),
    enabled: modalOpen,
  });

  const { data: plansData } = useQuery({
    queryKey: ["public-plans"],
    queryFn: listPublicPlans,
    enabled: modalOpen,
  });

  const manualPaymentMutation = useMutation({
    mutationFn: createManualPayment,
    onSuccess: () => {
      showSuccess("Pago manual registrado y suscripción renovada");
      setModalOpen(false);
      resetModalForm();
      refetch();
    },
    onError: (err) => {
      showError(extractErrorMessage(err, "No se pudo registrar el pago manual"));
    },
  });

  const resetModalForm = () => {
    setSelectedLocalId("");
    setSelectedPlanId("");
    setAmount(0);
    setPaymentMethod("EFECTIVO");
    setPaymentDate(new Date().toISOString().split("T")[0]);
  };

  const handleLocalChange = (localId: string) => {
    setSelectedLocalId(localId);
    const foundLocal = localesData?.items.find((l) => l.id === localId);
    if (foundLocal && foundLocal.plan) {
      setSelectedPlanId(foundLocal.plan.id);
      setAmount(Number(foundLocal.plan.monthlyPrice));
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlanId(planId);
    const foundPlan = plansData?.find((p) => p.id === planId);
    if (foundPlan) {
      setAmount(Number(foundPlan.monthlyPrice));
    }
  };

  const handleCreatePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocalId) return showError("Selecciona un local");
    if (!selectedPlanId) return showError("Selecciona un plan");
    if (amount <= 0) return showError("El monto debe ser mayor a 0");

    manualPaymentMutation.mutate({
      localId: selectedLocalId,
      planId: selectedPlanId,
      amount,
      paymentMethod,
      createdAt: paymentDate ? new Date(paymentDate).toISOString() : undefined,
    });
  };

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
      key: "paymentMethod",
      header: "Método",
      render: (item: SubscriptionPayment) => (
        <Badge tone={item.paymentMethod === "MERCADO_PAGO" ? "info" : "warning"}>
          {item.paymentMethod ?? "MERCADO_PAGO"}
        </Badge>
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
      header: "ID Transacción",
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
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Historial de suscripciones e ingresos (Mercado Pago, Efectivo y Transferencias)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar Pago Manual
          </Button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Pago Manual">
        <form onSubmit={handleCreatePaymentSubmit} className="space-y-4">
          <Select
            label="Local *"
            value={selectedLocalId}
            onChange={(e) => handleLocalChange(e.target.value)}
            required
          >
            <option value="">-- Seleccionar Local --</option>
            {localesData?.items.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.ownerEmail})
              </option>
            ))}
          </Select>

          <Select
            label="Plan Facturado *"
            value={selectedPlanId}
            onChange={(e) => handlePlanChange(e.target.value)}
            required
          >
            <option value="">-- Seleccionar Plan --</option>
            {plansData?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatCurrency(Number(p.monthlyPrice))}/mes)
              </option>
            ))}
          </Select>

          <Input
            label="Monto Abonado ($) *"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            required
          />

          <Select
            label="Método de Pago *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "EFECTIVO" | "TRANSFERENCIA")}
            required
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia Bancaria</option>
          </Select>

          <Input
            label="Fecha del Pago *"
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={manualPaymentMutation.isPending}>
              Registrar y Renovar (+30 Días)
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

