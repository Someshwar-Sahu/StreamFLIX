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
        setHistory(data);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="page-container"><div className="loading-spinner">Loading watch history...</div></div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-heading">Watch History</h1>

      {history.length === 0 ? (
        <div style={{ padding: '60px 0', color: '#8A8F98', textAlign: 'center' }}>
          No watch history yet. Start watching movies or series!
        </div>
      ) : (
        <div className="history-grid">
          {history.map((item) => {
            const title = item.title || `Content #${item.content_id}`;
            const posterUrl = resolveMediaUrl(item.poster_url || item.thumbnail_url);
            const dateStr = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : '';
            const progress = item.progress_seconds || 0;
            const duration = item.duration_seconds || 0;
            const progressPct = duration > 0 ? Math.min(Math.round((progress / duration) * 100), 100) : 0;

            return (
              <div key={item.content_id || item.id} className="history-card">
                <div className="history-thumb-wrap">
                  {posterUrl ? (
                    <img src={posterUrl} alt={title} className="history-thumb-img" />
                  ) : (
                    <span>{title[0]}</span>
                  )}
                </div>

                <div className="history-card-body">
                  <h3 className="history-card-title">{title}</h3>
                  <div className="history-card-meta">
                    <span>Watched on {dateStr}</span>
                    <span>• {Math.floor(progress / 60)}m {progress % 60}s</span>
                  </div>

                  {progressPct > 0 && (
                    <div className="history-progress-track">
                      <div className="history-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                  )}
                </div>

                <Link to={`/watch/${item.content_id}`} className="history-replay-btn">
                  ▶ Replay
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
