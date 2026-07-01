import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchTotalPatients,
  fetchTodayAppointments,
  fetchAppointmentTrends,
  fetchPatientVolumeByLocation,
  fetchNewPatientRegistrations,
  fetchPeakAppointmentHours,
} from "../slices/DashboardSlice";

const useDashboard = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    totalPatients,
    todayAppointments,
    appointmentTrends,
    patientVolumeByLocation,
    newPatientRegistrations,
    peakAppointmentHours,
    loading,
    error,
  } = useSelector((state: RootState) => state.dashboard);

  const loadTotalPatients = useCallback(() => {
    dispatch(fetchTotalPatients());
  }, [dispatch]);

  const loadTodayAppointments = useCallback(() => {
    dispatch(fetchTodayAppointments());
  }, [dispatch]);

  const loadAppointmentTrends = useCallback(
    (startDate: string, endDate: string, granularity: string) => {
      dispatch(fetchAppointmentTrends(startDate, endDate, granularity));
    },
    [dispatch],
  );

  const loadPatientVolumeByLocation = useCallback(
    (startDate: string, endDate: string) => {
      dispatch(fetchPatientVolumeByLocation(startDate, endDate));
    },
    [dispatch],
  );

  const loadNewPatientRegistrations = useCallback(
    (startDate: string, endDate: string, granularity: string) => {
      dispatch(fetchNewPatientRegistrations(startDate, endDate, granularity));
    },
    [dispatch],
  );

  const loadPeakAppointmentHours = useCallback(
    (startDate: string, endDate: string) => {
      dispatch(fetchPeakAppointmentHours(startDate, endDate));
    },
    [dispatch],
  );

  return {
    totalPatients,
    todayAppointments,
    appointmentTrends,
    patientVolumeByLocation,
    newPatientRegistrations,
    peakAppointmentHours,
    loading,
    error,
    loadTotalPatients,
    loadTodayAppointments,
    loadAppointmentTrends,
    loadPatientVolumeByLocation,
    loadNewPatientRegistrations,
    loadPeakAppointmentHours,
  };
};

export default useDashboard;
