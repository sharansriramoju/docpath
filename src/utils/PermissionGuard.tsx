import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import type {
  AccessAction,
  AccessResource,
  Permission,
} from "../context/AuthContext";
import { Navigate } from "react-router-dom";

interface PermissionGuardProps {
  permission?: Permission;
  action?: AccessAction;
  resource?: AccessResource;
  children: ReactNode;
}

const PermissionGuard = ({
  permission,
  action,
  resource,
  children,
}: PermissionGuardProps) => {
  const { hasPermission, can } = useAuth();

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/" replace />;
  }

  if (action && resource && !can(action, resource)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PermissionGuard;
