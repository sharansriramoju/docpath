import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

interface TrendRow {
  period: string;
  count: number;
}

interface LocationVolumeRow {
  location_id: string;
  location_name: string;
  count: number;
}

interface PeakHourRow {
  hour: number;
  count: number;
}

interface DashboardState {
  totalPatients: number | null;
  todayAppointments: number | null;
  appointmentTrends: TrendRow[];
  patientVolumeByLocation: LocationVolumeRow[];
  newPatientRegistrations: TrendRow[];
  peakAppointmentHours: PeakHourRow[];
  loading: {
    totalPatients: boolean;
    todayAppointments: boolean;
    appointmentTrends: boolean;
    patientVolumeByLocation: boolean;
    newPatientRegistrations: boolean;
    peakAppointmentHours: boolean;
  };
  error: string;
}

const initialState: DashboardState = {
  totalPatients: null,
  todayAppointments: null,
  appointmentTrends: [],
  patientVolumeByLocation: [],
  newPatientRegistrations: [],
  peakAppointmentHours: [],
  loading: {
    totalPatients: false,
    todayAppointments: false,
    appointmentTrends: false,
    patientVolumeByLocation: false,
    newPatientRegistrations: false,
    peakAppointmentHours: false,
  },
  error: "",
};

export const DashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    setTotalPatients(state, action: PayloadAction<number>) {
      state.totalPatients = action.payload;
    },
    setTodayAppointments(state, action: PayloadAction<number>) {
      state.todayAppointments = action.payload;
    },
    setAppointmentTrends(state, action: PayloadAction<TrendRow[]>) {
      state.appointmentTrends = action.payload;
    },
    setPatientVolumeByLocation(state, action: PayloadAction<LocationVolumeRow[]>) {
      state.patientVolumeByLocation = action.payload;
    },
    setNewPatientRegistrations(state, action: PayloadAction<TrendRow[]>) {
      state.newPatientRegistrations = action.payload;
    },
    setPeakAppointmentHours(state, action: PayloadAction<PeakHourRow[]>) {
      state.peakAppointmentHours = action.payload;
    },
    setLoading(state, action: PayloadAction<{ key: keyof DashboardState["loading"]; value: boolean }>) {
      state.loading[action.payload.key] = action.payload.value;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
  },
});

const { actions } = DashboardSlice;

export const fetchTotalPatients = () => async (dispatch: any) => {
  dispatch(actions.setLoading({ key: "totalPatients", value: true }));
  try {
    const res = await api.get("/dashboard/total-patients");
    dispatch(actions.setTotalPatients(res.data?.data?.total_patients ?? 0));
  } catch {
    dispatch(actions.setError("Failed to load total patients"));
  } finally {
    dispatch(actions.setLoading({ key: "totalPatients", value: false }));
  }
};

export const fetchTodayAppointments = () => async (dispatch: any) => {
  dispatch(actions.setLoading({ key: "todayAppointments", value: true }));
  try {
    const res = await api.get("/dashboard/today-appointments");
    dispatch(actions.setTodayAppointments(res.data?.data?.today_appointments ?? 0));
  } catch {
    dispatch(actions.setError("Failed to load today's appointments"));
  } finally {
    dispatch(actions.setLoading({ key: "todayAppointments", value: false }));
  }
};

export const fetchAppointmentTrends =
  (startDate: string, endDate: string, granularity: string) => async (dispatch: any) => {
    dispatch(actions.setLoading({ key: "appointmentTrends", value: true }));
    try {
      const res = await api.get("/dashboard/appointment-trends", {
        params: { start_date: startDate, end_date: endDate, granularity },
      });
      dispatch(actions.setAppointmentTrends(res.data?.data?.rows ?? []));
    } catch {
      dispatch(actions.setError("Failed to load appointment trends"));
    } finally {
      dispatch(actions.setLoading({ key: "appointmentTrends", value: false }));
    }
  };

export const fetchPatientVolumeByLocation =
  (startDate: string, endDate: string) => async (dispatch: any) => {
    dispatch(actions.setLoading({ key: "patientVolumeByLocation", value: true }));
    try {
      const res = await api.get("/dashboard/patient-volume-by-location", {
        params: { start_date: startDate, end_date: endDate },
      });
      dispatch(actions.setPatientVolumeByLocation(res.data?.data?.rows ?? []));
    } catch {
      dispatch(actions.setError("Failed to load patient volume by location"));
    } finally {
      dispatch(actions.setLoading({ key: "patientVolumeByLocation", value: false }));
    }
  };

export const fetchNewPatientRegistrations =
  (startDate: string, endDate: string, granularity: string) => async (dispatch: any) => {
    dispatch(actions.setLoading({ key: "newPatientRegistrations", value: true }));
    try {
      const res = await api.get("/dashboard/new-patient-registrations", {
        params: { start_date: startDate, end_date: endDate, granularity },
      });
      dispatch(actions.setNewPatientRegistrations(res.data?.data?.rows ?? []));
    } catch {
      dispatch(actions.setError("Failed to load new patient registrations"));
    } finally {
      dispatch(actions.setLoading({ key: "newPatientRegistrations", value: false }));
    }
  };

export const fetchPeakAppointmentHours =
  (startDate: string, endDate: string) => async (dispatch: any) => {
    dispatch(actions.setLoading({ key: "peakAppointmentHours", value: true }));
    try {
      const res = await api.get("/dashboard/peak-appointment-hours", {
        params: { start_date: startDate, end_date: endDate },
      });
      dispatch(actions.setPeakAppointmentHours(res.data?.data?.rows ?? []));
    } catch {
      dispatch(actions.setError("Failed to load peak appointment hours"));
    } finally {
      dispatch(actions.setLoading({ key: "peakAppointmentHours", value: false }));
    }
  };

export const DashboardActions = DashboardSlice.actions;
export default DashboardSlice;
