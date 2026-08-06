import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { QuickSearch } from "../search/QuickSearch";
import { GlobalScannerModal } from "./GlobalScannerModal";
import { preloadAllPages } from "../../App";
import { useHotkeys } from "../../hooks/useHotkeys";

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Precargar las rutas en segundo plano al iniciar la app
    preloadAllPages();
  }, []);

  useHotkeys({
    "ctrl+k": () => setSearchOpen(true),
    "shift+v": () => navigate("/ventas"),
    "shift+c": () => navigate("/caja"),
    "shift+x": () => navigate("/compras"),
  });

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileMenuOpen(true)} onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
      <QuickSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <GlobalScannerModal />
    </div>
  );
}
