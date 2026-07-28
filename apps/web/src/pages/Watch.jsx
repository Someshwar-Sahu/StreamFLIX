import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";
import api from "../api/client";
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from "../api/interactions";
import styles from "../styles/Watch.module.css";

export default function Watch() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [activeLevel, setActiveLevel] = useState("Auto");
  const resumeAppliedRef = useRef(false);
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    const src = `http://localhost:8000/media/${id}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => setLevels(data.levels));
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setActiveLevel(level ? `${level.height}p` : "Auto");
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, [id]);

  useEffect(() => {
    getContentDetails(id).then(setDetails).catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get("/watch-history").then((res) => {
      const entry = res.data.find((h) => h.content_id === Number(id));
      if (entry && entry.progress_seconds > 5 && !resumeAppliedRef.current) {
        const video = videoRef.current;
        const applyResume = () => {
          video.currentTime = entry.progress_seconds;
          resumeAppliedRef.current = true;
        };
        video.addEventListener("loadedmetadata", applyResume, { once: true });
      }
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    const video = videoRef.current;
    let interval = null;

    function sendProgress() {
      if (!video || video.currentTime < 1) return;
      api.post("/watch-history", {
        content_id: Number(id),
        progress_seconds: Math.floor(video.currentTime),
        duration_seconds: video.duration ? Math.floor(video.duration) : null,
      }).catch(() => {});
    }

    function startInterval() { if (!interval) interval = setInterval(sendProgress, 10000); }
    function stopInterval() {
      if (interval) { clearInterval(interval); interval = null; }
      sendProgress();
    }

    video.addEventListener("play", startInterval);
    video.addEventListener("pause", stopInterval);
    window.addEventListener("beforeunload", sendProgress);

    return () => {
      video.removeEventListener("play", startInterval);
      video.removeEventListener("pause", stopInterval);
      window.removeEventListener("beforeunload", sendProgress);
      stopInterval();
    };
  }, [id]);

  function handleQualityChange(e) {
    const value = Number(e.target.value);
    setCurrentLevel(value);
    if (hlsRef.current) hlsRef.current.currentLevel = value;
  }

  async function handleWatchlist() {
    await toggleWatchlist(Number(id), details.in_watchlist);
    setDetails((d) => ({ ...d, in_watchlist: !d.in_watchlist }));
  }

  async function handleRate(value) {
    if (details.my_rating === value) {
      await clearRating(Number(id));
      setDetails((d) => ({ ...d, my_rating: null }));
    } else {
      await rateContent(Number(id), value);
      setDetails((d) => ({ ...d, my_rating: value }));
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.playerWrap}>
        <video ref={videoRef} className={styles.video} controls />
      </div>
      <div className={styles.info}>
        <Link to="/" className={styles.back}>← Back to Catalog</Link>
        <h1 className={styles.title}>{details?.content?.title || `Content #${id}`}</h1>
        <div className={styles.controls}>
          {details && (
            <>
              <button className={`${styles.btn} ${details.in_watchlist ? styles.btnActive : ""}`} onClick={handleWatchlist}>
                {details.in_watchlist ? "✓ In Watchlist" : "+ Watchlist"}
              </button>
              <button className={`${styles.btn} ${details.my_rating === 1 ? styles.btnActive : ""}`} onClick={() => handleRate(1)}>
                👍 {details.likes}
              </button>
              <button className={`${styles.btn} ${details.my_rating === -1 ? styles.btnActive : ""}`} onClick={() => handleRate(-1)}>
                👎 {details.dislikes}
              </button>
            </>
          )}
          <span className={styles.qualityBadge}>Playing: {activeLevel}</span>
          {levels.length > 0 && (
            <select className={styles.select} value={currentLevel} onChange={handleQualityChange}>
              <option value={-1}>Auto</option>
              {levels.map((level, index) => (
                <option key={index} value={index}>{level.height}p</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}