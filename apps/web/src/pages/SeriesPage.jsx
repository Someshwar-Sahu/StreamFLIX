import React, { useEffect, useState } from 'react';
import { getSeries } from '../api/catalog';
import ContentRow from '../components/ContentRow';
import PosterCard from '../components/PosterCard';

export default function SeriesPage() {
  const [seriesList, setSeriesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSeries();
        setSeriesList(data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
          Original Series & Shows
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Binge full seasons, multi-episode thrillers, and documentaries.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '2/3', borderRadius: 10 }} />
          ))}
        </div>
      ) : seriesList.length > 0 ? (
        <>
          <ContentRow title="Trending Series" items={seriesList.map((s) => ({ ...s, type: 'series' }))} />
          <div style={{ marginTop: 40 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 20 }}>
              All Series
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 24 }}>
              {seriesList.map((s) => (
                <PosterCard key={s.id} item={{ ...s, type: 'series' }} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 12 }}>tv_off</span>
          <p>No TV series available yet.</p>
        </div>
      )}
    </div>
  );
}
