import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export interface Patient {
  patient_id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  profile_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// The id field name isn't documented; tolerate either patient_id or id.
export const getPatientId = (patient: Patient): string =>
  patient.patient_id ?? patient.id ?? "";

export interface PatientFilters {
  page: number;
  limit: number;
  name?: string;
  phone?: string;
}

interface PatientsResponse {
  success: boolean;
  data: {
    count: number;
    rows: Patient[];
  };
  message: string;
}

export interface SavePatientPayload {
  mode: "add" | "edit";
  patientId?: string;
  data: {
    name: string;
    email: string;
    phone: string;
    gender: string;
    date_of_birth: string;
  };
}

interface PatientsState {
  patients: Patient[];
  totalCount: number;
  loading: boolean;
  error: string;
  selectedPatient: Patient | null;
  loadingPatientId: string | null;
  saving: boolean;
  saveError: string;
  deletingPatientId: string | null;
}

const initialState: PatientsState = {
  patients: [],
  totalCount: 0,
  loading: false,
  error: "",
  selectedPatient: null,
  loadingPatientId: null,
  saving: false,
  saveError: "",
  deletingPatientId: null,
};

export const PatientsSlice = createSlice({
  name: "patients",
  initialState,
  reducers: {
    setPatients(state, action: PayloadAction<Patient[]>) {
      state.patients = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedPatient(state, action: PayloadAction<Patient | null>) {
      state.selectedPatient = action.payload;
    },
    setLoadingPatientId(state, action: PayloadAction<string | null>) {
      state.loadingPatientId = action.payload;
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
    setDeletingPatientId(state, action: PayloadAction<string | null>) {
      state.deletingPatientId = action.payload;
    },
  },
});

export const fetchPatientsRdx =
  (filters: PatientFilters) => async (dispatch: any) => {
    dispatch(PatientsSlice.actions.setLoading(true));
    dispatch(PatientsSlice.actions.setError(""));

    try {
      const response = await api.get<PatientsResponse>("/patients", {
        params: {
          page: filters.page,
          limit: filters.limit,
          name: filters.name || undefined,
          phone: filters.phone || undefined,
        },
      });
      dispatch(PatientsSlice.actions.setPatients(response.data.data.rows));
      dispatch(PatientsSlice.actions.setTotalCount(response.data.data.count));
    } catch (error) {
      console.error("Failed to load patients", error);
      dispatch(
        PatientsSlice.actions.setError(
          "Unable to load patients. Please try again.",
        ),
      );
      dispatch(PatientsSlice.actions.setPatients([]));
      dispatch(PatientsSlice.actions.setTotalCount(0));
    } finally {
      dispatch(PatientsSlice.actions.setLoading(false));
    }
  };

export const fetchPatientByIdRdx =
  (patientId: string) => async (dispatch: any) => {
    dispatch(PatientsSlice.actions.setLoadingPatientId(patientId));
    dispatch(PatientsSlice.actions.setError(""));

    try {
      const response = await api.get<any>(`/patients/${patientId}`);
      const patient: Patient = response.data?.data ?? response.data?.patient;
      dispatch(PatientsSlice.actions.setSelectedPatient(patient));
      return patient;
    } catch (error) {
      console.error("Failed to fetch patient by id", error);
      dispatch(
        PatientsSlice.actions.setError(
          "Unable to open patient details. Please try again.",
        ),
      );
      dispatch(PatientsSlice.actions.setSelectedPatient(null));
      throw error;
    } finally {
      dispatch(PatientsSlice.actions.setLoadingPatientId(null));
    }
  };

export const savePatientRdx =
  (payload: SavePatientPayload) => async (dispatch: any) => {
    dispatch(PatientsSlice.actions.setSaving(true));
    dispatch(PatientsSlice.actions.setSaveError(""));

    try {
      const body = {
        name: payload.data.name,
        email: payload.data.email,
        phone: payload.data.phone,
        gender: payload.data.gender,
        date_of_birth: payload.data.date_of_birth,
      };

      const response =
        payload.mode === "add"
          ? await api.post<any>("/patients", body)
          : await api.put<any>(`/patients/${payload.patientId}`, body);

      return (
        response.data?.data ?? response.data?.patient ?? response.data ?? null
      );
    } catch (error) {
      console.error("Failed to save patient", error);
      dispatch(
        PatientsSlice.actions.setSaveError(
          "Unable to save patient. Please check values and try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(PatientsSlice.actions.setSaving(false));
    }
  };

export const deletePatientRdx =
  (patientId: string) => async (dispatch: any) => {
    dispatch(PatientsSlice.actions.setDeletingPatientId(patientId));
    dispatch(PatientsSlice.actions.setError(""));

    try {
      const response = await api.delete(`/patients/${patientId}`);
      return response.data;
    } catch (error) {
      console.error("Failed to delete patient", error);
      dispatch(
        PatientsSlice.actions.setError(
          "Unable to delete patient. Please try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(PatientsSlice.actions.setDeletingPatientId(null));
    }
  };

export const PatientsActions = PatientsSlice.actions;

export default PatientsSlice;
