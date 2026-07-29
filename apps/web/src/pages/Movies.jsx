import React, { useEffect, useState } from 'react';
import { getContent, getCategories } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import ContentRow from '../components/ContentRow';
import '../styles/Catalog.module.css';

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
    <div className="page-container padded">
      <h1 className="page-heading">Movies</h1>

      <div className="category-filter-chips" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          className={`chip ${!selectedCategory ? 'active' : ''}`}
          onClick={() => setSelectedCategory('')}
          style={chipStyle(!selectedCategory)}
        >
          All Movies
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`chip ${selectedCategory === c.name ? 'active' : ''}`}
            onClick={() => setSelectedCategory(c.name)}
            style={chipStyle(selectedCategory === c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading movies...</div>
      ) : selectedCategory ? (
        <div className="poster-grid">
          {movies.map((movie) => (
            <PosterCard key={movie.id} item={{ ...movie, type: 'movie' }} />
          ))}
        </div>
      ) : moviesByCategory.length > 0 ? (
        <div>
          {moviesByCategory.map((group) => (
            <ContentRow
              key={group.id}
              title={group.name}
              items={group.items}
              seeAllLink="#"
            />
          ))}
        </div>
      ) : (
        <div className="poster-grid">
          {movies.map((movie) => (
            <PosterCard key={movie.id} item={{ ...movie, type: 'movie' }} />
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle = (active) => ({
  padding: '8px 16px',
  borderRadius: '20px',
  border: active ? '1px solid #F2A93B' : '1px solid rgba(255,255,255,0.12)',
  background: active ? 'rgba(242,169,59,0.15)' : 'rgba(23,27,36,0.7)',
  color: active ? '#F2A93B' : '#8A8F98',
  cursor: 'pointer',
  fontWeight: active ? '700' : '500',
  fontSize: '13px',
});
