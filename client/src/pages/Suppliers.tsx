import { useAuth } from "../context/AuthContext";
import { permissions } from "../lib/permissions";
import { SuppliersTab } from "../components/purchases/SuppliersTab";

export default function Suppliers() {
  const { user } = useAuth();
  const canManage = user ? permissions.canManageCatalog(user.role) : false;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Proveedores</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Administrá tus proveedores y actualizá los precios de todos sus productos de una vez.
        </p>
      </div>
      <SuppliersTab canManage={canManage} />
    </div>
  );
}
