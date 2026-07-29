import React, { useEffect, useState } from 'react';
import { getTrending } from '../api/catalog';
import { getWatchHistory } from '../api/interactions';
import HeroBanner from '../components/HeroBanner';
import ContentRow from '../components/ContentRow';
import '../styles/Catalog.module.css';

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
    return <div className="page-container"><div className="loading-spinner">Loading StreamFlix...</div></div>;
  }

  return (
    <div className="page-container">
      {heroItem && <HeroBanner item={heroItem} />}

      {continueWatching.length > 0 && (
        <ContentRow title="Continue Watching" items={continueWatching} isProgressRow={true} />
      )}

      <ContentRow title="Trending Overall" items={trending.overall} />
      <ContentRow title="Trending Movies" items={trending.movies} />
      <ContentRow title="Trending Series" items={trending.series} />
    </div>
  );
}
