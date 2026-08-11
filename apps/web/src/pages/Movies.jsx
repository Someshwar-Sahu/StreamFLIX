import React, { useEffect, useState } from 'react';
import { getContent, getCategories } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { CATEGORY_METADATA } from '../constants/categoryImages';
import styles from '../styles/Movies.module.css';

export default function Movies() {
  const [movies, setMovies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [movieList, catList] = await Promise.all([
          getContent(selectedCategory ? { category: selectedCategory } : {}),
          getCategories(),
        ]);
        setMovies(movieList || []);
        setCategories(catList || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory]);

  const filteredMovies = movies.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (m.title || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const top10List = filteredMovies.slice(0, 10);

  return (
    <div className="page-container">
      {/* Top Filter & Search Bar */}
      <div className={styles.topBar}>
        <div className={styles.searchInputWrap}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>search</span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search movies, genres, or directors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filterPills}>
          <button
            className={`${styles.pill} ${!selectedCategory ? styles.pillActive : ''}`}
            onClick={() => setSelectedCategory('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`${styles.pill} ${selectedCategory === c.name ? styles.pillActive : ''}`}
              onClick={() => setSelectedCategory(c.name)}
            >
              {c.name}
            </button>
          ))}
          <button className={styles.pill} onClick={() => setSelectedCategory('4K Ultra HD')}>
            4K Ultra HD
          </button>
          <button className={styles.pill} onClick={() => setSelectedCategory('HDR')}>
            HDR
          </button>
          <button className={styles.pill} onClick={() => setSelectedCategory('Dolby Atmos')}>
            Dolby Atmos
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <>
          {/* Top 10 in your Country Today with Giant Watermark Numbers */}
          {top10List.length > 0 && (
            <div style={{ marginBottom: 48 }}>
              <h2 className={styles.sectionHeading}>Top 10 in your Country Today</h2>
              <div className={styles.top10Track}>
                {top10List.map((movie, idx) => (
                  <div key={movie.id} className={styles.top10Item}>
                    <div className={styles.rankNumber}>{idx + 1}</div>
                    <div className={styles.top10CardWrap}>
                      <PosterCard item={{ ...movie, type: 'movie' }} badgeText={idx < 3 ? 'TOP 10' : null} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Movies Grid if filtered or searched */}
          {(selectedCategory || searchQuery) && (
            <div style={{ marginBottom: 48 }}>
              <h2 className={styles.sectionHeading}>
                {selectedCategory ? `${selectedCategory} Movies` : `Search Results for "${searchQuery}"`}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
                {filteredMovies.map((movie) => (
                  <PosterCard key={movie.id} item={{ ...movie, type: 'movie' }} />
                ))}
              </div>
            </div>
          )}

          {/* Explore by Genre Visual Grid */}
          {!selectedCategory && !searchQuery && (
            <div style={{ marginBottom: 48 }}>
              <h2 className={styles.sectionHeading}>Explore by Genre</h2>
              <div className={styles.genreGrid}>
                {/* Featured Action Card */}
                <div
                  className={`${styles.genreCard} ${styles.genreCardFeatured}`}
                  onClick={() => setSelectedCategory('Action')}
                >
                  <img src={CATEGORY_METADATA.Action.image} alt="Action" className={styles.genreImg} />
                  <div className={styles.genreOverlay} />
                  <div className={styles.genreContent}>
                    <h3 className={styles.genreTitle}>Action</h3>
                    <p className={styles.genreSubtitle}>{CATEGORY_METADATA.Action.subtitle}</p>
                  </div>
                </div>

                {/* Other Genre Cards */}
                {['Sci-Fi', 'Horror', 'Comedy', 'Drama', 'Anime', 'Documentary'].map((genreKey) => {
                  const meta = CATEGORY_METADATA[genreKey];
                  if (!meta) return null;
                  return (
                    <div
                      key={genreKey}
                      className={styles.genreCard}
                      onClick={() => setSelectedCategory(genreKey)}
                    >
                      <img src={meta.image} alt={meta.name} className={styles.genreImg} />
                      <div className={styles.genreOverlay} />
                      <div className={styles.genreContent}>
                        <h3 className={styles.genreTitle}>{meta.name}</h3>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
