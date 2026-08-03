import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  CreditCard,
  ListChecks,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Field";
import { Badge } from "../components/ui/Badge";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { EmptyState } from "../components/ui/EmptyState";
import { Pagination } from "../components/ui/Pagination";
import { StatCard } from "../components/ui/StatCard";
import { Tabs } from "../components/ui/Tabs";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useProducts } from "../hooks/useProducts";
import { useCashStatus } from "../hooks/useCash";
import { useCreateSale, useSales, useSalesSummary } from "../hooks/useSales";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { formatCurrency, formatDateTime, formatNumber } from "../lib/formatters";
import { cn } from "../lib/utils";
import type { PaymentMethod } from "../lib/types";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
};
const PAYMENT_METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  EFECTIVO: Banknote,
  TRANSFERENCIA: Receipt,
  TARJETA: CreditCard,
};
const PAYMENT_METHOD_TONE: Record<PaymentMethod, "success" | "info" | "warning"> = {
  EFECTIVO: "success",
  TRANSFERENCIA: "info",
  TARJETA: "warning",
};

type CartLine = { productId: string; name: string; sku: string; unitPrice: number; availableStock: number; quantity: number };

export default function Ventas() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<"new" | "history">("new");

  const [search, setSearch] = useState("");
  const { data: productsPage } = useProducts({ q: search || undefined, isActive: true, limit: 20 });
  const { data: cashStatus } = useCashStatus();
  const { data: summary } = useSalesSummary();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [payerName, setPayerName] = useState("");
  const createSale = useCreateSale();

  const total = useMemo(() => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [cart]);
  const hasOpenShift = !!cashStatus?.myOpenShift;
  const requiresReceiptInfo = paymentMethod !== "EFECTIVO";
  const missingReceiptInfo = requiresReceiptInfo && (!receiptNumber.trim() || !payerName.trim());

  const addToCart = (productId: string, name: string, sku: string, unitPrice: number, availableStock: number) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        if (existing.quantity >= availableStock) return prev;
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
      }
      if (availableStock <= 0) return prev;
      return [...prev, { productId, name, sku, unitPrice, availableStock, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.productId === productId
            ? { ...l, quantity: Math.max(0, Math.min(l.availableStock, l.quantity + delta)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const removeLine = (productId: string) => setCart((prev) => prev.filter((l) => l.productId !== productId));

  const checkout = async () => {
    if (cart.length === 0 || missingReceiptInfo) return;
    try {
      await createSale.mutateAsync({
        paymentMethod,
        items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        receiptNumber: requiresReceiptInfo ? receiptNumber.trim() : undefined,
        payerName: requiresReceiptInfo ? payerName.trim() : undefined,
      });
      showSuccess("Venta registrada correctamente");
      setCart([]);
      setReceiptNumber("");
      setPayerName("");
    } catch (error) {
      showError(extractErrorMessage(error, "No se pudo registrar la venta"));
    }
  };

  const [historyPage, setHistoryPage] = useState(1);
  const [filterMethod, setFilterMethod] = useState<PaymentMethod | "">("");
  const { data: sales, isLoading: loadingHistory } = useSales({
    page: historyPage,
    limit: 15,
    paymentMethod: filterMethod || undefined,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Ventas</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Registra ventas y consulta el historial.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Vendido hoy" value={formatCurrency(summary?.total ?? 0)} icon={Receipt} />
        <StatCard label="Ventas hoy" value={formatNumber(summary?.count ?? 0)} icon={ShoppingCart} />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "new", label: "Nueva venta", icon: ShoppingCart },
          { value: "history", label: `Historial${user?.role === "EMPLOYEE" ? " (mío)" : ""}`, icon: ListChecks },
        ]}
      />

      {tab === "new" ? (
        <>
          {!hasOpenShift && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Debes abrir tu turno de caja antes de registrar ventas.{" "}
              <Link to="/caja" className="font-medium underline underline-offset-2">
                Ir a Caja
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-4 lg:flex-row">
            <Card className="flex-1">
              <CardHeader title="Productos" description="Busca por nombre, SKU o código de barra" />
              <CardBody className="flex flex-col gap-3">
                <Input
                  placeholder="Buscar producto..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {productsPage?.items.length === 0 && (
                    <p className="col-span-full py-6 text-center text-sm text-neutral-400">Sin resultados.</p>
                  )}
                  {productsPage?.items.map((p) => {
                    const outOfStock = p.currentStock <= 0;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={outOfStock}
                        onClick={() => addToCart(p.id, p.name, p.sku, p.sellPrice, p.currentStock)}
                        className={cn(
                          "flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-sm transition-colors",
                          outOfStock
                            ? "cursor-not-allowed border-neutral-200 opacity-50 dark:border-neutral-800"
                            : "border-neutral-200 hover:border-indigo-400 hover:bg-indigo-50 dark:border-neutral-700 dark:hover:bg-indigo-950",
                        )}
                      >
                        <span className="font-medium text-neutral-900 dark:text-neutral-100">{p.name}</span>
                        <span className="text-xs text-neutral-400">{p.sku}</span>
                        <div className="flex w-full items-center justify-between">
                          <span className="font-medium text-indigo-600 dark:text-indigo-400">{formatCurrency(p.sellPrice)}</span>
                          <span className="text-xs text-neutral-500">Stock: {p.currentStock}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card className="lg:w-96 lg:shrink-0">
              <CardHeader title="Carrito" description={`${cart.length} producto(s)`} />
              <CardBody className="flex flex-col gap-3">
                {cart.length === 0 ? (
                  <p className="py-6 text-center text-sm text-neutral-400">Agrega productos al carrito.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cart.map((line) => (
                      <div key={line.productId} className="flex items-center gap-2 rounded-lg border border-neutral-200 p-2 dark:border-neutral-700">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">{line.name}</div>
                          <div className="text-xs text-neutral-400">{formatCurrency(line.unitPrice)} c/u</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-sm">{line.quantity}</span>
                          <button
                            type="button"
                            disabled={line.quantity >= line.availableStock}
                            onClick={() => changeQuantity(line.productId, 1)}
                            className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-300 text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="w-16 text-right text-sm font-medium">{formatCurrency(line.unitPrice * line.quantity)}</span>
                        <button type="button" onClick={() => removeLine(line.productId)} className="text-neutral-400 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 pt-2">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Medio de pago</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["EFECTIVO", "TRANSFERENCIA", "TARJETA"] as PaymentMethod[]).map((m) => {
                      const Icon = PAYMENT_METHOD_ICON[m];
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition-colors",
                            paymentMethod === m
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                              : "border-neutral-200 text-neutral-500 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {PAYMENT_METHOD_LABEL[m]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {requiresReceiptInfo && (
                  <div className="flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                    <Input
                      label="N.° de comprobante"
                      required
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                    />
                    <Input
                      label="Nombre de quien paga"
                      required
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-800">
                  <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total</span>
                  <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatCurrency(total)}</span>
                </div>

                <Button
                  onClick={checkout}
                  disabled={cart.length === 0 || !hasOpenShift || missingReceiptInfo}
                  isLoading={createSale.isPending}
                >
                  Confirmar venta
                </Button>
              </CardBody>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3 dark:border-neutral-800">
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filtrar por medio de pago</span>
            <Select
              className="w-48"
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value as PaymentMethod | "");
                setHistoryPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="TARJETA">Tarjeta</option>
            </Select>
          </div>

          {loadingHistory && !sales ? (
            <TableSkeleton columns={7} />
          ) : !sales || sales.items.length === 0 ? (
            <EmptyState icon={Receipt} title="Sin ventas" description="Aún no se han registrado ventas." />
          ) : (
            <>
              <Table>
                <THead>
                  <tr>
                    <TH>Fecha</TH>
                    <TH>Productos</TH>
                    <TH>Medio de pago</TH>
                    <TH>Comprobante</TH>
                    <TH>Pagado por</TH>
                    <TH>Usuario</TH>
                    <TH>Total</TH>
                  </tr>
                </THead>
                <TBody>
                  {sales.items.map((s) => (
                    <TR key={s.id}>
                      <TD className="text-xs text-neutral-400">{formatDateTime(s.createdAt)}</TD>
                      <TD>{s.items.length} línea(s)</TD>
                      <TD>
                        <Badge tone={PAYMENT_METHOD_TONE[s.paymentMethod]}>{PAYMENT_METHOD_LABEL[s.paymentMethod]}</Badge>
                      </TD>
                      <TD className="text-xs text-neutral-500">{s.receiptNumber ?? "—"}</TD>
                      <TD className="text-xs text-neutral-500">{s.payerName ?? "—"}</TD>
                      <TD>{s.user.name}</TD>
                      <TD className="font-medium">{formatCurrency(s.total)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              <Pagination page={sales.pagination.page} totalPages={sales.pagination.totalPages} total={sales.pagination.total} onPageChange={setHistoryPage} />
            </>
          )}
        </Card>
      )}
    </div>
  );
}
