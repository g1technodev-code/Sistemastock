import { useSearchParams } from "react-router-dom";
import { BarChart3, LineChart, Percent } from "lucide-react";
import { Tabs } from "../components/ui/Tabs";
import Reports from "./Reports";
import Estadisticas from "./Estadisticas";
import Rentabilidad from "./Rentabilidad";

export type AnalisisTab = "informes" | "estadisticas" | "rentabilidad";

const TABS = [
  { value: "informes", label: "Informes", icon: BarChart3 },
  { value: "estadisticas", label: "Estadísticas", icon: LineChart },
  { value: "rentabilidad", label: "Rentabilidad", icon: Percent },
] as const satisfies readonly { value: AnalisisTab; label: string; icon: typeof BarChart3 }[];

const DESCRIPTIONS: Record<AnalisisTab, string> = {
  informes: "Valor y movimiento de tu inventario.",
  estadisticas: "Rendimiento de ventas por período, producto, categoría, empleado y método de pago.",
  rentabilidad: "Ganancia y margen calculados sobre las ventas de los últimos 30 días.",
};

function isAnalisisTab(value: string | null): value is AnalisisTab {
  return TABS.some((t) => t.value === value);
}

export default function Analisis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const param = searchParams.get("tab");
  const activeTab: AnalisisTab = isAnalisisTab(param) ? param : "informes";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Panel de Análisis</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{DESCRIPTIONS[activeTab]}</p>
      </div>

      <Tabs
        tabs={[...TABS]}
        value={activeTab}
        onChange={(tab) => setSearchParams({ tab }, { replace: true })}
        className="overflow-x-auto"
      />

      <div className="mt-2">
        {activeTab === "informes" && <Reports />}
        {activeTab === "estadisticas" && <Estadisticas />}
        {activeTab === "rentabilidad" && <Rentabilidad />}
      </div>
    </div>
  );
}
