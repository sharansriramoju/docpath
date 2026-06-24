import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface AppointmentPatient {
  user_id: string;
  name: string;
  phone: string;
  email: string;
  gender: string;
  date_of_birth: string;
  profile_image_url: string | null;
}

export interface AppointmentLocation {
  location_id: string;
  name: string;
  latitude?: string;
  longitude?: string;
  google_maps_url?: string;
  status?: string;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  location_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  doctor_notes: string | null;
  prescription: string | null;
  status: AppointmentStatus;
  created_by_id: string;
  created_at: string;
  patient?: AppointmentPatient;
  location?: AppointmentLocation;
}

export interface AppointmentNotes {
  appointment_id: string;
  reason: string | null;
  doctor_notes: string | null;
  prescription: string | null;
}

// Per-location status counts for a single date (from the overview endpoint).
export interface OverviewTotal {
  location_id: string;
  location_name: string;
  doctor_id: string;
  doctor_name: string;
  pending: number;
  completed: number;
  cancelled: number;
  total_scheduled: number;
}

export interface DoctorOption {
  user_id: string;
  name: string;
}

export interface PatientOption {
  user_id: string;
  name: string;
  phone: string;
}

export interface LocationOption {
  location_id: string;
  name: string;
}

export interface CreateAppointmentBody {
  patient_id: string;
  doctor_id: string;
  location_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface RescheduleBody {
  date: string;
  start_time: string;
  end_time: string;
}

export interface NotesBody {
  reason?: string;
  doctor_notes?: string;
  prescription?: string;
}

interface AppointmentsState {
  // day timeline
  appointments: Appointment[];
  loading: boolean;
  error: string;
  // month overview (date -> per-location totals)
  monthOverview: Record<string, OverviewTotal[]>;
  monthOverviewLoading: boolean;
  // viewable doctors for the logged-in user
  reportingDoctors: DoctorOption[];
  // mutations
  saving: boolean;
  saveError: string;
  actioningId: string | null;
  notes: AppointmentNotes | null;
  notesLoading: boolean;
  // selector options (create form)
  doctorOptions: DoctorOption[];
  patientOptions: PatientOption[];
  locationOptions: LocationOption[];
}

const initialState: AppointmentsState = {
  appointments: [],
  loading: false,
  error: "",
  monthOverview: {},
  monthOverviewLoading: false,
  reportingDoctors: [],
  saving: false,
  saveError: "",
  actioningId: null,
  notes: null,
  notesLoading: false,
  doctorOptions: [],
  patientOptions: [],
  locationOptions: [],
};

const errMsg = (error: any, fallback: string): string =>
  error?.response?.data?.message || fallback;

export const AppointmentsSlice = createSlice({
  name: "appointments",
  initialState,
  reducers: {
    setAppointments(state, action: PayloadAction<Appointment[]>) {
      state.appointments = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setMonthOverview(
      state,
      action: PayloadAction<Record<string, OverviewTotal[]>>,
    ) {
      state.monthOverview = action.payload;
    },
    setMonthOverviewLoading(state, action: PayloadAction<boolean>) {
      state.monthOverviewLoading = action.payload;
    },
    setReportingDoctors(state, action: PayloadAction<DoctorOption[]>) {
      state.reportingDoctors = action.payload;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
    setSaveError(state, action: PayloadAction<string>) {
      state.saveError = action.payload;
    },
    setActioningId(state, action: PayloadAction<string | null>) {
      state.actioningId = action.payload;
    },
    setNotes(state, action: PayloadAction<AppointmentNotes | null>) {
      state.notes = action.payload;
    },
    setNotesLoading(state, action: PayloadAction<boolean>) {
      state.notesLoading = action.payload;
    },
    setDoctorOptions(state, action: PayloadAction<DoctorOption[]>) {
      state.doctorOptions = action.payload;
    },
    setPatientOptions(state, action: PayloadAction<PatientOption[]>) {
      state.patientOptions = action.payload;
    },
    setLocationOptions(state, action: PayloadAction<LocationOption[]>) {
      state.locationOptions = action.payload;
    },
  },
});

const A = AppointmentsSlice.actions;

// Per-date overview for the whole month in a single call.
export const fetchMonthOverviewRdx =
  (params: { month: string; doctor_id?: string }) =>
  async (dispatch: any) => {
    dispatch(A.setMonthOverviewLoading(true));
    dispatch(A.setError(""));
    try {
      const response = await api.get<any>("/appointments/overview", {
        params: {
          view: "month",
          month: params.month,
          doctor_id: params.doctor_id || undefined,
        },
      });
      const days: { date: string; totals: OverviewTotal[] }[] =
        response.data?.data ?? [];
      const map: Record<string, OverviewTotal[]> = {};
      for (const d of days) map[d.date] = d.totals ?? [];
      dispatch(A.setMonthOverview(map));
    } catch (error) {
      console.error("Failed to load overview", error);
      dispatch(
        A.setError(
          errMsg(error, "Unable to load the calendar. Please try again."),
        ),
      );
      dispatch(A.setMonthOverview({}));
    } finally {
      dispatch(A.setMonthOverviewLoading(false));
    }
  };

// The logged-in user's reporting doctors (drives the viewer filter).
export const fetchReportingDoctorsRdx =
  (userId: string) => async (dispatch: any) => {
    try {
      const response = await api.get<any>(`/user/${userId}`);
      const list: DoctorOption[] = (
        response.data?.data?.reporting_doctors ?? []
      ).map((d: any) => ({ user_id: d.user_id, name: d.name }));
      dispatch(A.setReportingDoctors(list));
      return list;
    } catch (error) {
      console.error("Failed to load reporting doctors", error);
      dispatch(A.setReportingDoctors([]));
      return [];
    }
  };

// A single day's appointments, merged across the locations that have entries
// for that date (the list endpoint is per-location).
export const fetchDayRdx =
  (params: { date: string; doctor_id?: string; location_ids: string[] }) =>
  async (dispatch: any) => {
    dispatch(A.setLoading(true));
    dispatch(A.setError(""));
    try {
      if (params.location_ids.length === 0) {
        dispatch(A.setAppointments([]));
        return;
      }
      const results = await Promise.all(
        params.location_ids.map((location_id) =>
          api
            .get<any>("/appointments", {
              params: {
                location_id,
                date: params.date,
                doctor_id: params.doctor_id || undefined,
              },
            })
            .then((r) => (r.data?.data ?? []) as Appointment[])
            .catch(() => [] as Appointment[]),
        ),
      );
      const merged = results
        .flat()
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
      dispatch(A.setAppointments(merged));
    } catch (error) {
      console.error("Failed to load day", error);
      dispatch(
        A.setError(errMsg(error, "Unable to load appointments for this day.")),
      );
      dispatch(A.setAppointments([]));
    } finally {
      dispatch(A.setLoading(false));
    }
  };

export const createAppointmentRdx =
  (body: CreateAppointmentBody) => async (dispatch: any) => {
    dispatch(A.setSaving(true));
    dispatch(A.setSaveError(""));
    try {
      const response = await api.post<any>("/appointments", body);
      return response.data?.data;
    } catch (error) {
      const message = errMsg(error, "Unable to create the appointment.");
      dispatch(A.setSaveError(message));
      throw new Error(message);
    } finally {
      dispatch(A.setSaving(false));
    }
  };

export const rescheduleAppointmentRdx =
  (appointmentId: string, body: RescheduleBody) => async (dispatch: any) => {
    dispatch(A.setSaving(true));
    dispatch(A.setSaveError(""));
    try {
      const response = await api.patch<any>(
        `/appointments/${appointmentId}/reschedule`,
        body,
      );
      return response.data?.data;
    } catch (error) {
      const message = errMsg(error, "Unable to reschedule the appointment.");
      dispatch(A.setSaveError(message));
      throw new Error(message);
    } finally {
      dispatch(A.setSaving(false));
    }
  };

export const cancelAppointmentRdx =
  (appointmentId: string) => async (dispatch: any) => {
    dispatch(A.setActioningId(appointmentId));
    dispatch(A.setError(""));
    try {
      const response = await api.patch<any>(
        `/appointments/${appointmentId}/cancel`,
      );
      return response.data?.data;
    } catch (error) {
      const message = errMsg(error, "Unable to cancel the appointment.");
      dispatch(A.setError(message));
      throw new Error(message);
    } finally {
      dispatch(A.setActioningId(null));
    }
  };

export const fetchNotesRdx =
  (appointmentId: string) => async (dispatch: any) => {
    dispatch(A.setNotesLoading(true));
    try {
      const response = await api.get<any>(
        `/appointments/${appointmentId}/notes`,
      );
      const data: AppointmentNotes = response.data?.data;
      dispatch(A.setNotes(data));
      return data;
    } catch (error) {
      const message = errMsg(error, "Unable to load notes.");
      dispatch(A.setError(message));
      dispatch(A.setNotes(null));
      throw new Error(message);
    } finally {
      dispatch(A.setNotesLoading(false));
    }
  };

export const updateNotesRdx =
  (appointmentId: string, body: NotesBody) => async (dispatch: any) => {
    dispatch(A.setSaving(true));
    dispatch(A.setSaveError(""));
    try {
      const response = await api.patch<any>(
        `/appointments/${appointmentId}/notes`,
        body,
      );
      return response.data?.data;
    } catch (error) {
      const message = errMsg(error, "Unable to update notes.");
      dispatch(A.setSaveError(message));
      throw new Error(message);
    } finally {
      dispatch(A.setSaving(false));
    }
  };

export const fetchDoctorOptionsRdx = () => async (dispatch: any) => {
  try {
    const response = await api.get<any>("/users", {
      params: { role_name: "doctor", limit: 50 },
    });
    const payload = response.data?.data;
    const rows: any[] = Array.isArray(payload) ? payload : (payload?.rows ?? []);
    dispatch(
      A.setDoctorOptions(rows.map((u) => ({ user_id: u.user_id, name: u.name }))),
    );
  } catch (error) {
    console.error("Failed to load doctors", error);
    dispatch(A.setDoctorOptions([]));
  }
};

export const fetchPatientOptionsRdx =
  (search: string) => async (dispatch: any) => {
    try {
      const response = await api.get<any>("/patients", {
        params: { name: search || undefined, limit: 20, page: 1 },
      });
      const payload = response.data?.data;
      const rows: any[] = Array.isArray(payload)
        ? payload
        : (payload?.rows ?? []);
      dispatch(
        A.setPatientOptions(
          rows.map((p) => ({
            user_id: p.user_id ?? p.patient_id ?? p.id,
            name: p.name,
            phone: p.phone,
          })),
        ),
      );
    } catch (error) {
      console.error("Failed to load patients", error);
      dispatch(A.setPatientOptions([]));
    }
  };

export const fetchLocationOptionsRdx = () => async (dispatch: any) => {
  try {
    const response = await api.get<any>("/locations", {
      params: { limit: 50, page: 1 },
    });
    const payload = response.data?.data;
    const rows: any[] = Array.isArray(payload) ? payload : (payload?.rows ?? []);
    dispatch(
      A.setLocationOptions(
        rows.map((l) => ({ location_id: l.location_id, name: l.name })),
      ),
    );
  } catch (error) {
    console.error("Failed to load locations", error);
    dispatch(A.setLocationOptions([]));
  }
};

export const AppointmentsActions = AppointmentsSlice.actions;

export default AppointmentsSlice;
