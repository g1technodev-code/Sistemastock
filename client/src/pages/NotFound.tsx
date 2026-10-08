import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  ArrowLeft,
  Search,
  X,
  Package,
  ShoppingCart,
  Wallet,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  HelpCircle,
  Sparkles,
  Sun,
  Moon,
  Copy,
  Check,
  RotateCcw,
  Boxes,
  ShoppingBag,
  Sliders,
  Layers,
  Compass,
  CornerDownLeft,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";

interface SearchRouteItem {
  name: string;
  path: string;
  description: string;
  category: "Operaciones" | "Inventario" | "Finanzas" | "General" | "Sistema" | "Soporte";
  icon: typeof Package;
  color: string;
  shortcut?: string;
  keywords: string[];
}

const SEARCH_DIRECTORY: SearchRouteItem[] = [
  {
    name: "Punto de Venta",
    path: "/ventas",
    description: "Crea tickets, cobra ventas rápidas y gestiona pedidos.",
    category: "Operaciones",
    icon: ShoppingCart,
    color: "emerald",
    shortcut: "⇧V",
    keywords: ["ventas", "cobrar", "ticket", "factura", "pos", "caja", "vender", "pedido"],
  },
  {
    name: "Catálogo de Productos",
    path: "/products",
    description: "Administra tu inventario, códigos de barra, costos y precios.",
    category: "Inventario",
    icon: Package,
    color: "blue",
    shortcut: "Productos",
    keywords: ["productos", "articulos", "items", "inventario", "catalogo", "precios", "costos", "codigo"],
  },
  {
    name: "Movimientos de Stock",
    path: "/stock",
    description: "Consulta entradas, salidas, transferencias y ajustes de stock.",
    category: "Inventario",
    icon: ArrowLeftRight,
    color: "indigo",
    shortcut: "Stock",
    keywords: ["stock", "inventario", "movimientos", "entradas", "salidas", "transferencias", "ajustes"],
  },
  {
    name: "Panel de Control",
    path: "/dashboard",
    description: "Métricas principales, ventas diarias y rendimiento del negocio.",
    category: "General",
    icon: LayoutDashboard,
    color: "violet",
    shortcut: "Panel",
    keywords: ["dashboard", "panel", "metricas", "graficos", "resumen", "balance", "kpi", "inicio"],
  },
  {
    name: "Control de Caja",
    path: "/caja",
    description: "Apertura, cierre de caja, arqueos y movimientos de dinero.",
    category: "Finanzas",
    icon: Wallet,
    color: "amber",
    shortcut: "⇧C",
    keywords: ["caja", "arqueo", "cierre", "apertura", "efectivo", "dinero", "movimientos"],
  },
  {
    name: "Compras y Proveedores",
    path: "/compras",
    description: "Órdenes de compra, reposición de mercadería y proveedores.",
    category: "Operaciones",
    icon: ShoppingBag,
    color: "cyan",
    shortcut: "⇧X",
    keywords: ["compras", "proveedores", "ordenes", "facturas", "reposicion", "gastos"],
  },
  {
    name: "Gestión de Clientes",
    path: "/customers",
    description: "Base de datos de clientes, cuentas corrientes y fiados.",
    category: "Operaciones",
    icon: Users,
    color: "teal",
    shortcut: "Clientes",
    keywords: ["clientes", "cuenta corriente", "deudores", "contacto", "personas"],
  },
  {
    name: "Categorías y Rubros",
    path: "/categories",
    description: "Organiza tus productos por familias y categorías.",
    category: "Inventario",
    icon: Boxes,
    color: "sky",
    shortcut: "Categorías",
    keywords: ["categorias", "rubros", "familias", "grupos", "clasificacion"],
  },
  {
    name: "Reportes y Análisis",
    path: "/analisis",
    description: "Estadísticas avanzadas, informes de rentabilidad y exportación.",
    category: "Finanzas",
    icon: Layers,
    color: "purple",
    shortcut: "Reportes",
    keywords: ["analisis", "reportes", "informes", "estadisticas", "rentabilidad", "ganancias"],
  },
  {
    name: "Centro de Ayuda y Tutoriales",
    path: "/tutorial",
    description: "Guías interactivas, atajos de teclado y preguntas frecuentes.",
    category: "Soporte",
    icon: HelpCircle,
    color: "rose",
    shortcut: "Ayuda",
    keywords: ["tutorial", "ayuda", "guia", "soporte", "faq", "manual", "como usar", "atajos"],
  },
  {
    name: "Configuración del Sistema",
    path: "/settings",
    description: "Datos del local, impresoras de tickets, perfiles y seguridad.",
    category: "Sistema",
    icon: Sliders,
    color: "slate",
    shortcut: "Ajustes",
    keywords: ["configuracion", "ajustes", "empresa", "local", "impresora", "perfil", "ticket"],
  },
  {
    name: "Suscripciones y Planes",
    path: "/plans",
    description: "Mejora tu plan, gestiona tu membresía y funciones premium.",
    category: "Sistema",
    icon: Sparkles,
    color: "yellow",
    shortcut: "Planes",
    keywords: ["planes", "suscripcion", "pro", "pago", "facturacion", "upgrade", "membresia"],
  },
];

const POPULAR_TAGS = [
  { label: "Punto de Venta", query: "ventas" },
  { label: "Productos", query: "productos" },
  { label: "Control de Stock", query: "stock" },
  { label: "Dashboard", query: "dashboard" },
  { label: "Caja", query: "caja" },
  { label: "Tutoriales", query: "tutorial" },
];

export default function NotFound() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determinar la ruta por defecto según rol y autenticación
  const homeDestination = useMemo(() => {
    if (!user) return "/login";
    if (user.role === "SUPERADMIN") return "/superadmin";
    if (user.role === "EMPLOYEE") return "/ventas";
    return "/dashboard";
  }, [user]);

  // Filtrado reactivo en tiempo real del buscador
  const filteredResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_DIRECTORY.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.includes(q))
      );
    });
  }, [searchQuery]);

  // Atajo de teclado '/' o 'Ctrl+K' para enfocar el buscador
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && document.activeElement !== searchInputRef.current)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === "Escape") {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleCopyPath = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback si no hay permisos de portapapeles
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900 transition-colors duration-300 dark:bg-neutral-950 dark:text-neutral-100 flex flex-col">
      {/* Fondo estético con cuadrícula y orbes difuminados */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-60 dark:opacity-30" />

      {/* Luces ambientales con animación sutil */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[36rem] rounded-full bg-gradient-to-tr from-primary-500/20 via-sky-400/15 to-indigo-500/20 blur-3xl animate-pulse-glow" />
      <div className="pointer-events-none absolute bottom-10 right-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-10 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Barra superior de navegación rápida */}
      <header className="relative z-20 flex h-16 w-full items-center justify-between border-b border-neutral-200/80 bg-white/70 px-4 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/70 sm:px-8">
        <Link to={homeDestination} className="flex items-center gap-3 transition-transform hover:scale-105">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-neutral-200/50 dark:bg-neutral-900 dark:ring-white/10">
            <img src="/kipo-logo.png" alt="Kipo Logo" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-none">
              Kipo
            </span>
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 leading-none mt-0.5">
              StockFlow
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicador de usuario o acceso rápido */}
          {user ? (
            <div className="hidden items-center gap-2 rounded-full border border-neutral-200 bg-white/80 py-1 pl-3 pr-3 text-xs text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/80 dark:text-neutral-300 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium truncate max-w-[130px]">{user.name}</span>
              <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                {user.role}
              </span>
            </div>
          ) : (
            <Link to="/login" className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Iniciar sesión
            </Link>
          )}

          {/* Toggle Modo Oscuro / Claro */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-200/80 bg-white/80 text-neutral-600 shadow-sm transition-all hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800/80 dark:bg-neutral-900/80 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-600" />}
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">

        {/* Banner Hero 404 */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8">

          {/* Badge superior animado */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-sm mb-6 backdrop-blur-sm animate-float-slow">
            <Compass className="h-3.5 w-3.5 text-primary-500 animate-spin" style={{ animationDuration: "12s" }} />
            <span>Código de Estado: 404 • Ruta no encontrada</span>
          </div>

          {/* Número 404 Gigante con efecto Glass y Gradiente */}
          <div className="relative mb-2 select-none">
            <h1 className="text-8xl sm:text-9xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-neutral-900 via-primary-700 to-primary-900 dark:from-white dark:via-primary-300 dark:to-primary-600 leading-none">
              404
            </h1>
            <div className="absolute -inset-1 rounded-3xl bg-primary-500/10 blur-2xl -z-10" />
          </div>

          {/* Título y Mensaje descriptivo */}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
            Parece que te has salido del inventario
          </h2>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-lg mb-4">
            La página o recurso al que intentas acceder no existe, ha cambiado de estantería o fue removida del sistema.
          </p>

          {/* Caja con la ruta solicitada y botón de copiar */}
          <div className="flex items-center gap-2 rounded-xl border border-neutral-200/80 bg-white/60 px-3 py-1.5 shadow-sm backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-900/60 max-w-full mb-6">
            <span className="text-xs font-medium text-neutral-400">Ruta:</span>
            <code className="text-xs font-mono font-semibold text-primary-600 dark:text-primary-400 truncate max-w-[240px] sm:max-w-xs">
              {location.pathname}
            </code>
            <button
              onClick={handleCopyPath}
              title="Copiar enlace"
              className="ml-1 flex items-center gap-1 rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200 text-[11px]"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{copied ? "¡Copiado!" : "Copiar"}</span>
            </button>
          </div>

          {/* Botones de acción principales */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full sm:w-auto">
            <Link to={homeDestination}>
              <Button size="md" className="gap-2 shadow-float">
                <Home className="h-4 w-4" />
                <span>Volver al Inicio</span>
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Página anterior</span>
            </Button>
          </div>
        </div>

        {/* Buscador Interactivo / "Buscador de Mentira" con Sugerencias en Vivo */}
        <div className="w-full max-w-2xl mx-auto mb-10">
          <div className="relative rounded-2xl border border-neutral-200/90 bg-white/90 p-2 shadow-soft backdrop-blur-xl transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/90 focus-within:border-primary-500/80 focus-within:ring-4 focus-within:ring-primary-500/15">

            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="¿Qué estabas buscando? (ej: ventas, productos, caja, reportes...)"
                className="w-full rounded-xl bg-transparent py-2.5 pl-10 pr-20 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100"
              />

              <div className="absolute right-2.5 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Limpiar búsqueda"
                    className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                    Ctrl K
                  </kbd>
                )}
              </div>
            </div>

            {/* Chips de búsquedas rápidas populares cuando no hay texto */}
            {!searchQuery && (
              <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap items-center gap-1.5 px-1.5">
                <span className="text-[11px] font-medium text-neutral-400 mr-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" /> Sugerencias:
                </span>
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag.query}
                    onClick={() => {
                      setSearchQuery(tag.query);
                      searchInputRef.current?.focus();
                    }}
                    className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-primary-950/60 dark:hover:text-primary-300"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            )}

            {/* Resultados filtrados en tiempo real */}
            {searchQuery && (
              <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 max-h-72 overflow-y-auto space-y-1 px-1">
                {filteredResults.length > 0 ? (
                  <>
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Coincidencias encontradas ({filteredResults.length})
                    </div>
                    {filteredResults.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="flex items-center justify-between rounded-xl p-2.5 transition-all duration-150 hover:bg-neutral-100/90 dark:hover:bg-neutral-800/90 group"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                              item.color === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              item.color === "blue" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                              item.color === "indigo" && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                              item.color === "violet" && "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                              item.color === "amber" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                              item.color === "cyan" && "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
                              item.color === "teal" && "bg-teal-500/10 text-teal-600 dark:text-teal-400",
                              item.color === "sky" && "bg-sky-500/10 text-sky-600 dark:text-sky-400",
                              item.color === "purple" && "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                              item.color === "rose" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                              item.color === "slate" && "bg-slate-500/10 text-slate-600 dark:text-slate-400",
                              item.color === "yellow" && "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                  {item.name}
                                </span>
                                {item.shortcut && (
                                  <span className="rounded bg-neutral-200/60 px-1.5 py-0.2 text-[10px] font-mono text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                    {item.shortcut}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity dark:text-primary-400 pr-2">
                            <span>Ir</span>
                            <CornerDownLeft className="h-3 w-3" />
                          </div>
                        </Link>
                      );
                    })}
                  </>
                ) : (
                  <div className="py-6 text-center">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                      <Search className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                      No encontramos coincidencias para "{searchQuery}"
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Intenta con palabras clave como <span className="underline cursor-pointer" onClick={() => setSearchQuery("ventas")}>ventas</span>, <span className="underline cursor-pointer" onClick={() => setSearchQuery("productos")}>productos</span>, o <span className="underline cursor-pointer" onClick={() => setSearchQuery("stock")}>stock</span>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sección de Enlaces de Navegación Rápidos Recomendados */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
              <Boxes className="h-4 w-4 text-primary-500" /> Secciones recomendadas
            </h3>
            <span className="text-xs text-neutral-400">Acceso directo a los módulos clave</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {SEARCH_DIRECTORY.slice(0, 6).map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.path}
                  to={section.path}
                  className="group relative flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:border-primary-500/40 hover:shadow-card dark:border-neutral-800/80 dark:bg-neutral-900/70 dark:hover:border-primary-500/40"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                      section.color === "emerald" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      section.color === "blue" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
                      section.color === "indigo" && "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                      section.color === "violet" && "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                      section.color === "amber" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      section.color === "cyan" && "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-neutral-900 transition-colors group-hover:text-primary-600 dark:text-neutral-100 dark:group-hover:text-primary-400">
                          {section.name}
                        </span>
                        {section.shortcut && (
                          <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                            {section.shortcut}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                        {section.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-[11px] font-medium text-primary-600 dark:text-primary-400">
                    <span className="text-neutral-400 dark:text-neutral-500 font-normal">{section.category}</span>
                    <span className="flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Entrar <ArrowLeft className="h-3 w-3 rotate-180" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </main>

      {/* Pie de página con soporte / diagnóstico */}
      <footer className="relative z-20 border-t border-neutral-200/80 bg-white/40 py-4 px-6 text-center text-xs text-neutral-500 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/40 dark:text-neutral-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-5xl mx-auto">
          <span>
            ¿Crees que se trata de un error? Consulta el{" "}
            <Link to="/tutorial" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
              Centro de Ayuda
            </Link>{" "}
            o contacta a tu administrador.
          </span>
          <span className="text-[11px] text-neutral-400">
            StockFlow &bull; Sistema de Gestión de Stock
          </span>
        </div>
      </footer>
    </div>
  );
}
