import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchMonthOverviewRdx,
  fetchReportingDoctorsRdx,
  fetchDayRdx,
  createAppointmentRdx,
  rescheduleAppointmentRdx,
  cancelAppointmentRdx,
  fetchNotesRdx,
  updateNotesRdx,
  fetchDoctorOptionsRdx,
  fetchPatientOptionsRdx,
  fetchLocationOptionsRdx,
  AppointmentsActions,
  type AppointmentNotes,
  type CreateAppointmentBody,
  type DoctorOption,
  type NotesBody,
  type RescheduleBody,
} from "../slices/AppointmentsSlice";

const useAppointments = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    appointments,
    loading,
    error,
    monthOverview,
    monthOverviewLoading,
    reportingDoctors,
    saving,
    saveError,
    actioningId,
    notes,
    notesLoading,
    doctorOptions,
    patientOptions,
    locationOptions,
  } = useSelector((state: RootState) => state.appointments);

  const fetchMonthOverview = useCallback(
    async (params: { month: string; doctor_id?: string }) => {
      await dispatch(fetchMonthOverviewRdx(params));
    },
    [dispatch],
  );

  const fetchReportingDoctors = useCallback(
    async (userId: string): Promise<DoctorOption[]> => {
      const result: any = await dispatch(fetchReportingDoctorsRdx(userId));
      return result ?? [];
    },
    [dispatch],
  );

  const fetchDay = useCallback(
    async (params: {
      date: string;
      doctor_id?: string;
      location_ids: string[];
    }) => {
      await dispatch(fetchDayRdx(params));
    },
    [dispatch],
  );

  const createAppointment = useCallback(
    async (body: CreateAppointmentBody) => {
      return await dispatch(createAppointmentRdx(body));
    },
    [dispatch],
  );

  const rescheduleAppointment = useCallback(
    async (appointmentId: string, body: RescheduleBody) => {
      return await dispatch(rescheduleAppointmentRdx(appointmentId, body));
    },
    [dispatch],
  );

  const cancelAppointment = useCallback(
    async (appointmentId: string) => {
      return await dispatch(cancelAppointmentRdx(appointmentId));
    },
    [dispatch],
  );

  const fetchNotes = useCallback(
    async (appointmentId: string): Promise<AppointmentNotes | null> => {
      const result: any = await dispatch(fetchNotesRdx(appointmentId));
      return result ?? null;
    },
    [dispatch],
  );

  const updateNotes = useCallback(
    async (appointmentId: string, body: NotesBody) => {
      return await dispatch(updateNotesRdx(appointmentId, body));
    },
    [dispatch],
  );

  const fetchDoctorOptions = useCallback(async () => {
    await dispatch(fetchDoctorOptionsRdx());
  }, [dispatch]);

  const fetchPatientOptions = useCallback(
    async (search: string) => {
      await dispatch(fetchPatientOptionsRdx(search));
    },
    [dispatch],
  );

  const fetchLocationOptions = useCallback(async () => {
    await dispatch(fetchLocationOptionsRdx());
  }, [dispatch]);

  const setError = useCallback(
    (message: string) => dispatch(AppointmentsActions.setError(message)),
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => dispatch(AppointmentsActions.setSaveError(message)),
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(AppointmentsActions.setError(""));
    dispatch(AppointmentsActions.setSaveError(""));
  }, [dispatch]);

  return {
    appointments,
    loading,
    error,
    monthOverview,
    monthOverviewLoading,
    reportingDoctors,
    saving,
    saveError,
    actioningId,
    notes,
    notesLoading,
    doctorOptions,
    patientOptions,
    locationOptions,
    fetchMonthOverview,
    fetchReportingDoctors,
    fetchDay,
    createAppointment,
    rescheduleAppointment,
    cancelAppointment,
    fetchNotes,
    updateNotes,
    fetchDoctorOptions,
    fetchPatientOptions,
    fetchLocationOptions,
    setError,
    setSaveError,
    clearErrors,
  };
};

export default useAppointments;
