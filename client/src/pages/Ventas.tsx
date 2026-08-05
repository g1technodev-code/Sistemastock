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
import { Tabs } from "../components/ui/Tabs";
import { TableSkeleton } from "../components/ui/Skeleton";
import { useProducts } from "../hooks/useProducts";
import { useCashStatus } from "../hooks/useCash";
import { useCreateSale, useSales } from "../hooks/useSales";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../api/client";
import { listProducts } from "../api/products";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { formatCurrency, formatDateTime } from "../lib/formatters";
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

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [payerName, setPayerName] = useState("");
  const createSale = useCreateSale();

  const handleScan = async (code: string) => {
    try {
      const res = await listProducts({ q: code, isActive: true, limit: 10 });
      // Buscamos coincidencia exacta por SKU o código de barras
      const match = res.items.find((p) => p.sku === code || p.barcode === code);
      if (match) {
        if (match.currentStock > 0) {
          addToCart(match.id, match.name, match.sku, match.sellPrice, match.currentStock);
          showSuccess(`Agregado: ${match.name}`);
          setSearch(""); // Limpiamos la búsqueda si había algo
        } else {
          showError(`Sin stock: ${match.name}`);
        }
      } else {
        showError(`Producto no encontrado: ${code}`);
      }
    } catch (error) {
      showError("Error al procesar el código de barras");
    }
  };

  useBarcodeScanner(handleScan);

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
                  placeholder="Buscar producto o escanear código..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && search.trim()) {
                      e.preventDefault();
                      await handleScan(search.trim());
                    }
                  }}
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
                          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-95",
                          outOfStock
                            ? "cursor-not-allowed border-neutral-200 opacity-50 dark:border-neutral-800"
                            : "border-neutral-200 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md dark:border-neutral-700/60 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10",
                        )}
                      >
                        <span className="font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{p.name}</span>
                        <span className="text-xs font-medium text-neutral-400">{p.sku}</span>
                        <div className="flex w-full items-center justify-between mt-1">
                          <span className="text-lg font-black text-primary-600 dark:text-primary-400">{formatCurrency(p.sellPrice)}</span>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Stock: {p.currentStock}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardBody>
            </Card>

            <Card className="lg:w-[420px] lg:shrink-0 h-fit sticky top-24 shadow-2xl ring-1 ring-black/5 dark:ring-white/5">
              <CardHeader title="Carrito de Compra" description={`${cart.length} producto(s)`} />
              <CardBody className="flex flex-col gap-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <ShoppingCart className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Agrega productos al carrito.</p>
                  </div>
                ) : (
                  <div className="flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
                    {cart.map((line) => (
                      <div key={line.productId} className="flex items-center gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-700/50 dark:bg-neutral-800/20">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">{line.name}</div>
                          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(line.unitPrice)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => changeQuantity(line.productId, -1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center font-bold">{line.quantity}</span>
                          <button
                            type="button"
                            disabled={line.quantity >= line.availableStock}
                            onClick={() => changeQuantity(line.productId, 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <span className="w-16 text-right font-black text-primary-600 dark:text-primary-400">{formatCurrency(line.unitPrice * line.quantity)}</span>
                        <button type="button" onClick={() => removeLine(line.productId)} className="rounded-full p-2 text-neutral-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-500/10">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-2 pt-4">
                  <span className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Medio de pago</span>
                  <div className="grid grid-cols-3 gap-3">
                    {(["EFECTIVO", "TRANSFERENCIA", "TARJETA"] as PaymentMethod[]).map((m) => {
                      const Icon = PAYMENT_METHOD_ICON[m];
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all duration-200 active:scale-95",
                            paymentMethod === m
                              ? "border-primary-500 bg-primary-500 text-white shadow-md dark:bg-primary-600"
                              : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60",
                          )}
                        >
                          <Icon className="h-5 w-5" strokeWidth={paymentMethod === m ? 3 : 2} />
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
                  className="mt-2 h-14 text-lg font-bold shadow-lg"
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
