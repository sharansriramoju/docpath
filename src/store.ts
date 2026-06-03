import { configureStore } from "@reduxjs/toolkit";
import { LoginSlice } from "./slices/LoginSlice";
import { LocationsSlice } from "./slices/LocationsSlice";
import DoctorRoutinesSlice from "./slices/DoctorRoutinesSlice";

const store = configureStore({
  reducer: {
    login: LoginSlice.reducer,
    locations: LocationsSlice.reducer,
    doctorRoutine: DoctorRoutinesSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;
