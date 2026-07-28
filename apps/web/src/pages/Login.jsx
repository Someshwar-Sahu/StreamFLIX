import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../api/AuthContext";
import styles from "../styles/Login.module.css";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { token, profileToken, saveToken } = useAuth();

  useEffect(() => {
    if (profileToken) navigate("/", { replace: true });
    else if (token) navigate("/profiles", { replace: true });
  }, [token, profileToken, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const t = mode === "login" ? await login(email, password) : await register(email, username, password);
      saveToken(t);
      navigate("/profiles", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  }

  return (
    <div className={styles.stage}>
      <div className={styles.card}>
        <div className={styles.logo}>StreamFlix</div>
        <h1 className={styles.heading}>{mode === "login" ? "Sign In" : "Create Account"}</h1>
        <form onSubmit={handleSubmit}>
          <input className={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {mode === "register" && (
            <input className={styles.input} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          )}
          <input className={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className={styles.submit} type="submit">{mode === "login" ? "Sign In" : "Register"}</button>
        </form>
        {error && <p className={styles.error}>{error}</p>}
        <button className={styles.switch} onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}