import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../api/media";
import styles from "../styles/PosterCard.module.css";

export default function PosterCard({ to, title, posterUrl, status, progressPct, item }) {
  const finalTitle = title || item?.title || "Untitled";
  const rawPoster = posterUrl || item?.poster_url || item?.thumbnail_url || item?.posterUrl;
  const finalPoster = resolveMediaUrl(rawPoster);
  const finalStatus = status || item?.status;
  const itemType = item?.type || "movie";
  const itemId = item?.id;
  const finalTo = to || (itemType === "series" ? `/series/${itemId}` : `/watch/${itemId}`);

  return (
    <Link to={finalTo} className={styles.link}>
      <div className={styles.card}>
        <div className={styles.posterWrap}>
          {finalPoster ? (
            <img src={finalPoster} alt={finalTitle} className={styles.poster} />
          ) : (
            <div className={styles.placeholder}>{finalTitle[0]?.toUpperCase()}</div>
          )}
          {finalStatus && finalStatus !== "ready" && <span className={styles.badge}>{finalStatus}</span>}
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