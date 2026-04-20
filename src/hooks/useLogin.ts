import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { sendOtpRdx, verifyOtpRdx } from "../slices/LoginSlice";
import { useAuth } from "../context/AuthContext";
import type { AppDispatch } from "../store";

const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async (digits: string) => {
    setLoading(true);
    setError("");
    try {
      await dispatch(sendOtpRdx(digits));
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (digits: string, code: string) => {
    setLoading(true);
    setError("");
    try {
      const result: any = await dispatch(verifyOtpRdx(digits, code));
      const userData = result.data;
      const roleName = (userData.role?.name || "doctor").toLowerCase() as
        | "admin"
        | "doctor"
        | "receptionist"
        | "nurse";
      login({
        id: userData.user_id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: roleName,
        avatar: null,
      });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { phone, setPhone, loading, error, setError, sendOtp, verifyOtp };
};

export default useLogin;
