import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import PosterCard from './PosterCard';
import '../styles/ContentRow.css';

export default function ContentRow({ title, items = [], seeAllLink, isProgressRow = false }) {
  const trackRef = useRef(null);

  if (!items || items.length === 0) return null;

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -420, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 420, behavior: 'smooth' });
    }
  };

  // Deduplicate items & ensure composite unique React key
  const uniqueItems = items.reduce((acc, item, idx) => {
    const itemType = item.type || (item.seasons ? 'series' : 'movie');
    const itemId = item.id || item.content_id || idx;
    const computedKey = `${itemType}-${itemId}-${idx}`;
    
    // Check if exact same item ID & type already exists in this row
    const exists = acc.some(i => (i.id || i.content_id) === itemId && (i.type || (i.seasons ? 'series' : 'movie')) === itemType);
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
            See All ›
          </Link>
        )}
      </div>

      <div className="carousel-viewport">
        <button className="scroll-arrow scroll-arrow-left" onClick={scrollLeft} aria-label="Scroll left">
          ‹
        </button>

        <div className="content-row-track" ref={trackRef}>
          {uniqueItems.map((item) => (
            <PosterCard key={item._computedKey} item={item} isProgress={isProgressRow} />
          ))}
        </div>

        <button className="scroll-arrow scroll-arrow-right" onClick={scrollRight} aria-label="Scroll right">
          ›
        </button>
      </div>
    </div>
  );
}
