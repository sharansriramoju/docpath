import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchPatientsRdx,
  fetchPatientByIdRdx,
  savePatientRdx,
  deletePatientRdx,
  PatientsActions,
  type Patient,
  type PatientFilters,
  type SavePatientPayload,
} from "../slices/PatientsSlice";

const usePatients = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    patients,
    totalCount,
    loading,
    error,
    selectedPatient,
    loadingPatientId,
    saving,
    saveError,
    deletingPatientId,
  } = useSelector((state: RootState) => state.patients);

  const fetchPatients = useCallback(
    async (filters: PatientFilters) => {
      await dispatch(fetchPatientsRdx(filters));
    },
    [dispatch],
  );

  const fetchPatientById = useCallback(
    async (patientId: string): Promise<Patient | null> => {
      const result: any = await dispatch(fetchPatientByIdRdx(patientId));
      return result ?? null;
    },
    [dispatch],
  );

  const savePatient = useCallback(
    async (payload: SavePatientPayload) => {
      const result: any = await dispatch(savePatientRdx(payload));
      return result ?? null;
    },
    [dispatch],
  );

  const deletePatient = useCallback(
    async (patientId: string) => {
      const result: any = await dispatch(deletePatientRdx(patientId));
      return result ?? null;
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => {
      dispatch(PatientsActions.setError(message));
    },
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => {
      dispatch(PatientsActions.setSaveError(message));
    },
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(PatientsActions.setError(""));
    dispatch(PatientsActions.setSaveError(""));
  }, [dispatch]);

  return {
    patients,
    totalCount,
    loading,
    error,
    selectedPatient,
    loadingPatientId,
    saving,
    saveError,
    deletingPatientId,
    fetchPatients,
    fetchPatientById,
    savePatient,
    deletePatient,
    setError,
    setSaveError,
    clearErrors,
  };
};

export default usePatients;
