import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from '../api/interactions';
import CustomMobilePlayer from '../components/CustomMobilePlayer';
import DownloadQualityModal, { QualityOption } from '../components/DownloadQualityModal';
import DeleteSafetyModal from '../components/DeleteSafetyModal';
import { addDownloadedItem, isContentDownloaded, removeDownloadedItem } from './DownloadsScreen';

export default function Watch({ navigation }: any) {
  const route = useRoute<any>();
  const { id, title } = route.params;
  const { role } = useAuth();
  const uri = `${API_BASE_URL}/media/${id}/master.m3u8`;

  const [tracks, setTracks] = useState<any[]>([
    { index: 0, height: 1080 },
    { index: 1, height: 720 },
    { index: 2, height: 480 },
  ]);
  const [selectedHeight, setSelectedHeight] = useState<number | 'auto'>('auto');
  const [details, setDetails] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const durationRef = useRef(0);

  useEffect(() => {
    let timer: any;
    async function loadDetails() {
      try {
        const d = await getContentDetails(id);
        setDetails(d);
        if (d && d.status === 'processing') {
          timer = setTimeout(loadDetails, 3000);
        }
      } catch (err) {}
    }
    loadDetails();
    setIsDownloaded(isContentDownloaded(id));
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  function handleProgressReport(currentTime: number, duration: number) {
    durationRef.current = duration;
    if (currentTime > 3) {
      api.post('/watch-history', {
        content_id: Number(id),
        progress_seconds: Math.floor(currentTime),
        duration_seconds: duration ? Math.floor(duration) : null,
      }).catch(() => {});
    }
  }

  async function handleWatchlist() {
    await toggleWatchlist(Number(id), details.in_watchlist);
    setDetails((d: any) => ({ ...d, in_watchlist: !d.in_watchlist }));
  }

  async function handleRate(value: number) {
    if (details.my_rating === value) {
      await clearRating(Number(id));
      setDetails((d: any) => ({ ...d, my_rating: null }));
    } else {
      await rateContent(Number(id), value);
      setDetails((d: any) => ({ ...d, my_rating: value }));
    }
  }

  const handleDeleteContent = async () => {
    await api.delete(`/content/${id}`);
    navigation.goBack();
  };

  const handleDownloadBtnPress = () => {
    if (isDownloaded) {
      Alert.alert('Downloaded', `"${title}" is saved in your offline storage.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Download',
          style: 'destructive',
          onPress: async () => {
            await removeDownloadedItem(id);
            setIsDownloaded(false);
            setDownloadProgress(null);
          },
        },
      ]);
    } else {
      setShowModal(true);
    }
  };

  const handleStartDownload = (option: QualityOption) => {
    setDownloadProgress(10);
    const interval = setInterval(async () => {
      setDownloadProgress((prev) => {
        if (prev === null || prev >= 100) {
          clearInterval(interval);
          addDownloadedItem({
            id: `dl-${id}-${Date.now()}`,
            contentId: id,
            title: title,
            type: 'movie',
            posterUrl: details?.poster_url || details?.thumbnail_url || null,
            sizeMb: option.sizeMb,
            duration: durationRef.current ? `${Math.floor(durationRef.current / 60)}m ${Math.floor(durationRef.current % 60)}s` : '15m',
            resolution: option.resolution,
            downloadedAt: new Date().toLocaleDateString(),
          });
          setIsDownloaded(true);
          return 100;
        }
        return prev + 30;
      });
    }, 350);
  };

  const isProcessing = details && details.status === 'processing';
  const isFailed = details && details.status === 'failed';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Player or Processing Banner */}
      <View style={styles.playerFrameWrap}>
        {isProcessing ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#F2A93B" style={{ marginBottom: 12 }} />
            <Text style={styles.processingTitle}>⏳ Transcoding in Progress...</Text>
            <Text style={styles.processingSub}>
              This video is currently being optimized into multi-bitrate HLS streams for smooth playback.
            </Text>
            <View style={styles.statusChip}>
              <Text style={styles.statusChipText}>STATUS: PROCESSING (AUTO-REFRESHING)</Text>
            </View>
          </View>
        ) : isFailed ? (
          <View style={styles.processingCard}>
            <Text style={styles.failedTitle}>❌ Video Transcoding Failed</Text>
            <Text style={styles.processingSub}>An error occurred while encoding this media file.</Text>
          </View>
        ) : (
          <CustomMobilePlayer
            sourceUri={uri}
            title={title}
            onBackPress={() => navigation.goBack()}
            onProgressReport={handleProgressReport}
            tracks={tracks}
            selectedHeight={selectedHeight}
            onSelectHeight={setSelectedHeight}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>{title}</Text>

        {details && (
          <View style={styles.interactionRow}>
            <TouchableOpacity style={[styles.pillBtn, details.in_watchlist && styles.pillBtnActive]} onPress={handleWatchlist}>
              <Text style={[styles.pillText, details.in_watchlist && styles.pillTextActive]}>
                {details.in_watchlist ? '✓ Watchlist' : '+ Watchlist'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pillBtn, (isDownloaded || downloadProgress !== null) && styles.pillBtnActive]}
              onPress={handleDownloadBtnPress}
              disabled={isProcessing}
            >
              <Text style={[styles.pillText, (isDownloaded || downloadProgress !== null) && styles.pillTextActive]}>
                {isDownloaded
                  ? '✓ Downloaded'
                  : downloadProgress === null
                  ? '📥 Download'
                  : downloadProgress < 100
                  ? `⏳ ${downloadProgress}%`
                  : '✓ Downloaded'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.pillBtn, details.my_rating === 1 && styles.pillBtnActive]} onPress={() => handleRate(1)}>
              <Text style={[styles.pillText, details.my_rating === 1 && styles.pillTextActive]}>👍 {details.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, details.my_rating === -1 && styles.pillBtnActive]} onPress={() => handleRate(-1)}>
              <Text style={[styles.pillText, details.my_rating === -1 && styles.pillTextActive]}>👎 {details.dislikes}</Text>
            </TouchableOpacity>

            {(role === 'uploader' || role === 'admin') && (
              <TouchableOpacity style={styles.deletePillBtn} onPress={() => setShowDeleteModal(true)}>
                <Text style={styles.deletePillText}>🗑️ Delete Movie</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <DownloadQualityModal
        visible={showModal}
        title={title}
        durationSeconds={durationRef.current}
        onClose={() => setShowModal(false)}
        onSelectQuality={handleStartDownload}
      />

      <DeleteSafetyModal
        visible={showDeleteModal}
        title={title}
        onConfirm={handleDeleteContent}
        onClose={() => setShowDeleteModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  playerFrameWrap: { paddingHorizontal: 12, paddingTop: 8 },
  processingCard: {
    height: 220,
    backgroundColor: '#171B24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.4)',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingTitle: { color: '#F2A93B', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  failedTitle: { color: '#EF476F', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  processingSub: { color: '#8A8F98', fontSize: 12, textAlign: 'center', lineHeight: 18, marginBottom: 12 },
  statusChip: { backgroundColor: 'rgba(242,169,59,0.15)', borderWidth: 1, borderColor: '#F2A93B', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusChipText: { color: '#F2A93B', fontSize: 10, fontWeight: '700' },
  header: { fontSize: 20, fontWeight: '700', color: '#F5F5F0', marginBottom: 14 },
  interactionRow: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  pillBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', backgroundColor: '#171B24' },
  pillBtnActive: { borderColor: '#F2A93B' },
  pillText: { color: '#8A8F98', fontSize: 12, fontWeight: '500' },
  pillTextActive: { color: '#F2A93B' },
  deletePillBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(239,71,111,0.4)', backgroundColor: 'rgba(239,71,111,0.15)', marginLeft: 'auto' },
  deletePillText: { color: '#EF476F', fontSize: 12, fontWeight: '700' },
});