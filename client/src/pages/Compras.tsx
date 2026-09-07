import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { permissions } from "../lib/permissions";
import { Tabs } from "../components/ui/Tabs";

// Tabs imports
import { PurchasesDashboardTab } from "../components/purchases/PurchasesDashboardTab";
import { SuppliersTab } from "../components/purchases/SuppliersTab";
import { PurchaseOrdersTab } from "../components/purchases/PurchaseOrdersTab";
import { PurchasesListTab } from "../components/purchases/PurchasesListTab";

type ComprasTab = "dashboard" | "proveedores" | "pedidos" | "compras";

export default function Compras() {
  const { user } = useAuth();
  const canManage = user ? permissions.canManageCatalog(user.role) : false;
  
  const [activeTab, setActiveTab] = useState<ComprasTab>("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "proveedores", label: "Proveedores" },
    { id: "pedidos", label: "Pedidos" },
    { id: "compras", label: "Historial de Compras" },
  ] as const;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Gestión de Compras</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Módulo integral de proveedores, pedidos, compras y cuentas corrientes.
        </p>
      </div>

      <Tabs tabs={tabs as any} activeTab={activeTab} onChange={(id) => setActiveTab(id as ComprasTab)} />

      <div className="mt-4">
        {activeTab === "dashboard" && <PurchasesDashboardTab />}
        {activeTab === "proveedores" && <SuppliersTab canManage={canManage} />}
        {activeTab === "pedidos" && <PurchaseOrdersTab canManage={canManage} />}
        {activeTab === "compras" && <PurchasesListTab canManage={canManage} />}
      </div>
    </div>
  );
}
