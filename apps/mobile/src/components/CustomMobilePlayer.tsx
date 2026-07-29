import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import Video, { SelectedVideoTrackType } from 'react-native-video';
import { DESIGN_TOKENS } from '@streamflix/ui';

type Props = {
  sourceUri: string;
  title: string;
  onBackPress?: () => void;
  onProgressReport?: (currentTime: number, duration: number) => void;
  onOpenQualityModal?: () => void;
  tracks?: any[];
  selectedHeight?: number | 'auto';
  onSelectHeight?: (height: number | 'auto') => void;
};

const SPEED_RATES = [0.75, 1.0, 1.25, 1.5, 2.0];

export default function CustomMobilePlayer({
  sourceUri,
  title,
  onBackPress,
  onProgressReport,
  tracks = [],
  selectedHeight = 'auto',
  onSelectHeight,
}: Props) {
  const videoRef = useRef<any>(null);
  const hideTimerRef = useRef<any>(null);

  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rateIdx, setRateIdx] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const currentRate = SPEED_RATES[rateIdx];

  const resetHideTimer = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!paused && !showQualityMenu) {
        Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
          setShowControls(false);
        });
      }
    }, 3200);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [paused, showQualityMenu]);

  const togglePlay = () => {
    setPaused(!paused);
    resetHideTimer();
  };

  const skipSeconds = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    videoRef.current.seek(newTime);
    setCurrentTime(newTime);
    resetHideTimer();
  };

  const cycleSpeed = () => {
    setRateIdx((prev) => (prev + 1) % SPEED_RATES.length);
    resetHideTimer();
  };

  const handleProgress = (data: any) => {
    setCurrentTime(data.currentTime);
    if (onProgressReport) {
      onProgressReport(data.currentTime, duration);
    }
  };

  const handleLoad = (data: any) => {
    setDuration(data.duration);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <TouchableWithoutFeedback onPress={resetHideTimer}>
      <View style={styles.playerContainer}>
        <Video
          ref={videoRef}
          source={{ uri: sourceUri }}
          style={styles.videoStyle}
          paused={paused}
          rate={currentRate}
          resizeMode="contain"
          onLoad={handleLoad}
          onProgress={handleProgress}
          onEnd={() => setPaused(true)}
          selectedVideoTrack={
            selectedHeight === 'auto'
              ? { type: SelectedVideoTrackType.AUTO }
              : { type: SelectedVideoTrackType.RESOLUTION, value: selectedHeight as number }
          }
        />

        {/* Overlay Controls */}
        <Animated.View style={[styles.overlayStyle, { opacity: fadeAnim }]} pointerEvents={showControls ? 'auto' : 'none'}>
          {/* Top Bar */}
          <View style={styles.topBarRow}>
            {onBackPress && (
              <TouchableOpacity onPress={onBackPress} style={styles.backBtnPill}>
                <Text style={styles.backBtnLabel}>←</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.videoTitleText} numberOfLines={1}>{title}</Text>
          </View>

          {/* Center Controls */}
          <View style={styles.centerControlsRow}>
            <TouchableOpacity style={styles.skipCircleBtn} onPress={() => skipSeconds(-10)}>
              <Text style={styles.skipCircleText}>⏮ 10s</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.playMainCircleBtn} onPress={togglePlay}>
              <Text style={styles.playMainCircleText}>{paused ? '▶' : '⏸'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipCircleBtn} onPress={() => skipSeconds(10)}>
              <Text style={styles.skipCircleText}>10s ⏭</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Bar */}
          <View style={styles.bottomBarCol}>
            {/* Progress Bar Track */}
            <View style={styles.progressTrackBar}>
              <View style={[styles.progressFillBar, { width: `${progressPct}%` }]} />
            </View>

            <View style={styles.bottomControlsRow}>
              <Text style={styles.timeLabelText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>

              <View style={styles.rightPillsGroup}>
                {/* Speed Button */}
                <TouchableOpacity style={styles.pillBtnBox} onPress={cycleSpeed}>
                  <Text style={styles.pillBtnText}>⚡ {currentRate}x</Text>
                </TouchableOpacity>

                {/* Quality Button */}
                <TouchableOpacity
                  style={styles.pillBtnBox}
                  onPress={() => setShowQualityMenu(!showQualityMenu)}
                >
                  <Text style={styles.pillBtnText}>⚙️ {selectedHeight === 'auto' ? 'Auto' : `${selectedHeight}p`}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quality Selector Popup */}
          {showQualityMenu && (
            <View style={styles.qualityMenuBox}>
              <TouchableOpacity
                style={[styles.menuRowItem, selectedHeight === 'auto' && styles.menuRowItemActive]}
                onPress={() => {
                  if (onSelectHeight) onSelectHeight('auto');
                  setShowQualityMenu(false);
                }}
              >
                <Text style={[styles.menuRowText, selectedHeight === 'auto' && styles.menuRowTextActive]}>Auto</Text>
              </TouchableOpacity>
              {tracks
                .filter((t) => t.height)
                .sort((a, b) => (b.height || 0) - (a.height || 0))
                .map((t) => (
                  <TouchableOpacity
                    key={t.index}
                    style={[styles.menuRowItem, selectedHeight === t.height && styles.menuRowItemActive]}
                    onPress={() => {
                      if (onSelectHeight) onSelectHeight(t.height);
                      setShowQualityMenu(false);
                    }}
                  >
                    <Text style={[styles.menuRowText, selectedHeight === t.height && styles.menuRowTextActive]}>{t.height}p</Text>
                  </TouchableOpacity>
                ))}
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  playerContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 12,
  },
  videoStyle: {
    width: '100%',
    height: '100%',
  },
  overlayStyle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 17, 23, 0.7)',
    justifyContent: 'space-between',
    padding: 12,
    zIndex: 10,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtnPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnLabel: {
    color: '#F5F5F0',
    fontSize: 14,
    fontWeight: '700',
  },
  videoTitleText: {
    flex: 1,
    color: '#F5F5F0',
    fontSize: 14,
    fontWeight: '700',
  },
  centerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  skipCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(23, 27, 36, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipCircleText: {
    color: '#F5F5F0',
    fontSize: 10,
    fontWeight: '700',
  },
  playMainCircleBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: DESIGN_TOKENS.colors.accentAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playMainCircleText: {
    color: '#0D1117',
    fontSize: 20,
    fontWeight: '700',
  },
  bottomBarCol: {
    gap: 6,
  },
  progressTrackBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFillBar: {
    height: '100%',
    backgroundColor: DESIGN_TOKENS.colors.accentAmber,
  },
  bottomControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeLabelText: {
    color: DESIGN_TOKENS.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  rightPillsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  pillBtnBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillBtnText: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontSize: 10,
    fontWeight: '700',
  },
  qualityMenuBox: {
    position: 'absolute',
    bottom: 40,
    right: 12,
    backgroundColor: '#171B24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(242, 169, 59, 0.4)',
    padding: 4,
    zIndex: 100,
  },
  menuRowItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  menuRowItemActive: {
    backgroundColor: 'rgba(242, 169, 59, 0.15)',
  },
  menuRowText: {
    color: '#F5F5F0',
    fontSize: 11,
  },
  menuRowTextActive: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontWeight: '700',
  },
});
