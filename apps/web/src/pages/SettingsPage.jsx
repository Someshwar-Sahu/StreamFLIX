import React, { useState } from 'react';
import '../styles/Catalog.module.css';

export default function SettingsPage() {
  const [quality, setQuality] = useState('auto');

  return (
    <div className="page-container padded">
      <h1 className="page-heading">Settings</h1>

      <div style={{ background: '#171B24', borderRadius: 12, padding: 24, maxWidth: 600, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ color: '#F5F5F0', marginBottom: 16 }}>Playback Settings</h3>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#8A8F98', display: 'block', marginBottom: 8 }}>Default Video Quality</label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            style={{ background: '#0D1117', color: '#F5F5F0', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)', width: '100%' }}
          >
            <option value="auto">Auto (Adaptive Bitrate)</option>
            <option value="1080p">1080p (Full HD)</option>
            <option value="720p">720p (HD)</option>
            <option value="480p">480p (SD)</option>
          </select>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <h4 style={{ color: '#F5F5F0', marginBottom: 4 }}>App Info</h4>
          <p style={{ color: '#8A8F98', fontSize: '0.85rem' }}>StreamFlix Web / Desktop Client v0.1.0 (Phase 19)</p>
        </div>
      </div>
    </div>
  );
}
