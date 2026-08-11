import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from '../api/interactions';
import { resolveMediaUrl } from '../api/media';
import { getCategoryVisual } from '../constants/categoryImages';
import { useToast } from '../context/ToastContext';
import styles from '../styles/MovieDetail.module.css';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getContentDetails(id)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton-shimmer" style={{ width: '100%', height: 500, borderRadius: 20 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ color: '#ffffff' }}>Movie not found</h2>
        <Link to="/movies" style={{ color: 'var(--primary-red)', marginTop: 12, display: 'inline-block' }}>
          Back to Movies
        </Link>
      </div>
    );
  }

  const movie = data.content || data;
  const categoriesList = movie.categories || [];
  const primaryCategory = categoriesList[0]?.name || 'Action';
  const categoryVisual = getCategoryVisual(primaryCategory);

  const backdropSrc =
    resolveMediaUrl(movie.thumbnail_url || movie.poster_url) || categoryVisual.image;

  async function handleWatchlist() {
    const willBeInWatchlist = !data.in_watchlist;
    setData((prev) => ({ ...prev, in_watchlist: willBeInWatchlist }));
    await toggleWatchlist(Number(id), data.in_watchlist);
    showToast(willBeInWatchlist ? 'Added to your Watchlist!' : 'Removed from Watchlist.', 'info');
  }

  async function handleRate(value) {
    const oldRating = data.my_rating;
    const newRating = oldRating === value ? null : value;
    setData((prev) => ({ ...prev, my_rating: newRating }));
    if (newRating === null) {
      await clearRating(Number(id));
    } else {
      await rateContent(Number(id), value);
      showToast('Rating recorded!', 'info');
    }
  }

  // Format duration (e.g. 135 mins -> 2h 15m)
  const durationSec = movie.duration || 7200;
  const hours = Math.floor(durationSec / 3600);
  const minutes = Math.floor((durationSec % 3600) / 60);
  const formattedDuration = `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;

  const genresString = categoriesList.map((c) => c.name).join(', ') || primaryCategory;

  return (
    <div className="page-container" style={{ maxWidth: 1160, margin: '0 auto' }}>
      <Link
        to="/movies"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          marginBottom: 20,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
        Back to Catalog
      </Link>

      <div className={styles.detailBackdropWrap}>
        <img src={backdropSrc} alt={movie.title} className={styles.backdropImg} />
        <div className={styles.vignetteOverlay} />

        <div className={styles.contentBody}>
          <h1 className={styles.title}>{movie.title}</h1>

          <div className={styles.metaRow}>
            <span className={styles.matchGreen}>98% Match</span>
            <span className={styles.year}>{movie.release_year || '2024'}</span>
            <span className={styles.ratingBadge}>TV-MA</span>
            <span className={styles.duration}>{formattedDuration}</span>
            <span className={styles.techBadge}>HDR</span>
            <span className={styles.techBadge}>4K UHD</span>
          </div>

          <div className={styles.actionsRow}>
            <Link to={`/watch/${id}`} className={styles.playBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              Play
            </Link>

            <button
              className={`${styles.iconBtn} ${data.in_watchlist ? styles.iconBtnActive : ''}`}
              onClick={handleWatchlist}
              title={data.in_watchlist ? 'In Watchlist' : 'Add to Watchlist'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {data.in_watchlist ? 'check' : 'add'}
              </span>
            </button>

            <button
              className={`${styles.iconBtn} ${data.my_rating === 1 ? styles.iconBtnActive : ''}`}
              onClick={() => handleRate(1)}
              title="I like this"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, fontVariationSettings: data.my_rating === 1 ? "'FILL' 1" : "'FILL' 0" }}
              >
                thumb_up
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.twoColumnGrid}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: '#ffffff', marginBottom: 12 }}>
            Storyline
          </h3>
          <p className={styles.synopsis}>
            {movie.description ||
              'In a high-stakes cinematic thrill ride, characters must navigate impossible choices and unforgiving environments to uncover an ancient mystery before time runs out.'}
          </p>
        </div>

        <div className={styles.metadataBlock}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Cast:</span>
            <span className={styles.metaVal}>Anya Taylor-Joy, Oscar Isaac, Hiroyuki Sanada</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Genres:</span>
            <span className={styles.metaVal}>{genresString}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>This movie is:</span>
            <span className={styles.metaVal}>{categoryVisual.mood}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
