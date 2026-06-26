import { configureStore } from "@reduxjs/toolkit";
import { LoginSlice } from "./slices/LoginSlice";
import { LocationsSlice } from "./slices/LocationsSlice";
import { UsersSlice } from "./slices/UsersSlice";
import { PatientsSlice } from "./slices/PatientsSlice";
import { AppointmentsSlice } from "./slices/AppointmentsSlice";
import { PatientDiagnosticsSlice } from "./slices/PatientDiagnosticsSlice";
import { RolesSlice } from "./slices/RolesSlice";

const store = configureStore({
  reducer: {
    login: LoginSlice.reducer,
    locations: LocationsSlice.reducer,
    users: UsersSlice.reducer,
    patients: PatientsSlice.reducer,
    appointments: AppointmentsSlice.reducer,
    patientDiagnostics: PatientDiagnosticsSlice.reducer,
    roles: RolesSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export default store;
