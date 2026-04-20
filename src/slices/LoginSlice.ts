import { createSlice } from "@reduxjs/toolkit";
import api from "../utils/api";

const initialState = {};

export const LoginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {},
});

export const sendOtpRdx = (phone: string) => async () => {
  try {
    const response = await api.post("/send-otp-login", { phone });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to send OTP");
  }
};

export const verifyOtpRdx = (phone: string, otp: string) => async () => {
  try {
    const response = await api.post("/verify-otp-login", { phone, otp });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to verify OTP");
  }
};
