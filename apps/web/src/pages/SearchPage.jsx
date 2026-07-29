import React, { useState, useEffect } from 'react';
import { getContent } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import '../styles/SearchPage.css';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

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
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const isActive = isFocused || query.length > 0;

  return (
    <div className="page-container">
      <div className={`search-hero ${isActive ? 'active' : ''}`}>
        <h1 className="search-title">What would you like to watch today?</h1>
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-hero-input"
            placeholder="Search titles, movies, series, or categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
      </div>

      {loading && <div className="loading-spinner" style={{ textAlign: 'center' }}>Searching catalog...</div>}

      {!loading && query && results.length === 0 && (
        <div className="empty-search-box">No titles found matching "{query}". Try another search term!</div>
      )}

      <div className="poster-grid">
        {results.map((item) => (
          <PosterCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
