import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import '../styles/CustomWebPlayer.css';

export default function CustomWebPlayer({ src, title, onProgressReport, onBackPress }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const hideTimerRef = useRef(null);
  const clickTimerRef = useRef(null);

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
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({ width: 16, height: 9 });

  const [ripple, setRipple] = useState(null);

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
    if (showControls) {
      resetHideTimer();
    } else {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [isPlaying, showSpeedMenu, showQualityMenu, showControls]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase())) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          skipSeconds(-10);
          triggerRipple('rewind');
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          skipSeconds(10);
          triggerRipple('forward');
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((v) => Math.min(1, v + 0.1));
          if (videoRef.current) videoRef.current.volume = Math.min(1, volume + 0.1);
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((v) => Math.max(0, v - 0.1));
          if (videoRef.current) videoRef.current.volume = Math.max(0, volume - 0.1);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [volume, isPlaying]);

  const triggerRipple = (type) => {
    setRipple({ type, id: Date.now() });
    setTimeout(() => setRipple(null), 700);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Click / Double Click Handler: Single click toggles controls visible/hidden!
  const handleContainerClick = (e) => {
    if (clickTimerRef.current) {
      // Double Click Event
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;

      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = clickX / rect.width;

      if (pct < 0.4) {
        skipSeconds(-10);
        triggerRipple('rewind');
      } else if (pct > 0.6) {
        skipSeconds(10);
        triggerRipple('forward');
      } else {
        togglePlay();
      }
    } else {
      // Single Click Event: Toggles controls visible or hidden!
      clickTimerRef.current = setTimeout(() => {
        setShowControls((prev) => !prev);
        clickTimerRef.current = null;
      }, 250);
    }
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
      setVideoDimensions({
        width: videoRef.current.videoWidth || 16,
        height: videoRef.current.videoHeight || 9,
      });
    }
  };

  const handleSeek = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(duration, pos * duration));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleMouseMoveProgress = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(pos * duration);
    setHoverPos(e.clientX - rect.left);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
      setIsMuted(newVol === 0);
    }
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

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
        // Automatic orientation lock based on video dimensions
        if (window.screen && window.screen.orientation && window.screen.orientation.lock) {
          const isHorizontal = videoDimensions.width >= videoDimensions.height;
          window.screen.orientation.lock(isHorizontal ? 'landscape' : 'portrait').catch(() => {});
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
        if (window.screen && window.screen.orientation && window.screen.orientation.unlock) {
          window.screen.orientation.unlock();
        }
      }
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
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
      className={`hotstar-player-container ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={() => { if (showControls) resetHideTimer(); }}
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        className="hotstar-video-element"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      {/* Ripple Feedback */}
      {ripple && (
        <div className={`gesture-ripple-overlay ${ripple.type}`}>
          <div className="ripple-circle">
            <span>{ripple.type === 'rewind' ? '⏮ 10s' : '10s ⏭'}</span>
          </div>
        </div>
      )}

      {/* Hotstar Gradient Overlay */}
      <div className={`hotstar-overlay ${!showControls ? 'hidden' : ''}`}>
        {/* Top Header Bar */}
        <div className="hotstar-top-bar" onClick={(e) => e.stopPropagation()}>
          <div className="hotstar-top-left">
            {onBackPress && (
              <button className="hotstar-back-btn" onClick={onBackPress} title="Back">
                ←
              </button>
            )}
            <div className="hotstar-title-wrap">
              <span className="hotstar-video-title">{title}</span>
              <span className="hotstar-badge">FULL HD • STEREO</span>
            </div>
          </div>
        </div>

        {/* Hotstar Center Controls */}
        <div className="hotstar-center-controls">
          <button className="hotstar-skip-btn" onClick={(e) => { e.stopPropagation(); skipSeconds(-10); triggerRipple('rewind'); }} title="Rewind 10s">
            <span className="skip-icon">↺</span>
            <span className="skip-num">10</span>
          </button>

          <button className="hotstar-main-play-btn" onClick={(e) => { e.stopPropagation(); togglePlay(); }} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#0D1117">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            ) : (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#0D1117" style={{ marginLeft: 4 }}>
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <button className="hotstar-skip-btn" onClick={(e) => { e.stopPropagation(); skipSeconds(10); triggerRipple('forward'); }} title="Forward 10s">
            <span className="skip-icon">↻</span>
            <span className="skip-num">10</span>
          </button>
        </div>

        {/* Hotstar Bottom Controls Bar */}
        <div className="hotstar-bottom-bar" onClick={(e) => e.stopPropagation()}>
          <div
            className="hotstar-progress-container"
            onClick={handleSeek}
            onMouseMove={handleMouseMoveProgress}
            onMouseLeave={() => setHoverTime(null)}
          >
            {hoverTime !== null && (
              <div className="hotstar-time-tooltip" style={{ left: `${hoverPos}px` }}>
                {formatTime(hoverTime)}
              </div>
            )}
            <div className="hotstar-progress-track">
              <div className="hotstar-progress-fill" style={{ width: `${progressPct}%` }}>
                <div className="hotstar-scrubber-knob" />
              </div>
            </div>
          </div>

          <div className="hotstar-controls-row">
            <div className="hotstar-left-group">
              <button className="hotstar-icon-btn" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className="hotstar-volume-group">
                <button className="hotstar-icon-btn" onClick={toggleMute}>
                  {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hotstar-volume-slider"
                />
              </div>

              <span className="hotstar-time-label">
                {formatTime(currentTime)} <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>/</span> {formatTime(duration)}
              </span>
            </div>

            <div className="hotstar-right-group">
              {showSpeedMenu && (
                <div className="hotstar-popup-menu">
                  <div className="hotstar-popup-header">Playback Speed</div>
                  {SPEED_OPTIONS.map((spd) => (
                    <div
                      key={spd}
                      className={`hotstar-popup-item ${playbackSpeed === spd ? 'active' : ''}`}
                      onClick={() => handleSpeedChange(spd)}
                    >
                      <span>{spd === 1 ? '1.0x (Normal)' : `${spd}x`}</span>
                      {playbackSpeed === spd && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              {showQualityMenu && (
                <div className="hotstar-popup-menu">
                  <div className="hotstar-popup-header">Video Quality</div>
                  <div
                    className={`hotstar-popup-item ${currentLevel === -1 ? 'active' : ''}`}
                    onClick={() => handleQualityChange(-1)}
                  >
                    <span>Auto (Recommended)</span>
                    {currentLevel === -1 && <span>✓</span>}
                  </div>
                  {levels.map((lvl, idx) => (
                    <div
                      key={idx}
                      className={`hotstar-popup-item ${currentLevel === idx ? 'active' : ''}`}
                      onClick={() => handleQualityChange(idx)}
                    >
                      <span>{lvl.height}p ({Math.round(lvl.bitrate / 1000)} kbps)</span>
                      {currentLevel === idx && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}

              <button
                className="hotstar-pill-btn"
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowQualityMenu(false);
                }}
              >
                ⚡ {playbackSpeed === 1 ? '1.0x' : `${playbackSpeed}x`}
              </button>

              <button
                className="hotstar-pill-btn"
                onClick={() => {
                  setShowQualityMenu(!showQualityMenu);
                  setShowSpeedMenu(false);
                }}
              >
                ⚙️ {currentQualityLabel}
              </button>

              <button className="hotstar-icon-btn" onClick={toggleFullscreen} title="Fullscreen">
                {isFullscreen ? '↙' : '⤢'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
