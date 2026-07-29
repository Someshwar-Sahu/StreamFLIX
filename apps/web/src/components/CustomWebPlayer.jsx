import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import '../styles/CustomWebPlayer.css';

export default function CustomWebPlayer({ src, title, onProgressReport }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [levels, setLevels] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported() && (src.includes('.m3u8') || src.includes('/media/'))) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setLevels(data.levels || []);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        setCurrentLevel(data.level);
      });
      return () => {
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }
  }, [src]);

  const resetHideTimer = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (isPlaying && !showSpeedMenu && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3500);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, showSpeedMenu, showQualityMenu]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skipSeconds = (seconds) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);
    if (onProgressReport) {
      onProgressReport(curr, duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSpeedMenu(false);
  };

  const handleQualityChange = (levelIdx) => {
    setCurrentLevel(levelIdx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx;
    }
    setShowQualityMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const currentQualityLabel =
    currentLevel === -1
      ? 'Auto'
      : levels[currentLevel]?.height
      ? `${levels[currentLevel].height}p`
      : 'HD';

  return (
    <div
      ref={containerRef}
      className="custom-player-wrapper"
      onMouseMove={resetHideTimer}
      onClick={resetHideTimer}
    >
      <video
        ref={videoRef}
        className="custom-player-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />

      <div className={`custom-player-overlay ${!showControls ? 'hidden' : ''}`}>
        {/* Top Header Bar */}
        <div className="player-top-bar">
          <span className="player-title">{title}</span>
        </div>

        {/* Center Play / Skip Controls */}
        <div className="player-center-controls">
          <button className="center-btn" onClick={() => skipSeconds(-10)} title="Rewind 10s">
            ⏮ 10s
          </button>
          <button className="center-btn play-main" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button className="center-btn" onClick={() => skipSeconds(10)} title="Forward 10s">
            10s ⏭
          </button>
        </div>

        {/* Bottom Control Bar */}
        <div className="player-bottom-bar">
          {/* Progress Bar */}
          <div className="progress-wrap" onClick={handleSeek}>
            <div className="progress-bar-fill" style={{ width: `${progressPct}%` }}>
              <div className="progress-knob" />
            </div>
          </div>

          <div className="controls-row">
            <div className="left-controls">
              <button className="control-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? '🔇' : '🔊'}
              </button>
              <span className="time-display">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="right-controls" style={{ position: 'relative' }}>
              {/* Speed Menu Popup */}
              {showSpeedMenu && (
                <div style={popupMenuStyle}>
                  <div style={popupHeaderStyle}>Playback Speed</div>
                  {SPEED_OPTIONS.map((spd) => (
                    <div
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      style={{
                        ...popupItemStyle,
                        color: playbackSpeed === spd ? '#F2A93B' : '#F5F5F0',
                        fontWeight: playbackSpeed === spd ? '700' : 'normal',
                      }}
                    >
                      {spd === 1 ? '1.0x (Normal)' : `${spd}x`}
                    </div>
                  ))}
                </div>
              )}

              {/* Quality Menu Popup */}
              {showQualityMenu && (
                <div style={popupMenuStyle}>
                  <div style={popupHeaderStyle}>Video Quality</div>
                  <div
                    onClick={() => handleQualityChange(-1)}
                    style={{
                      ...popupItemStyle,
                      color: currentLevel === -1 ? '#F2A93B' : '#F5F5F0',
                      fontWeight: currentLevel === -1 ? '700' : 'normal',
                    }}
                  >
                    Auto
                  </div>
                  {levels.map((lvl, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleQualityChange(idx)}
                      style={{
                        ...popupItemStyle,
                        color: currentLevel === idx ? '#F2A93B' : '#F5F5F0',
                        fontWeight: currentLevel === idx ? '700' : 'normal',
                      }}
                    >
                      {lvl.height}p ({Math.round(lvl.bitrate / 1000)} kbps)
                    </div>
                  ))}
                </div>
              )}

              {/* Speed Button */}
              <button
                className="quality-select-btn"
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
              >
                ⚡ {playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}
              </button>

              {/* Quality Button */}
              <button
                className="quality-select-btn"
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
              >
                ⚙️ {currentQualityLabel}
              </button>

              <button className="control-btn" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? '↙' : '⤢'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const popupMenuStyle = {
  position: 'absolute',
  bottom: '100%',
  right: 0,
  backgroundColor: '#171B24',
  border: '1px solid rgba(242, 169, 59, 0.4)',
  borderRadius: '8px',
  marginBottom: 10,
  minWidth: 160,
  padding: '6px 0',
  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
  zIndex: 100,
};

const popupHeaderStyle = {
  padding: '6px 12px',
  color: '#8A8F98',
  fontSize: '11px',
  fontWeight: '700',
  textTransform: 'uppercase',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const popupItemStyle = {
  padding: '8px 14px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'background 0.2s ease',
};
