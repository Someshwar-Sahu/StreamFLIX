import React from 'react';

export default function StreamFlixLogo({ size = 36, showText = true, className = '' }) {
  return (
    <div className={`streamflix-logo-wrapper ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 10px rgba(255, 149, 0, 0.45))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="sfGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E63946" />
            <stop offset="45%" stopColor="#FF9500" />
            <stop offset="100%" stopColor="#F2A93B" />
          </linearGradient>
          <linearGradient id="sfGradAccent" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF0055" />
            <stop offset="100%" stopColor="#FFC107" />
          </linearGradient>
          <filter id="sfGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer glowing sleek S-ribbon curve */}
        <path
          d="M 28 24 C 48 14, 78 18, 78 35 C 78 52, 22 48, 22 65 C 22 82, 52 86, 76 76"
          stroke="url(#sfGradPrimary)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center glowing Play Emblem */}
        <path
          d="M 45 38 L 65 50 L 45 62 Z"
          fill="url(#sfGradAccent)"
          filter="url(#sfGlow)"
        />
      </svg>

      {showText && (
        <span style={{
          fontFamily: "'Clash Display', 'Inter', sans-serif",
          fontSize: size > 30 ? '1.45rem' : '1.2rem',
          fontWeight: 800,
          color: '#F5F5F0',
          letterSpacing: '-0.5px',
          lineHeight: 1
        }}>
          STREAM<span style={{ color: '#FF9500' }}>FLIX</span>
        </span>
      )}
    </div>
  );
}
