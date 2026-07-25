import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";
import api from "../api/client";

export default function Watch() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [activeLevel, setActiveLevel] = useState('Auto');
  const resumeAppliedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;
    const src = `http://localhost:8000/media/${id}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLevels(data.levels);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = hls.levels[data.level];
        setActiveLevel(level ? `${level.height}p` : 'Auto');
      });
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
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

    function startInterval() {
      if (!interval) interval = setInterval(sendProgress, 10000);
    }
    function stopInterval() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
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
    if (hlsRef.current) {
      hlsRef.current.currentLevel = value;
    }
  }

  return (
    <div>
      <h1>Watching content #{id}</h1>
      <video ref={videoRef} controls width="640" />
      <span style={{ color: '#888', fontSize: '12px' }}>Playing: {activeLevel}</span>
      {levels.length > 0 && (
        <div style={{ marginTop: "8px" }}>
          <label>Quality: </label>
          <select value={currentLevel} onChange={handleQualityChange}>
            <option value={-1}>Auto</option>
            {levels.map((level, index) => (
              <option key={index} value={index}>
                {level.height}p
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}