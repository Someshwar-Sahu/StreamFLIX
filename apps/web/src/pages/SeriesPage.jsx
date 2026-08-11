import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSeries } from '../api/catalog';
import ContentRow from '../components/ContentRow';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import '../styles/HeroBanner.css';

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSeries();
        setSeriesList(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const heroSeries = seriesList[0] || null;
  const heroPosterUrl = heroSeries ? resolveMediaUrl(heroSeries.poster_url) : null;

  return (
    <div className="page-container">
      {/* Series Hero Banner matching Image 7 */}
      {heroSeries && (
        <div className="hero-banner-container" style={{ marginBottom: 40 }}>
          <div className="hero-backdrop-wrapper">
            {heroPosterUrl ? (
              <img src={heroPosterUrl} alt={heroSeries.title} className="hero-backdrop-img" />
            ) : (
              <div className="hero-backdrop-placeholder" />
            )}
            <div className="hero-vignette-bottom" />
            <div className="hero-vignette-left" />
          </div>

          <div className="hero-content">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div className="hero-pill-badge">
                <span className="hero-pill-dot" />
                STREAMFLIX ORIGINAL
              </div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#ffffff',
                }}
              >
                Season 1
              </span>
            </div>

            <h1 className="hero-title">{heroSeries.title}</h1>

            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                fontSize: '13px',
                fontWeight: '600',
                marginBottom: 16,
              }}
            >
              <span style={{ color: '#46d369', fontWeight: '700' }}>98% Match</span>
              <span style={{ color: 'var(--text-secondary)' }}>2024</span>
              <span
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                }}
              >
                TV-MA
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>8 Episodes</span>
              <span
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: '700',
                }}
              >
                HDR
              </span>
            </div>

            <p className="hero-synopsis">
              {heroSeries.description ||
                'When ancient secrets begin to surface, characters must embark on a treacherous journey to uncover the hidden realm before darkness consumes the kingdom.'}
            </p>

            <div className="hero-actions">
              <Link to={`/series/${heroSeries.id}`} className="hero-btn hero-btn-play">
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                Play
              </Link>
              <Link to={`/series/${heroSeries.id}`} className="hero-btn hero-btn-info">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  info
                </span>
                More Info
              </Link>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : (
        <>
          <ContentRow
            title="Trending Series"
            items={seriesList.map((s) => ({ ...s, type: 'series' }))}
          />

          <div style={{ marginTop: 48 }}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: 20,
              }}
            >
              All TV Shows & Series
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
              {seriesList.map((s) => (
                <PosterCard key={s.id} item={{ ...s, type: 'series' }} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
