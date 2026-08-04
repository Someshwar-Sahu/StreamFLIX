import React, { useState } from 'react';
import '../styles/Catalog.module.css';

export default function SettingsPage() {
  const [quality, setQuality] = useState('auto');
  const [serverUrl, setServerUrl] = useState(localStorage.getItem('custom_api_url') || '');

  const handleSaveServerUrl = () => {
    if (serverUrl.trim()) {
      localStorage.setItem('custom_api_url', serverUrl.trim());
      alert('Server URL saved! The app will now connect to: ' + serverUrl.trim());
      window.location.reload();
    } else {
      localStorage.removeItem('custom_api_url');
      alert('Custom Server URL cleared. Reverting to default.');
      window.location.reload();
    }
  };

  return (
    <div className="page-container padded">
      <h1 className="page-heading">Settings</h1>

      <div style={{ background: '#171B24', borderRadius: 12, padding: 24, maxWidth: 600, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ color: '#F5F5F0', marginBottom: 16 }}>Server & Connection</h3>

        <div style={{ marginBottom: 24 }}>
          <label style={{ color: '#8A8F98', display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>
            Backend API Server URL (Render / Live Domain)
          </label>
          <input
            type="text"
            placeholder="https://streamflix-api.onrender.com"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            style={{
              background: '#0D1117',
              color: '#F5F5F0',
              padding: '10px 14px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              width: '100%',
              boxSizing: 'border-box',
              marginBottom: 12
            }}
          />
          <button
            onClick={handleSaveServerUrl}
            style={{
              background: '#F2A93B',
              color: '#0D1117',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 6,
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Save Server URL
          </button>
        </div>

        <h3 style={{ color: '#F5F5F0', marginBottom: 16, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>Playback Settings</h3>

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
