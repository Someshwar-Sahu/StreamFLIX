import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import PosterCard from './PosterCard';
import { resolveMediaUrl } from '../api/media';
import '../styles/ContentRow.css';

export default function ContentRow({ title, items = [], seeAllLink, isProgressRow = false }) {
  const trackRef = useRef(null);

  if (!items || items.length === 0) return null;

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -460, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 460, behavior: 'smooth' });
    }
  };

  // Deduplicate items & ensure composite unique React key
  const uniqueItems = items.reduce((acc, item, idx) => {
    const itemType = item.type || (item.seasons ? 'series' : 'movie');
    const itemId = item.id || item.content_id || idx;
    const computedKey = `${itemType}-${itemId}-${idx}`;

    const exists = acc.some((i) => (i.id || i.content_id) === itemId && (i.type || (i.seasons ? 'series' : 'movie')) === itemType);
    if (!exists) {
      acc.push({ ...item, _computedKey: computedKey });
    }
    return acc;
  }, []);

  return (
    <div className="content-row-container">
      <div className="content-row-header">
        <h2 className="content-row-title">{title}</h2>
        {seeAllLink && (
          <Link to={seeAllLink} className="see-all-link">
            <span>Explore All</span>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          </Link>
        )}
      </div>

      <div className="carousel-viewport">
        <button className="scroll-arrow scroll-arrow-left" onClick={scrollLeft} aria-label="Scroll left">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>

        <div className="content-row-track" ref={trackRef}>
          {uniqueItems.map((item, index) => {
            if (isProgressRow) {
              const progressPct =
                item.duration_seconds && item.progress_seconds
                  ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
                  : 50;

              const posterUrl = resolveMediaUrl(item.thumbnail_url || item.poster_url);
              const itemId = item.content_id || item.id;
              const targetUrl = `/watch/${itemId}`;

              return (
                <Link key={item._computedKey} to={targetUrl} className="continue-card">
                  <div className="continue-card-inner">
                    {posterUrl ? (
                      <img src={posterUrl} alt={item.title} className="continue-card-poster" loading="lazy" />
                    ) : (
                      <div className="hero-backdrop-placeholder" />
                    )}

                    <div className="continue-gradient" />

                    <div className="continue-play-hover">
                      <div className="continue-play-circle">
                        <span className="material-symbols-outlined" style={{ fontSize: 26, fontVariationSettings: "'FILL' 1" }}>
                          play_arrow
                        </span>
                      </div>
                    </div>

                    <div className="continue-details">
                      <div className="continue-title">{item.title}</div>
                      <div className="continue-sub">{progressPct}% completed</div>
                      <div className="continue-progress-track">
                        <div className="continue-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }

            const badgeText = index < 3 ? `TOP ${index + 1}` : null;
            return <PosterCard key={item._computedKey} item={item} badgeText={badgeText} />;
          })}
        </div>

        <button className="scroll-arrow scroll-arrow-right" onClick={scrollRight} aria-label="Scroll right">
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
