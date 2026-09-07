import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Field";
import { usePurchaseOrderMutations } from "../../hooks/usePurchaseOrders";
import { useToast } from "../../hooks/useToast";
import { extractErrorMessage } from "../../lib/api";
import { formatCurrency } from "../../lib/formatters";
import type { PurchaseOrder, PaymentMethod, PurchaseOrderItem } from "../../lib/types";

export function ReceiveOrderModal({ order, open, onClose }: { order: PurchaseOrder; open: boolean; onClose: () => void }) {
  const { receive } = usePurchaseOrderMutations();
  const { showSuccess, showError } = useToast();

  const [items, setItems] = useState(
    order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      name: it.product.name,
      sku: it.product.sku,
      orderedQuantity: it.quantity,
      alreadyReceived: it.receivedQuantity,
      receivedQuantity: Math.max(0, it.quantity - it.receivedQuantity),
      actualUnitCost: it.estimatedUnitPrice,
    }))
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [note, setNote] = useState("");

  const handleUpdateItem = (productId: string, field: string, value: number) => {
    setItems((prev) => prev.map((it) => (it.productId === productId ? { ...it, [field]: value } : it)));
  };

  const total = items.reduce((sum, it) => sum + it.receivedQuantity * it.actualUnitCost, 0);

  const handleSubmit = async () => {
    try {
      await receive.mutateAsync({
        id: order.id,
        input: {
          paymentMethod: paymentMethod || null,
          receiptNumber: receiptNumber || null,
          note: note.trim() || null,
          items: items.map((it) => ({
            id: it.id,
            productId: it.productId,
            receivedQuantity: it.receivedQuantity,
            actualUnitCost: it.actualUnitCost,
          })),
        },
      });
      showSuccess("Mercadería recibida exitosamente");
      onClose();
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo recibir la mercadería"));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Recibir Pedido #${order.id.slice(-6)}`} size="xl">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Ajusta las cantidades recibidas y los costos reales. Los productos se sumarán al stock automáticamente.
        </p>

        <div className="max-h-96 overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500">
              <tr>
                <th className="p-3 font-medium">Producto</th>
                <th className="p-3 font-medium text-right">Pendiente</th>
                <th className="p-3 font-medium">Recibido Ahora</th>
                <th className="p-3 font-medium">Costo Real</th>
                <th className="p-3 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-950">
              {items.map((it) => {
                const pending = Math.max(0, it.orderedQuantity - it.alreadyReceived);
                return (
                  <tr key={it.productId}>
                    <td className="p-3">
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{it.name}</div>
                      <div className="text-xs text-neutral-400">{it.sku}</div>
                    </td>
                    <td className="p-3 text-right text-neutral-500">{pending}</td>
                    <td className="p-3 w-32">
                      <input
                        type="number"
                        min={0}
                        value={it.receivedQuantity}
                        onChange={(e) => handleUpdateItem(it.productId, "receivedQuantity", Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </td>
                    <td className="p-3 w-32">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={it.actualUnitCost}
                        onChange={(e) => handleUpdateItem(it.productId, "actualUnitCost", Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </td>
                    <td className="p-3 text-right font-medium">{formatCurrency(it.receivedQuantity * it.actualUnitCost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Método de Pago" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
            <option value="">Sin pago inmediato (o a convenir)</option>
            <option value="EFECTIVO">Efectivo (Descuenta caja)</option>
            <option value="CUENTA_CORRIENTE">Cuenta Corriente (Suma Deuda)</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA">Tarjeta</option>
          </Select>

          <Input label="Comprobante (opcional)" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} placeholder="Nro de Factura/Recibo" />
        </div>

        <Textarea label="Nota para la compra (opcional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />

        <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
          <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total a Pagar</span>
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(total)}</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSubmit} isLoading={receive.isPending} disabled={total === 0}>
            Confirmar Recepción
          </Button>
        </div>
      </div>
    </Modal>
  );
}
