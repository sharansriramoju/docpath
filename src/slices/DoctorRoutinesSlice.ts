import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export interface DoctorRoutine {
  routine_id: string;
  doctor_id: string;
  index?: number;
  location_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  day?: string;
  created_at: string;
  location: {
    location_id: string;
    name: string;
  };
}

interface DoctorRoutineState {
  doctorRoutines: DoctorRoutine[];
  totalCount: number;
  loading: boolean;
  error: string;
  selectedDoctorRoutine: DoctorRoutine | null;
  loadingRoutineId: string | null;
  saving: boolean;
  saveError: string;
}

interface DoctorRoutinesResponse {
  success: boolean;
  data: {
    count: number;
    rows: DoctorRoutine[];
  };
  message: string;
}

interface SaveDoctorRoutineResponse {
  success: boolean;
  data: DoctorRoutine;
  message: string;
}

interface SaveDoctorRoutinePayload {
  mode: "add" | "edit";
  data: {
    routine_id?: string;
    doctor_id: string;
    location_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  };
}

const initialState: DoctorRoutineState = {
  doctorRoutines: [],
  totalCount: 0,
  loading: false,
  error: "",
  selectedDoctorRoutine: null,
  loadingRoutineId: null,
  saving: false,
  saveError: "",
};

export const DoctorRoutinesSlice = createSlice({
  name: "doctorRoutine",
  initialState,
  reducers: {
    setDoctorRoutines(state, action: PayloadAction<DoctorRoutine[]>) {
      state.doctorRoutines = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedDoctorRoutine(
      state,
      action: PayloadAction<DoctorRoutine | null>,
    ) {
      state.selectedDoctorRoutine = action.payload;
    },
    setLoadingRoutineId(state, action: PayloadAction<string | null>) {
      state.loadingRoutineId = action.payload;
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
  },
});

export const fetchDoctorRoutinesRdx =
  (
    page: number,
    limit: number,
    doctorId?: string,
    index?: number,
    dayOfWeek?: number,
    locationIds?: string[],
  ) =>
  async (dispatch: any) => {
    dispatch(DoctorRoutinesSlice.actions.setLoading(true));
    dispatch(DoctorRoutinesSlice.actions.setError(""));
    try {
      const response = await api.get<DoctorRoutinesResponse>(
        "/doctor-routine",
        {
          params: {
            doctor_id: doctorId,
            page,
            limit,
            index,
            day_of_week: dayOfWeek,
            location_ids: locationIds ? JSON.stringify(locationIds) : undefined,
          },
        },
      );
      dispatch(
        DoctorRoutinesSlice.actions.setDoctorRoutines(response.data.data.rows),
      );
      dispatch(
        DoctorRoutinesSlice.actions.setTotalCount(response.data.data.count),
      );
    } catch (error: any) {
      dispatch(
        DoctorRoutinesSlice.actions.setError(
          "Failed to fetch doctor routines.",
        ),
      );
      dispatch(DoctorRoutinesSlice.actions.setDoctorRoutines([]));
      dispatch(DoctorRoutinesSlice.actions.setTotalCount(0));
      console.error("Failed to fetch doctor routines", error);
    } finally {
      dispatch(DoctorRoutinesSlice.actions.setLoading(false));
    }
  };

export const fetchDoctorRoutineByIdRdx =
  (routine_id: string, doctor_id: string) => async (dispatch: any) => {
    dispatch(DoctorRoutinesSlice.actions.setLoadingRoutineId(routine_id));
    dispatch(DoctorRoutinesSlice.actions.setError(""));
    try {
      const response = await api.get<{
        success: boolean;
        data: DoctorRoutine;
        message: string;
      }>(`/doctor-routine/${doctor_id}/${routine_id}`);
      dispatch(
        DoctorRoutinesSlice.actions.setSelectedDoctorRoutine(
          response.data.data,
        ),
      );
      return response.data;
    } catch (error) {
      dispatch(
        DoctorRoutinesSlice.actions.setError("Failed to fetch doctor routine."),
      );
    } finally {
      dispatch(DoctorRoutinesSlice.actions.setLoadingRoutineId(null));
    }
  };

export const DoctorRoutinesActions = DoctorRoutinesSlice.actions;

export const saveDoctorRoutineRdx =
  (payload: SaveDoctorRoutinePayload) => async (dispatch: any) => {
    dispatch(DoctorRoutinesSlice.actions.setSaving(true));
    dispatch(DoctorRoutinesSlice.actions.setSaveError(""));
    try {
      let response;
      if (payload.mode === "add") {
        response = await api.post<SaveDoctorRoutineResponse>(
          "/doctor-routine",
          payload.data,
        );
      } else {
        const routineId = payload.data.routine_id;
        payload.data.routine_id = undefined; // Remove routine_id from payload for PUT request
        response = await api.put<SaveDoctorRoutineResponse>(
          `/doctor-routine/${payload.data.doctor_id}/${routineId}`,
          payload.data,
        );
      }
    } catch (error: any) {
      dispatch(
        DoctorRoutinesSlice.actions.setSaveError(
          error.response?.data?.message ||
            "Failed to save routine. Please check values and try again.",
        ),
      );
    } finally {
      dispatch(DoctorRoutinesSlice.actions.setSaving(false));
    }
  };

export default DoctorRoutinesSlice;
