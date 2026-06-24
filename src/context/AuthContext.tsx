import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import api, { setLogoutHandler } from "../utils/api";

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

export type AccessAction = "read" | "create" | "update" | "delete" | "manage";

export type AccessResource =
  | "Locations"
  | "Patients"
  | "Appointments"
  | "Users"
  | "Roles"
  | "PatientDiagnostics";

export interface ApiPermission {
  action: string;
  subject: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  avatar: string | null;
  permissions?: ApiPermission[];
}

interface AuthContextValue {
  user: User | null;
  authLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  can: (action: AccessAction, resource: AccessResource) => boolean;
  ROLE_PERMISSIONS: Record<Role, Permission[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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

const storeDisplayData = (userData: User) => {
  localStorage.setItem(
    "userDetails",
    JSON.stringify({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    }),
  );
};

const getStoredUser = (): User | null => {
  try {
    const stored = localStorage.getItem("userDetails");
    if (!stored) return null;
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const storedUser = getStoredUser();
  const [user, setUser] = useState<User | null>(storedUser);
  const [authLoading, setAuthLoading] = useState(!!storedUser);

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
      if (!user?.permissions) return false;
      return user.permissions.some(
        (p) =>
          (p.action === action || p.action === "manage") &&
          (p.subject === resource || p.subject === "all"),
      );
    },
    [user],
  );

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("userDetails");
  }, []);

  const login = useCallback((userData: User) => {
    setUser(userData);
    storeDisplayData(userData);
  }, []);

  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  useEffect(() => {
    if (!storedUser) return;

    let cancelled = false;
    const fetchMe = async () => {
      try {
        const response = await api.get<any>("/auth/me");
        if (cancelled) return;
        const data = response.data?.data ?? response.data;
        const roleName = (
          data.role?.name || data.role || "doctor"
        ).toLowerCase() as Role;
        const permissions: ApiPermission[] = (
          data.role?.permissions ?? data.permissions ?? []
        ).map((p: any) => ({
          action: p.action,
          subject: p.subject,
        }));
        const fullUser: User = {
          id: data.user_id ?? data.id ?? storedUser.id,
          name: data.name ?? storedUser.name,
          email: data.email ?? storedUser.email,
          phone: data.phone,
          role: roleName,
          avatar: data.profile_image_url ?? null,
          permissions,
        };
        setUser(fullUser);
        storeDisplayData(fullUser);
      } catch {
        if (cancelled) return;
        setUser(null);
        localStorage.removeItem("userDetails");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    };
    void fetchMe();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoading,
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
