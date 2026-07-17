import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../api/AuthContext";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { saveToken } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const token = mode === "login" ? await login(email, password) : await register(email, username, password);
      saveToken(token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  }

  return (
    <div>
      <h1>{mode === "login" ? "Login" : "Register"}</h1>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        {mode === "register" && (
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        )}
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
        Switch to {mode === "login" ? "Register" : "Login"}
      </button>
    </div>
  );
}