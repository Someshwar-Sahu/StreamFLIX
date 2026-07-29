import React, { useEffect, useState } from 'react';
import { getWatchlist, toggleWatchlist, toggleSeriesWatchlist } from '../api/interactions';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import '../styles/WatchlistPage.css';

export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const data = await getWatchlist();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    fetchWatchlist();
  }, []);

  const handleRemove = async (item) => {
    try {
      if (item.type === 'series') {
        await toggleSeriesWatchlist(item.id, true);
      } else {
        await toggleWatchlist(item.id, true);
      }
      setItems((prev) => prev.filter((i) => i.id !== item.id || i.type !== item.type));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading-spinner">Loading Watchlist...</div></div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-heading">My Saved Watchlist</h1>

      {items.length === 0 ? (
        <div style={{ padding: '60px 0', color: '#8A8F98', textAlign: 'center' }}>
          Your watchlist is empty. Add movies or series to watch later!
        </div>
      ) : (
        <div className="watchlist-grid">
          {items.map((item) => {
            const posterUrl = resolveMediaUrl(item.poster_url);
            const to = item.type === 'series' ? `/series/${item.id}` : `/watch/${item.id}`;

            return (
              <div key={`${item.type}-${item.id}`} className="watchlist-card-wrap">
                <PosterCard to={to} title={item.title} posterUrl={posterUrl} />
                <button
                  className="watchlist-remove-btn"
                  onClick={() => handleRemove(item)}
                >
                  ✕ Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
