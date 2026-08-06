import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { Loader2 } from "lucide-react";

// Lazy loading of page components for optimal initial bundle size and speed
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Stock = lazy(() => import("./pages/Stock"));
const Ventas = lazy(() => import("./pages/Ventas"));
const Compras = lazy(() => import("./pages/Compras"));
const InventarioFisico = lazy(() => import("./pages/InventarioFisico"));
const Caja = lazy(() => import("./pages/Caja"));
const Reports = lazy(() => import("./pages/Reports"));
const Estadisticas = lazy(() => import("./pages/Estadisticas"));
const Rentabilidad = lazy(() => import("./pages/Rentabilidad"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const Customers = lazy(() => import("./pages/Customers"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Precargar todas las rutas en segundo plano para eliminar pantallas de carga al navegar
export function preloadAllPages() {
  import("./pages/Dashboard");
  import("./pages/Products");
  import("./pages/Ventas");
  import("./pages/Caja");
  import("./pages/Stock");
  import("./pages/Compras");
  import("./pages/Categories");
  import("./pages/Suppliers");
  import("./pages/InventarioFisico");
  import("./pages/Reports");
  import("./pages/Estadisticas");
  import("./pages/Rentabilidad");
  import("./pages/Users");
  import("./pages/Settings");
}

function PageLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "ADMIN") return <Navigate to="/dashboard" replace />;
  return <Navigate to="/ventas" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<RootRedirect />} />
          
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Dashboard /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Categories /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Suppliers /></ProtectedRoute>} />
          <Route path="/inventario-fisico" element={<InventarioFisico />} />

          {/* Both Admin and Employee */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/caja" element={<Caja />} />
          <Route path="/customers" element={<Customers />} />

          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/estadisticas"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Estadisticas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rentabilidad"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Rentabilidad />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
