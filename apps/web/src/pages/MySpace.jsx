import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { getWatchHistory, getWatchlist } from '../api/interactions';
import ContentRow from '../components/ContentRow';
import PosterCard from '../components/PosterCard';
import ProfileModal from '../components/ProfileModal';
import { getValidAvatarUrl } from '../utils/avatar';

export default function MySpace() {
  const { currentProfile } = useAuth();
  const [history, setHistory] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [historyData, watchlistData] = await Promise.all([
          getWatchHistory().catch(() => []),
          getWatchlist().catch(() => []),
        ]);
        setHistory(historyData);
        setWatchlist(watchlistData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const profileName = currentProfile?.name || 'User';
  const avatarUrl = getValidAvatarUrl(currentProfile?.avatar_url, currentProfile?.id || 1);

  return (
    <div className="page-container">
      {/* Profile Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '28px 36px',
          background: 'var(--bg-surface-low)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          marginBottom: 40,
          boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '3px solid var(--primary-red)',
            boxShadow: '0 0 20px var(--primary-glow)',
            flexShrink: 0,
          }}
        >
          <img
            src={avatarUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.currentTarget.src = getValidAvatarUrl(null, currentProfile?.id || 1);
            }}
          />
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#ffffff', margin: 0 }}>
            {profileName}'s Cinema Space
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {watchlist.length} saved titles • {history.length} in-progress & watched
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link
            to="/watchlist"
            style={{
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>bookmark</span>
            My List
          </Link>

          <Link
            to="/history"
            style={{
              padding: '10px 20px',
              borderRadius: 20,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
            History
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 20px',
              borderRadius: 20,
              background: 'var(--primary-red)',
              border: 'none',
              color: '#ffffff',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px var(--primary-glow)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>manage_accounts</span>
            Switch Profile
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <>
          {history.length > 0 && (
            <ContentRow
              title="Continue Watching"
              items={history}
              isProgressRow={true}
            />
          )}

          {watchlist.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#ffffff' }}>
                  Saved to My List
                </h2>
                <Link to="/watchlist" style={{ color: 'var(--text-secondary)', fontSize: 13, textDecoration: 'none' }}>
                  Manage List ›
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                {watchlist.slice(0, 10).map((item) => (
                  <PosterCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
