import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Banknote, ListChecks, LogIn, LogOut, Wallet, WalletCards } from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { StatCard } from "../components/ui/StatCard";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import { permissions } from "../lib/permissions";
import { cn } from "../lib/utils";
import {
  useCashStatus,
  useCashSummary,
  useCloseShift,
  useCreateWithdrawal,
  useOpenShift,
  useShifts,
  useCashMovements,
} from "../hooks/useCash";
import type { CashMovementType, CashShift } from "../lib/types";

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
  SALE_IN: "Venta en efectivo",
  WITHDRAWAL: "Retiro",
  ADJUSTMENT: "Ajuste",
};
const MOVEMENT_TYPE_TONE: Record<CashMovementType, "success" | "danger" | "warning"> = {
  SALE_IN: "success",
  WITHDRAWAL: "danger",
  ADJUSTMENT: "warning",
};

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
  const [tab, setTab] = useState<"shifts" | "ledger">("shifts");

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

  const canWithdraw = permissions.canManageCash(user?.role ?? "EMPLOYEE");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Caja</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Abre tu turno, registra retiros y consulta el historial.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Saldo en caja" value={formatCurrency(status?.currentBalance ?? 0)} icon={Wallet} />
        <StatCard label="Ventas en efectivo hoy" value={formatCurrency(summary?.salesInToday ?? 0)} icon={Banknote} />
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
                    Abierto: <span className="text-neutral-900 dark:text-neutral-100">{formatDateTime(status.myOpenShift.openedAt)}</span>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Contado: <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(status.myOpenShift.openingCounted)}</span>
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400">
                    Esperado: <span className="text-neutral-900 dark:text-neutral-100">{formatCurrency(status.myOpenShift.openingExpected)}</span>
                  </span>
                  <DiscrepancyBadge value={status.myOpenShift.openingDiscrepancy} />
                </div>

                {!closing ? (
                  <Button variant="outline" onClick={() => setClosing(true)}>
                    <LogOut className="h-4 w-4" /> Cerrar turno
                  </Button>
                ) : (
                  <form onSubmit={closeForm.handleSubmit(onCloseShift)} className="flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                    <Input
                      label="Efectivo contado al cerrar"
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      error={closeForm.formState.errors.countedAmount?.message}
                      {...closeForm.register("countedAmount")}
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
                    <span className="text-neutral-500 dark:text-neutral-400">Último cierre:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">{formatDateTime(lastClosed.closedAt!)}</span>
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

      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setTab("shifts")}
          className={cn(
            "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
            tab === "shifts" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-neutral-500",
          )}
        >
          <ListChecks className="h-4 w-4" /> Turnos{user?.role === "EMPLOYEE" ? " (míos)" : ""}
        </button>
        {canViewLedger && (
          <button
            onClick={() => setTab("ledger")}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium",
              tab === "ledger" ? "border-indigo-600 text-indigo-600 dark:text-indigo-400" : "border-transparent text-neutral-500",
            )}
          >
            <WalletCards className="h-4 w-4" /> Movimientos de caja
          </button>
        )}
      </div>

      {tab === "shifts" ? (
        <Card>
          {loadingShifts && !shifts ? (
            <div className="p-8 text-center text-sm text-neutral-400">Cargando...</div>
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
                    <TH>Cierre</TH>
                    <TH>Diferencia cierre</TH>
                    <TH>Estado</TH>
                  </tr>
                </THead>
                <TBody>
                  {shifts.items.map((s) => (
                    <TR key={s.id}>
                      <TD>{s.openedBy.name}</TD>
                      <TD className="text-xs text-neutral-400">{formatDateTime(s.openedAt)}</TD>
                      <TD>
                        <DiscrepancyBadge value={s.openingDiscrepancy} />
                      </TD>
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
      ) : (
        <Card>
          {loadingLedger && !movements ? (
            <div className="p-8 text-center text-sm text-neutral-400">Cargando...</div>
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
