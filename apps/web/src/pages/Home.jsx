import React, { useEffect, useState } from 'react';
import { getTrending } from '../api/catalog';
import { getWatchHistory } from '../api/interactions';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';

export default function Home() {
  const [trending, setTrending] = useState({ movies: [], series: [], overall: [] });
  const [continueWatching, setContinueWatching] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [trendData, historyData] = await Promise.all([
          getTrending().catch(() => ({ movies: [], series: [], overall: [] })),
          getWatchHistory().catch(() => []),
        ]);
        setTrending(trendData);
        setContinueWatching(historyData);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const heroItem = trending.overall[0] || null;

  if (loading) {
    return (
      <div className="page-container">
        {/* Skeleton Hero */}
        <div
          className="skeleton-shimmer"
          style={{ width: '100%', height: 500, borderRadius: 20, marginBottom: 40 }}
        />
        {/* Skeleton Rows */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 40 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className="skeleton-shimmer"
              style={{ width: 190, aspectRatio: '2/3', borderRadius: 10, flexShrink: 0 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {heroItem && <HeroBanner item={heroItem} />}

      {continueWatching.length > 0 && (
        <ContentRow title="Continue Watching" items={continueWatching} isProgressRow={true} />
      )}

      <ContentRow title="Trending Now" items={trending.overall} seeAllLink="/movies" />
      <ContentRow title="Blockbuster Movies" items={trending.movies} seeAllLink="/movies" />
      <ContentRow title="Bingeworthy Series" items={trending.series} seeAllLink="/series" />
    </div>
  );
}
