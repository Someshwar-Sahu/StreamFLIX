import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, verifyOtp, resendOtp } from "../api/auth";
import api from "../api/client";
import { useAuth } from "../api/AuthContext";
import { useToast } from "../context/ToastContext";
import StreamFlixLogo from "../components/StreamFlixLogo";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify" | "forgot" | "reset"
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const navigate = useNavigate();
  const { token, profileToken, saveToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    if (profileToken) navigate("/", { replace: true });
    else if (token) navigate("/profiles", { replace: true });
  }, [token, profileToken, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setHasError(false);
    setLoading(true);

    try {
      if (mode === "login") {
        const t = await login(email, password);
        saveToken(t);
        showToast("Signed in successfully!", "success");
        navigate("/profiles", { replace: true });
      } else if (mode === "register") {
        const res = await register(email, username, password);
        showToast(res.message || "Security code sent to your email!", "info");
        setMode("verify");
      } else if (mode === "verify") {
        const t = await verifyOtp(email, otpCode);
        saveToken(t);
        showToast("Account verified successfully! Welcome to StreamFlix.", "success");
        navigate("/profiles", { replace: true });
      } else if (mode === "forgot") {
        const formData = new FormData();
        formData.append("email", email.trim());
        await api.post("/auth/forgot-password", formData);
        showToast(`Verification code sent to ${email}`, "info");
        setMode("reset");
      } else if (mode === "reset") {
        const formData = new FormData();
        formData.append("email", email.trim());
        formData.append("code", otpCode.trim());
        formData.append("new_password", newPassword);
        await api.post("/auth/reset-password", formData);
        showToast("Password reset successfully! Please sign in with your new password.", "success");
        setPassword("");
        setMode("login");
      }
    } catch (err) {
      setHasError(true);
      showToast(err.response?.data?.detail || "Authentication error occurred", "error");
      setTimeout(() => setHasError(false), 600);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      const res = await resendOtp(email);
      showToast(res.message || "New security code sent to your email.", "info");
    } catch (err) {
      showToast(err.response?.data?.detail || "Failed to resend code", "error");
    }
  }

  return (
    <div className={styles.stage}>
      <div className={`${styles.card} ${hasError ? 'shake-error' : ''}`}>
        <div className={styles.logoWrap}>
          <StreamFlixLogo size={38} showText={true} />
        </div>

        <h1 className={styles.heading}>
          {mode === "login"
            ? "Sign In"
            : mode === "register"
            ? "Create Account"
            : mode === "verify"
            ? "Verify Email"
            : mode === "forgot"
            ? "Reset Password"
            : "Set New Password"}
        </h1>

        {mode === "forgot" && (
          <p className={styles.subHeading}>
            Enter your registered email address and we will send you a 6-digit security code to reset your password.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          {(mode === "login" || mode === "register" || mode === "forgot" || mode === "reset") && (
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={mode === "reset"}
            />
          )}

          {mode === "register" && (
            <input
              className={styles.input}
              placeholder="Username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          {(mode === "login" || mode === "register") && (
            <>
              <input
                className={styles.input}
                type="password"
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {mode === "login" && (
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => {
                    setMode("forgot");
                  }}
                >
                  Forgot Password?
                </button>
              )}
            </>
          )}

          {mode === "verify" && (
            <div style={{ marginBottom: 20, textAlign: "center" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 16 }}>
                Enter the 6-digit code sent to <strong style={{ color: "#ffffff" }}>{email}</strong>
              </p>
              <input
                className={styles.input}
                style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700, color: "var(--primary-red)" }}
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleResend}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", marginTop: 8 }}
              >
                Didn't receive code? <span style={{ color: "var(--primary-red)", textDecoration: "underline" }}>Resend</span>
              </button>
            </div>
          )}

          {mode === "reset" && (
            <>
              <input
                className={styles.input}
                style={{ textAlign: "center", fontSize: 20, letterSpacing: 6, fontWeight: 700 }}
                placeholder="6-digit reset code"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                required
                autoFocus
              />
              <input
                className={styles.input}
                type="password"
                placeholder="New Password (min 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </>
          )}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Sign In"
              : mode === "register"
              ? "Send Security Code"
              : mode === "verify"
              ? "Verify & Start Streaming"
              : mode === "forgot"
              ? "Send Reset Code"
              : "Update Password & Sign In"}
          </button>
        </form>

        {mode === "login" && (
          <button className={styles.switch} onClick={() => setMode("register")}>
            New to StreamFlix? <strong>Sign up now.</strong>
          </button>
        )}

        {mode === "register" && (
          <button className={styles.switch} onClick={() => setMode("login")}>
            Already have an account? <strong>Sign in.</strong>
          </button>
        )}

        {(mode === "forgot" || mode === "reset") && (
          <button className={styles.switch} onClick={() => setMode("login")}>
            Remembered your password? <strong>Back to Sign In</strong>
          </button>
        )}
      </div>
    </div>
  );
}