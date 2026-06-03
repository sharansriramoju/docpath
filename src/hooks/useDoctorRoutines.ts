import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import {
  DoctorRoutinesActions,
  fetchDoctorRoutineByIdRdx,
  fetchDoctorRoutinesRdx,
  saveDoctorRoutineRdx,
} from "../slices/DoctorRoutinesSlice";
import { useCallback } from "react";

interface SaveDoctorRoutineArgs {
  mode: "add" | "edit";
  data: {
    routine_id?: string;
    doctor_id: string;
    location_id: string;
    index?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active?: boolean;
  };
}

const useDoctorRoutines = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    doctorRoutines,
    totalCount,
    loading,
    error,
    selectedDoctorRoutine,
    loadingRoutineId,
    saving,
    saveError,
  } = useSelector((state: RootState) => state.doctorRoutine);

  const fetchDoctorRoutines = useCallback(
    async (
      page: number,
      limit: number,
      doctorId?: string,
      index?: number,
      dayOfWeek?: number,
      locationIds?: string[],
    ) => {
      await dispatch(
        fetchDoctorRoutinesRdx(
          page,
          limit,
          doctorId,
          index,
          dayOfWeek,
          locationIds,
        ),
      );
    },
    [dispatch],
  );

  const fetchDoctorRoutineById = useCallback(
    async (routineId: string, doctorId: string) => {
      const result: any = await dispatch(
        fetchDoctorRoutineByIdRdx(routineId, doctorId),
      );
      return result;
    },
    [dispatch],
  );

  const saveDoctorRoutine = useCallback(
    async (payload: SaveDoctorRoutineArgs) => {
      const result: any = await dispatch(saveDoctorRoutineRdx(payload));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => {
      dispatch(DoctorRoutinesActions.setError(message));
    },
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => {
      dispatch(DoctorRoutinesActions.setSaveError(message));
    },
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(DoctorRoutinesActions.setError(""));
    dispatch(DoctorRoutinesActions.setSaveError(""));
  }, [dispatch]);
  return {
    doctorRoutines,
    totalCount,
    loading,
    error,
    selectedDoctorRoutine,
    loadingRoutineId,
    saving,
    saveError,
    fetchDoctorRoutines,
    saveDoctorRoutine,
    fetchDoctorRoutineById,
    setSaveError,
    clearErrors,
    setError,
  };
};

export default useDoctorRoutines;
