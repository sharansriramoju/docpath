import { useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { auth } from "../utils/firebase";
import { firebaseLoginRdx } from "../slices/LoginSlice";
import { useAuth } from "../context/AuthContext";
import type { AppDispatch } from "../store";

const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  const getRecaptcha = useCallback(() => {
    if (!recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return recaptchaRef.current;
  }, []);

  const resetRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  const sendOtp = async (digits: string) => {
    setLoading(true);
    setError("");
    try {
      const verifier = getRecaptcha();
      const fullPhone = `+91${digits}`;
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
      confirmationRef.current = result;
    } catch (err: any) {
      resetRecaptcha();
      const msg =
        err.code === "auth/invalid-phone-number"
          ? "Invalid phone number"
          : err.code === "auth/too-many-requests"
            ? "Too many attempts. Please try again later"
            : err.message || "Failed to send OTP";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (_digits: string, code: string) => {
    setLoading(true);
    setError("");
    try {
      if (!confirmationRef.current) {
        throw new Error("No confirmation result. Please resend the OTP.");
      }
      const credential = await confirmationRef.current.confirm(code);
      const idToken = await credential.user.getIdToken();

      const result: any = await dispatch(firebaseLoginRdx(idToken));
      const userData = result.data;
      const roleName = (userData.role?.name || "doctor").toLowerCase() as
        | "admin"
        | "doctor"
        | "receptionist"
        | "nurse";
      const permissions = (
        userData.role?.permissions ?? userData.permissions ?? []
      ).map((p: any) => ({ action: p.action, subject: p.subject }));
      login({
        id: userData.user_id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: roleName,
        avatar: null,
        permissions,
      });
      navigate("/");
    } catch (err: any) {
      const msg =
        err.code === "auth/invalid-verification-code"
          ? "Invalid verification code"
          : err.code === "auth/code-expired"
            ? "Code expired. Please resend"
            : err.message || "Failed to verify OTP";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { phone, setPhone, loading, error, setError, sendOtp, verifyOtp };
};

export default useLogin;
