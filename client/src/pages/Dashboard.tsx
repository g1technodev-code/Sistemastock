import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  DollarSign,
  AlertTriangle,
  ArrowLeftRight,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Receipt,
  Percent,
  Clock,
  Truck,
  CheckCircle2,
  ArrowRight,
  Info,
} from "lucide-react";
import { getDashboardSummary } from "../api/dashboard";
import { StatCard } from "../components/ui/StatCard";
import { Card, CardHeader } from "../components/ui/Card";
import { Table, THead, TBody, TR, TH, TD } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { FullPageSpinner } from "../components/ui/Spinner";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { formatCurrency, formatDateTime, formatNumber } from "../lib/formatters";

const MOVEMENT_TYPE_LABEL: Record<string, string> = { IN: "Entrada", OUT: "Salida", ADJUSTMENT: "Ajuste" };
const MOVEMENT_TYPE_TONE: Record<string, "success" | "danger" | "warning"> = {
  IN: "success",
  OUT: "danger",
  ADJUSTMENT: "warning",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-summary"], queryFn: getDashboardSummary });
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  if (isLoading || !data) return <FullPageSpinner />;

  const { alerts, kpis } = data;
  const hasAlerts = alerts.lowStock.length > 0 || alerts.noMovement.length > 0 || alerts.noSupplier.length > 0;

  const renderModalContent = () => {
    switch (selectedCard) {
      case "salesToday":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/40 dark:bg-indigo-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Facturación de hoy</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatCurrency(kpis.salesToday)}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Total acumulado de ventas cobradas o registradas durante la jornada actual.</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Total de productos vendidos:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(kpis.unitsSoldToday)} unidades</span>
              </div>
              <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800">
                <span className="text-neutral-600 dark:text-neutral-400">Promedio por ticket:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatCurrency(kpis.avgTicketToday)}</span>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/ventas"); }}>
                Ir a Ventas <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "profitToday":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Ganancia estimada de hoy</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatCurrency(kpis.profitToday)}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Calculada en base a la diferencia entre el precio de venta y el costo de los productos vendidos hoy.</p>
            </div>
            <div className="rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              <p className="font-semibold flex items-center gap-1.5"><Info className="h-4 w-4 text-emerald-500" /> Nota sobre la ganancia:</p>
              <p className="mt-1">Para mantener márgenes exactos, asegúrate de que todos tus productos tengan su costo de compra actualizado en el inventario.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/rentabilidad"); }}>
                Ver informe de Rentabilidad <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "stockValue":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Valorización total del inventario</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatCurrency(kpis.totalStockValue)}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Capital total inmovilizado calculado según la cantidad actual de productos multiplicada por su precio/costo.</p>
            </div>
            <div className="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 text-sm">
              <span className="text-neutral-600 dark:text-neutral-400">Total de productos en catálogo:</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatNumber(kpis.totalProducts)} artículos</span>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/products"); }}>
                Gestionar Productos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "unitsSold":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Unidades vendidas hoy</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatNumber(kpis.unitsSoldToday)} <span className="text-lg font-normal text-neutral-500">unidades</span></p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Suma total de ítems individuales despachados en las ventas de hoy.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/estadisticas"); }}>
                Ver Estadísticas de Productos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "avgTicket":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Ticket Promedio</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatCurrency(kpis.avgTicketToday)}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Monto promedio gastado por cliente en cada compra efectuada hoy.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/estadisticas"); }}>
                Ver Estadísticas Generales <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "cashBalance":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4 dark:border-teal-900/40 dark:bg-teal-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">Saldo actual en caja</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatCurrency(kpis.cashBalance)}</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Dinero disponible actualmente registrado en el turno de caja activo o caja física.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/caja"); }}>
                Ir a Gestión de Caja <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "lowStock":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Alertas de Stock Bajo</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatNumber(kpis.lowStockCount)} <span className="text-lg font-normal text-neutral-500">productos</span></p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Productos con cantidad actual igual o inferior a su umbral mínimo de seguridad.</p>
            </div>

            {alerts.lowStock.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {alerts.lowStock.map((prod) => (
                  <div key={prod.productId} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{prod.name}</p>
                      <p className="text-xs text-neutral-500">SKU: {prod.sku}</p>
                    </div>
                    <Badge tone={prod.currentStock <= 0 ? "danger" : "warning"}>
                      Stock: {prod.currentStock} / Mín: {prod.minStock}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">No hay productos en estado crítico actualmente.</p>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/products"); }}>
                Ver todo el Inventario <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case "noMovement":
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">Productos sin movimiento</p>
              <p className="mt-1 text-3xl font-black text-neutral-900 dark:text-white">{formatNumber(kpis.noMovementCount)} <span className="text-lg font-normal text-neutral-500">productos</span></p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Productos inactivos que no registran ventas o movimientos recientes.</p>
            </div>

            {alerts.noMovement.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {alerts.noMovement.map((prod) => (
                  <div key={prod.productId} className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-50 dark:bg-neutral-800/60">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{prod.name}</p>
                      <p className="text-xs text-neutral-500">
                        {prod.daysSinceLastMovement === null ? "Sin movimientos registrados" : `Hace ${prod.daysSinceLastMovement} días`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-500">Todos los productos registran actividad frecuente.</p>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => { setSelectedCard(null); navigate("/products"); }}>
                Gestionar Productos <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (selectedCard) {
      case "salesToday": return "Detalle: Ventas de Hoy";
      case "profitToday": return "Detalle: Ganancia de Hoy";
      case "stockValue": return "Detalle: Valor del Inventario";
      case "unitsSold": return "Detalle: Productos Vendidos Hoy";
      case "avgTicket": return "Detalle: Ticket Promedio";
      case "cashBalance": return "Detalle: Saldo en Caja";
      case "lowStock": return "Detalle: Alertas de Stock Bajo";
      case "noMovement": return "Detalle: Productos sin Movimiento";
      default: return "";
    }
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Panel general</h1>
        <p className="mt-1 text-base text-neutral-500 dark:text-neutral-400">Resumen de tu inventario en tiempo real. Haz clic en cualquier tarjeta para ver su detalle.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <StatCard
          label="Ventas de hoy"
          value={formatCurrency(kpis.salesToday)}
          icon={ShoppingCart}
          tone="neutral"
          delta={{value: "12%", direction: "up", isGood: true}}
          onClick={() => setSelectedCard("salesToday")}
        />
        <StatCard
          label="Ganancia de hoy"
          value={formatCurrency(kpis.profitToday)}
          icon={TrendingUp}
          tone="neutral"
          delta={{value: "8%", direction: "up", isGood: true}}
          onClick={() => setSelectedCard("profitToday")}
        />
        <StatCard
          label="Valor del inventario"
          value={formatCurrency(kpis.totalStockValue)}
          icon={DollarSign}
          onClick={() => setSelectedCard("stockValue")}
        />
        <StatCard
          label="Productos vendidos hoy"
          value={formatNumber(kpis.unitsSoldToday)}
          icon={Receipt}
          onClick={() => setSelectedCard("unitsSold")}
        />
        <StatCard
          label="Ticket promedio"
          value={formatCurrency(kpis.avgTicketToday)}
          icon={Percent}
          onClick={() => setSelectedCard("avgTicket")}
        />
        <StatCard
          label="Saldo en caja"
          value={formatCurrency(kpis.cashBalance)}
          icon={Wallet}
          onClick={() => setSelectedCard("cashBalance")}
        />
        <StatCard
          label="Alertas de stock bajo"
          value={formatNumber(kpis.lowStockCount)}
          icon={AlertTriangle}
          tone={kpis.lowStockCount > 0 ? "warning" : "neutral"}
          onClick={() => setSelectedCard("lowStock")}
        />
        <StatCard
          label="Productos sin movimiento"
          value={formatNumber(kpis.noMovementCount)}
          icon={Clock}
          tone={kpis.noMovementCount > 0 ? "warning" : "neutral"}
          onClick={() => setSelectedCard("noMovement")}
        />
      </div>

      <Modal open={!!selectedCard} onClose={() => setSelectedCard(null)} title={getModalTitle()} size="md">
        {renderModalContent()}
      </Modal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader title="Alertas inteligentes" description="Cosas que conviene revisar hoy" />
            {!hasAlerts ? (
              <EmptyState icon={CheckCircle2} title="Todo en orden" description="No hay alertas pendientes por ahora." />
            ) : (
              <div className="max-h-[420px] overflow-y-auto p-2">
                {alerts.lowStock.map((a) => (
                  <Link
                    key={`low-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${a.currentStock <= 0 ? "text-red-500" : "text-amber-500"}`} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">
                        {a.currentStock <= 0 ? "Sin stock: " : "Quedan pocas unidades de "}
                        {a.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Stock {a.currentStock} / mínimo {a.minStock}
                      </p>
                    </div>
                  </Link>
                ))}
                {alerts.noMovement.map((a) => (
                  <Link
                    key={`nomove-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {a.daysSinceLastMovement === null
                          ? "Nunca tuvo movimientos registrados"
                          : `Hace ${a.daysSinceLastMovement} días que no tiene movimientos`}
                      </p>
                    </div>
                  </Link>
                ))}
                {alerts.noSupplier.map((a) => (
                  <Link
                    key={`nosup-${a.productId}`}
                    to={`/products/${a.productId}`}
                    className="flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-neutral-900 dark:text-neutral-100">{a.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Sin proveedor asignado</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader title="Actividad reciente" description="Últimos movimientos de stock registrados" />
            {data.recentActivity.length === 0 ? (
              <EmptyState icon={ArrowLeftRight} title="Aún no hay movimientos registrados" />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Producto</TH>
                    <TH>Tipo</TH>
                    <TH>Cantidad</TH>
                    <TH>Usuario</TH>
                    <TH>Fecha</TH>
                  </tr>
                </THead>
                <TBody>
                  {data.recentActivity.map((m) => (
                    <TR key={m.id}>
                      <TD className="font-medium text-neutral-900 dark:text-neutral-100">{m.product.name}</TD>
                      <TD>
                        <Badge tone={MOVEMENT_TYPE_TONE[m.type] || "neutral"}>
                          {MOVEMENT_TYPE_LABEL[m.type] || m.type}
                        </Badge>
                      </TD>
                      <TD>{formatNumber(m.quantity)}</TD>
                      <TD>{m.user.name}</TD>
                      <TD className="text-neutral-500 dark:text-neutral-400">{formatDateTime(m.createdAt)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
