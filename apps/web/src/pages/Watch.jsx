import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Hls from "hls.js";

export default function Watch() {
  const { id } = useParams();
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1); 
  const [activeLevel, setActiveLevel] = useState('Auto')

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