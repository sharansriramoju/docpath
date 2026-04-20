import { configureStore } from "@reduxjs/toolkit";
import { LoginSlice } from "./slices/LoginSlice";

const store = configureStore({
  reducer: {
    login: LoginSlice.reducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export default store;
