import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { getCategories } from '../api/catalog';
import api from '../api/client';
import AnimatedModal from '../components/AnimatedModal';
import { useToast } from '../context/ToastContext';

export default function Categories() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

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
    try {
      await api.post('/categories', { name: newCatName.trim() });
      showToast(`Category "${newCatName.trim()}" added successfully!`, 'success');
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to add category', 'error');
    }
  }

  async function confirmDeleteCategory() {
    if (!deleteTarget) return;
    try {
      await api.delete(`/categories/${deleteTarget.id}`);
      showToast(`Category "${deleteTarget.name}" deleted.`, 'info');
      setDeleteTarget(null);
      fetchCategories();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to delete category', 'error');
    }
  }

  if (role !== 'admin' && role !== 'uploader') return null;

  return (
    <div className="page-container" style={{ maxWidth: 880, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Category & Genre Studio
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Manage global classification tags and genres for movies and series.
        </p>
      </div>

      <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
        <input
          type="text"
          placeholder="New Category Name (e.g. Cyberpunk, Anime, Docuseries)..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          style={{
            flex: 1,
            height: 48,
            padding: '0 20px',
            background: 'var(--bg-surface-low)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 10,
            color: '#ffffff',
            fontSize: 14,
            outline: 'none',
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: '0 28px',
            background: 'var(--primary-red)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 10,
            fontFamily: 'var(--font-body)',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
            boxShadow: '0 4px 14px var(--primary-glow)',
            transition: 'all 0.2s ease',
          }}
        >
          Add Genre
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {categories.map((cat) => (
          <div
            key={cat.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              background: 'var(--bg-surface-low)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary-red)', fontSize: 20 }}>
                label
              </span>
              <span style={{ color: '#ffffff', fontWeight: 600, fontSize: 14 }}>{cat.name}</span>
            </div>
            <button
              onClick={() => setDeleteTarget(cat)}
              style={{
                background: 'rgba(229, 9, 20, 0.1)',
                border: '1px solid rgba(229, 9, 20, 0.25)',
                color: '#ffb4aa',
                width: 32,
                height: 32,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              title="Delete Category"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            </button>
          </div>
        ))}
      </div>

      <AnimatedModal
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to remove the category "${deleteTarget?.name}"?`}
        type="danger"
        confirmText="Delete"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
