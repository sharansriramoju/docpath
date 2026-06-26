import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchDiagnosticsRdx,
  createDiagnosticRdx,
  updateDiagnosticRdx,
  deleteDiagnosticRdx,
  DiagnosticsActions,
} from "../slices/PatientDiagnosticsSlice";

const usePatientDiagnostics = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    diagnostics,
    totalCount,
    loading,
    error,
    saving,
    saveError,
    deletingId,
  } = useSelector((state: RootState) => state.patientDiagnostics);

  const fetchDiagnostics = useCallback(
    async (patientId: string, page = 1, limit = 20) => {
      await dispatch(fetchDiagnosticsRdx(patientId, page, limit));
    },
    [dispatch],
  );

  const createDiagnostic = useCallback(
    async (patientId: string, description: string, file?: File) => {
      const result: any = await dispatch(
        createDiagnosticRdx(patientId, description, file),
      );
      return result ?? null;
    },
    [dispatch],
  );

  const updateDiagnostic = useCallback(
    async (diagnosticId: string, description: string, file?: File) => {
      const result: any = await dispatch(
        updateDiagnosticRdx(diagnosticId, description, file),
      );
      return result ?? null;
    },
    [dispatch],
  );

  const deleteDiagnostic = useCallback(
    async (diagnosticId: string) => {
      const result: any = await dispatch(deleteDiagnosticRdx(diagnosticId));
      return result ?? null;
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => dispatch(DiagnosticsActions.setError(message)),
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => dispatch(DiagnosticsActions.setSaveError(message)),
    [dispatch],
  );

  const reset = useCallback(
    () => dispatch(DiagnosticsActions.reset()),
    [dispatch],
  );

  return {
    diagnostics,
    totalCount,
    loading,
    error,
    saving,
    saveError,
    deletingId,
    fetchDiagnostics,
    createDiagnostic,
    updateDiagnostic,
    deleteDiagnostic,
    setError,
    setSaveError,
    reset,
  };
};

export default usePatientDiagnostics;
