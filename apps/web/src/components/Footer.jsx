import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div className={styles.column}>
            <Link to="/movies" className={styles.link}>Audio Description</Link>
            <Link to="/settings" className={styles.link}>Help Center</Link>
            <Link to="/myspace" className={styles.link}>Gift Cards</Link>
            <Link to="/movies" className={styles.link}>Media Center</Link>
          </div>
          <div className={styles.column}>
            <Link to="/settings" className={styles.link}>Investor Relations</Link>
            <Link to="/settings" className={styles.link}>Jobs</Link>
            <Link to="/settings" className={styles.link}>Terms of Use</Link>
            <Link to="/settings" className={styles.link}>Privacy</Link>
          </div>
          <div className={styles.column}>
            <Link to="/settings" className={styles.link}>Legal Notices</Link>
            <Link to="/settings" className={styles.link}>Cookie Preferences</Link>
            <Link to="/settings" className={styles.link}>Corporate Information</Link>
            <Link to="/settings" className={styles.link}>Contact Us</Link>
          </div>
          <div className={styles.column}>
            <div className={styles.badge}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>bolt</span>
              Ultra HD 4K Streaming
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginTop: 8 }}>
              Experience next-generation cinema with zero buffering and edge-accelerated streaming.
            </p>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>© 2026 StreamFlix, Inc. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 16 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Service Status: Optimal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
