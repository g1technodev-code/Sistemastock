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

const Stock = lazy(() => import("./pages/Stock"));
const Ventas = lazy(() => import("./pages/Ventas"));
const Compras = lazy(() => import("./pages/Compras"));
const Caja = lazy(() => import("./pages/Caja"));
const Analisis = lazy(() => import("./pages/Analisis"));
const Users = lazy(() => import("./pages/Users"));
const Settings = lazy(() => import("./pages/Settings"));
const Customers = lazy(() => import("./pages/Customers"));
const Plans = lazy(() => import("./pages/Plans"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const Catalog = lazy(() => import("./pages/Catalog"));




const SuperAdminDashboard = lazy(() => import("./features/admin/components/SuperAdminDashboard"));
const SuperAdminPagos = lazy(() => import("./pages/superadmin/Pagos"));
const SuperAdminAnuncios = lazy(() => import("./pages/superadmin/Anuncios"));
const SuperAdminPlanes = lazy(() => import("./pages/superadmin/Planes"));
const SuperAdminRubros = lazy(() => import("./pages/superadmin/Rubros"));
const SuperAdminCatalogoProductos = lazy(() => import("./pages/superadmin/CatalogoProductos"));

// Precargar todas las rutas en segundo plano para eliminar pantallas de carga al navegar
export function preloadAllPages() {
  import("./pages/Dashboard");
  import("./pages/Products");
  import("./pages/Ventas");
  import("./pages/Caja");
  import("./pages/Stock");
  import("./pages/Compras");
  import("./pages/Categories");
  import("./pages/Analisis");
  import("./pages/Users");
  import("./pages/Settings");
  import("./pages/Tutorial");
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
  if (user.role === "SUPERADMIN") return <Navigate to="/superadmin" replace />;
  return <Navigate to="/ventas" replace />;
}


export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/c/:localId" element={<Catalog />} />
        <Route path="/login" element={<Login />} />


        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<RootRedirect />} />
          
          <Route path="/superadmin" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminDashboard /></ProtectedRoute>} />
          <Route path="/superadmin/pagos" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminPagos /></ProtectedRoute>} />
          <Route path="/superadmin/anuncios" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminAnuncios /></ProtectedRoute>} />
          <Route path="/superadmin/planes" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminPlanes /></ProtectedRoute>} />
          <Route path="/superadmin/rubros" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminRubros /></ProtectedRoute>} />
          <Route path="/superadmin/catalogo" element={<ProtectedRoute allowedRoles={["SUPERADMIN"]}><SuperAdminCatalogoProductos /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Dashboard /></ProtectedRoute>} />

          <Route path="/categories" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Categories /></ProtectedRoute>} />

          {/* Both Admin and Employee */}
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/compras" element={<ProtectedRoute requiredFeature="PURCHASES"><Compras /></ProtectedRoute>} />
          <Route path="/caja" element={<ProtectedRoute requiredFeature="CASH_REGISTER"><Caja /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute requiredFeature="CUSTOMERS"><Customers /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Plans /></ProtectedRoute>} />


          <Route
            path="/analisis"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]} requiredFeature="REPORTS">
                <Analisis />
              </ProtectedRoute>
            }
          />
          {/* Old URLs, kept so bookmarks keep working */}
          <Route path="/reports" element={<Navigate to="/analisis?tab=informes" replace />} />
          <Route path="/estadisticas" element={<Navigate to="/analisis?tab=estadisticas" replace />} />
          <Route path="/rentabilidad" element={<Navigate to="/analisis?tab=rentabilidad" replace />} />
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
