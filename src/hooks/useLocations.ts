import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../store";
import {
  fetchLocationByIdRdx,
  fetchLocationsRdx,
  saveLocationRdx,
  LocationsActions,
  type Location,
  type LocationStatus,
} from "../slices/LocationsSlice";

interface SaveLocationArgs {
  mode: "add" | "edit";
  data: {
    location_id?: string;
    name: string;
    latitude: string;
    longitude: string;
    google_maps_url: string;
    status?: LocationStatus;
  };
}

const useLocations = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    locations,
    totalCount,
    loading,
    error,
    selectedLocation,
    loadingLocationId,
    saving,
    saveError,
  } = useSelector((state: RootState) => state.locations);

  const fetchLocations = useCallback(
    async (search: string, page: number, limit: number) => {
      await dispatch(fetchLocationsRdx(search, page, limit));
    },
    [dispatch],
  );

  const fetchLocationById = useCallback(
    async (locationId: string) => {
      const result: any = await dispatch(fetchLocationByIdRdx(locationId));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const saveLocation = useCallback(
    async (payload: SaveLocationArgs) => {
      const result: any = await dispatch(saveLocationRdx(payload));
      return result?.data ?? null;
    },
    [dispatch],
  );

  const setError = useCallback(
    (message: string) => {
      dispatch(LocationsActions.setError(message));
    },
    [dispatch],
  );

  const setSaveError = useCallback(
    (message: string) => {
      dispatch(LocationsActions.setSaveError(message));
    },
    [dispatch],
  );

  const clearErrors = useCallback(() => {
    dispatch(LocationsActions.setError(""));
    dispatch(LocationsActions.setSaveError(""));
  }, [dispatch]);

  return {
    locations,
    totalCount,
    loading,
    error,
    selectedLocation,
    loadingLocationId,
    saving,
    saveError,
    fetchLocations,
    fetchLocationById,
    saveLocation,
    setError,
    setSaveError,
    clearErrors,
  };
};

export default useLocations;
