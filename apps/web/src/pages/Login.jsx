import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register, verifyOtp, resendOtp } from "../api/auth";
import { useAuth } from "../api/AuthContext";
import StreamFlixLogo from "../components/StreamFlixLogo";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "register" | "verify"
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token, profileToken, saveToken } = useAuth();

  useEffect(() => {
    if (profileToken) navigate("/", { replace: true });
    else if (token) navigate("/profiles", { replace: true });
  }, [token, profileToken, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "login") {
        const t = await login(email, password);
        saveToken(t);
        navigate("/profiles", { replace: true });
      } else if (mode === "register") {
        const res = await register(email, username, password);
        setInfo(res.message || "Security code sent to your email!");
        setMode("verify");
      } else if (mode === "verify") {
        const t = await verifyOtp(email, otpCode);
        saveToken(t);
        navigate("/profiles", { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setInfo("");
    try {
      const res = await resendOtp(email);
      setInfo(res.message || "A new code has been sent to your email");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to resend code");
    }
  }

  return (
    <div className={styles.stage}>
      <div className={styles.card}>
        <div style={{ marginBottom: 24 }}>
          <StreamFlixLogo size={42} showText={true} />
        </div>

        <h1 className={styles.heading}>
          {mode === "login" ? "Sign In" : mode === "register" ? "Create Account" : "Verify Email"}
        </h1>

        {info && <p style={{ color: '#F2A93B', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{info}</p>}

        <form onSubmit={handleSubmit}>
          {mode !== "verify" && (
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          )}

          {mode === "register" && (
            <input
              className={styles.input}
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          {mode !== "verify" && (
            <input
              className={styles.input}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}

          {mode === "verify" && (
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <p style={{ color: '#8A8F98', fontSize: 14, marginBottom: 16 }}>
                Enter the 6-digit code sent to <strong style={{ color: '#F5F5F0' }}>{email}</strong>
              </p>
              <input
                className={styles.input}
                style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700, color: '#F2A93B' }}
                placeholder="000000"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={handleResend}
                style={{ background: 'none', border: 'none', color: '#8A8F98', fontSize: 13, cursor: 'pointer', marginTop: 8 }}
              >
                Didn't receive code? <span style={{ color: '#F2A93B', textDecoration: 'underline' }}>Resend</span>
              </button>
            </div>
          )}

          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : mode === "register" ? "Send Security Code" : "Verify & Start Streaming"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        {mode !== "verify" && (
          <button className={styles.switch} onClick={() => setMode(mode === "login" ? "register" : "login")}>
            {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        )}

        {mode === "verify" && (
          <button className={styles.switch} onClick={() => setMode("register")}>
            ← Change email or register again
          </button>
        )}
      </div>
    </div>
  );
}