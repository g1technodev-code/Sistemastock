import { useSearchParams } from "react-router-dom";
import { Building2, Users } from "lucide-react";

import { Tabs } from "../../components/ui/Tabs";
import { LocalesPanel } from "../../features/admin/components/LocalesPanel";
import { UsuariosPanel } from "../../features/admin/components/UsuariosPanel";

type Tab = "locales" | "usuarios";

export default function SuperAdminLocalesUsuarios() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get("tab") === "usuarios" ? "usuarios" : "locales";
  const localId = params.get("localId");
  const localName = params.get("localName");
  const localFilter = localId ? { id: localId, name: localName ?? localId } : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 animate-in fade-in duration-500">
      <div className="border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary-500" />
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">Locales y Usuarios</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Control de cada negocio registrado en Kipo y de las cuentas de sus usuarios.
        </p>
      </div>

      <Tabs<Tab>
        value={tab}
        onChange={(value) => setParams(value === "usuarios" ? { tab: "usuarios" } : {})}
        tabs={[
          { value: "locales", label: "Locales", icon: Building2 },
          { value: "usuarios", label: "Usuarios", icon: Users },
        ]}
      />

      {tab === "locales" ? (
        <LocalesPanel onViewUsers={(local) => setParams({ tab: "usuarios", localId: local.id, localName: local.name })} />
      ) : (
        <UsuariosPanel localFilter={localFilter} onClearLocalFilter={() => setParams({ tab: "usuarios" })} />
      )}
    </div>
  );
}
