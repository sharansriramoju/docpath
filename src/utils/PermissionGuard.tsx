import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type { Permission } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

interface PermissionGuardProps {
  permission?: Permission;
  children: ReactNode;
}

const PermissionGuard = ({ permission, children }: PermissionGuardProps) => {
  const { hasPermission } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionGuard;
