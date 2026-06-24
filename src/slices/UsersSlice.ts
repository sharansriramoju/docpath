import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export interface RoleRef {
  role_id: number;
  name: string;
}

export interface LocationRef {
  location_id: string;
  name: string;
}

export interface DoctorRef {
  user_id: string;
  name: string;
}

export interface User {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  role_id: number;
  profile_image_url: string | null;
  created_at: string;
  updated_at: string;
  role?: RoleRef;
  locations?: LocationRef[];
  reporting_doctors?: DoctorRef[];
}

export interface UserFilters {
  page: number;
  limit: number;
  name?: string;
  email?: string;
  phone?: string;
  role_id?: number | "";
}

interface UsersResponse {
  success: boolean;
  data: {
    count: number;
    rows: User[];
  };
  message: string;
}

interface UserByIdResponse {
  success: boolean;
  data: User;
  message: string;
}

// Create returns the user under `user`; update/getById return it under `data`.
interface CreateUserResponse {
  success: boolean;
  user: User;
  message: string;
}

interface UpdateUserResponse {
  success: boolean;
  data: User;
  message: string;
}

interface RolesResponse {
  success: boolean;
  data: {
    count: number;
    rows: RoleRef[];
  };
  message: string;
}

interface LocationsResponse {
  success: boolean;
  data: {
    count: number;
    rows: LocationRef[];
  };
  message: string;
}

export interface SaveUserPayload {
  mode: "add" | "edit";
  userId?: string;
  data: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string;
    role_id: number;
    // create
    location_ids?: string[];
    reporting_doctor_ids?: string[];
    // edit (delta)
    add_location_ids?: string[];
    remove_location_ids?: string[];
    add_reporting_doctor_ids?: string[];
    remove_reporting_doctor_ids?: string[];
  };
}

interface UsersState {
  users: User[];
  totalCount: number;
  loading: boolean;
  error: string;
  selectedUser: User | null;
  loadingUserId: string | null;
  saving: boolean;
  saveError: string;
  deletingUserId: string | null;
  roleOptions: RoleRef[];
  locationOptions: LocationRef[];
  doctorOptions: DoctorRef[];
}

const initialState: UsersState = {
  users: [],
  totalCount: 0,
  loading: false,
  error: "",
  selectedUser: null,
  loadingUserId: null,
  saving: false,
  saveError: "",
  deletingUserId: null,
  roleOptions: [],
  locationOptions: [],
  doctorOptions: [],
};

export const UsersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setUsers(state, action: PayloadAction<User[]>) {
      state.users = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedUser(state, action: PayloadAction<User | null>) {
      state.selectedUser = action.payload;
    },
    setLoadingUserId(state, action: PayloadAction<string | null>) {
      state.loadingUserId = action.payload;
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
    setDeletingUserId(state, action: PayloadAction<string | null>) {
      state.deletingUserId = action.payload;
    },
    setRoleOptions(state, action: PayloadAction<RoleRef[]>) {
      state.roleOptions = action.payload;
    },
    setLocationOptions(state, action: PayloadAction<LocationRef[]>) {
      state.locationOptions = action.payload;
    },
    setDoctorOptions(state, action: PayloadAction<DoctorRef[]>) {
      state.doctorOptions = action.payload;
    },
  },
});

export const fetchUsersRdx =
  (filters: UserFilters) => async (dispatch: any) => {
    dispatch(UsersSlice.actions.setLoading(true));
    dispatch(UsersSlice.actions.setError(""));

    try {
      const response = await api.get<UsersResponse>("/users", {
        params: {
          page: filters.page,
          limit: filters.limit,
          name: filters.name || undefined,
          email: filters.email || undefined,
          phone: filters.phone || undefined,
          role_id: filters.role_id || undefined,
        },
      });
      dispatch(UsersSlice.actions.setUsers(response.data.data.rows));
      dispatch(UsersSlice.actions.setTotalCount(response.data.data.count));
    } catch (error) {
      console.error("Failed to load users", error);
      dispatch(
        UsersSlice.actions.setError("Unable to load users. Please try again."),
      );
      dispatch(UsersSlice.actions.setUsers([]));
      dispatch(UsersSlice.actions.setTotalCount(0));
    } finally {
      dispatch(UsersSlice.actions.setLoading(false));
    }
  };

export const fetchUserByIdRdx = (userId: string) => async (dispatch: any) => {
  dispatch(UsersSlice.actions.setLoadingUserId(userId));
  dispatch(UsersSlice.actions.setError(""));

  try {
    const response = await api.get<UserByIdResponse>(`/user/${userId}`);
    dispatch(UsersSlice.actions.setSelectedUser(response.data.data));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user by id", error);
    dispatch(
      UsersSlice.actions.setError(
        "Unable to open user details. Please try again.",
      ),
    );
    dispatch(UsersSlice.actions.setSelectedUser(null));
    throw error;
  } finally {
    dispatch(UsersSlice.actions.setLoadingUserId(null));
  }
};

export const saveUserRdx =
  (payload: SaveUserPayload) => async (dispatch: any) => {
    dispatch(UsersSlice.actions.setSaving(true));
    dispatch(UsersSlice.actions.setSaveError(""));

    try {
      if (payload.mode === "add") {
        const response = await api.post<CreateUserResponse>("/users", {
          name: payload.data.name,
          email: payload.data.email,
          phone: payload.data.phone,
          gender: payload.data.gender,
          date_of_birth: payload.data.date_of_birth,
          role_id: payload.data.role_id,
          location_ids: payload.data.location_ids ?? [],
          reporting_doctor_ids: payload.data.reporting_doctor_ids ?? [],
        });
        return response.data.user;
      }

      const response = await api.put<UpdateUserResponse>(
        `/users/${payload.userId}`,
        {
          name: payload.data.name,
          email: payload.data.email,
          phone: payload.data.phone,
          gender: payload.data.gender,
          date_of_birth: payload.data.date_of_birth,
          role_id: payload.data.role_id,
          add_location_ids: payload.data.add_location_ids ?? [],
          remove_location_ids: payload.data.remove_location_ids ?? [],
          add_reporting_doctor_ids: payload.data.add_reporting_doctor_ids ?? [],
          remove_reporting_doctor_ids:
            payload.data.remove_reporting_doctor_ids ?? [],
        },
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to save user", error);
      dispatch(
        UsersSlice.actions.setSaveError(
          "Unable to save user. Please check values and try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(UsersSlice.actions.setSaving(false));
    }
  };

export const deleteUserRdx = (userId: string) => async (dispatch: any) => {
  dispatch(UsersSlice.actions.setDeletingUserId(userId));
  dispatch(UsersSlice.actions.setError(""));

  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete user", error);
    dispatch(
      UsersSlice.actions.setError("Unable to delete user. Please try again."),
    );
    throw error;
  } finally {
    dispatch(UsersSlice.actions.setDeletingUserId(null));
  }
};

export const fetchRoleOptionsRdx = () => async (dispatch: any) => {
  try {
    const response = await api.get<RolesResponse>("/roles", {
      params: { limit: 100, page: 1 },
    });
    dispatch(UsersSlice.actions.setRoleOptions(response.data.data.rows));
    return response.data.data.rows;
  } catch (error) {
    console.error("Failed to load roles", error);
    dispatch(UsersSlice.actions.setRoleOptions([]));
    return [];
  }
};

export const fetchLocationOptionsRdx =
  (search: string) => async (dispatch: any) => {
    try {
      const response = await api.get<LocationsResponse>("/locations", {
        params: { search: search || undefined, limit: 100, page: 1 },
      });
      dispatch(UsersSlice.actions.setLocationOptions(response.data.data.rows));
      return response.data.data.rows;
    } catch (error) {
      console.error("Failed to load locations", error);
      dispatch(UsersSlice.actions.setLocationOptions([]));
      return [];
    }
  };

export const fetchDoctorOptionsRdx = () => async (dispatch: any) => {
  try {
    const response = await api.get<any>("/users", {
      params: { role_name: "doctor" },
    });
    // Tolerate either a bare array or a paginated { rows } payload.
    const payload = response.data?.data;
    const rows: any[] = Array.isArray(payload) ? payload : (payload?.rows ?? []);
    const doctors: DoctorRef[] = rows.map((u) => ({
      user_id: u.user_id,
      name: u.name,
    }));
    dispatch(UsersSlice.actions.setDoctorOptions(doctors));
    return doctors;
  } catch (error) {
    console.error("Failed to load doctors", error);
    dispatch(UsersSlice.actions.setDoctorOptions([]));
    return [];
  }
};

export const UsersActions = UsersSlice.actions;

export default UsersSlice;
