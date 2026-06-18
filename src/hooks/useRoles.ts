import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchRolesRdx,
  fetchRoleByIdRdx,
  fetchPermissionsRdx,
  saveRoleRdx,
  deleteRoleRdx,
  RolesActions,
  type Permission,
  type Role,
  type SaveRolePayload,
} from "../slices/RolesSlice";

const useRoles = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    roles,
    totalCount,
    loading,
    error,
    selectedRole,
    loadingRoleId,
    saving,
    saveError,
    deletingRoleId,
    permissions,
    permissionsLoading,
  } = useSelector((state: RootState) => state.roles);

  const fetchRoles = useCallback(
    async (search: string, page: number, limit: number) => {
      await dispatch(fetchRolesRdx(search, page, limit));
    },
    [dispatch],
  );

  const fetchRoleById = useCallback(
    async (roleId: number): Promise<Role | null> => {
      const result: any = await dispatch(fetchRoleByIdRdx(roleId));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const fetchPermissions = useCallback(
    async (search: string): Promise<Permission[]> => {
      const result: any = await dispatch(fetchPermissionsRdx(search));
      return result ?? [];
    },
    [dispatch],
  );

  const saveRole = useCallback(
    async (payload: SaveRolePayload) => {
      const result: any = await dispatch(saveRoleRdx(payload));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const deleteRole = useCallback(
    async (roleId: number) => {
      const result: any = await dispatch(deleteRoleRdx(roleId));
      return result ?? null;
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => {
      dispatch(RolesActions.setError(message));
    },
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => {
      dispatch(RolesActions.setSaveError(message));
    },
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(RolesActions.setError(""));
    dispatch(RolesActions.setSaveError(""));
  }, [dispatch]);

  return {
    roles,
    totalCount,
    loading,
    error,
    selectedRole,
    loadingRoleId,
    saving,
    saveError,
    deletingRoleId,
    permissions,
    permissionsLoading,
    fetchRoles,
    fetchRoleById,
    fetchPermissions,
    saveRole,
    deleteRole,
    setError,
    setSaveError,
    clearErrors,
  };
};

export default useRoles;
