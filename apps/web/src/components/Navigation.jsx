import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../api/AuthContext";
import ProfileModal from "./ProfileModal";
import StreamFlixLogo from "./StreamFlixLogo";
import { getValidAvatarUrl } from "../utils/avatar";
import '../styles/Navigation.css';

export default function Navigation() {
    const { currentProfile, role, logout } = useAuth();
    const location = useLocation();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

    const avatarUrl = getValidAvatarUrl(currentProfile?.avatar_url, currentProfile?.id || 1);

    return (
        <>
            <header className="nav-header">
                <div className="nav-left">
                    <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
                        <StreamFlixLogo size={36} showText={true} />
                    </Link>

                    <nav className="nav-links">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="nav-right">
                    {currentProfile && (
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="nav-profile-badge"
                            title="Switch or Edit Profile"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 10 }}
                        >
                            <div style={{ position: 'relative', width: 32, height: 32, borderRadius: 16, overflow: 'hidden', border: '2px solid #F2A93B', background: '#171B24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                    <button onClick={logout} className="nav-logout-btn">
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