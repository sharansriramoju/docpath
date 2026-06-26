import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export interface Diagnostic {
  diagnostic_id: string;
  patient_id: string;
  media_url: string | null;
  media_key: string | null;
  media_type: string | null;
  description: string;
  created_by_id: string;
  created_at: string;
  created_by?: { user_id: string; name: string };
}

interface DiagnosticsState {
  diagnostics: Diagnostic[];
  totalCount: number;
  loading: boolean;
  error: string;
  saving: boolean;
  saveError: string;
  deletingId: string | null;
}

const initialState: DiagnosticsState = {
  diagnostics: [],
  totalCount: 0,
  loading: false,
  error: "",
  saving: false,
  saveError: "",
  deletingId: null,
};

export const PatientDiagnosticsSlice = createSlice({
  name: "patientDiagnostics",
  initialState,
  reducers: {
    setDiagnostics(state, action: PayloadAction<Diagnostic[]>) {
      state.diagnostics = action.payload;
    },
    setTotalCount(state, action: PayloadAction<number>) {
      state.totalCount = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
    setSaveError(state, action: PayloadAction<string>) {
      state.saveError = action.payload;
    },
    setDeletingId(state, action: PayloadAction<string | null>) {
      state.deletingId = action.payload;
    },
    reset(state) {
      Object.assign(state, initialState);
    },
  },
});

export const fetchDiagnosticsRdx =
  (patientId: string, page = 1, limit = 20) =>
  async (dispatch: any) => {
    dispatch(PatientDiagnosticsSlice.actions.setLoading(true));
    dispatch(PatientDiagnosticsSlice.actions.setError(""));

    try {
      const response = await api.get<any>(
        `/patient-diagnostics/patient/${patientId}`,
        { params: { page, limit } },
      );
      const data = response.data?.data ?? response.data;
      dispatch(
        PatientDiagnosticsSlice.actions.setDiagnostics(data.rows ?? []),
      );
      dispatch(
        PatientDiagnosticsSlice.actions.setTotalCount(data.count ?? 0),
      );
    } catch (error) {
      console.error("Failed to load diagnostics", error);
      dispatch(
        PatientDiagnosticsSlice.actions.setError(
          "Unable to load diagnostics. Please try again.",
        ),
      );
      dispatch(PatientDiagnosticsSlice.actions.setDiagnostics([]));
      dispatch(PatientDiagnosticsSlice.actions.setTotalCount(0));
    } finally {
      dispatch(PatientDiagnosticsSlice.actions.setLoading(false));
    }
  };

export const createDiagnosticRdx =
  (patientId: string, description: string, file?: File) =>
  async (dispatch: any) => {
    dispatch(PatientDiagnosticsSlice.actions.setSaving(true));
    dispatch(PatientDiagnosticsSlice.actions.setSaveError(""));

    try {
      const formData = new FormData();
      formData.append("patient_id", patientId);
      formData.append("description", description);
      if (file) formData.append("file", file);

      const response = await api.post<any>("/patient-diagnostics", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Failed to create diagnostic", error);
      dispatch(
        PatientDiagnosticsSlice.actions.setSaveError(
          "Unable to create diagnostic. Please try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(PatientDiagnosticsSlice.actions.setSaving(false));
    }
  };

export const updateDiagnosticRdx =
  (diagnosticId: string, description: string, file?: File) =>
  async (dispatch: any) => {
    dispatch(PatientDiagnosticsSlice.actions.setSaving(true));
    dispatch(PatientDiagnosticsSlice.actions.setSaveError(""));

    try {
      const formData = new FormData();
      formData.append("description", description);
      if (file) formData.append("file", file);

      const response = await api.put<any>(
        `/patient-diagnostics/${diagnosticId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return response.data?.data ?? response.data;
    } catch (error) {
      console.error("Failed to update diagnostic", error);
      dispatch(
        PatientDiagnosticsSlice.actions.setSaveError(
          "Unable to update diagnostic. Please try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(PatientDiagnosticsSlice.actions.setSaving(false));
    }
  };

export const deleteDiagnosticRdx =
  (diagnosticId: string) => async (dispatch: any) => {
    dispatch(PatientDiagnosticsSlice.actions.setDeletingId(diagnosticId));
    dispatch(PatientDiagnosticsSlice.actions.setError(""));

    try {
      const response = await api.delete(
        `/patient-diagnostics/${diagnosticId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Failed to delete diagnostic", error);
      dispatch(
        PatientDiagnosticsSlice.actions.setError(
          "Unable to delete diagnostic. Please try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(PatientDiagnosticsSlice.actions.setDeletingId(null));
    }
  };

export const DiagnosticsActions = PatientDiagnosticsSlice.actions;

export default PatientDiagnosticsSlice;
