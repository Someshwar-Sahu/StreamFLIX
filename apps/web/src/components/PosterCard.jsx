import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { resolveMediaUrl } from "../api/media";
import styles from "../styles/PosterCard.module.css";

export default function PosterCard({ to, title, posterUrl, status, progressPct, item, badgeText }) {
  const navigate = useNavigate();
  const finalTitle = title || item?.title || "Untitled";
  const rawPoster = posterUrl || item?.poster_url || item?.thumbnail_url || item?.posterUrl;
  const finalPoster = resolveMediaUrl(rawPoster);
  const itemType = item?.type || (item?.seasons ? "series" : "movie");
  const itemId = item?.id || item?.content_id;
  const finalTo = to || (itemType === "series" ? `/series/${itemId}` : `/movie/${itemId}`);

  // Deterministic mock match score (94% - 99%)
  const matchScore = 94 + (((itemId || 1) * 7) % 5);

  const handleQuickPlay = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(itemType === "series" ? `/series/${itemId}` : `/watch/${itemId}`);
  };

  return (
    <Link to={finalTo} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.posterWrap}>
          {finalPoster ? (
            <img src={finalPoster} alt={finalTitle} className={styles.poster} loading="lazy" />
          ) : (
            <div className={styles.placeholder}>{finalTitle[0]?.toUpperCase()}</div>
          )}

          {badgeText && <span className={styles.topBadge}>{badgeText}</span>}
          <span className={styles.qualityBadge}>4K HDR</span>

          {/* Slide-Up Metadata Overlay matching Stitch Designs */}
          <div className={styles.overlay}>
            <div className={styles.metaRow}>
              <span className={styles.matchScore}>{matchScore}% Match</span>
              <span className={styles.ratingTag}>TV-MA</span>
            </div>
            <div className={styles.overlayTitle}>{finalTitle}</div>
            <div className={styles.overlayActions}>
              <div className={styles.playCircleBtn} onClick={handleQuickPlay} title="Instant Play">
                <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
              </div>
            </div>
          </div>

          {progressPct != null && (
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>

        <p className={styles.title}>{finalTitle}</p>
      </div>
    </Link>
  );
}