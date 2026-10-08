import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  ListChecks,
  Minus,
  Plus,
  Receipt,
  ShoppingCart,
  Trash2,
  Camera,
  Users,
  Split,
  ArrowLeft,
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
import { listCustomers, createCustomer } from "../api/customers";
import { CustomerModal } from "../components/customers/CustomerModal";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";
import { CameraScannerModal } from "../components/common/CameraScannerModal";
import { formatCurrency, formatDateTime } from "../lib/formatters";
import { cn } from "../lib/utils";
import type { Customer, PaymentMethod } from "../lib/types";

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  TARJETA: "Tarjeta",
  CUENTA_CORRIENTE: "Cuenta Corriente",
  MIXTO: "Mixto",
};
const PAYMENT_METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  EFECTIVO: Banknote,
  TRANSFERENCIA: Receipt,
  TARJETA: CreditCard,
  CUENTA_CORRIENTE: Users,
  MIXTO: Split,
};
const PAYMENT_METHOD_TONE: Record<PaymentMethod, "success" | "info" | "warning" | "neutral"> = {
  EFECTIVO: "success",
  TRANSFERENCIA: "info",
  TARJETA: "warning",
  CUENTA_CORRIENTE: "neutral",
  MIXTO: "info",
};

type CartLine = { productId: string; name: string; sku: string; unitPrice: number; availableStock: number; quantity: number; amount?: number; saleType: "UNIT" | "WEIGHT" | "AMOUNT" };

export default function Ventas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState<"new" | "history">("new");

  const [search, setSearch] = useState("");
  const { data: productsPage } = useProducts({ q: search || undefined, isActive: true, limit: 20 });
  const { data: cashStatus } = useCashStatus();
  const { data: customersData } = useQuery({
    queryKey: ["customers-active"],
    queryFn: () => listCustomers({ limit: 100 }),
  });

  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [payerName, setPayerName] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [weightModal, setWeightModal] = useState<{ productId: string, name: string, sku: string, unitPrice: number, availableStock: number } | null>(null);
  const [amountModal, setAmountModal] = useState<{ productId: string, name: string, sku: string, availableStock: number } | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [quickCustomerModalOpen, setQuickCustomerModalOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["customers-active"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      showSuccess(`Cliente "${newCustomer.name}" registrado`);
      setSelectedCustomerId(newCustomer.id);
      setQuickCustomerModalOpen(false);
    },
    onError: (err: unknown) => {
      showError(extractErrorMessage(err, "No se pudo crear el cliente"));
    },
  });

  const [splitAmounts, setSplitAmounts] = useState<Record<string, string>>({
    EFECTIVO: "",
    TRANSFERENCIA: "",
    TARJETA: "",
    CUENTA_CORRIENTE: "",
  });

  const createSale = useCreateSale();

  const handleScan = async (code: string) => {
    try {
      const res = await listProducts({ q: code, isActive: true, limit: 10 });
      // Buscamos coincidencia exacta por SKU o código de barras
      const match = res.items.find((p) => p.sku === code || p.barcode === code);
      if (match) {
        if (match.saleType === "UNIT") {
          if (match.currentStock > 0) {
            addToCart(match.id, match.name, match.sku, match.sellPrice, match.currentStock, "UNIT");
            showSuccess(`Agregado: ${match.name}`);
            setSearch("");
          } else {
            showError(`Sin stock: ${match.name}`);
          }
        } else if (match.saleType === "WEIGHT") {
          setWeightModal({ productId: match.id, name: match.name, sku: match.sku, unitPrice: match.sellPrice, availableStock: match.currentStock });
          setModalInput("");
        } else if (match.saleType === "AMOUNT") {
          setAmountModal({ productId: match.id, name: match.name, sku: match.sku, availableStock: match.currentStock });
          setModalInput("");
        }
      } else {
        showError(`Producto no encontrado: ${code}`);
      }
    } catch (error) {
      showError("Error al procesar el código de barras");
    }
  };

  useBarcodeScanner(handleScan);

  const total = useMemo(() => cart.reduce((sum, line) => {
    if (line.saleType === "UNIT") return sum + line.unitPrice * line.quantity;
    if (line.saleType === "WEIGHT") return sum + (line.unitPrice / 1000) * line.quantity;
    if (line.saleType === "AMOUNT") return sum + (line.amount || 0);
    return sum;
  }, 0), [cart]);

  // Auto-cálculo de Cuenta Corriente en Pago Mixto
  useEffect(() => {
    if (paymentMethod !== "MIXTO") return;

    const efectivo = Number(splitAmounts.EFECTIVO || 0);
    const transferencia = Number(splitAmounts.TRANSFERENCIA || 0);
    const tarjeta = Number(splitAmounts.TARJETA || 0);

    const pagado = efectivo + transferencia + tarjeta;
    const resto = total - pagado;

    const newCuentaCorriente = resto > 0 ? (Math.round(resto * 100) / 100).toString() : "";

    if (splitAmounts.CUENTA_CORRIENTE !== newCuentaCorriente) {
      setSplitAmounts((prev) => ({
        ...prev,
        CUENTA_CORRIENTE: newCuentaCorriente,
      }));
    }
  }, [paymentMethod, total, splitAmounts.EFECTIVO, splitAmounts.TRANSFERENCIA, splitAmounts.TARJETA]);

  const hasOpenShift = !!cashStatus?.myOpenShift;
  const requiresReceiptInfo = false;
  
  const ccSplitAmount = paymentMethod === "MIXTO" ? Number(splitAmounts.CUENTA_CORRIENTE || 0) : 0;
  const requiresCustomer = paymentMethod === "CUENTA_CORRIENTE" || (paymentMethod === "MIXTO" && ccSplitAmount > 0);
  
  const missingReceiptInfo = requiresReceiptInfo && (!receiptNumber.trim() || !payerName.trim());
  const missingCustomer = requiresCustomer && !selectedCustomerId;
  
  const splitTotal = paymentMethod === "MIXTO" ? Object.values(splitAmounts).reduce((sum, val) => sum + Number(val || 0), 0) : 0;
  const invalidSplit = paymentMethod === "MIXTO" && Math.abs(splitTotal - total) > 0.01;

  const addToCart = (productId: string, name: string, sku: string, unitPrice: number, availableStock: number, saleType: "UNIT" | "WEIGHT" | "AMOUNT", qtyOrAmount?: number) => {
    setCart((prev) => {
      if (saleType === "UNIT") {
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          if (existing.quantity >= availableStock) return prev;
          return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l));
        }
        if (availableStock <= 0) return prev;
        return [...prev, { productId, name, sku, unitPrice, availableStock, quantity: 1, saleType }];
      } else if (saleType === "WEIGHT") {
        const grams = qtyOrAmount || 0;
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          if (existing.quantity + grams > availableStock) {
            showError("Supera el stock disponible");
            return prev;
          }
          return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + grams } : l));
        }
        if (grams > availableStock) {
          showError("Supera el stock disponible");
          return prev;
        }
        return [...prev, { productId, name, sku, unitPrice, availableStock, quantity: grams, saleType }];
      } else if (saleType === "AMOUNT") {
        const amt = qtyOrAmount || 0;
        const existing = prev.find((l) => l.productId === productId);
        if (existing) {
          return prev.map((l) => (l.productId === productId ? { ...l, amount: (l.amount || 0) + amt } : l));
        }
        return [...prev, { productId, name, sku, unitPrice: 0, availableStock, quantity: 1, amount: amt, saleType }];
      }
      return prev;
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
    if (cart.length === 0 || missingReceiptInfo || missingCustomer || invalidSplit) {
      if (paymentMethod === "MIXTO" && ccSplitAmount > 0 && !selectedCustomerId) {
        showError("Debes seleccionar un cliente para asignar el monto de Cuenta Corriente.");
      }
      return;
    }
    try {
      await createSale.mutateAsync({
        paymentMethod,
        splitPayments: paymentMethod === "MIXTO" ? Object.entries(splitAmounts).map(([method, amount]) => ({ method: method as PaymentMethod, amount: Number(amount || 0) })).filter(p => p.amount > 0) : undefined,
        customerId: requiresCustomer ? selectedCustomerId : undefined,
        items: cart.map((l) => ({ 
          productId: l.productId, 
          quantity: l.saleType === "AMOUNT" ? undefined : l.quantity,
          amount: l.saleType === "AMOUNT" ? l.amount : undefined
        })),
        receiptNumber: requiresReceiptInfo ? receiptNumber.trim() : undefined,
        payerName: requiresReceiptInfo ? payerName.trim() : undefined,
      });
      showSuccess("Venta registrada correctamente");
      setCart([]);
      setReceiptNumber("");
      setPayerName("");
      setSelectedCustomerId("");
      setSplitAmounts({ EFECTIVO: "", TRANSFERENCIA: "", TARJETA: "", CUENTA_CORRIENTE: "" });
      setIsMobileCartOpen(false);
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
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Ventas</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Registra ventas y consulta el historial.</p>
      </div>

      <div className="shrink-0">
        <Tabs
          value={tab}
          onChange={(val) => {
            setTab(val as "new" | "history");
            setIsMobileCartOpen(false);
          }}
          tabs={[
            { value: "new", label: "Nueva venta", icon: ShoppingCart },
            { value: "history", label: `Historial${user?.role === "EMPLOYEE" ? " (mío)" : ""}`, icon: ListChecks },
          ]}
        />
      </div>

      {tab === "new" ? (
        <div className="flex flex-1 flex-col min-h-0 gap-3">
          {!hasOpenShift && (
            <div className="shrink-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
              Debes abrir tu turno de caja antes de registrar ventas.{" "}
              <Link to="/caja" className="font-medium underline underline-offset-2">
                Ir a Caja
              </Link>
            </div>
          )}

          <div className="flex flex-1 min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch">
            {/* Columna Izquierda (Productos) */}
            <Card className={cn(
              "flex-1 flex-col min-h-0 min-w-0 overflow-hidden",
              isMobileCartOpen ? "hidden lg:flex" : "flex"
            )}>
              <CardHeader className="shrink-0" title="Productos" description="Busca por nombre, SKU o código de barra" />
              <CardBody className="flex flex-1 flex-col min-h-0 gap-3 overflow-hidden p-4">
                <div className="shrink-0 flex gap-2">
                  <div className="flex-1">
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
                  </div>
                  <button
                    type="button"
                    onClick={() => setCameraOpen(true)}
                    title="Escanear con Cámara"
                    className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
                  >
                    <Camera className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span className="hidden sm:inline">Escanear</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 pr-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                        onClick={() => {
                          if (p.saleType === "UNIT") {
                            addToCart(p.id, p.name, p.sku, p.sellPrice, p.currentStock, "UNIT");
                          } else if (p.saleType === "WEIGHT") {
                            setWeightModal({ productId: p.id, name: p.name, sku: p.sku, unitPrice: p.sellPrice, availableStock: p.currentStock });
                            setModalInput("");
                          } else if (p.saleType === "AMOUNT") {
                            setAmountModal({ productId: p.id, name: p.name, sku: p.sku, availableStock: p.currentStock });
                            setModalInput("");
                          }
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-95 h-fit",
                          outOfStock
                            ? "cursor-not-allowed border-neutral-200 opacity-50 dark:border-neutral-800"
                            : "border-neutral-200 hover:border-primary-400 hover:bg-primary-50 hover:shadow-md dark:border-neutral-700/60 dark:hover:border-primary-500/50 dark:hover:bg-primary-500/10",
                        )}
                      >
                        <span className="font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{p.name}</span>
                        <span className="text-xs font-medium text-neutral-400">{p.sku}</span>
                        <div className="flex w-full items-center justify-between mt-1">
                          <span className="text-lg font-black text-primary-600 dark:text-primary-400">
                            {p.saleType === "AMOUNT" ? "Importe" : formatCurrency(p.sellPrice)}
                            {p.saleType === "WEIGHT" && <span className="text-xs text-neutral-500"> /kg</span>}
                          </span>
                          {p.saleType !== "AMOUNT" && (
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Stock: {p.currentStock}</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Floating Action Button (Mobile only) */}
                <div className="shrink-0 pt-2 border-t border-neutral-200 dark:border-neutral-800 lg:hidden">
                  <Button
                    variant="primary"
                    onClick={() => setIsMobileCartOpen(true)}
                    className="w-full flex items-center justify-between h-12 px-4 text-sm font-bold shadow-lg"
                  >
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Ver Carrito ({cart.reduce((sum, item) => sum + (item.saleType === "UNIT" ? item.quantity : 1), 0)})
                    </span>
                    <span className="text-base font-black">{formatCurrency(total)}</span>
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Columna Derecha (Carrito) */}
            <Card className={cn(
              "h-full flex-col overflow-y-auto shadow-2xl ring-1 ring-black/5 dark:ring-white/5 lg:w-[420px] lg:shrink-0",
              isMobileCartOpen ? "flex w-full" : "hidden lg:flex"
            )}>
              {/* Header con botón de regreso en Mobile */}
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 lg:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMobileCartOpen(false)}
                  className="flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver a Productos
                </button>
                <span className="text-xs font-bold text-neutral-500">{cart.length} producto(s)</span>
              </div>
              <CardHeader className="hidden lg:block shrink-0" title="Carrito de Compra" description={`${cart.length} producto(s)`} />
              <CardBody className="flex flex-col gap-4 p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <ShoppingCart className="h-8 w-8 text-neutral-400" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Agrega productos al carrito.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cart.map((line) => (
                      <div key={line.productId} className="flex items-start justify-between gap-2.5 rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-3 dark:border-neutral-700/50 dark:bg-neutral-800/20">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold leading-tight text-neutral-900 dark:text-neutral-100 whitespace-normal break-words">{line.name}</div>
                          {line.saleType === "UNIT" && <div className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(line.unitPrice)} c/u</div>}
                          {line.saleType === "WEIGHT" && <div className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">{formatCurrency(line.unitPrice)} /kg</div>}
                          {line.saleType === "AMOUNT" && <div className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">Venta por importe</div>}
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0 pt-0.5">
                          {line.saleType === "UNIT" && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => changeQuantity(line.productId, -1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold">{line.quantity}</span>
                              <button
                                type="button"
                                disabled={line.quantity >= line.availableStock}
                                onClick={() => changeQuantity(line.productId, 1)}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-500 shadow-sm transition-colors hover:bg-neutral-100 disabled:opacity-40 dark:border-neutral-700 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {line.saleType === "WEIGHT" && (
                            <div className="flex items-center gap-1">
                              <span className="text-center text-xs font-bold">{line.quantity} g</span>
                            </div>
                          )}
                          
                          <span className="w-16 text-right text-sm font-black text-primary-600 dark:text-primary-400">
                            {formatCurrency(line.saleType === 'UNIT' ? line.unitPrice * line.quantity : line.saleType === 'WEIGHT' ? (line.unitPrice / 1000) * line.quantity : line.amount || 0)}
                          </span>
                          <button type="button" onClick={() => removeLine(line.productId)} className="rounded-full p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-500 dark:hover:bg-danger-500/10">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer del Carrito (Fluye naturalmente con el scroll del panel derecho) */}
                <div className="flex flex-col gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Medio de pago</span>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
                      {(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "CUENTA_CORRIENTE", "MIXTO"] as PaymentMethod[]).map((m) => {
                        const Icon = PAYMENT_METHOD_ICON[m];
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setPaymentMethod(m)}
                            className={cn(
                              "flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold transition-all duration-200 active:scale-95 text-center",
                              paymentMethod === m
                                ? "border-primary-500 bg-primary-500 text-white shadow-md dark:bg-primary-600"
                                : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60",
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" strokeWidth={paymentMethod === m ? 3 : 2} />
                            {PAYMENT_METHOD_LABEL[m]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {paymentMethod === "MIXTO" && (
                    <div className="flex flex-col gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
                      <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Desglose de Pago</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(["EFECTIVO", "TRANSFERENCIA", "TARJETA", "CUENTA_CORRIENTE"] as const).map((m) => (
                          <Input
                            key={m}
                            label={PAYMENT_METHOD_LABEL[m as PaymentMethod]}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={splitAmounts[m]}
                            onChange={(e) => setSplitAmounts(prev => ({ ...prev, [m]: e.target.value }))}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between items-center bg-neutral-50 p-2 rounded-lg dark:bg-neutral-800/50">
                        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Total Ingresado:</span>
                        <span className={cn("text-xs font-bold", Math.abs(splitTotal - total) > 0.01 ? "text-amber-600 dark:text-amber-400" : "text-success-600 dark:text-success-400")}>
                          {formatCurrency(splitTotal)} / {formatCurrency(total)}
                        </span>
                      </div>
                    </div>
                  )}

                  {requiresCustomer && (
                    <div className="flex flex-col gap-1.5 border-t border-neutral-200 pt-2 dark:border-neutral-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase text-neutral-600 dark:text-neutral-400">
                          Cliente en Cuenta Corriente *
                        </label>
                        <button
                          type="button"
                          onClick={() => setQuickCustomerModalOpen(true)}
                          className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-500 dark:text-primary-400"
                        >
                          <Plus className="h-3.5 w-3.5" /> + Nuevo Cliente
                        </button>
                      </div>
                      <Select
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                      >
                        <option value="">-- Selecciona un cliente --</option>
                        {customersData?.items.filter((c: Customer) => c.isActive).map((c: Customer) => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.taxId ? `(${c.taxId})` : ""} - Deuda: {formatCurrency(c.currentBalance)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {requiresReceiptInfo && (
                    <div className="flex flex-col gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
                      <Input
                        label="N.° de comprobante *"
                        required
                        value={receiptNumber}
                        onChange={(e) => setReceiptNumber(e.target.value)}
                      />
                      <Input
                        label="Nombre de quien paga *"
                        required
                        value={payerName}
                        onChange={(e) => setPayerName(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-neutral-200 pt-2 dark:border-neutral-800">
                    <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Total</span>
                    <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(total)}</span>
                  </div>

                  <Button
                    variant="success"
                    onClick={checkout}
                    disabled={cart.length === 0 || !hasOpenShift || missingReceiptInfo || missingCustomer || invalidSplit}
                    isLoading={createSale.isPending}
                    className="h-11 text-base font-bold shadow-lg"
                  >
                    Confirmar venta
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
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
              <option value="CUENTA_CORRIENTE">Cuenta Corriente</option>
              <option value="MIXTO">Mixto</option>
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
                    <TH>Comprobante / Cliente</TH>
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
                      <TD className="text-xs text-neutral-500">
                        {s.paymentMethod === "CUENTA_CORRIENTE" ? (s.customer?.name ?? "Cliente") : (s.receiptNumber ?? "—")}
                      </TD>
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

      <CameraScannerModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onScan={handleScan}
        title="Escanear Código de Barras"
      />

      {/* Modal para Peso */}
      {weightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">Venta por Peso</h2>
            <div className="mb-4">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{weightModal.name}</p>
              <p className="text-sm text-neutral-500">Precio: {formatCurrency(weightModal.unitPrice)} / kg</p>
            </div>
            <Input
              label="Peso (en gramos)"
              type="number"
              placeholder="Ej: 350"
              autoFocus
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && Number(modalInput) > 0) {
                  addToCart(weightModal.productId, weightModal.name, weightModal.sku, weightModal.unitPrice, weightModal.availableStock, "WEIGHT", Number(modalInput));
                  setSearch("");
                  setWeightModal(null);
                }
              }}
            />
            {Number(modalInput) > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-100 p-3 dark:bg-neutral-800">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total:</span>
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency((weightModal.unitPrice / 1000) * Number(modalInput))}
                </span>
              </div>
            )}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWeightModal(null)}>Cancelar</Button>
              <Button
                disabled={Number(modalInput) <= 0}
                onClick={() => {
                  addToCart(weightModal.productId, weightModal.name, weightModal.sku, weightModal.unitPrice, weightModal.availableStock, "WEIGHT", Number(modalInput));
                  setSearch("");
                  setWeightModal(null);
                }}
              >
                Agregar al carrito
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Importe */}
      {amountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
            <h2 className="mb-4 text-lg font-bold text-neutral-900 dark:text-neutral-100">Venta por Importe</h2>
            <div className="mb-4">
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{amountModal.name}</p>
            </div>
            <Input
              label="Importe ($)"
              type="number"
              step="0.01"
              placeholder="Ej: 2500"
              autoFocus
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && Number(modalInput) > 0) {
                  addToCart(amountModal.productId, amountModal.name, amountModal.sku, 0, amountModal.availableStock, "AMOUNT", Number(modalInput));
                  setSearch("");
                  setAmountModal(null);
                }
              }}
            />
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAmountModal(null)}>Cancelar</Button>
              <Button
                disabled={Number(modalInput) <= 0}
                onClick={() => {
                  addToCart(amountModal.productId, amountModal.name, amountModal.sku, 0, amountModal.availableStock, "AMOUNT", Number(modalInput));
                  setSearch("");
                  setAmountModal(null);
                }}
              >
                Agregar al carrito
              </Button>
            </div>
          </div>
        </div>
      )}

      <CustomerModal
        open={quickCustomerModalOpen}
        onClose={() => setQuickCustomerModalOpen(false)}
        isLoading={createCustomerMutation.isPending}
        onSubmit={(input) => createCustomerMutation.mutate(input)}
      />
    </div>
  );
}

