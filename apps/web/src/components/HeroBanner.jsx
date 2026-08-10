import React from 'react';
import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../api/media';
import '../styles/HeroBanner.css';

export default function HeroBanner({ item }) {
  if (!item) return null;

  const backdropUrl = resolveMediaUrl(item.poster_url || item.thumbnail_url);
  const targetLink = item.type === 'series' ? `/series/${item.id}` : `/watch/${item.id}`;

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

        <div className="hero-actions">
          <Link to={targetLink} className="hero-btn hero-btn-primary">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              play_arrow
            </span>
            Play Now
          </Link>
          <Link to={targetLink} className="hero-btn hero-btn-secondary">
            <span className="material-symbols-outlined">info</span>
            More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
