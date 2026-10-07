import { useState } from "react";
import { Drawer } from "../ui/Drawer";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { Table, THead, TBody, TR, TH, TD } from "../ui/Table";
import { Badge } from "../ui/Badge";
import { formatCurrency, formatDateTime } from "../../lib/formatters";
import { useSupplierAccount, useSupplierAccountMutations } from "../../hooks/useSuppliers";
import { useToast } from "../../context/ToastContext";
import { extractErrorMessage } from "../../api/client";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { PaymentMethod } from "../../lib/types";

export function SupplierAccountDrawer({ supplierId, open, onClose }: { supplierId: string | null; open: boolean; onClose: () => void }) {
  const { data: supplier, isLoading } = useSupplierAccount(supplierId);
  const { registerPayment } = useSupplierAccountMutations();
  const { showSuccess, showError } = useToast();

  const [paymentAmount, setPaymentAmount] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [paymentNote, setPaymentNote] = useState("");

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || paymentAmount === "" || paymentAmount <= 0) return;

    try {
      await registerPayment.mutateAsync({
        id: supplierId,
        input: { amount: paymentAmount, paymentMethod, note: paymentNote.trim() || null },
      });
      showSuccess("Pago registrado exitosamente");
      setPaymentAmount("");
      setPaymentNote("");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar el pago"));
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={supplier ? `Cuenta corriente: ${supplier.name}` : "Cargando..."}>
      {isLoading || !supplier ? (
        <p className="py-6 text-center text-sm text-neutral-400">Cargando datos...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-sm text-neutral-500 dark:text-neutral-400">Deuda actual</div>
            <div className={`text-3xl font-bold ${supplier.currentBalance > 0 ? "text-danger-600" : "text-neutral-900 dark:text-neutral-100"}`}>
              {formatCurrency(supplier.currentBalance)}
            </div>
            <div className="mt-1 text-xs text-neutral-400">Al {formatDateTime(new Date().toISOString())}</div>
          </div>

          <form onSubmit={handlePayment} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Registrar Pago a Proveedor</h3>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monto"
                type="number"
                min={0.01}
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value ? Number(e.target.value) : "")}
              />
              <Select label="Método" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} required>
                <option value="EFECTIVO">Efectivo (Descuenta caja)</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="TARJETA">Tarjeta</option>
              </Select>
            </div>
            <Textarea
              label="Nota (opcional)"
              rows={2}
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Ej. Recibo 0001-1234"
            />
            <Button type="submit" isLoading={registerPayment.isPending} disabled={paymentAmount === "" || paymentAmount <= 0}>
              Registrar pago
            </Button>
          </form>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">Historial de movimientos</h3>
            {supplier.movements?.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">No hay movimientos registrados.</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Fecha</TH>
                    <TH>Concepto</TH>
                    <TH className="text-right">Monto</TH>
                  </tr>
                </THead>
                <TBody>
                  {supplier.movements?.map((mov: any) => (
                    <TR key={mov.id}>
                      <TD className="text-xs">
                        {formatDateTime(mov.createdAt)}
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          {mov.type === "CHARGE" ? (
                            <ArrowUpRight className="h-4 w-4 text-danger-500" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-success-500" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {mov.type === "CHARGE" ? "Deuda generada (Compra)" : "Pago realizado"}
                            </div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[200px]">
                              {mov.note || (mov.purchase?.receiptNumber ? `Factura ${mov.purchase.receiptNumber}` : "Sin nota")}
                            </div>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-right font-medium">
                        <span className={mov.type === "CHARGE" ? "text-danger-600" : "text-success-600"}>
                          {mov.type === "CHARGE" ? "+" : "-"}{formatCurrency(mov.amount)}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
