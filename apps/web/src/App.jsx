import { HashRouter, Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import Catalog from "./pages/Catalog";
import Watch from "./pages/Watch";
import Login from "./pages/Login";
import Upload from "./pages/Upload";
import ProfilePicker from "./pages/ProfilePicker";
import SeriesDetail from "./pages/SeriesDetail";
import Admin from "./pages/Admin";
import { AuthProvider, useAuth } from "./api/AuthContext";

function Nav() {
  const { token, role, logout } = useAuth();
  const location = useLocation();
  const hideNav = ["/login", "/profiles"].includes(location.pathname);
  if (hideNav) return null;

  return (
    <nav>
      <Link to="/">Catalog</Link>
      {(role === "uploader" || role === "admin") && <> | <Link to="/upload">Upload</Link></>}
      {" | "}
      {token ? (
        <button onClick={() => { logout(); window.location.href = "/#/login"; }}>Logout</button>
      ) : (
        <Link to="/login">Login</Link>
      )}
      {role === "admin" && <> | <Link to="/admin">Admin</Link></>}
    </nav>
  );
}

function RequireProfile({ children }) {
  const { token, profileToken } = useAuth()
  if(!token) return <Navigate to="/login" replace/>
  if(!profileToken) return <Navigate to="/profiles" replace />
  return children 
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Nav />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<RequireProfile><Admin /></RequireProfile>} />
          <Route path="/profiles" element={<ProfilePicker />} />
          <Route path="/" element={<RequireProfile><Catalog /></RequireProfile>} />
          <Route path="/watch/:id" element={<RequireProfile><Watch /></RequireProfile>} />
          <Route path="/upload" element={<RequireProfile><Upload /></RequireProfile>} />
          <Route path="/series/:id" element={<RequireProfile><SeriesDetail /></RequireProfile>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}