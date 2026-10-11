import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { routePaths } from "../../constants/routes";
import { useAuth } from "../../state/AuthContext";
import type { UserRole } from "../../types";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={routePaths.login} state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
