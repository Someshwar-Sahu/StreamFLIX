import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';
import { getCategories } from '../api/catalog';
import api from '../api/client';
import AnimatedModal from '../components/AnimatedModal';
import { useToast } from '../context/ToastContext';
import { CATEGORY_METADATA } from '../constants/categoryImages';
import styles from '../styles/Categories.module.css';

export default function Categories() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [newCatName, setNewCatName] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isAdminOrUploader = role === 'admin' || role === 'uploader';

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const catList = await getCategories();
      setCategories(catList || []);
    } catch {}
  }

  async function handleAddCategory(e) {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories', { name: newCatName.trim() });
      showToast(`Category "${newCatName.trim()}" added!`, 'success');
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

  return (
    <div className="page-container">
      {/* Header & Subtitle matching Image 8 */}
      <div className={styles.header}>
        <h1 className={styles.title}>Categories</h1>
        <p className={styles.subtitle}>
          Explore our vast cinematic universe. Choose a genre to discover your next favorite movie or TV show, carefully curated for an immersive experience.
        </p>
      </div>

      {/* Visual Masonry Grid of Genre Cards */}
      <div className={styles.grid}>
        {/* Action (Hero Card) */}
        <Link
          to="/movies"
          className={`${styles.card} ${styles.cardFeatured}`}
          style={{ textDecoration: 'none' }}
        >
          <img src={CATEGORY_METADATA.Action.image} alt="Action" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Action</h2>
            <p className={styles.cardSub}>{CATEGORY_METADATA.Action.subtitle}</p>
          </div>
        </Link>

        {/* Sci-Fi */}
        <Link to="/movies" className={styles.card}>
          <img src={CATEGORY_METADATA['Sci-Fi'].image} alt="Sci-Fi" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Sci-Fi</h2>
          </div>
        </Link>

        {/* Horror */}
        <Link to="/movies" className={styles.card}>
          <img src={CATEGORY_METADATA.Horror.image} alt="Horror" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Horror</h2>
          </div>
        </Link>

        {/* Comedy */}
        <Link to="/movies" className={styles.card}>
          <img src={CATEGORY_METADATA.Comedy.image} alt="Comedy" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Comedy</h2>
          </div>
        </Link>

        {/* Anime (Tall Vertical Card) */}
        <Link to="/movies" className={`${styles.card} ${styles.cardTall}`}>
          <img src={CATEGORY_METADATA.Anime.image} alt="Anime" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Anime</h2>
          </div>
        </Link>

        {/* Drama */}
        <Link to="/movies" className={styles.card}>
          <img src={CATEGORY_METADATA.Drama.image} alt="Drama" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Drama</h2>
          </div>
        </Link>

        {/* Documentary */}
        <Link to="/movies" className={styles.card}>
          <img src={CATEGORY_METADATA.Documentary.image} alt="Documentary" className={styles.cardImg} />
          <div className={styles.overlay} />
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Documentary</h2>
          </div>
        </Link>
      </div>

      {/* Admin / Uploader Category Studio */}
      {isAdminOrUploader && (
        <div style={{ marginTop: 40, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 40 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: '#ffffff', marginBottom: 16 }}>
            Category Management Studio
          </h2>
          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 12, marginBottom: 28, maxWidth: 640 }}>
            <input
              type="text"
              placeholder="Add new custom category..."
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              style={{
                flex: 1,
                height: 46,
                padding: '0 16px',
                background: 'var(--bg-surface-low)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#ffffff',
                fontSize: 14,
                outline: 'none',
              }}
              required
            />
            <button
              type="submit"
              style={{
                padding: '0 24px',
                background: 'var(--primary-red)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Add Category
            </button>
          </form>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'var(--bg-surface-low)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 20,
                  padding: '6px 14px',
                }}
              >
                <span style={{ color: '#ffffff', fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                <button
                  onClick={() => setDeleteTarget(c)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffb4aa',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

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
