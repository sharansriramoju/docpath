import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import api from "../utils/api";

export type LocationStatus = "active" | "inactive";

export interface Location {
  location_id: string;
  name: string;
  latitude: string;
  longitude: string;
  google_maps_url: string;
  created_by_id: string;
  created_at: string;
  status: LocationStatus;
}

interface LocationsResponse {
  success: boolean;
  data: {
    count: number;
    rows: Location[];
  };
  message: string;
}

interface LocationByIdResponse {
  success: boolean;
  data: Location;
  message: string;
}

interface SaveLocationPayload {
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

interface LocationsState {
  locations: Location[];
  totalCount: number;
  loading: boolean;
  error: string;
  selectedLocation: Location | null;
  loadingLocationId: string | null;
  saving: boolean;
  saveError: string;
}

const initialState: LocationsState = {
  locations: [],
  totalCount: 0,
  loading: false,
  error: "",
  selectedLocation: null,
  loadingLocationId: null,
  saving: false,
  saveError: "",
};

export const LocationsSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {
    setLocations(state, action: PayloadAction<Location[]>) {
      state.locations = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    setSelectedLocation(state, action: PayloadAction<Location | null>) {
      state.selectedLocation = action.payload;
    },
    setLoadingLocationId(state, action: PayloadAction<string | null>) {
      state.loadingLocationId = action.payload;
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
  },
});

export const fetchLocationsRdx =
  (search: string, page: number, limit: number) => async (dispatch: any) => {
    dispatch(LocationsSlice.actions.setLoading(true));
    dispatch(LocationsSlice.actions.setError(""));

    try {
      const response = await api.get<LocationsResponse>("/locations", {
        params: {
          search: search || undefined,
          page,
          limit,
        },
      });
      dispatch(LocationsSlice.actions.setLocations(response.data.data.rows));
      dispatch(LocationsSlice.actions.setTotalCount(response.data.data.count));
    } catch (error) {
      console.error("Failed to load locations", error);
      dispatch(
        LocationsSlice.actions.setError(
          "Unable to load locations. Please try again.",
        ),
      );
      dispatch(LocationsSlice.actions.setLocations([]));
      dispatch(LocationsSlice.actions.setTotalCount(0));
    } finally {
      dispatch(LocationsSlice.actions.setLoading(false));
    }
  };

export const fetchLocationByIdRdx =
  (locationId: string) => async (dispatch: any) => {
    dispatch(LocationsSlice.actions.setLoadingLocationId(locationId));
    dispatch(LocationsSlice.actions.setError(""));

    try {
      const response = await api.get<LocationByIdResponse>(
        `/location/${locationId}`,
      );
      dispatch(LocationsSlice.actions.setSelectedLocation(response.data.data));
      return response.data;
    } catch (error) {
      console.error("Failed to fetch location by id", error);
      dispatch(
        LocationsSlice.actions.setError(
          "Unable to open location details. Please try again.",
        ),
      );
      dispatch(LocationsSlice.actions.setSelectedLocation(null));
      throw error;
    } finally {
      dispatch(LocationsSlice.actions.setLoadingLocationId(null));
    }
  };

export const saveLocationRdx =
  (payload: SaveLocationPayload) => async (dispatch: any) => {
    dispatch(LocationsSlice.actions.setSaving(true));
    dispatch(LocationsSlice.actions.setSaveError(""));

    try {
      let response;
      if (payload.mode === "add") {
        response = await api.post<SaveLocationResponse>("/location", {
          name: payload.data.name,
          latitude: payload.data.latitude,
          longitude: payload.data.longitude,
          google_maps_url: payload.data.google_maps_url,
        });
      } else {
        response = await api.put<SaveLocationResponse>("/location", {
          location_id: payload.data.location_id,
          name: payload.data.name,
          latitude: payload.data.latitude,
          longitude: payload.data.longitude,
          google_maps_url: payload.data.google_maps_url,
          status: payload.data.status,
        });
      }

      return response.data;
    } catch (error) {
      console.error("Failed to save location", error);
      dispatch(
        LocationsSlice.actions.setSaveError(
          "Unable to save location. Please check values and try again.",
        ),
      );
      throw error;
    } finally {
      dispatch(LocationsSlice.actions.setSaving(false));
    }
  };

export const LocationsActions = LocationsSlice.actions;

interface SaveLocationResponse {
  success: boolean;
  data: Location;
  message: string;
}

export default LocationsSlice;
