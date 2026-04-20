import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { baseAPIURL } from "../common/constants";

const initialState = {};

export const LoginSlice = createSlice({
  name: "login",
  initialState,
  reducers: {},
});

export const sendOtpRdx = (phone: string) => async () => {
  try {
    const response = await axios.post(
      baseAPIURL + "/send-otp-login",
      { phone },
      { withCredentials: true },
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to send OTP");
  }
};

export const verifyOtpRdx = (phone: string, otp: string) => async () => {
  try {
    const response = await axios.post(
      baseAPIURL + "/verify-otp-login",
      { phone, otp },
      { withCredentials: true },
    );
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message ?? "Failed to verify OTP");
  }
};
