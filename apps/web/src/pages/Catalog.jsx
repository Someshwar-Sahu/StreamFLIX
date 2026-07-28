import { useEffect, useState } from "react";
import api from "../api/client";
import { getContent, getSeries, getTrending, getCategories } from "../api/catalog";
import PosterCard from "../components/PosterCard";
import styles from "../styles/Catalog.module.css";
import { resolveMediaUrl } from "../api/media";

export default function Catalog() {
  const [content, setContent] = useState([]);
  const [series, setSeries] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  function fetchAll() {
    getContent({ q: q || undefined, category: activeCategory || undefined }).then(setContent);
    getSeries().then(setSeries);
    getTrending().then((t) => setTrending(t.overall || []));
  }

  function fetchContinueWatching() {
    api.get("/watch-history").then((res) => setContinueWatching(res.data)).catch(() => setContinueWatching([]));
  }

  function removeItem(contentId) {
    api.delete(`/watch-history/${contentId}`).then(fetchContinueWatching).catch(() => {});
  }

  function clearAll() {
    api.delete("/watch-history").then(fetchContinueWatching).catch(() => {});
  }

  useEffect(() => { getCategories().then(setCategories); }, []);
  useEffect(() => { fetchAll(); }, [q, activeCategory]);
  useEffect(() => {
    fetchContinueWatching();
    function onVisible() {
      if (document.visibilityState === "visible") { fetchAll(); fetchContinueWatching(); }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          placeholder="Search titles..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className={`${styles.chip} ${!activeCategory ? styles.chipActive : ""}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            className={`${styles.chip} ${activeCategory === c.name ? styles.chipActive : ""}`}
            onClick={() => setActiveCategory(c.name)}
          >
            {c.name}
          </button>
        ))}
      </div>

      {trending.length > 0 && (
        <>
          <h2 className={styles.rowHeading}>Trending Now</h2>
          <div className={styles.row}>
            {trending.map((item) => (
              <PosterCard
                key={`${item.type}-${item.id}`}
                to={item.type === "movie" ? `/watch/${item.id}` : `/series/${item.id}`}
                title={item.title}
                posterUrl={resolveMediaUrl(item.poster_url)}
              />
            ))}
          </div>
        </>
      )}

      {continueWatching.length > 0 && (
        <>
          <h2 className={styles.rowHeading}>
            Continue Watching
            <button className={styles.clearAll} onClick={clearAll}>Clear All</button>
          </h2>
          <div className={styles.row}>
            {continueWatching.map((item) => {
              const pct = item.duration_seconds
                ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
                : 0;
              return (
                <div key={item.content_id} style={{ position: "relative" }}>
                  <PosterCard to={`/watch/${item.content_id}`} title={item.title} posterUrl={null} progressPct={pct} />
                  <button
                    onClick={() => removeItem(item.content_id)}
                    style={{ position: "absolute", top: 4, left: 4, fontSize: 10, background: "rgba(13,17,23,0.85)", color: "#8A8F98", border: "none", borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className={styles.rowHeading}>Movies</h2>
      <div className={styles.grid}>
        {content.length === 0 && <p className={styles.empty}>No movies found.</p>}
        {content.map((item) => (
          <PosterCard key={item.id} to={`/watch/${item.id}`} title={item.title} posterUrl={resolveMediaUrl(item.thumbnail_url)} status={item.status} />
        ))}
      </div>

      <h2 className={styles.rowHeading}>Series</h2>
      <div className={styles.grid}>
        {series.length === 0 && <p className={styles.empty}>No series found.</p>}
        {series.map((s) => (
          <PosterCard key={s.id} to={`/series/${s.id}`} title={s.title} posterUrl={resolveMediaUrl(s.poster_url)} />
        ))}
      </div>
    </div>
  );
}