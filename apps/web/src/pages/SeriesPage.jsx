import React, { useEffect, useState } from 'react';
import { getSeries } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import ContentRow from '../components/ContentRow';

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

  if (loading) {
    return <div className="page-container"><div className="loading-spinner">Loading series...</div></div>;
  }

  return (
    <div className="page-container padded">
      <h1 className="page-heading">Series</h1>
      <ContentRow title="Featured Series" items={seriesList.map((s) => ({ ...s, type: 'series' }))} />
    </div>
  );
}
