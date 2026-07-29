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
        <span className="hero-type-badge">{item.type === 'series' ? 'SERIES' : 'MOVIE'}</span>
        <h1 className="hero-title">{item.title}</h1>
        {item.description && <p className="hero-description">{item.description}</p>}

        <div className="hero-actions">
          <Link to={targetLink} className="hero-btn hero-btn-primary">
            ▶ Play Now
          </Link>
          <Link to={targetLink} className="hero-btn hero-btn-secondary">
            ℹ More Info
          </Link>
        </div>
      </div>
    </div>
  );
}
