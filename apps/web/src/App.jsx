import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './api/AuthContext';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Movies from './pages/Movies';
import SeriesPage from './pages/SeriesPage';
import Categories from './pages/Categories';
import SearchPage from './pages/SearchPage';
import Watch from './pages/Watch';
import MySpace from './pages/MySpace';
import HistoryPage from './pages/HistoryPage';
import SeriesDetail from './pages/SeriesDetail';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import WatchlistPage from './pages/WatchlistPage';
import SettingsPage from './pages/SettingsPage';
import Login from './pages/Login';
import ProfilePicker from './pages/ProfilePicker';

function ProtectedRoute({ children }) {
  const { token, profileToken } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (!profileToken) {
    return <Navigate to="/profiles" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { token, profileToken } = useAuth();
  if (token && profileToken) {
    return <Navigate to="/" replace />;
  }
  if (token && !profileToken) {
    return <Navigate to="/profiles" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/profiles" element={<ProfilePicker />} />

          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/myspace" element={<ProtectedRoute><MySpace /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/watchlist" element={<ProtectedRoute><WatchlistPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/movies" element={<ProtectedRoute><Movies /></ProtectedRoute>} />
          <Route path="/series" element={<ProtectedRoute><SeriesPage /></ProtectedRoute>} />
          <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/watch/:id" element={<ProtectedRoute><Watch /></ProtectedRoute>} />
          <Route path="/series/:id" element={<ProtectedRoute><SeriesDetail /></ProtectedRoute>} />
          <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
