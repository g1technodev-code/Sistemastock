import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, ShoppingCart, Package, Tags, ArrowLeftRight, Keyboard, Info } from "lucide-react";
import { cn } from "../lib/utils";

type TutorialItem = {
  title: string;
  icon: any;
  content: React.ReactNode;
};

export default function Tutorial() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const tutorials: TutorialItem[] = [
    {
      title: "Cómo registrar una nueva venta",
      icon: ShoppingCart,
      content: (
        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
          <p>El módulo de ventas está diseñado para ser rápido e intuitivo. Sigue estos pasos:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Ve al menú principal y haz clic en <strong>Ventas</strong>.</li>
            <li>En la barra de búsqueda superior, ingresa el <strong>nombre, código o código de barras</strong> del producto.</li>
            <li>Presiona Enter o haz clic en el producto para agregarlo al carrito.</li>
            <li>Ajusta la cantidad usando los botones + y - si es necesario.</li>
            <li>Revisa el Total en la parte inferior y selecciona el <strong>Método de Pago</strong> (Efectivo, Tarjeta, etc.).</li>
            <li>Haz clic en el botón azul de <strong>Confirmar Venta</strong>.</li>
          </ol>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-900/20">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-blue-800 dark:text-blue-300">
              <strong>Tip:</strong> Si tienes un lector de código de barras, simplemente escanéalo directamente en la pantalla de ventas sin necesidad de hacer clic en el buscador primero.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Cómo cargar o editar productos",
      icon: Package,
      content: (
        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
          <p>Mantener el catálogo de productos actualizado es esencial para tener precios y stock correctos:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Ve a la sección <strong>Productos</strong> en el menú lateral.</li>
            <li>Para agregar uno nuevo, haz clic en el botón verde <strong>+ Nuevo Producto</strong> arriba a la derecha.</li>
            <li>Completa los datos obligatorios: Nombre, Código SKU, Costo, Precio de Venta y Stock actual. El margen de ganancia se calculará automáticamente.</li>
            <li>Haz clic en <strong>Crear Producto</strong>.</li>
            <li>Para editar un producto existente, búscalo en la lista y haz clic sobre la fila. Podrás modificar cualquier dato.</li>
          </ol>
        </div>
      ),
    },
    {
      title: "Gestión de Stock y Movimientos",
      icon: ArrowLeftRight,
      content: (
        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
          <p>Existen dos formas principales de modificar el stock de un producto fuera de una venta normal:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Carga Rápida en Productos:</strong> Ve a Productos, haz clic en editar y modifica el número de stock. (Ideal para correcciones pequeñas).
            </li>
            <li>
              <strong>Movimientos de Stock:</strong> Ve a la pestaña de Stock. Aquí puedes registrar Entradas (mercadería nueva), Salidas (productos vencidos/rotos) o Ajustes. Este método deja un registro detallado de quién y por qué modificó el stock.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "Atajos de Teclado (Para ir más rápido)",
      icon: Keyboard,
      content: (
        <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400">
          <p>Utiliza estos atajos desde cualquier parte del sistema para navegar rápidamente:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
              <span>Ir a Ventas</span>
              <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-300 font-mono text-xs dark:bg-neutral-800 dark:border-neutral-700">Shift + V</kbd>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
              <span>Ir a Compras</span>
              <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-300 font-mono text-xs dark:bg-neutral-800 dark:border-neutral-700">Shift + X</kbd>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
              <span>Abrir Caja</span>
              <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-300 font-mono text-xs dark:bg-neutral-800 dark:border-neutral-700">Shift + C</kbd>
            </div>
            <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
              <span>Escanear Producto Global</span>
              <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-300 font-mono text-xs dark:bg-neutral-800 dark:border-neutral-700">Ctrl + M</kbd>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary-100 text-primary-600 rounded-xl dark:bg-primary-900/30 dark:text-primary-400">
          <BookOpen className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Centro de Ayuda y Tutorial
          </h1>
          <p className="text-neutral-500 mt-1 dark:text-neutral-400">
            Todo lo que necesitas saber para operar el sistema rápidamente.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {tutorials.map((item, index) => {
          const isOpen = openItems.includes(index);
          return (
            <div
              key={index}
              className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm transition-all dark:bg-neutral-900 dark:border-neutral-800"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-5 text-left focus:outline-none hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-semibold text-neutral-900 text-lg dark:text-neutral-100">
                    {item.title}
                  </span>
                </div>
                <div className="text-neutral-400 bg-neutral-100 p-1 rounded-full dark:bg-neutral-800">
                  {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </button>
              
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="p-5 pt-0 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                  <div className="pt-4">
                    {item.content}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-10 p-6 bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100 rounded-2xl dark:from-primary-900/20 dark:to-indigo-900/20 dark:border-primary-900/30">
        <h3 className="text-lg font-bold text-primary-900 dark:text-primary-300 mb-2">¿Necesitas ayuda adicional?</h3>
        <p className="text-primary-700 dark:text-primary-400 text-sm">
          Este manual cubre las funciones principales del día a día. Si ocurre algún error técnico en el sistema o tienes una duda muy específica sobre el funcionamiento de los reportes, contacta al administrador principal (SuperAdmin).
        </p>
      </div>
    </div>
  );
}
