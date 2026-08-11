import React, { useState, useEffect } from 'react';
import { getContent, getTrending } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import '../styles/SearchPage.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [topSearches, setTopSearches] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Top Searches and Recommended items
    getTrending().then((data) => {
      setTopSearches(data.overall || []);
      setRecommended(data.movies || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getContent({ q: query });
        setResults(data || []);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const shortcutGenres = ['Action', 'Comedy', 'Horror', 'Sci-Fi', 'Documentary', 'Anime'];

  return (
    <div className="page-container">
      {/* Search Header matching Image 6 */}
      <div style={{ maxWidth: 760, margin: '0 auto 36px auto', textAlign: 'center' }}>
        <div className="search-input-wrap" style={{ marginBottom: 20 }}>
          <span className="material-symbols-outlined search-input-icon">search</span>
          <input
            type="text"
            className="search-hero-input"
            placeholder="Search movies, TV shows, or genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button className="search-clear-btn" onClick={() => setQuery('')} title="Clear search">
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          )}
        </div>

        {/* Quick Genre Pill Shortcuts */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          {shortcutGenres.map((genre) => (
            <button
              key={genre}
              onClick={() => setQuery(genre)}
              style={{
                padding: '6px 18px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: query === genre ? 'var(--primary-red)' : 'var(--bg-surface-low)',
                color: query === genre ? '#ffffff' : 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      )}

      {/* Query Search Results */}
      {!loading && query && (
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#ffffff', marginBottom: 20 }}>
            Results for "{query}"
          </h2>
          {results.length === 0 ? (
            <div className="empty-search-box">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--primary-red)', marginBottom: 12 }}>
                search_off
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: '#ffffff', marginBottom: 6 }}>
                No matches found for "{query}"
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                Try searching for another keyword, genre, or title.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
              {results.map((item) => (
                <PosterCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Default Discovery: Top Searches & Recommended for You matching Image 6 */}
      {!query && (
        <>
          {topSearches.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#ffffff', marginBottom: 20 }}>
                Top Searches
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                {topSearches.slice(0, 6).map((item) => (
                  <PosterCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {recommended.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: '#ffffff', marginBottom: 20 }}>
                Recommended for You
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                {recommended.slice(0, 8).map((item) => (
                  <PosterCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
