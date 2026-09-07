import { ShoppingBag, Truck, CreditCard, DollarSign } from "lucide-react";
import { Card } from "../ui/Card";
import { usePurchases } from "../../hooks/usePurchases";
import { useSuppliers } from "../../hooks/useSuppliers";
import { formatCurrency } from "../../lib/utils";

export function PurchasesDashboardTab() {
  const { data: purchasesData, isLoading: loadingPurchases } = usePurchases({ limit: 100 });
  const { data: suppliersData, isLoading: loadingSuppliers } = useSuppliers();

  const totalSpent = purchasesData?.items
    .filter((p) => p.status === "RECEIVED")
    .reduce((sum, p) => sum + p.total, 0) || 0;

  const totalDebt = suppliersData?.reduce((sum, s) => sum + (s.currentBalance > 0 ? s.currentBalance : 0), 0) || 0;
  
  const activeSuppliers = suppliersData?.filter((s) => s.isActive).length || 0;
  const recentPurchases = purchasesData?.items.filter((p) => p.status === "RECEIVED").length || 0;

  const isLoading = loadingPurchases || loadingSuppliers;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium">Gasto en Compras (Recientes)</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : formatCurrency(totalSpent)}
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <CreditCard className="w-5 h-5 text-danger-500" />
            <span className="text-sm font-medium">Deuda Total a Proveedores</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : formatCurrency(totalDebt)}
          </div>
        </Card>
        
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <Truck className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium">Proveedores Activos</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : activeSuppliers}
          </div>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <ShoppingBag className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium">Compras Recientes</span>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {isLoading ? "..." : recentPurchases}
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Proveedores con mayor deuda</h3>
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Cargando...</p>
            ) : (
              suppliersData?.filter((s) => s.currentBalance > 0)
                .sort((a, b) => b.currentBalance - a.currentBalance)
                .slice(0, 5)
                .map((s) => (
                  <div key={s.id} className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">{s.name}</span>
                    <span className="text-danger-600 font-semibold">{formatCurrency(s.currentBalance)}</span>
                  </div>
                ))
            )}
            {!isLoading && suppliersData?.filter(s => s.currentBalance > 0).length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">No hay deudas con proveedores.</p>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-4 text-neutral-800 dark:text-neutral-200">Últimas Compras Recibidas</h3>
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <p className="text-sm text-neutral-500">Cargando...</p>
            ) : (
              purchasesData?.items.filter(p => p.status === "RECEIVED")
                .slice(0, 5)
                .map((p) => (
                  <div key={p.id} className="flex justify-between items-center border-b border-neutral-100 dark:border-neutral-800 pb-2">
                    <div>
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">{p.supplier.name}</div>
                      <div className="text-xs text-neutral-500">{new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <span className="font-semibold">{formatCurrency(p.total)}</span>
                  </div>
                ))
            )}
             {!isLoading && purchasesData?.items.filter(p => p.status === "RECEIVED").length === 0 && (
              <p className="text-sm text-neutral-500 text-center py-4">No hay compras recientes.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
