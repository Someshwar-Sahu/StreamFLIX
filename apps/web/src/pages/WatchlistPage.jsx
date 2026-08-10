import React, { useEffect, useState } from 'react';
import { getWatchlist, toggleWatchlist, toggleSeriesWatchlist } from '../api/interactions';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { useToast } from '../context/ToastContext';
import '../styles/WatchlistPage.css';

export default function WatchlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('recent');
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const data = await getWatchlist();
        setItems(data || []);
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
      showToast(`Removed "${item.title}" from your list.`, 'info');
    } catch (err) {
      showToast('Failed to update watchlist', 'error');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortBy === 'alpha') {
      return (a.title || '').localeCompare(b.title || '');
    }
    return 0; // Default recent
  });

  return (
    <div className="page-container">
      <div className="watchlist-header">
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            My List
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {items.length} titles saved to watch anytime.
          </p>
        </div>

        {items.length > 0 && (
          <div className="watchlist-sort-group">
            <button
              className={`sort-pill ${sortBy === 'recent' ? 'active' : ''}`}
              onClick={() => setSortBy('recent')}
            >
              Recently Added
            </button>
            <button
              className={`sort-pill ${sortBy === 'alpha' ? 'active' : ''}`}
              onClick={() => setSortBy('alpha')}
            >
              Alphabetical
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : sortedItems.length === 0 ? (
        <div style={{ padding: '80px 20px', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--bg-surface-low)', borderRadius: 16 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 56, color: 'var(--primary-red)', marginBottom: 16 }}>
            bookmark_border
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#ffffff', marginBottom: 8 }}>
            Your watchlist is empty
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            Explore movies and series, and click "+ Add to Watchlist" to save your favorite titles here.
          </p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {sortedItems.map((item) => {
            const posterUrl = resolveMediaUrl(item.poster_url || item.thumbnail_url);
            const to = item.type === 'series' ? `/series/${item.id}` : `/watch/${item.id}`;

            return (
              <div key={`${item.type}-${item.id}`} className="watchlist-card-wrap">
                <PosterCard to={to} title={item.title} posterUrl={posterUrl} item={item} />
                <button
                  className="watchlist-remove-btn"
                  onClick={() => handleRemove(item)}
                  title="Remove from Watchlist"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
