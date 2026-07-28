import { Link } from "react-router-dom";
import styles from "../styles/PosterCard.module.css";

export default function PosterCard({ to, title, posterUrl, status, progressPct }) {
  const clickable = status ? status === "ready" : true;
  const card = (
    <div className={styles.card}>
      <div className={styles.posterWrap}>
        {posterUrl ? (
          <img src={posterUrl} alt={title} className={styles.poster} />
        ) : (
          <div className={styles.placeholder}>{title[0]}</div>
        )}
        {status && status !== "ready" && <span className={styles.badge}>{status}</span>}
        {progressPct != null && (
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        )}
      </div>
      <p className={styles.title}>{title}</p>
    </div>
  );
  return clickable ? <Link to={to} className={styles.link}>{card}</Link> : card;
}