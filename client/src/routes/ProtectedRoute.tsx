import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FullPageSpinner } from "../components/ui/Spinner";
import type { Role } from "../lib/types";
import { hasFeature, type PlanFeature } from "../lib/features";

export function ProtectedRoute({
  children,
  allowedRoles,
  requiredFeature,
}: {
  children: ReactNode;
  allowedRoles?: Role[];
  requiredFeature?: PlanFeature;
}) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requiredFeature && !hasFeature(user, requiredFeature)) {
    return <Navigate to={user.role === "ADMIN" ? "/plans" : "/"} replace />;
  }

  return <>{children}</>;
}
