import React, { useState } from 'react';

export default function DeleteSafetyModal({ isOpen, title, onConfirm, onClose }) {
  const [confirmInput, setConfirmInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmInput.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmed) return;
    setBusy(true);
    setError('');
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete title');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ color: '#EF476F', margin: 0, fontSize: 18, fontWeight: 700 }}>
            ⚠️ Danger Zone — Delete Title
          </h2>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        <p style={{ color: '#F5F5F0', fontSize: 14, lineHeight: 1.5, marginBottom: 12 }}>
          Are you sure you want to delete <strong style={{ color: '#F2A93B' }}>"{title}"</strong>?
        </p>

        <p style={{ color: '#8A8F98', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
          This action <strong style={{ color: '#EF476F' }}>cannot be undone</strong>. This will permanently delete the video media files, streaming playlists, ratings, and watch history from StreamFlix.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', color: '#8A8F98', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
            To confirm, type <span style={{ color: '#EF476F', userSelect: 'all' }}>DELETE</span> below:
          </label>
          <input
            type="text"
            placeholder="Type DELETE to confirm..."
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            style={inputStyle}
            autoFocus
          />
        </div>

        {error && <p style={{ color: '#EF476F', fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={cancelBtnStyle} disabled={busy}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || busy}
            style={{
              ...deleteBtnStyle,
              opacity: isConfirmed && !busy ? 1 : 0.4,
              cursor: isConfirmed && !busy ? 'pointer' : 'not-allowed',
            }}
          >
            {busy ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(13, 17, 23, 0.85)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10000,
  padding: 20,
};

const modalStyle = {
  backgroundColor: '#171B24',
  border: '1px solid rgba(239, 71, 111, 0.4)',
  borderRadius: 16,
  padding: 24,
  maxWidth: 480,
  width: '100%',
  boxShadow: '0 20px 48px rgba(0,0,0,0.8)',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#8A8F98',
  fontSize: 16,
  cursor: 'pointer',
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#0D1117',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  color: '#F5F5F0',
  fontSize: 14,
  outline: 'none',
};

const cancelBtnStyle = {
  padding: '10px 18px',
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: 8,
  color: '#F5F5F0',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

const deleteBtnStyle = {
  padding: '10px 18px',
  backgroundColor: '#EF476F',
  border: 'none',
  borderRadius: 8,
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: 700,
};
