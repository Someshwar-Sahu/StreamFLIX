import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import ProfileModal from "./ProfileModal";
import StreamFlixLogo from "./StreamFlixLogo";
import { getValidAvatarUrl } from "../utils/avatar";
import { useToast } from "../context/ToastContext";
import '../styles/Navigation.css';

export default function Navigation() {
  const { currentProfile, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleState = (e) => setIsUploading(!!e.detail?.isUploading);
    window.addEventListener("streamflix:upload-state", handleState);
    return () => window.removeEventListener("streamflix:upload-state", handleState);
  }, []);

  if (location.pathname === "/login" || location.pathname === "/profiles") {
    return null;
  }

  const navLinks = [
    { path: '/', label: 'Home' },
    { path: '/movies', label: 'Movies' },
    { path: '/series', label: 'Series' },
    { path: '/search', label: 'Search' },
    { path: '/myspace', label: 'My Space' },
  ];

  if (role === 'uploader' || role === 'admin') {
    navLinks.push({ path: '/categories', label: 'Categories' });
    navLinks.push({ path: '/upload', label: 'Upload' });
  }

  if (role === 'admin') {
    navLinks.push({ path: '/admin', label: 'Admin' });
  }

  const handleNavClick = (e, path) => {
    if (isUploading && location.pathname !== path) {
      e.preventDefault();
      e.stopPropagation();
      showToast("Video upload in progress! Please cancel upload before navigating.", "warning", "Upload Active");
      return false;
    }
  };

  const avatarUrl = getValidAvatarUrl(currentProfile?.avatar_url, currentProfile?.id || 1);

  return (
    <>
      <header className="nav-header">
        <div className="nav-left">
          <Link
            to="/"
            className="nav-logo"
            onClick={(e) => handleNavClick(e, '/')}
          >
            <StreamFlixLogo size={32} showText={true} />
          </Link>

          <nav className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={(e) => handleNavClick(e, link.path)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          <button
            className="nav-icon-btn"
            title="Search Movies & Series"
            onClick={() => navigate('/search')}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>search</span>
          </button>

          <button
            className="nav-icon-btn"
            title="Notifications"
            onClick={() => showToast("You're all caught up! No new notifications.", "info", "Notifications")}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>notifications</span>
            <span className="notification-dot" />
          </button>

          {currentProfile && (
            <button
              onClick={(e) => {
                if (handleNavClick(e, '#profile') === false) return;
                setIsProfileModalOpen(true);
              }}
              className="nav-profile-badge"
              title="Switch or Edit Profile"
            >
              <div className="profile-avatar-frame">
                <img
                  src={avatarUrl}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.src = getValidAvatarUrl(null, currentProfile?.id || 1);
                  }}
                />
              </div>
              <span className="profile-name">{currentProfile.name}</span>
            </button>
          )}

          <button
            onClick={(e) => {
              if (handleNavClick(e, '#logout') === false) return;
              logout();
              showToast("Signed out successfully.", "info");
            }}
            className="nav-logout-btn"
          >
            Logout
          </button>
        </div>
      </header>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}