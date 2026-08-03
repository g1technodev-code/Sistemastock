import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { refreshSession, setAccessToken, setUnauthenticatedHandler } from "../api/client";
import type { AuthUser } from "../lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Bypass temporal: permite desplegar el frontend en Vercel antes de tener el backend online.
// Activar con VITE_SKIP_AUTH=true en el entorno de Vercel; quitarla (o ponerla en false) cuando el backend esté disponible.
const SKIP_AUTH = import.meta.env.VITE_SKIP_AUTH === "true";
const MOCK_USER: AuthUser = { id: "dev-mock-user", name: "Usuario Demo", email: "demo@stockflow.local", role: "ADMIN" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(SKIP_AUTH ? MOCK_USER : null);
  const [isLoading, setIsLoading] = useState(!SKIP_AUTH);

  useEffect(() => {
    if (SKIP_AUTH) return;

    setUnauthenticatedHandler(() => setUser(null));

    (async () => {
      try {
        const { user: refreshedUser } = await refreshSession();
        setUser(refreshedUser);
      } catch {
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user: loggedInUser } = await authApi.login(email, password);
    setAccessToken(accessToken);
    setUser(loggedInUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
