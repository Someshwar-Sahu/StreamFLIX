import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.linksGrid}>
          <div className={styles.linkCol}>
            <Link to="/movies" className={styles.link}>Browse Movies</Link>
            <Link to="/series" className={styles.link}>Original Series</Link>
            <Link to="/categories" className={styles.link}>Explore Genres</Link>
          </div>

          <div className={styles.linkCol}>
            <Link to="/search" className={styles.link}>Search Titles</Link>
            <Link to="/myspace" className={styles.link}>My Watchlist</Link>
            <Link to="/history" className={styles.link}>Watch History</Link>
          </div>

          <div className={styles.linkCol}>
            <span className={styles.staticText}>4K Ultra HD & HDR</span>
            <span className={styles.staticText}>Dolby Cinema Audio</span>
            <span className={styles.staticText}>Zero Buffering CDN</span>
          </div>

          <div className={styles.linkCol}>
            <span className={styles.staticText}>StreamFlix Cloud Engine</span>
            <span className={styles.staticText}>Backblaze B2 Object Storage</span>
            <span className={styles.staticText}>Render Distributed API</span>
          </div>
        </div>

        <div className={styles.copyright}>
          © 2026 StreamFlix. Designed & Engineered by <strong style={{ color: '#ffffff' }}>Someshwar Sahu</strong> & <strong style={{ color: '#ffffff' }}>Yashaditya Singh</strong>. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
