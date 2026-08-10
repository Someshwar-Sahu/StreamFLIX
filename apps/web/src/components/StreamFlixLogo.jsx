import React from 'react';

export default function StreamFlixLogo({ size = 34, showText = true, className = '' }) {
  return (
    <div
      className={`streamflix-brand-logo ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        textDecoration: 'none',
        userSelect: 'none',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 12px rgba(229, 9, 20, 0.5))',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
        }}
      >
        <defs>
          <linearGradient id="sfStitchRed" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d5a" />
            <stop offset="60%" stopColor="#e50914" />
            <stop offset="100%" stopColor="#930007" />
          </linearGradient>
        </defs>

        {/* Dynamic Curved Ribbon Icon */}
        <path
          d="M 28 22 C 50 12, 80 16, 80 34 C 80 52, 20 48, 20 66 C 20 84, 50 88, 76 78"
          stroke="url(#sfStitchRed)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Glowing Play Arrow */}
        <polygon
          points="46,38 66,50 46,62"
          fill="#ffffff"
          style={{ filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.8))' }}
        />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontSize: size > 30 ? '1.5rem' : '1.25rem',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <span style={{ color: '#ffffff', display: 'inline-flex' }}>
            <span className="cinematic-letter delay-1">S</span>
            <span className="cinematic-letter delay-2">T</span>
            <span className="cinematic-letter delay-3">R</span>
            <span className="cinematic-letter delay-4">E</span>
            <span className="cinematic-letter delay-5">A</span>
            <span className="cinematic-letter delay-6">M</span>
          </span>
          <span style={{ color: '#e50914', display: 'inline-flex' }}>
            <span className="cinematic-letter delay-7">F</span>
            <span className="cinematic-letter delay-8">L</span>
            <span className="cinematic-letter delay-9">I</span>
            <span className="cinematic-letter delay-10">X</span>
          </span>
        </span>
      )}
    </div>
  );
}
