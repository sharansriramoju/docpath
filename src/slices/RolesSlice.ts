import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

// Scope values observed from the API. "manage all" permissions carry a null
// scope; assignable permissions are scoped (e.g. LIMITED / ALL).
export type PermissionScope = "LIMITED" | "ALL";

export interface Permission {
  permission_id: string;
  action: string;
  subject: string;
}

export interface RolePermission extends Permission {
  RolePermission: {
    scope: PermissionScope | null;
    conditions: unknown;
  };
}

export interface Role {
  role_id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  permissions: RolePermission[];
}

interface RolesResponse {
  success: boolean;
  data: {
    count: number;
    rows: Role[];
  };
  message: string;
}

interface RoleByIdResponse {
  success: boolean;
  data: Role;
  message: string;
}

interface SaveRoleResponse {
  success: boolean;
  data: Role;
  message: string;
}

interface PermissionsResponse {
  success: boolean;
  data: Permission[];
  message: string;
}

export interface PermissionAssignment {
  permission_id: string;
  scope: PermissionScope;
}

export interface SaveRolePayload {
  mode: "add" | "edit";
  roleId?: number;
  data: {
    name: string;
    description: string;
    // create
    permissions?: PermissionAssignment[];
    // edit (delta)
    add_permissions?: PermissionAssignment[];
    remove_permissions?: string[];
    edit_permissions?: PermissionAssignment[];
  };
}

interface RolesState {
  roles: Role[];
  totalCount: number;
  loading: boolean;
  error: string;
  selectedRole: Role | null;
  loadingRoleId: number | null;
  saving: boolean;
  saveError: string;
  deletingRoleId: number | null;
  permissions: Permission[];
  permissionsLoading: boolean;
}

const initialState: RolesState = {
  roles: [],
  totalCount: 0,
  loading: false,
  error: "",
  selectedRole: null,
  loadingRoleId: null,
  saving: false,
  saveError: "",
  deletingRoleId: null,
  permissions: [],
  permissionsLoading: false,
};

export const RolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    setRoles(state, action: PayloadAction<Role[]>) {
      state.roles = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedRole(state, action: PayloadAction<Role | null>) {
      state.selectedRole = action.payload;
    },
    setLoadingRoleId(state, action: PayloadAction<number | null>) {
      state.loadingRoleId = action.payload;
    },
    setTotalCount(state, action: PayloadAction<number>) {
      state.totalCount = action.payload;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
    setSaveError(state, action: PayloadAction<string>) {
      state.saveError = action.payload;
    },
    setDeletingRoleId(state, action: PayloadAction<number | null>) {
      state.deletingRoleId = action.payload;
    },
    setPermissions(state, action: PayloadAction<Permission[]>) {
      state.permissions = action.payload;
    },
    setPermissionsLoading(state, action: PayloadAction<boolean>) {
      state.permissionsLoading = action.payload;
    },
  },
});

export const fetchRolesRdx =
  (search: string, page: number, limit: number) => async (dispatch: any) => {
    dispatch(RolesSlice.actions.setLoading(true));
    dispatch(RolesSlice.actions.setError(""));

    try {
      const response = await api.get<RolesResponse>("/roles", {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      dispatch(RolesSlice.actions.setRoles(response.data.data.rows));
      dispatch(RolesSlice.actions.setTotalCount(response.data.data.count));
    } catch (error) {
      console.error("Failed to load roles", error);
      dispatch(
        RolesSlice.actions.setError("Unable to load roles. Please try again."),
      );
      dispatch(RolesSlice.actions.setRoles([]));
      dispatch(RolesSlice.actions.setTotalCount(0));
    } finally {
      dispatch(RolesSlice.actions.setLoading(false));
    }
  };

export const fetchRoleByIdRdx = (roleId: number) => async (dispatch: any) => {
  dispatch(RolesSlice.actions.setLoadingRoleId(roleId));
  dispatch(RolesSlice.actions.setError(""));

  try {
    const response = await api.get<RoleByIdResponse>(`/roles/${roleId}`);
    dispatch(RolesSlice.actions.setSelectedRole(response.data.data));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch role by id", error);
    dispatch(
      RolesSlice.actions.setError(
        "Unable to open role details. Please try again.",
      ),
    );
    dispatch(RolesSlice.actions.setSelectedRole(null));
    throw error;
  } finally {
    dispatch(RolesSlice.actions.setLoadingRoleId(null));
  }
};

export const fetchPermissionsRdx =
  (search: string) => async (dispatch: any) => {
    dispatch(RolesSlice.actions.setPermissionsLoading(true));

    try {
      const response = await api.get<PermissionsResponse>("/permissions", {
        params: {
          search: search || undefined,
        },
      });
      dispatch(RolesSlice.actions.setPermissions(response.data.data));
      return response.data.data;
    } catch (error) {
      console.error("Failed to load permissions", error);
      dispatch(RolesSlice.actions.setPermissions([]));
      return [];
    } finally {
      dispatch(RolesSlice.actions.setPermissionsLoading(false));
    }
  };

export const saveRoleRdx =
  (payload: SaveRolePayload) => async (dispatch: any) => {
    dispatch(RolesSlice.actions.setSaving(true));
    dispatch(RolesSlice.actions.setSaveError(""));

    try {
      let response;
      if (payload.mode === "add") {
        response = await api.post<SaveRoleResponse>("/roles", {
          name: payload.data.name,
          description: payload.data.description,
          permissions: payload.data.permissions ?? [],
        });
      } else {
        response = await api.put<SaveRoleResponse>(`/roles/${payload.roleId}`, {
          name: payload.data.name,
          description: payload.data.description,
          add_permissions: payload.data.add_permissions ?? [],
          remove_permissions: payload.data.remove_permissions ?? [],
          edit_permissions: payload.data.edit_permissions ?? [],
        });
      }

      return response.data;
    } catch (error) {
      console.error("Failed to save role", error);
      dispatch(
        RolesSlice.actions.setSaveError(
          "Unable to save role. Please check values and try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(RolesSlice.actions.setSaving(false));
    }
  };

export const deleteRoleRdx = (roleId: number) => async (dispatch: any) => {
  dispatch(RolesSlice.actions.setDeletingRoleId(roleId));
  dispatch(RolesSlice.actions.setError(""));

  try {
    const response = await api.delete<SaveRoleResponse>(`/roles/${roleId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete role", error);
    dispatch(
      RolesSlice.actions.setError("Unable to delete role. Please try again."),
    );
    throw error;
  } finally {
    dispatch(RolesSlice.actions.setDeletingRoleId(null));
  }
};

export const RolesActions = RolesSlice.actions;

export default RolesSlice;
