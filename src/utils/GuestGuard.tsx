import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestGuard = ({ children }: { children: ReactNode }) => {
  const { user, authLoading } = useAuth();

  if (authLoading) return null;

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestGuard;
