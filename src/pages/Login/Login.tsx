import { useState, useRef, useEffect } from "react";
import useLogin from "../../hooks/useLogin";
import { Phone, Shield, ArrowRight, Stethoscope } from "lucide-react";
import "./Login.css";

const OTP_LENGTH = 6;

const Login = () => {
  const { phone, setPhone, loading, error, setError, sendOtp, verifyOtp } =
    useLogin();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setPhone(formatPhone(e.target.value));
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    try {
      await sendOtp(digits);
      setStep("otp");
      setCountdown(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch {
      // error is set by the hook
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    setError("");
    if (value && !/^\d$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIdx]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setError("Please enter the complete verification code");
      return;
    }
    try {
      const digits = phone.replace(/\D/g, "");
      await verifyOtp(digits, code);
    } catch {
      // error is set by the hook
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      const digits = phone.replace(/\D/g, "");
      await sendOtp(digits);
      setCountdown(30);
      setOtp(Array(OTP_LENGTH).fill(""));
      otpRefs.current[0]?.focus();
    } catch {
      // error is set by the hook
    }
  };

  const handleBack = () => {
    setStep("phone");
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
  };

  return (
    <div className="login-page">
      {/* Decorative background */}
      <div className="login-bg">
        <div className="login-bg-circle login-bg-circle--1" />
        <div className="login-bg-circle login-bg-circle--2" />
        <div className="login-bg-circle login-bg-circle--3" />
      </div>

      <div className="login-container">
        {/* Left branding panel */}
        <div className="login-brand">
          <div className="login-brand-content">
            <div className="login-brand-icon">
              <Stethoscope size={36} />
            </div>
            <h1 className="login-brand-title">DocPath</h1>
            <p className="login-brand-subtitle">Clinic Management System</p>
            <div className="login-brand-features">
              <div className="login-brand-feature">
                <span className="login-feature-dot" />
                Appointment scheduling
              </div>
              <div className="login-brand-feature">
                <span className="login-feature-dot" />
                Patient records management
              </div>
              <div className="login-brand-feature">
                <span className="login-feature-dot" />
                Town visit coordination
              </div>
            </div>
          </div>
          <p className="login-brand-footer">
            Trusted by healthcare professionals
          </p>
        </div>

        {/* Right form panel */}
        <div className="login-form-panel">
          <div className="login-form-wrapper">
            <div className="login-form-header">
              <h2 className="login-form-title">
                {step === "phone" ? "Welcome back" : "Verify your number"}
              </h2>
              <p className="login-form-desc">
                {step === "phone"
                  ? "Enter your phone number to sign in"
                  : `We sent a code to +91 ${phone}`}
              </p>
            </div>

            {step === "phone" ? (
              <form onSubmit={handlePhoneSubmit} className="login-form">
                <div className="login-phone-field">
                  <label className="form-label" htmlFor="phone">
                    Phone Number
                  </label>
                  <div className="login-phone-input-wrap">
                    <span className="login-phone-prefix">
                      <Phone size={16} />
                      +91
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      className="form-input login-phone-input"
                      placeholder="99999 99999"
                      value={phone}
                      onChange={handlePhoneChange}
                      autoFocus
                      autoComplete="tel"
                      inputMode="numeric"
                    />
                  </div>
                  {error && <span className="form-error-msg">{error}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                  disabled={loading || phone.replace(/\D/g, "").length < 10}
                >
                  {loading ? (
                    <span className="login-spinner" />
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="login-form">
                <div className="login-otp-field">
                  <label className="form-label">Verification Code</label>
                  <div className="login-otp-inputs" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className={`login-otp-box ${digit ? "login-otp-box--filled" : ""}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>
                  {error && <span className="form-error-msg">{error}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary login-submit-btn"
                  disabled={loading || otp.join("").length < OTP_LENGTH}
                >
                  {loading ? (
                    <span className="login-spinner" />
                  ) : (
                    <>
                      <Shield size={16} />
                      Verify &amp; Sign in
                    </>
                  )}
                </button>

                <div className="login-otp-actions">
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={handleBack}
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    className="login-link-btn"
                    onClick={handleResend}
                    disabled={countdown > 0}
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            <p className="login-footer-text">
              By continuing, you agree to the Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
