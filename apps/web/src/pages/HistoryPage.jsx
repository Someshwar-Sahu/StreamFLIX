import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWatchHistory } from '../api/interactions';
import { resolveMediaUrl } from '../api/media';
import '../styles/HistoryPage.css';

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getWatchHistory();
        setHistory(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Watch History & Activity
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Jump back into in-progress movies or replay completed stories.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', height: 110, borderRadius: 14 }} />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div style={{ padding: '80px 20px', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-surface-low)', borderRadius: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--primary-red)', marginBottom: 16 }}>
            history
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#ffffff', marginBottom: 8 }}>
            No Watch History Yet
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            Start playing titles from the catalog to track your watch activity and resume spots automatically.
          </p>
        </div>
      ) : (
        <div className="history-grid">
          {history.map((item) => {
            const title = item.title || `Content #${item.content_id}`;
            const posterUrl = resolveMediaUrl(item.thumbnail_url || item.poster_url);
            const dateStr = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : 'Recently';
            const progress = item.progress_seconds || 0;
            const duration = item.duration_seconds || 0;
            const progressPct = duration > 0 ? Math.min(Math.round((progress / duration) * 100), 100) : 50;

            return (
              <div key={item.content_id || item.id} className="history-card">
                <div className="history-thumb-wrap">
                  {posterUrl ? (
                    <img src={posterUrl} alt={title} className="history-thumb-img" loading="lazy" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800 }}>
                      {title[0]}
                    </div>
                  )}
                </div>

                <div className="history-card-body">
                  <h3 className="history-card-title">{title}</h3>
                  <div className="history-card-meta">
                    <span>Watched on {dateStr}</span>
                    <span>• {Math.floor(progress / 60)}m {progress % 60}s watched</span>
                  </div>

                  {progressPct > 0 && (
                    <div className="history-progress-track">
                      <div className="history-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                  )}
                </div>

                <Link to={`/watch/${item.content_id || item.id}`} className="history-replay-btn">
                  <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Resume Playback
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
