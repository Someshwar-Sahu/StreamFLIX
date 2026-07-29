import React, { useState, useEffect } from 'react';
import { getCategories } from '../api/catalog';

const PREDEFINED_CATEGORIES = [
  'Action',
  'Thriller',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Romance',
  'Horror',
  'Mystery',
  'Adventure',
  'Animation',
  'Anime',
  'Crime',
  'Documentary',
  'Family',
  'History',
  'Music',
  'Superhero',
  'War',
  'Western',
  'Biopic',
  'Short Film',
  'Sports',
  'Reality TV',
  'K-Drama',
];

export default function CategoryTagSelector({ selectedCategories = [], onChange }) {
  const [search, setSearch] = useState('');
  const [availableCategories, setAvailableCategories] = useState(PREDEFINED_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getCategories()
      .then((list) => {
        if (list && list.length > 0) {
          const names = list.map((c) => c.name);
          const combined = Array.from(new Set([...PREDEFINED_CATEGORIES, ...names]));
          setAvailableCategories(combined);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = availableCategories.filter(
    (c) =>
      c.toLowerCase().includes(search.toLowerCase()) &&
      !selectedCategories.includes(c)
  );

  const addCategory = (cat) => {
    const updated = [...selectedCategories, cat];
    onChange(updated);
    setSearch('');
    setIsOpen(false);
  };

  const removeCategory = (cat) => {
    const updated = selectedCategories.filter((c) => c !== cat);
    onChange(updated);
  };

  return (
    <div style={{ marginBottom: 16, position: 'relative' }}>
      {/* Selected Tags Pill Row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
        {selectedCategories.map((cat) => (
          <span key={cat} style={tagStyle}>
            {cat}
            <button type="button" onClick={() => removeCategory(cat)} style={removeBtnStyle}>
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Type to search and add categories (e.g. Action, Sci-Fi, Drama)..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        style={inputStyle}
      />

      {/* Dropdown Options */}
      {isOpen && filtered.length > 0 && (
        <div style={dropdownStyle}>
          {filtered.map((cat) => (
            <div
              key={cat}
              onClick={() => addCategory(cat)}
              style={dropdownItemStyle}
              onMouseDown={(e) => e.preventDefault()}
            >
              + {cat}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tagStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: 'rgba(242, 169, 59, 0.15)',
  border: '1px solid #F2A93B',
  borderRadius: '16px',
  color: '#F2A93B',
  fontSize: '13px',
  fontWeight: '600',
};

const removeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#F2A93B',
  cursor: 'pointer',
  fontSize: '12px',
  padding: 0,
};

const inputStyle = {
  width: '100%',
  padding: '12px',
  background: '#0D1117',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '8px',
  color: '#F5F5F0',
  fontSize: '14px',
  outline: 'none',
};

const dropdownStyle = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  backgroundColor: '#171B24',
  border: '1px solid rgba(242, 169, 59, 0.4)',
  borderRadius: '8px',
  marginTop: 4,
  maxHeight: 200,
  overflowY: 'auto',
  zIndex: 100,
  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
};

const dropdownItemStyle = {
  padding: '10px 14px',
  color: '#F5F5F0',
  fontSize: '13px',
  cursor: 'pointer',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};
