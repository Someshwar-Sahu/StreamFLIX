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
          {items.map((item) => (
            <PosterCard key={item.id || item.content_id} item={item} isProgress={isProgressRow} />
          ))}
        </div>

        <button className="scroll-arrow scroll-arrow-right" onClick={scrollRight} aria-label="Scroll right">
          ›
        </button>
      </div>
    </div>
  );
}
