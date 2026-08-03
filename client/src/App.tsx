import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import Suppliers from "./pages/Suppliers";
import Stock from "./pages/Stock";
import Ventas from "./pages/Ventas";
import Compras from "./pages/Compras";
import InventarioFisico from "./pages/InventarioFisico";
import Caja from "./pages/Caja";
import Reports from "./pages/Reports";
import Estadisticas from "./pages/Estadisticas";
import Rentabilidad from "./pages/Rentabilidad";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/inventario-fisico" element={<InventarioFisico />} />
        <Route path="/caja" element={<Caja />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/estadisticas"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Estadisticas />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rentabilidad"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
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
  );
}
