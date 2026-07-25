import { HashRouter, Routes, Route, Link } from "react-router-dom";
import Catalog from "./pages/Catalog";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import { AuthProvider, useAuth } from "./api/AuthContext";

function Nav() {
  const { token, role, logout } = useAuth();
  return (
    <nav>
      <Link to="/">Catalog</Link>  
      {role === "uploader" && <> | <Link to="/upload">Upload</Link></>}
      {" | "}
      {token ? (
        <button onClick={() => {logout(); window.location.href = "/#/login"; }}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/login" element={<Login />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}