import { createSlice } from "@reduxjs/toolkit";
import api from "../utils/api";

const initialState = {};

export const LoginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {},
});

export const firebaseLoginRdx = (idToken: string) => async () => {
  try {
    const response = await api.post("/auth/firebase-login", {
      id_token: idToken,
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to sign in");
  }
};
