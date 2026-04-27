import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { setLogoutHandler } from "../utils/api";

export type Role = "admin" | "doctor" | "receptionist" | "nurse";

export type Permission =
  | "view_dashboard"
  | "manage_appointments"
  | "manage_patients"
  | "view_records"
  | "manage_records"
  | "manage_schedule"
  | "manage_visits"
  | "manage_users"
  | "manage_settings";

export type AccessAction = "read" | "create" | "update";

export type AccessResource = "Locations";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar: string | null;
}

interface AuthContextValue {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  can: (action: AccessAction, resource: AccessResource) => boolean;
  ROLE_PERMISSIONS: Record<Role, Permission[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Role definitions with permissions
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "view_dashboard",
    "manage_appointments",
    "manage_patients",
    "view_records",
    "manage_records",
    "manage_schedule",
    "manage_visits",
    "manage_users",
    "manage_settings",
  ],
  doctor: [
    "view_dashboard",
    "manage_appointments",
    "manage_patients",
    "view_records",
    "manage_records",
    "manage_schedule",
    "manage_visits",
    "manage_settings",
  ],
  receptionist: [
    "view_dashboard",
    "manage_appointments",
    "manage_patients",
    "view_records",
  ],
  nurse: [
    "view_dashboard",
    "manage_appointments",
    "manage_patients",
    "view_records",
    "manage_records",
  ],
};

const ROLE_ACCESS: Record<
  Role,
  Partial<Record<AccessResource, AccessAction[]>>
> = {
  admin: {
    Locations: ["read", "create", "update"],
  },
  doctor: {
    Locations: ["read", "create", "update"],
  },
  receptionist: {},
  nurse: {},
};

// Restore user from localStorage if available
const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem("userDetails");
    if (!stored) return null;
    const data = JSON.parse(stored);
    return data as User;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const hasPermission = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      const perms = ROLE_PERMISSIONS[user.role] || [];
      return perms.includes(permission);
    },
    [user],
  );

  const hasRole = useCallback((role: Role) => user?.role === role, [user]);

  const can = useCallback(
    (action: AccessAction, resource: AccessResource) => {
      if (!user) return false;
      const allowedActions = ROLE_ACCESS[user.role]?.[resource] || [];
      return allowedActions.includes(action);
    },
    [user],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("userDetails");
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    localStorage.setItem("userDetails", JSON.stringify(userData));
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission,
        hasRole,
        can,
        ROLE_PERMISSIONS,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
