import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, CreditCard, Landmark, ListChecks, LogIn, LogOut, TrendingUp, Wallet, WalletCards } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { StatCard } from "../components/ui/StatCard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Tabs } from "../components/ui/Tabs";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import { permissions } from "../lib/permissions";
import {
  useCashStatus,
  useCashSummary,
  useCloseShift,
  useCreateWithdrawal,
  useOpenShift,
  useShifts,
  useCashMovements,
  useCashIncome,
} from "../hooks/useCash";
import type { CashMovementType, CashShift, IncomeMethod } from "../lib/types";

const openShiftSchema = z.object({
  countedAmount: z.coerce.number().min(0, "El monto no puede ser negativo"),
  note: z.string().optional(),
});
const closeShiftSchema = openShiftSchema;
type ShiftFormInput = z.input<typeof openShiftSchema>;
type ShiftFormValues = z.output<typeof openShiftSchema>;

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  note: z.string().min(1, "Indica el motivo del retiro"),
});
type WithdrawalFormInput = z.input<typeof withdrawalSchema>;
type WithdrawalFormValues = z.output<typeof withdrawalSchema>;

const MOVEMENT_TYPE_LABEL: Record<CashMovementType, string> = {
  SALE_IN: "Ingreso por venta",
  WITHDRAWAL: "Retiro manual",
  ADJUSTMENT: "Ajuste de caja",
  PURCHASE_OUT: "Compra al contado",
  SUPPLIER_PAYMENT: "Pago a proveedor",
};
const MOVEMENT_TYPE_TONE: Record<CashMovementType, "success" | "danger" | "warning"> = {
  SALE_IN: "success",
  WITHDRAWAL: "danger",
  ADJUSTMENT: "warning",
  PURCHASE_OUT: "danger",
  SUPPLIER_PAYMENT: "warning",
};

const INCOME_METHOD_LABEL: Record<IncomeMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};
const INCOME_METHOD_TONE: Record<IncomeMethod, "success" | "info" | "warning"> = {
  EFECTIVO: "success",
  TRANSFERENCIA: "info",
  TARJETA: "warning",
};

/** YYYY-MM-DD of today in the browser's local time zone (value for <input type="date">). */
function todayInputValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Local-time start/end of the given YYYY-MM-DD day, as ISO strings for the API. */
function dayRange(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return {
    from: new Date(y, m - 1, d, 0, 0, 0, 0).toISOString(),
    to: new Date(y, m - 1, d, 23, 59, 59, 999).toISOString(),
  };
}

function DiscrepancyBadge({ value }: { value: number }) {
  if (Math.round(value * 100) === 0) return <Badge tone="success">Sin diferencia</Badge>;
  return (
    <Badge tone={value > 0 ? "info" : "danger"}>
      {value > 0 ? "Sobrante" : "Faltante"} {formatCurrency(Math.abs(value))}
    </Badge>
  );
}

export default function Caja() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<"shifts" | "income" | "ledger">("shifts");

  const { data: status } = useCashStatus();
  const { data: summary } = useCashSummary();
  const openShift = useOpenShift();
  const closeShift = useCloseShift();
  const createWithdrawal = useCreateWithdrawal();

  const [lastClosed, setLastClosed] = useState<CashShift | null>(null);
  const [closing, setClosing] = useState(false);

  const openForm = useForm<ShiftFormInput, unknown, ShiftFormValues>({ resolver: zodResolver(openShiftSchema), defaultValues: { countedAmount: 0, note: "" } });
  const closeForm = useForm<ShiftFormInput, unknown, ShiftFormValues>({ resolver: zodResolver(closeShiftSchema), defaultValues: { countedAmount: 0, note: "" } });
  const withdrawalForm = useForm<WithdrawalFormInput, unknown, WithdrawalFormValues>({ resolver: zodResolver(withdrawalSchema), defaultValues: { amount: 0, note: "" } });
  const [confirmingWithdrawal, setConfirmingWithdrawal] = useState<WithdrawalFormValues | null>(null);

  const onOpenShift = async (values: ShiftFormValues) => {
    try {
      await openShift.mutateAsync({ countedAmount: values.countedAmount, note: values.note || null });
      showSuccess("Turno abierto correctamente");
      setLastClosed(null);
      openForm.reset({ countedAmount: 0, note: "" });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo abrir el turno"));
    }
  };

  const onCloseShift = async (values: ShiftFormValues) => {
    if (!status?.myOpenShift) return;
    try {
      const shift = await closeShift.mutateAsync({
        id: status.myOpenShift.id,
        input: { countedAmount: values.countedAmount, note: values.note || null },
      });
      showSuccess("Turno cerrado correctamente");
      setLastClosed(shift);
      setClosing(false);
      closeForm.reset({ countedAmount: 0, note: "" });
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo cerrar el turno"));
    }
  };

  const onWithdraw = async () => {
    if (!confirmingWithdrawal) return;
    try {
      await createWithdrawal.mutateAsync(confirmingWithdrawal);
      showSuccess("Retiro registrado correctamente");
      withdrawalForm.reset({ amount: 0, note: "" });
      setConfirmingWithdrawal(null);
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar el retiro"));
      setConfirmingWithdrawal(null);
    }
  };

  const [shiftsPage, setShiftsPage] = useState(1);
  const { data: shifts, isLoading: loadingShifts } = useShifts({ page: shiftsPage, limit: 10 });

  const [ledgerPage, setLedgerPage] = useState(1);
  const canViewLedger = permissions.canViewCashLedger(user?.role ?? "EMPLOYEE");
  const { data: movements, isLoading: loadingLedger } = useCashMovements({ page: ledgerPage, limit: 10 });

  const [incomeDay, setIncomeDay] = useState(todayInputValue);
  const [incomeMethod, setIncomeMethod] = useState<IncomeMethod | "">("");
  const { data: income, isLoading: loadingIncome } = useCashIncome(dayRange(incomeDay || todayInputValue()), canViewLedger && tab === "income");
  const incomeItems = income?.items.filter((i) => !incomeMethod || i.method === incomeMethod) ?? [];

  const canWithdraw = permissions.canManageCash(user?.role ?? "EMPLOYEE");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Caja</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Abre tu turno, registra retiros y consulta el historial.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Saldo en caja" value={formatCurrency(status?.currentBalance ?? 0)} icon={Wallet} />
        <StatCard label="Ventas en efectivo hoy" value={formatCurrency(summary?.salesInToday ?? 0)} icon={Banknote} />
        <StatCard
          label="Ventas por transferencia hoy"
          value={formatCurrency(summary?.ventasTransferenciaHoy ?? summary?.transferSalesToday ?? 0)}
          icon={Landmark}
        />
        <StatCard label="Retiros hoy" value={formatCurrency(summary?.withdrawalsToday ?? 0)} icon={WalletCards} tone="warning" />
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <Card className="flex-1">
          <CardHeader title="Mi turno" description="Verifica el efectivo contado al empezar y terminar" />
          <CardBody>
            {status?.myOpenShift ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Abierto por: <span className="font-medium text-neutral-900 dark:text-neutral-100">{status.myOpenShift.openedBy.name}</span> ({formatDateTime(status.myOpenShift.openedAt)})
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Contado: <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(status.myOpenShift.openingCounted)}</span>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Esperado: <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(status.myOpenShift.openingExpected)}</span>
                  </span>
                  <DiscrepancyBadge value={status.myOpenShift.openingDiscrepancy} />
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Transferencias: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(status.shiftTotals?.transfer ?? status.transferTotal ?? 0)}</span>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Tarjetas: <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(status.shiftTotals?.card ?? status.cardTotal ?? 0)}</span>
                  </span>
                </div>

                {!closing ? (
                  <Button variant="outline" onClick={() => setClosing(true)}>
                    <LogOut className="h-4 w-4" /> Cerrar turno
                  </Button>
                ) : (
                  <form onSubmit={closeForm.handleSubmit(onCloseShift)} className="flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-sm dark:border-neutral-800 dark:bg-neutral-800/40">
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Efectivo esperado: </span>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(status.currentBalance)}</span>
                      </div>
                      <div className="hidden h-4 w-px bg-neutral-200 dark:bg-neutral-700 sm:block" />
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Transferencias: </span>
                        <span className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(status.shiftTotals?.transfer ?? status.transferTotal ?? 0)}</span>
                      </div>
                      <div className="hidden h-4 w-px bg-neutral-200 dark:bg-neutral-700 sm:block" />
                      <div>
                        <span className="text-neutral-500 dark:text-neutral-400">Tarjetas: </span>
                        <span className="font-bold text-warning-600 dark:text-warning-400">{formatCurrency(status.shiftTotals?.card ?? status.cardTotal ?? 0)}</span>
                      </div>
                    </div>

                    <Input
                      label="Efectivo contado al cerrar"
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      error={closeForm.formState.errors.countedAmount?.message}
                      {...closeForm.register("countedAmount")}
                      onFocus={(e) => e.target.select()}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                    <Input label="Nota (opcional)" {...closeForm.register("note")} />
                    <div className="flex gap-2">
                      <Button type="submit" isLoading={closeShift.isPending}>
                        Confirmar cierre
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setClosing(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {lastClosed && (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-neutral-200 p-3 text-sm dark:border-neutral-800">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      Último cierre por: <span className="font-medium text-neutral-900 dark:text-neutral-100">{lastClosed.closedBy?.name ?? "—"}</span> ({formatDateTime(lastClosed.closedAt!)})
                    </span>
                    <DiscrepancyBadge value={lastClosed.closingDiscrepancy ?? 0} />
                  </div>
                )}
                <form onSubmit={openForm.handleSubmit(onOpenShift)} className="flex flex-col gap-3">
                  <Input
                    label="Efectivo contado al abrir"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    hint="Cuenta el efectivo físico disponible antes de empezar a vender"
                    error={openForm.formState.errors.countedAmount?.message}
                    {...openForm.register("countedAmount")}
                    onFocus={(e) => e.target.select()}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <Input label="Nota (opcional)" {...openForm.register("note")} />
                  <Button type="submit" isLoading={openShift.isPending}>
                    <LogIn className="h-4 w-4" /> Abrir turno
                  </Button>
                </form>
              </div>
            )}
          </CardBody>
        </Card>

        {canWithdraw && (
          <Card className="lg:w-96 lg:shrink-0">
            <CardHeader title="Retiro de caja" description="Solo el dueño puede retirar efectivo del saldo" />
            <CardBody>
              <form
                onSubmit={withdrawalForm.handleSubmit((values) => setConfirmingWithdrawal(values))}
                className="flex flex-col gap-3"
              >
                <Input
                  label="Monto a retirar"
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  error={withdrawalForm.formState.errors.amount?.message}
                  {...withdrawalForm.register("amount")}
                  onFocus={(e) => e.target.select()}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Input
                  label="Motivo"
                  required
                  error={withdrawalForm.formState.errors.note?.message}
                  {...withdrawalForm.register("note")}
                />
                <Button type="submit" variant="danger">
                  Registrar retiro
                </Button>
              </form>
            </CardBody>
          </Card>
        )}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "shifts", label: `Turnos${user?.role === "EMPLOYEE" ? " (míos)" : ""}`, icon: ListChecks },
          ...(canViewLedger
            ? [
                { value: "income" as const, label: "Ingresos", icon: TrendingUp },
                { value: "ledger" as const, label: "Movimientos de caja", icon: WalletCards },
              ]
            : []),
        ]}
      />

      {tab === "shifts" ? (
        <Card>
          {loadingShifts && !shifts ? (
            <TableSkeleton columns={6} />
          ) : !shifts || shifts.items.length === 0 ? (
            <EmptyState icon={ListChecks} title="Sin turnos" description="Aún no se han registrado turnos de caja." />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Abierto por</TH>
                    <TH>Apertura</TH>
                    <TH>Diferencia apertura</TH>
                    <TH>Cerrado por</TH>
                    <TH>Cierre</TH>
                    <TH>Diferencia cierre</TH>
                    <TH>Estado</TH>
                  </tr>
                </THead>
                <TBody>
                  {shifts.items.map((s) => (
                    <TR key={s.id}>
                      <TD className="font-medium text-neutral-900 dark:text-neutral-100">{s.openedBy.name}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(s.openedAt)}</TD>
                      <TD>
                        <DiscrepancyBadge value={s.openingDiscrepancy} />
                      </TD>
                      <TD className="font-medium text-neutral-900 dark:text-neutral-100">{s.closedBy?.name ?? "—"}</TD>
                      <TD className="text-xs text-neutral-400">{s.closedAt ? formatDateTime(s.closedAt) : "—"}</TD>
                      <TD>{s.closingDiscrepancy !== null ? <DiscrepancyBadge value={s.closingDiscrepancy} /> : "—"}</TD>
                      <TD>
                        <Badge tone={s.status === "OPEN" ? "info" : "neutral"}>{s.status === "OPEN" ? "Abierto" : "Cerrado"}</Badge>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={shifts.pagination.page} totalPages={shifts.pagination.totalPages} total={shifts.pagination.total} onPageChange={setShiftsPage} />
            </>
          )}
        </Card>
      ) : tab === "income" ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total ingresos" value={formatCurrency(income?.total ?? 0)} icon={TrendingUp} />
            <StatCard label="Efectivo" value={formatCurrency(income?.totals.EFECTIVO ?? 0)} icon={Banknote} />
            <StatCard label="Transferencia" value={formatCurrency(income?.totals.TRANSFERENCIA ?? 0)} icon={Landmark} />
            <StatCard label="Tarjeta" value={formatCurrency(income?.totals.TARJETA ?? 0)} icon={CreditCard} />
          </div>
          <Card>
            <div className="flex flex-wrap items-end gap-3 border-b border-neutral-200 p-4 dark:border-neutral-800">
              <div className="w-44">
                <Input label="Fecha" type="date" value={incomeDay} max={todayInputValue()} onChange={(e) => setIncomeDay(e.target.value)} />
              </div>
              <div className="w-44">
                <Select label="Medio de pago" value={incomeMethod} onChange={(e) => setIncomeMethod(e.target.value as IncomeMethod | "")}>
                  <option value="">Todos</option>
                  {(Object.keys(INCOME_METHOD_LABEL) as IncomeMethod[]).map((m) => (
                    <option key={m} value={m}>
                      {INCOME_METHOD_LABEL[m]}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            {loadingIncome && !income ? (
              <TableSkeleton columns={5} />
            ) : incomeItems.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin ingresos" description="No hay ingresos registrados para este día." />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Fecha y hora</TH>
                    <TH>Medio de pago</TH>
                    <TH>Monto</TH>
                    <TH>Detalle</TH>
                    <TH>Usuario</TH>
                  </tr>
                </THead>
                <TBody>
                  {incomeItems.map((i) => (
                    <TR key={i.id}>
                      <TD className="text-xs text-neutral-500 dark:text-neutral-400">{formatDateTime(i.createdAt)}</TD>
                      <TD>
                        <Badge tone={INCOME_METHOD_TONE[i.method]}>{INCOME_METHOD_LABEL[i.method]}</Badge>
                      </TD>
                      <TD className="font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(i.amount)}</TD>
                      <TD className="text-sm">{i.description}</TD>
                      <TD>{i.userName}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      ) : (
        <Card>
          {loadingLedger && !movements ? (
            <TableSkeleton columns={6} />
          ) : !movements || movements.items.length === 0 ? (
            <EmptyState icon={WalletCards} title="Sin movimientos" description="Aún no hay movimientos de caja." />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Tipo</TH>
                    <TH>Monto</TH>
                    <TH>Saldo (antes → después)</TH>
                    <TH>Usuario</TH>
                    <TH>Nota</TH>
                    <TH>Fecha</TH>
                  </tr>
                </THead>
                <TBody>
                  {movements.items.map((m) => (
                    <TR key={m.id}>
                      <TD>
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type]}>{MOVEMENT_TYPE_LABEL[m.type]}</Badge>
                      </TD>
                      <TD>{formatCurrency(m.amount)}</TD>
                      <TD className="text-xs text-neutral-500">
                        {formatCurrency(m.balanceBefore)} → {formatCurrency(m.balanceAfter)}
                      </TD>
                      <TD>{m.user.name}</TD>
                      <TD className="text-xs text-neutral-400">{m.note ?? "—"}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(m.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={movements.pagination.page} totalPages={movements.pagination.totalPages} total={movements.pagination.total} onPageChange={setLedgerPage} />
            </>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={!!confirmingWithdrawal}
        title="Confirmar retiro de caja"
        message={
          confirmingWithdrawal
            ? `Vas a retirar ${formatCurrency(confirmingWithdrawal.amount)} de la caja. Motivo: ${confirmingWithdrawal.note}`
            : ""
        }
        confirmLabel="Retirar"
        danger
        isLoading={createWithdrawal.isPending}
        onConfirm={onWithdraw}
        onCancel={() => setConfirmingWithdrawal(null)}
      />
    </div>
  );
}
