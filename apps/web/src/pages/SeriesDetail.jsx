import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../api/AuthContext";
import { getSeriesDetails, toggleSeriesWatchlist, rateSeries, clearSeriesRating } from "../api/interactions";
import AnimatedModal from "../components/AnimatedModal";
import { useToast } from "../context/ToastContext";
import styles from "../styles/SeriesDetail.module.css";
import { resolveMediaUrl } from "../api/media";

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();
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
    showToast(in_watchlist ? "Removed from your watchlist." : "Added to your watchlist!", "success");
  }

  async function handleRate(value) {
    if (my_rating === value) {
      await clearSeriesRating(Number(id));
      setData((d) => ({ ...d, my_rating: null }));
    } else {
      await rateSeries(Number(id), value);
      setData((d) => ({ ...d, my_rating: value }));
      showToast(value === 1 ? "Marked as liked!" : "Feedback recorded.", "info");
    }
  }

  const handleDeleteSeries = async () => {
    await api.delete(`/series/${id}`);
    showToast(`Series "${series.title}" deleted successfully.`, "info");
    navigate('/series');
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {series.poster_url && (
          <img
            src={resolveMediaUrl(series.poster_url)}
            alt={series.title}
            className={styles.poster}
          />
        )}
        <div>
          <Link to="/series" className={styles.back}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            Back to Series
          </Link>
          <h1 className={styles.title}>{series.title}</h1>
          {series.description && <p className={styles.desc}>{series.description}</p>}
          <div className={styles.controls}>
            <button
              className={`${styles.btn} ${in_watchlist ? styles.btnActive : ""}`}
              onClick={handleWatchlist}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                {in_watchlist ? "check" : "add"}
              </span>
              {in_watchlist ? "In Watchlist" : "Add to Watchlist"}
            </button>
            <button
              className={`${styles.btn} ${my_rating === 1 ? styles.btnActive : ""}`}
              onClick={() => handleRate(1)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: my_rating === 1 ? "'FILL' 1" : "'FILL' 0" }}>
                thumb_up
              </span>
              {likes}
            </button>
            <button
              className={`${styles.btn} ${my_rating === -1 ? styles.btnActive : ""}`}
              onClick={() => handleRate(-1)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: my_rating === -1 ? "'FILL' 1" : "'FILL' 0" }}>
                thumb_down
              </span>
              {dislikes}
            </button>

            {(role === 'uploader' || role === 'admin') && (
              <button
                onClick={() => setIsDeleteOpen(true)}
                className={styles.btnDelete}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                Delete Series
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
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-red)', fontSize: 24 }}>
                      play_circle
                    </span>
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

      <AnimatedModal
        isOpen={isDeleteOpen}
        title="Delete TV Series"
        message={`Are you sure you want to delete "${series.title}" and all of its seasons/episodes? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Series"
        onConfirm={handleDeleteSeries}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}