import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video from 'react-native-video';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from '../api/interactions';
import DeleteSafetyModal from '../components/DeleteSafetyModal';
import { isContentDownloaded, saveDownload, removeDownload, DownloadQuality } from '../utils/downloads';
import { formatMbSize } from '../utils/formatters';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function Watch({ route, navigation }: any) {
  const { id, title: routeTitle } = route.params;
  const { role } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const durationRef = useRef<number>(0);
  const lastSyncedTimeRef = useRef<number>(0);

  useEffect(() => {
    let timer: any = null;
    async function loadData() {
      try {
        const d = await getContentDetails(id);
        setDetails(d);
        if (d.status === 'processing') {
          timer = setTimeout(loadData, 3000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    setIsDownloaded(isContentDownloaded(id));
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  function handleProgressReport(data: any) {
    const currentTime = data.currentTime;
    if (data.seekableDuration) {
      durationRef.current = data.seekableDuration;
    }
    if (currentTime > 3 && (currentTime - lastSyncedTimeRef.current >= 30 || currentTime < lastSyncedTimeRef.current)) {
      lastSyncedTimeRef.current = currentTime
      api.post('/watch-history', {
        content_id: Number(id),
        progress_seconds: Math.floor(currentTime),
        duration_seconds: durationRef.current ? Math.floor(durationRef.current) : null,
      }).catch(() => {});
    }
  }

  useEffect(() => {
    return () => {
      if (lastSyncedTimeRef.current > 0){
        api.post('/watch-history', {
          content_id: Number(id),
          progress_seconds: Math.floor(lastSyncedTimeRef.current),
          duration_seconds: durationRef.current ? Math.floor(durationRef.current) : null
        }).catch(() => {})
      }
    }
  }, [id])

  async function handleWatchlist() {
    if (!details) return;
    setDetails((d: any) => ({ ...d, in_watchlist: !d.in_watchlist }));
    await toggleWatchlist(Number(id), details.in_watchlist);
  }

  async function handleRate(value: number) {
    if (!details) return;
    const oldRating = details.my_rating;

    setDetails((prev: any) => {
      let newLikes = prev.likes || 0;
      let newDislikes = prev.dislikes || 0;
      let newRating: number | null = value;

      if (oldRating === value) {
        newRating = null;
        if (value === 1) newLikes = Math.max(0, newLikes - 1);
        if (value === -1) newDislikes = Math.max(0, newDislikes - 1);
      } else {
        if (value === 1) {
          newLikes += 1;
          if (oldRating === -1) newDislikes = Math.max(0, newDislikes - 1);
        } else if (value === -1) {
          newDislikes += 1;
          if (oldRating === 1) newLikes = Math.max(0, newLikes - 1);
        }
      }

      return {
        ...prev,
        my_rating: newRating,
        likes: newLikes,
        dislikes: newDislikes,
      };
    });

    try {
      if (oldRating === value) {
        await clearRating(Number(id));
      } else {
        await rateContent(Number(id), value);
      }
      const fresh = await getContentDetails(id);
      setDetails(fresh);
    } catch (err) {
      console.error(err);
    }
  }

  function handleToggleDownload() {
    if (isDownloaded) {
      removeDownload(id);
      setIsDownloaded(false);
    } else {
      setShowQualityModal(true);
    }
  }

  const activeDuration = durationRef.current || (details?.duration ? details.duration : 5400);

  const getDynamicSize = (quality: DownloadQuality): number => {
    return formatMbSize(activeDuration, quality);
  };

  const formatDurLabel = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    if (mins > 0) return `${mins}m ${s}s`;
    return `${s}s`;
  };

  function handleSelectDownloadQuality(quality: DownloadQuality) {
    const calculatedMb = getDynamicSize(quality);
    saveDownload({
      id: Number(id),
      title: details?.title || routeTitle || `Title #${id}`,
      poster_url: details?.thumbnail_url || null,
      duration: activeDuration,
      quality,
      sizeMb: calculatedMb,
    });
    setIsDownloaded(true);
    setShowQualityModal(false);
  }

  async function handleDeleteContent() {
    await api.delete(`/content/${id}`);
    navigation.navigate('Movies');
  }

  const videoUri = resolveMediaUrl(`/content/${id}/stream/master.m3u8`) || '';
  const isProcessing = details?.status === 'processing';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.playerWrap}>
        <Video
          source={{ uri: videoUri }}
          style={styles.defaultVideo}
          controls={true}
          resizeMode="contain"
          onProgress={handleProgressReport}
          onLoad={(meta) => {
            if (meta.duration) durationRef.current = meta.duration;
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isProcessing && (
          <View style={styles.processingCard}>
            <ActivityIndicator color={DESIGN_TOKENS.colors.accentAmber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.processingTitle}>⏳ Video Transcoding in Progress...</Text>
              <Text style={styles.processingSub}>Your video will automatically start playing once ready.</Text>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={DESIGN_TOKENS.colors.accentAmber} style={{ marginTop: 20 }} />
        ) : (
          details && (
            <View style={styles.detailsBox}>
              <Text style={styles.title}>{details.title}</Text>
              <Text style={styles.description}>
                {details.description || 'Enjoy watching on StreamFlix in HD.'}
              </Text>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btn, details.in_watchlist && styles.btnActive]}
                  onPress={handleWatchlist}
                >
                  <Text style={[styles.btnText, details.in_watchlist && styles.btnTextActive]}>
                    {details.in_watchlist ? '✓ Saved' : '+ Watchlist'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, details.my_rating === 1 && styles.btnActive]}
                  onPress={() => handleRate(1)}
                >
                  <Text style={[styles.btnText, details.my_rating === 1 && styles.btnTextActive]}>
                    👍 {details.likes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, details.my_rating === -1 && styles.btnDangerActive]}
                  onPress={() => handleRate(-1)}
                >
                  <Text style={[styles.btnText, details.my_rating === -1 && styles.btnTextDanger]}>
                    👎 {details.dislikes}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, isDownloaded && styles.btnActive]}
                  onPress={handleToggleDownload}
                >
                  <Text style={[styles.btnText, isDownloaded && styles.btnTextActive]}>
                    {isDownloaded ? '✓ Downloaded' : '📥 Download'}
                  </Text>
                </TouchableOpacity>
              </View>

              {(role === 'uploader' || role === 'admin') && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => setIsDeleteOpen(true)}
                >
                  <Text style={styles.deleteBtnText}>🗑️ Delete Movie</Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )}
      </ScrollView>

      <Modal
        visible={showQualityModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowQualityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowQualityModal(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalHeading}>Select Download Quality</Text>
            <Text style={styles.modalSubheading}>
              Video Duration: {formatDurLabel(activeDuration)}
            </Text>

            <TouchableOpacity
              style={styles.qualityOption}
              onPress={() => handleSelectDownloadQuality('1080p')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionTitle}>🌟 1080p Full HD</Text>
                <Text style={styles.optionSub}>Best Video & High Fidelity Audio</Text>
              </View>
              <Text style={styles.optionSize}>{getDynamicSize('1080p')} MB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qualityOption}
              onPress={() => handleSelectDownloadQuality('720p')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionTitle}>🎬 720p High Definition</Text>
                <Text style={styles.optionSub}>Standard HD Quality</Text>
              </View>
              <Text style={styles.optionSize}>{getDynamicSize('720p')} MB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qualityOption}
              onPress={() => handleSelectDownloadQuality('480p')}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionTitle}>📱 480p Data Saver</Text>
                <Text style={styles.optionSub}>Optimized for Storage & Speed</Text>
              </View>
              <Text style={styles.optionSize}>{getDynamicSize('480p')} MB</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowQualityModal(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <DeleteSafetyModal
        visible={isDeleteOpen}
        title={details?.title || 'this movie'}
        onConfirm={handleDeleteContent}
        onClose={() => setIsDeleteOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  playerWrap: { height: 220, backgroundColor: '#000000', overflow: 'hidden' },
  defaultVideo: { width: '100%', height: '100%' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(242, 169, 59, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(242, 169, 59, 0.4)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  processingTitle: { color: DESIGN_TOKENS.colors.accentAmber, fontSize: 13, fontWeight: '700' },
  processingSub: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 11, marginTop: 2 },
  detailsBox: { marginTop: 8 },
  title: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 8 },
  description: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 20 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 },
  btn: {
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  btnActive: {
    backgroundColor: 'rgba(242, 169, 59, 0.15)',
    borderColor: DESIGN_TOKENS.colors.accentAmber,
  },
  btnDangerActive: {
    backgroundColor: 'rgba(239, 71, 111, 0.15)',
    borderColor: DESIGN_TOKENS.colors.dangerRed,
  },
  btnText: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 13, fontWeight: '600' },
  btnTextActive: { color: DESIGN_TOKENS.colors.accentAmber },
  btnTextDanger: { color: DESIGN_TOKENS.colors.dangerRed },
  deleteBtn: {
    backgroundColor: 'rgba(239, 71, 111, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 71, 111, 0.4)',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  deleteBtnText: { color: DESIGN_TOKENS.colors.dangerRed, fontWeight: '700', fontSize: 14 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#131722',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(242, 169, 59, 0.3)',
  },
  modalHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubheading: {
    color: '#8A8F98',
    fontSize: 13,
    marginBottom: 20,
  },
  qualityOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  optionLeft: {
    flex: 1,
  },
  optionTitle: {
    color: '#F5F5F0',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionSub: {
    color: '#8A8F98',
    fontSize: 11,
  },
  optionSize: {
    color: '#F2A93B',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  cancelBtnText: {
    color: '#F5F5F0',
    fontSize: 14,
    fontWeight: '600',
  },
});