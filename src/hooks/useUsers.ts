import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchUsersRdx,
  fetchUserByIdRdx,
  saveUserRdx,
  deleteUserRdx,
  fetchRoleOptionsRdx,
  fetchLocationOptionsRdx,
  fetchDoctorOptionsRdx,
  UsersActions,
  type DoctorRef,
  type LocationRef,
  type RoleRef,
  type SaveUserPayload,
  type User,
  type UserFilters,
} from "../slices/UsersSlice";

const useUsers = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    users,
    totalCount,
    loading,
    error,
    selectedUser,
    loadingUserId,
    saving,
    saveError,
    deletingUserId,
    roleOptions,
    locationOptions,
    doctorOptions,
  } = useSelector((state: RootState) => state.users);

  const fetchUsers = useCallback(
    async (filters: UserFilters) => {
      await dispatch(fetchUsersRdx(filters));
    },
    [dispatch],
  );

  const fetchUserById = useCallback(
    async (userId: string): Promise<User | null> => {
      const result: any = await dispatch(fetchUserByIdRdx(userId));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const saveUser = useCallback(
    async (payload: SaveUserPayload) => {
      const result: any = await dispatch(saveUserRdx(payload));
      return result ?? null;
    },
    [dispatch],
  );

  const deleteUser = useCallback(
    async (userId: string) => {
      const result: any = await dispatch(deleteUserRdx(userId));
      return result ?? null;
    },
    [dispatch],
  );

  const fetchRoleOptions = useCallback(
    async (): Promise<RoleRef[]> => {
      const result: any = await dispatch(fetchRoleOptionsRdx());
      return result ?? [];
    },
    [dispatch],
  );

  const fetchLocationOptions = useCallback(
    async (search: string): Promise<LocationRef[]> => {
      const result: any = await dispatch(fetchLocationOptionsRdx(search));
      return result ?? [];
    },
    [dispatch],
  );

  const fetchDoctorOptions = useCallback(
    async (): Promise<DoctorRef[]> => {
      const result: any = await dispatch(fetchDoctorOptionsRdx());
      return result ?? [];
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => {
      dispatch(UsersActions.setError(message));
    },
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => {
      dispatch(UsersActions.setSaveError(message));
    },
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(UsersActions.setError(""));
    dispatch(UsersActions.setSaveError(""));
  }, [dispatch]);

  return {
    users,
    totalCount,
    loading,
    error,
    selectedUser,
    loadingUserId,
    saving,
    saveError,
    deletingUserId,
    roleOptions,
    locationOptions,
    doctorOptions,
    fetchUsers,
    fetchUserById,
    saveUser,
    deleteUser,
    fetchRoleOptions,
    fetchLocationOptions,
    fetchDoctorOptions,
    setError,
    setSaveError,
    clearErrors,
  };
};

export default useUsers;
