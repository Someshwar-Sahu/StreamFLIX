import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { getWatchHistory } from '../api/interactions';
import ContentRow from '../components/ContentRow';
import ProfileModal from '../components/ProfileModal';
import '../styles/MySpace.css';

export default function MySpace() {
  const { currentProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const historyData = await getWatchHistory().catch(() => []);
        setHistory(historyData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const profileName = currentProfile?.name || 'User';
  const rawAvatar = currentProfile?.avatar_url;
  const avatarUrl = rawAvatar && (rawAvatar.startsWith('/avatars') || rawAvatar.startsWith('http'))
    ? rawAvatar
    : '/avatars/avatar-1.svg';
  const initial = profileName[0]?.toUpperCase() || 'U';

  return (
    <div className="page-container">
      <div className="myspace-header-card">
        <div className="myspace-avatar-wrap">
          <img
            src={avatarUrl}
            alt=""
            className="myspace-avatar-img"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fb = e.currentTarget.nextSibling;
              if (fb) fb.style.display = 'flex';
            }}
          />
          <div className="myspace-avatar-circle" style={{ display: 'none' }}>
            {initial}
          </div>
        </div>

        <div className="myspace-info">
          <h1 className="myspace-title">{profileName}'s Space</h1>
          <div className="myspace-quick-pills">
            <Link to="/watchlist" className="myspace-pill">🔖 Saved Watchlist</Link>
            <Link to="/history" className="myspace-pill">🕒 Watch History</Link>
            <button className="myspace-pill" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
              ⚙️ Switch or Edit Profile
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading My Space...</div>
      ) : (
        <>
          {history.length > 0 && (
            <ContentRow
              title="Recently Watched"
              items={history}
              isProgressRow={true}
            />
          )}
        </>
      )}

      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
