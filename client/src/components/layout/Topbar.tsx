import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Menu, Search, Bell, LogOut, AlertTriangle, Sun, Moon, Wallet, CheckCheck, Megaphone, Gift, Copy } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Field";
import { useToast } from "../../context/ToastContext";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { listNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "../../api/notifications";
import { initials, formatDate } from "../../lib/formatters";
import { ROLE_LABEL } from "../../lib/permissions";
import { Badge } from "../ui/Badge";
import type { NotificationItem } from "../../lib/types";

export function Topbar({ onOpenMenu, onOpenSearch }: { onOpenMenu: () => void; onOpenSearch: () => void }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const [referralOpen, setReferralOpen] = useState(false);
  const { showSuccess } = useToast();

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications({ limit: 10 }),
    refetchInterval: 15_000,
  });

  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setAlertsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unreadCount = notificationsData?.unreadCount ?? 0;

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white/70 px-4 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/70 sm:px-6">
      <button onClick={onOpenMenu} className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-neutral-100 lg:hidden dark:hover:bg-neutral-800">
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onOpenSearch}
        className="flex flex-1 items-center gap-3 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-400 shadow-sm transition-all duration-200 hover:border-neutral-400 hover:bg-white max-w-lg dark:border-white/10 dark:bg-neutral-900/50 dark:hover:border-white/20 dark:hover:bg-neutral-900"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left font-medium">Buscar...</span>
        <kbd className="hidden rounded border border-neutral-300 bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500 sm:inline dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
          ⌘ K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {user?.role === "ADMIN" && (
          <button
            onClick={() => setReferralOpen(true)}
            className="hidden sm:flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-bold text-yellow-700 shadow-sm transition-all hover:bg-yellow-100 hover:shadow dark:border-yellow-900/50 dark:bg-yellow-950/30 dark:text-yellow-500"
          >
            <Gift className="h-4 w-4" /> Gana 1 Mes Gratis
          </button>
        )}
        <button
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          className="rounded-full p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" strokeWidth={2.5} /> : <Moon className="h-[18px] w-[18px]" strokeWidth={2.5} />}
        </button>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative rounded-full p-2.5 text-neutral-500 transition-colors hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
          >
            <Bell className="h-[18px] w-[18px]" strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-950">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {alertsOpen && (
            <div className="absolute right-0 z-40 mt-3 w-80 sm:w-96 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Notificaciones</span>
                  {unreadCount > 0 && <Badge tone="danger">{unreadCount}</Badge>}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllMutation.mutate()}
                    title="Marcar todas como leídas"
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors dark:text-primary-400"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Leer todas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto p-1 mt-1 space-y-1">
                {notificationsData?.items.length === 0 && (
                  <div className="px-2 py-8 text-center">
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Sin notificaciones recientes.</p>
                  </div>
                )}
                {notificationsData?.items.map((n: NotificationItem) => {
                  const isAnnouncement = n.metadata?.isAnnouncement || n.type.startsWith("ANNOUNCEMENT_");
                  const isStock = n.type === "LOW_STOCK";
                  const targetLink = isAnnouncement ? "#" : isStock ? "/products" : "/caja";

                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) markOneMutation.mutate(n.id);
                        if (!isAnnouncement) setAlertsOpen(false);
                      }}
                      className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                        n.isRead
                          ? "opacity-60 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                          : "bg-primary-50/40 dark:bg-primary-500/10 hover:bg-primary-50 dark:hover:bg-primary-500/20"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isAnnouncement
                          ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                          : isStock
                          ? "bg-warning-100 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
                          : "bg-primary-100 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400"
                      }`}>
                        {isAnnouncement ? <Megaphone className="h-4 w-4" /> : isStock ? <AlertTriangle className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate font-semibold text-neutral-900 dark:text-neutral-100">{n.title}</p>
                          {isAnnouncement && (
                            <Badge tone="info" className="text-[9px] px-1.5 py-0 font-bold uppercase tracking-wider shrink-0">
                              Aviso
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-neutral-400 mt-1">{formatDate(n.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}

              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-full p-1 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white shadow-sm dark:bg-primary-500">
              {initials(user?.name ?? "U")}
            </div>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 z-40 mt-3 w-56 rounded-2xl border border-neutral-200 bg-white/95 p-2 shadow-float backdrop-blur-xl dark:border-white/10 dark:bg-neutral-900/95 animate-in zoom-in-95 duration-200">
              <div className="px-4 py-3">
                <p className="truncate text-sm font-bold text-neutral-900 dark:text-neutral-100">{user?.name}</p>
                <p className="truncate text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">{user?.email}</p>
                <div className="mt-2">
                  <Badge tone="info">{user ? ROLE_LABEL[user.role] : ""}</Badge>
                </div>
              </div>
              <div className="my-1 h-px bg-neutral-100 dark:bg-neutral-800/60" />
              <button
                onClick={() => logout()}
                className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-500/10"
              >
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
      
      {/* Referral Modal */}
      <Modal open={referralOpen} onClose={() => setReferralOpen(false)} title="🎁 ¡Gana 1 Mes Gratis!" size="sm">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Comparte Kipo con otros negocios. Por cada local que se registre con tu enlace y adquiera un plan, te regalaremos <strong>1 mes gratis</strong> en tu plan actual.
          </p>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Tu enlace de invitación</span>
            <div className="flex gap-2">
              <Input
                readOnly
                value={`https://kipo.app/registro?ref=${user?.localId || user?.id}`}
                className="flex-1 font-mono text-xs"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(`https://kipo.app/registro?ref=${user?.localId || user?.id}`);
                  showSuccess("¡Enlace copiado!");
                }}
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
