import React from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/media';
import '../styles/HeroBanner.css';

export default function HeroBanner({ item }) {
  if (!item) return null;

  const backdropUrl = resolveMediaUrl(item.poster_url || item.thumbnail_url);
  const playLink = item.type === 'series' ? `/series/${item.id}` : `/watch/${item.id}`;
  const infoLink = item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`;

  return (
    <div className="hero-banner">
      {backdropUrl ? (
        <img src={backdropUrl} alt={item.title} className="hero-backdrop" />
      ) : (
        <div className="hero-backdrop-placeholder" />
      )}

      <div className="hero-gradient-overlay" />

      <div className="hero-content">
        <div className="hero-badge-pill">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            {item.type === 'series' ? 'tv' : 'movie'}
          </span>
          <span>{item.type === 'series' ? 'STREAMFLIX ORIGINAL SERIES' : 'STREAMFLIX ORIGINAL FILM'}</span>
        </div>

        <h1 className="hero-title">{item.title}</h1>
        {item.description && <p className="hero-description">{item.description}</p>}

        <div className="hero-actions" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Link to={playLink} className="hero-btn hero-btn-primary">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                play_arrow
              </span>
              Play
            </Link>
            <Link to={infoLink} className="hero-btn hero-btn-secondary">
              <span className="material-symbols-outlined">info</span>
              More Info
            </Link>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              opacity: 0.75,
              userSelect: 'none',
            }}
          >
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, letterSpacing: '0.1em', color: '#ffffff' }}>
              ODYSSEY
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
              4K UHD / HDR • DOLBY CINEMA
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
