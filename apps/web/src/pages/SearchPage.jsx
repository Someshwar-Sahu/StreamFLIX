import React, { useState, useEffect } from 'react';
import { getContent } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import '../styles/SearchPage.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getContent({ q: query });
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="page-container">
      <div className="search-hero">
        <h1 className="search-title">Discover Movies & Series</h1>
        <div className="search-input-wrap">
          <span className="material-symbols-outlined search-input-icon">search</span>
          <input
            type="text"
            className="search-hero-input"
            placeholder="Search by title, director, category, or cast..."
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
      </div>

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      )}

      {!loading && query && results.length === 0 && (
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
      )}

      {!loading && results.length > 0 && (
        <div>
          <div style={{ marginBottom: 20, color: 'var(--text-secondary)', fontSize: 14 }}>
            Found <strong style={{ color: '#ffffff' }}>{results.length}</strong> titles matching "{query}"
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
            {results.map((item) => (
              <PosterCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
