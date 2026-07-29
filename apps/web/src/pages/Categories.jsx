import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { getCategories } from '../api/catalog';
import api from '../api/client';
import '../styles/Catalog.module.css';

export default function Categories() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role !== 'admin' && role !== 'uploader') {
      navigate('/');
      return;
    }

    fetchCategories();
  }, [role, navigate]);

  async function fetchCategories() {
    try {
      const catList = await getCategories();
      setCategories(catList || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setError('');
    try {
      await api.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id, name) {
    if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
    setError('');
    try {
      await api.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete category');
    }
  }

  if (role !== 'admin' && role !== 'uploader') return null;

  return (
    <div className="page-container padded" style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1 className="page-heading">Category Management</h1>
      <p style={{ color: '#8A8F98', marginBottom: 24 }}>
        Add, view, or remove content categories available for uploaders and content classification.
      </p>

      {/* Add Category Form */}
      <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <input
          type="text"
          placeholder="New Category Name (e.g. Anime, K-Drama)..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          style={{
            flex: 1,
            padding: 12,
            background: '#171B24',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 8,
            color: '#F5F5F0',
            fontSize: 14,
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            background: '#F2A93B',
            color: '#0D1117',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Category
        </button>
      </form>

      {error && <div style={{ color: '#EF476F', marginBottom: 16 }}>{error}</div>}

      {/* Categories Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 16px',
              background: '#171B24',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10,
            }}
          >
            <span style={{ color: '#F5F5F0', fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
            <button
              onClick={() => handleDeleteCategory(cat.id, cat.name)}
              style={{
                background: 'none',
                border: 'none',
                color: '#EF476F',
                fontSize: 16,
                cursor: 'pointer',
              }}
              title="Delete Category"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
