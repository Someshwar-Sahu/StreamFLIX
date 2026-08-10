import React, { useEffect, useState } from 'react';
import { getContent, getCategories } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import ContentRow from '../components/ContentRow';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [movieList, catList] = await Promise.all([
          getContent(selectedCategory ? { category: selectedCategory } : {}),
          getCategories(),
        ]);
        setMovies(movieList);
        setCategories(catList);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory]);

  const moviesByCategory = categories.map((cat) => ({
    ...cat,
    items: movies.filter((m) => m.category_id === cat.id || m.category === cat.name),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            Feature Movies
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Stream the latest cinematic blockbusters in 4K HDR.
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        <button
          onClick={() => setSelectedCategory('')}
          style={chipStyle(!selectedCategory)}
        >
          All Movies
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.name)}
            style={chipStyle(selectedCategory === c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : selectedCategory ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {movies.map((movie) => (
            <PosterCard key={movie.id} item={{ ...movie, type: 'movie' }} />
          ))}
        </div>
      ) : moviesByCategory.length > 0 ? (
        <div>
          {moviesByCategory.map((group) => (
            <ContentRow key={group.id} title={group.name} items={group.items} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {movies.map((movie) => (
            <PosterCard key={movie.id} item={{ ...movie, type: 'movie' }} />
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle = (active) => ({
  padding: '8px 20px',
  borderRadius: '24px',
  border: active ? '1px solid var(--primary-red)' : '1px solid rgba(255, 255, 255, 0.12)',
  background: active ? 'var(--primary-red)' : 'rgba(26, 28, 28, 0.8)',
  color: active ? '#ffffff' : 'var(--text-secondary)',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontWeight: active ? '700' : '500',
  fontSize: '13px',
  boxShadow: active ? '0 0 14px var(--primary-glow)' : 'none',
  transition: 'all 0.25s ease',
});
