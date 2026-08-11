import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../styles/CustomWebPlayer.css';

export default function CustomWebPlayer({
  src,
  title = 'Now Playing',
  initialTime = 0,
  contentDuration = 0,
  onProgressReport,
  onBackPress,
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const seekbarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime || 0);
  const [duration, setDuration] = useState(contentDuration || 0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [qualityLevel, setQualityLevel] = useState('Auto');
  const [bufferedPercent, setBufferedPercent] = useState(0);

  const [centerPulse, setCenterPulse] = useState(null);
  const [gestureRipple, setGestureRipple] = useState(null);
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const QUALITY_OPTIONS = ['Auto', '1080p', '720p', '480p'];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && isFinite(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      } else if (contentDuration && contentDuration > 0) {
        setDuration(contentDuration);
      }

      if (initialTime && initialTime > 0 && Math.abs(video.currentTime - initialTime) > 1) {
        video.currentTime = initialTime;
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [initialTime, contentDuration]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    if (video.buffered.length > 0 && video.duration > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      setBufferedPercent((bufferedEnd / video.duration) * 100);
    }

    if (onProgressReport) {
      onProgressReport(video.currentTime, duration || video.duration);
    }
  };

  const triggerShowControls = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showSpeedMenu && !showQualityMenu) {
        setShowControls(false);
      }
    }, 3200);
  }, [isPlaying, showSpeedMenu, showQualityMenu]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        setCenterPulse('play');
        setTimeout(() => setCenterPulse(null), 500);
      }).catch((err) => {
        if (err.name !== 'AbortError') console.warn('Play error:', err);
      });
    } else {
      video.pause();
      setIsPlaying(false);
      setCenterPulse('pause');
      setTimeout(() => setCenterPulse(null), 500);
    }
    triggerShowControls();
  }, [triggerShowControls]);

  const seekRelative = useCallback((seconds) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(video.duration || duration || 0, video.currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);

    setGestureRipple({
      type: seconds < 0 ? 'left' : 'right',
      text: seconds < 0 ? '⏮ 10s' : '10s ⏭',
    });
    setTimeout(() => setGestureRipple(null), 700);

    triggerShowControls();
  }, [duration, triggerShowControls]);

  const handleSeekClick = (e) => {
    const rect = seekbarRef.current?.getBoundingClientRect();
    if (!rect || !videoRef.current) return;

    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const targetDuration = duration || videoRef.current.duration || 0;
    const newTime = percentage * targetDuration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerShowControls();
  };

  const handleSeekHover = (e) => {
    const rect = seekbarRef.current?.getBoundingClientRect();
    if (!rect) return;

    const hoverX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, hoverX / rect.width));
    const targetDuration = duration || videoRef.current?.duration || 0;

    setHoverPosition(hoverX);
    setHoverTime(percentage * targetDuration);
  };

  const handleVolumeChange = (newVol) => {
    const video = videoRef.current;
    if (!video) return;

    const vol = parseFloat(newVol);
    video.volume = vol;
    setVolume(vol);
    setIsMuted(vol === 0);
    triggerShowControls();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume > 0 ? volume : 1;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    triggerShowControls();
  };

  const handleSpeedSelect = (spd) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = spd;
    }
    setPlaybackSpeed(spd);
    setShowSpeedMenu(false);
    triggerShowControls();
  };

  const handleQualitySelect = (qual) => {
    setQualityLevel(qual);
    setShowQualityMenu(false);
    triggerShowControls();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
    triggerShowControls();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      switch (e.code) {
        case 'Space':
        case 'KeyK':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
        case 'KeyJ':
          e.preventDefault();
          seekRelative(-10);
          break;
        case 'ArrowRight':
        case 'KeyL':
          e.preventDefault();
          seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekRelative, volume, toggleMute]);

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const totalSecs = Math.floor(secs);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="player-wrapper"
      onMouseMove={triggerShowControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <div className="player-ambient-glow" />

      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        className="player-video-canvas"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
        }}
        playsInline
      />

      {/* Center Animated Play/Pause Pulse */}
      {centerPulse && (
        <div className="player-center-pulse">
          <span className="material-symbols-outlined" style={{ fontSize: 42 }}>
            {centerPulse === 'play' ? 'play_arrow' : 'pause'}
          </span>
        </div>
      )}

      {/* Double-Tap / Gesture Ripple */}
      {gestureRipple && (
        <div className={`player-ripple-gesture ${gestureRipple.type === 'left' ? 'player-ripple-left' : 'player-ripple-right'}`}>
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            {gestureRipple.type === 'left' ? 'replay_10' : 'forward_10'}
          </span>
          <span>{gestureRipple.text}</span>
        </div>
      )}

      {/* HUD Controls Layer */}
      <div className={`player-hud ${showControls ? 'visible' : ''}`}>
        {/* Top Bar */}
        <div className="player-top-bar">
          {onBackPress && (
            <button className="player-back-btn" onClick={onBackPress} title="Back">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <span className="player-title">{title}</span>
          <span className="player-badge-hd">HD 1080p</span>
        </div>

        {/* Bottom HUD */}
        <div className="player-bottom-hud">
          {/* Seekbar */}
          <div
            ref={seekbarRef}
            className="player-seekbar-container"
            onClick={handleSeekClick}
            onMouseMove={handleSeekHover}
            onMouseLeave={() => setHoverTime(null)}
          >
            {hoverTime !== null && (
              <div className="player-time-tooltip" style={{ left: `${hoverPosition}px` }}>
                {formatTime(hoverTime)}
              </div>
            )}
            <div className="player-seekbar-track">
              <div className="player-seekbar-buffered" style={{ width: `${bufferedPercent}%` }} />
              <div className="player-seekbar-progress" style={{ width: `${progressPercent}%` }} />
              <div className="player-seekbar-thumb" style={{ left: `${progressPercent}%` }} />
            </div>
          </div>

          {/* Controls Row */}
          <div className="player-controls-row">
            <div className="player-controls-left">
              <button className="player-btn" onClick={togglePlay} title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>
                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>

              <button className="player-btn" onClick={() => seekRelative(-10)} title="Rewind 10s (Left Arrow)">
                <span className="material-symbols-outlined">replay_10</span>
              </button>

              <button className="player-btn" onClick={() => seekRelative(10)} title="Forward 10s (Right Arrow)">
                <span className="material-symbols-outlined">forward_10</span>
              </button>

              {/* Volume Group */}
              <div className="player-volume-group">
                <button className="player-btn" onClick={toggleMute} title={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
                  <span className="material-symbols-outlined">
                    {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                  </span>
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  className="player-volume-slider"
                  title="Volume (Up/Down Arrows)"
                />
              </div>

              {/* Time Display */}
              <div className="player-time-display">
                <span className="current">{formatTime(currentTime)}</span> / {formatTime(duration)}
              </div>
            </div>

            <div className="player-controls-right">
              {/* Speed Menu Toggle */}
              <div style={{ position: 'relative' }}>
                <button
                  className="player-btn"
                  onClick={() => {
                    setShowSpeedMenu((prev) => !prev);
                    setShowQualityMenu(false);
                  }}
                  title="Playback Speed"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  {playbackSpeed}x
                </button>

                {showSpeedMenu && (
                  <div className="player-menu-popover" style={{ right: 0 }}>
                    <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Playback Speed
                    </div>
                    {SPEED_OPTIONS.map((spd) => (
                      <button
                        key={spd}
                        className={`player-menu-item ${playbackSpeed === spd ? 'active' : ''}`}
                        onClick={() => handleSpeedSelect(spd)}
                      >
                        <span>{spd === 1.0 ? 'Normal (1.0x)' : `${spd}x`}</span>
                        {playbackSpeed === spd && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality Menu Toggle */}
              <div style={{ position: 'relative' }}>
                <button
                  className="player-btn"
                  onClick={() => {
                    setShowQualityMenu((prev) => !prev);
                    setShowSpeedMenu(false);
                  }}
                  title="Quality Settings"
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>

                {showQualityMenu && (
                  <div className="player-menu-popover" style={{ right: 0 }}>
                    <div style={{ padding: '4px 8px', fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Video Quality
                    </div>
                    {QUALITY_OPTIONS.map((qual) => (
                      <button
                        key={qual}
                        className={`player-menu-item ${qualityLevel === qual ? 'active' : ''}`}
                        onClick={() => handleQualitySelect(qual)}
                      >
                        <span>{qual === 'Auto' ? 'Auto (Recommended)' : qual}</span>
                        {qualityLevel === qual && <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Picture in Picture */}
              {document.pictureInPictureEnabled && (
                <button
                  className="player-btn"
                  onClick={() => {
                    if (document.pictureInPictureElement) {
                      document.exitPictureInPicture();
                    } else if (videoRef.current) {
                      videoRef.current.requestPictureInPicture();
                    }
                  }}
                  title="Picture in Picture"
                >
                  <span className="material-symbols-outlined">picture_in_picture_alt</span>
                </button>
              )}

              {/* Fullscreen Button */}
              <button className="player-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
                <span className="material-symbols-outlined">
                  {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
