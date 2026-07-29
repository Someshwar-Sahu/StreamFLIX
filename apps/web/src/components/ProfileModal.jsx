import React, { useState, useEffect } from 'react';
import { useAuth } from '../api/AuthContext';
import { getProfiles, selectProfile, createProfile, updateProfile, deleteProfile } from '../api/profiles';
import { getValidAvatarUrl } from '../utils/avatar';

const AVATAR_OPTIONS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
  '/avatars/avatar-7.svg',
  '/avatars/avatar-8.svg',
];

export default function ProfileModal({ isOpen, onClose }) {
  const { selectProfile: setProfileToken, currentProfile, role } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [mode, setMode] = useState('switch'); // 'switch' | 'edit' | 'create'
  const [editingProfile, setEditingProfile] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [error, setError] = useState('');

  const isAdminOrUploader = role === 'admin' || role === 'uploader';

  const loadData = async () => {
    try {
      const list = await getProfiles();
      setProfiles(list);
    } catch (err) {
      setError('Failed to load profiles');
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setMode('switch');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (profileId) => {
    try {
      const newToken = await selectProfile(profileId);
      await setProfileToken(newToken);
      onClose();
    } catch (err) {
      setError('Could not switch profile');
    }
  };

  const handleStartEdit = (profile, e) => {
    e.stopPropagation();
    setEditingProfile(profile);
    setNameInput(profile.name);
    setSelectedAvatar(getValidAvatarUrl(profile.avatar_url, profile.id));
    setMode('edit');
  };

  const handleSaveEdit = async () => {
    if (!nameInput.trim()) return;
    try {
      await updateProfile(editingProfile.id, { name: nameInput, avatar_url: selectedAvatar });
      await loadData();
      setMode('switch');
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    try {
      await createProfile({ name: nameInput, avatar_url: selectedAvatar });
      setNameInput('');
      await loadData();
      setMode('switch');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create profile');
    }
  };

  const handleDelete = async (profileId) => {
    if (profiles.length <= 1) {
      setError('Cannot delete the only remaining profile');
      return;
    }
    try {
      await deleteProfile(profileId);
      await loadData();
      setMode('switch');
    } catch (err) {
      setError('Failed to delete profile');
    }
  };

  const displayedProfiles = isAdminOrUploader ? profiles.slice(0, 1) : profiles;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#F5F5F0', fontSize: '1.4rem' }}>
            {mode === 'switch' ? "Who's Watching?" : mode === 'edit' ? 'Edit Profile' : 'Create Profile'}
          </h2>
          <button style={closeBtnStyle} onClick={onClose}>✕</button>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}

        {mode === 'switch' && (
          <div>
            <div style={gridStyle}>
              {displayedProfiles.map((p) => {
                const avatarSrc = getValidAvatarUrl(p.avatar_url, p.id);
                const isActive = p.id === currentProfile?.id;
                const initial = p.name[0]?.toUpperCase() || 'P';

                return (
                  <div
                    key={p.id}
                    style={{ ...tileStyle, borderColor: isActive ? '#F2A93B' : 'rgba(255,255,255,0.1)' }}
                    onClick={() => handleSelect(p.id)}
                  >
                    <div style={avatarWrapStyle}>
                      <img
                        src={avatarSrc}
                        alt=""
                        style={avatarImgStyle}
                        onError={(e) => {
                          e.currentTarget.src = getValidAvatarUrl(null, p.id);
                        }}
                      />
                    </div>
                    <span style={nameStyle}>{p.name}</span>

                    <button style={editIconStyle} onClick={(e) => handleStartEdit(p, e)}>
                      ✏️ Edit
                    </button>
                  </div>
                );
              })}

              {!isAdminOrUploader && (
                <div style={addTileStyle} onClick={() => { setNameInput(''); setSelectedAvatar(AVATAR_OPTIONS[0]); setMode('create'); }}>
                  <div style={addIconStyle}>+</div>
                  <span style={nameStyle}>Add Profile</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(mode === 'edit' || mode === 'create') && (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Profile Name</label>
            <input
              type="text"
              style={inputStyle}
              placeholder="Enter profile name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            <label style={labelStyle}>Choose Avatar Illustration</label>
            <div style={avatarChoiceGridStyle}>
              {AVATAR_OPTIONS.map((avatarPath) => (
                <div
                  key={avatarPath}
                  style={{
                    ...avatarChoiceStyle,
                    borderColor: selectedAvatar === avatarPath ? '#F2A93B' : 'transparent',
                    background: selectedAvatar === avatarPath ? 'rgba(242,169,59,0.2)' : '#171B24',
                  }}
                  onClick={() => setSelectedAvatar(avatarPath)}
                >
                  <img src={avatarPath} alt="" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              {mode === 'edit' ? (
                <>
                  <button style={saveBtnStyle} onClick={handleSaveEdit}>Save Changes</button>
                  {!isAdminOrUploader && (
                    <button style={deleteBtnStyle} onClick={() => handleDelete(editingProfile.id)}>Delete</button>
                  )}
                </>
              ) : (
                <button style={saveBtnStyle} onClick={handleCreate}>Create Profile</button>
              )}
              <button style={cancelBtnStyle} onClick={() => setMode('switch')}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(13, 17, 23, 0.75)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle = {
  background: 'rgba(23, 27, 36, 0.95)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '20px',
  padding: '28px',
  width: '540px',
  maxWidth: '90vw',
  boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#8A8F98',
  fontSize: '18px',
  cursor: 'pointer',
};

const gridStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  justifyContent: 'center',
  padding: '12px 0',
};

const tileStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '110px',
  padding: '12px',
  borderRadius: '12px',
  background: 'rgba(255,255,255,0.03)',
  border: '2px solid transparent',
  cursor: 'pointer',
  position: 'relative',
};

const avatarWrapStyle = {
  position: 'relative',
  width: '64px',
  height: '64px',
  borderRadius: '32px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '8px',
  background: '#171B24',
  border: '2px solid rgba(242, 169, 59, 0.4)',
};

const avatarImgStyle = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const addTileStyle = {
  ...tileStyle,
  border: '2px dashed rgba(255,255,255,0.2)',
};

const addIconStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#F5F5F0',
  fontSize: '32px',
  fontWeight: '300',
  marginBottom: '8px',
  background: 'rgba(255,255,255,0.05)',
};

const nameStyle = {
  color: '#F5F5F0',
  fontSize: '13px',
  fontWeight: '600',
  marginBottom: '4px',
};

const editIconStyle = {
  background: 'none',
  border: 'none',
  color: '#F2A93B',
  fontSize: '11px',
  cursor: 'pointer',
  marginTop: '2px',
};

const labelStyle = {
  display: 'block',
  color: '#8A8F98',
  fontSize: '13px',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  background: '#0D1117',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '8px',
  color: '#F5F5F0',
  fontSize: '14px',
  outline: 'none',
  marginBottom: '16px',
};

const avatarChoiceGridStyle = {
  display: 'flex',
  gap: '12px',
  flexWrap: 'wrap',
  marginBottom: '20px',
  justifyContent: 'center',
};

const avatarChoiceStyle = {
  width: '60px',
  height: '60px',
  borderRadius: '30px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.2s ease',
};

const saveBtnStyle = {
  flex: 1,
  padding: '12px',
  background: '#F2A93B',
  color: '#0D1117',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '700',
  cursor: 'pointer',
};

const deleteBtnStyle = {
  padding: '12px 16px',
  background: 'rgba(230,57,70,0.15)',
  color: '#E63946',
  border: '1px solid rgba(230,57,70,0.4)',
  borderRadius: '8px',
  fontWeight: '600',
  cursor: 'pointer',
};

const cancelBtnStyle = {
  padding: '12px 16px',
  background: 'rgba(255,255,255,0.08)',
  color: '#8A8F98',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
};

const errorStyle = {
  color: '#EF476F',
  fontSize: '13px',
  marginBottom: '12px',
};
