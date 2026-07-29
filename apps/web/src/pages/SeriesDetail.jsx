import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../api/AuthContext";
import { getSeriesDetails, toggleSeriesWatchlist, rateSeries, clearSeriesRating } from "../api/interactions";
import DeleteSafetyModal from "../components/DeleteSafetyModal";
import styles from "../styles/SeriesDetail.module.css";
import { resolveMediaUrl } from "../api/media";

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const [data, setData] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    getSeriesDetails(id).then(setData).catch(() => {});
  }, [id]);

  if (!data) return null;
  const { series, likes, dislikes, my_rating, in_watchlist, episode_progress } = data;

  async function handleWatchlist() {
    await toggleSeriesWatchlist(Number(id), in_watchlist);
    setData((d) => ({ ...d, in_watchlist: !d.in_watchlist }));
  }

  async function handleRate(value) {
    if (my_rating === value) {
      await clearSeriesRating(Number(id));
      setData((d) => ({ ...d, my_rating: null }));
    } else {
      await rateSeries(Number(id), value);
      setData((d) => ({ ...d, my_rating: value }));
    }
  }

  const handleDeleteSeries = async () => {
    await api.delete(`/series/${id}`);
    navigate('/series');
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {series.poster_url && <img src={resolveMediaUrl(series.poster_url)} alt={series.title} className={styles.poster} />}
        <div>
          <Link to="/" className={styles.back}>← Back to Catalog</Link>
          <h1 className={styles.title}>{series.title}</h1>
          {series.description && <p className={styles.desc}>{series.description}</p>}
          <div className={styles.controls}>
            <button className={`${styles.btn} ${in_watchlist ? styles.btnActive : ""}`} onClick={handleWatchlist}>
              {in_watchlist ? "✓ In Watchlist" : "+ Watchlist"}
            </button>
            <button className={`${styles.btn} ${my_rating === 1 ? styles.btnActive : ""}`} onClick={() => handleRate(1)}>
              👍 {likes}
            </button>
            <button className={`${styles.btn} ${my_rating === -1 ? styles.btnActive : ""}`} onClick={() => handleRate(-1)}>
              👎 {dislikes}
            </button>

            {(role === 'uploader' || role === 'admin') && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: '1px solid rgba(239, 71, 111, 0.4)',
                  background: 'rgba(239, 71, 111, 0.15)',
                  color: '#EF476F',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginLeft: 12,
                }}
              >
                🗑️ Delete Series
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.seasons}>
        {series.seasons.map((season) => (
          <div key={season.id}>
            <h2 className={styles.seasonHeading}>Season {season.season_number}</h2>
            <div className={styles.episodeList}>
              {season.episodes.map((ep) => {
                const progress = episode_progress[ep.content_id];
                return (
                  <Link key={ep.id} to={`/watch/${ep.content_id}`} className={styles.episode}>
                    <span className={styles.episodeNum}>{ep.episode_number}</span>
                    <span className={styles.episodeTitle}>{ep.title || `Episode ${ep.episode_number}`}</span>
                    {progress != null && (
                      <div className={styles.episodeProgress}>
                        <div className={styles.episodeProgressFill} style={{ width: "60%" }} />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <DeleteSafetyModal
        isOpen={isDeleteOpen}
        title={series.title}
        onConfirm={handleDeleteSeries}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}