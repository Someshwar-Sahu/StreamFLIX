import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { SelectedVideoTrackType } from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config';
import api from '../api/client';
import { getContentDetails, toggleWatchlist, rateContent, clearRating } from '../api/interactions';

type Track = { index: number; height?: number; bitrate?: number };

export default function Watch() {
  const route = useRoute<any>();
  const { id, title } = route.params;
  const uri = `${API_BASE_URL}/media/${id}/master.m3u8`;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedHeight, setSelectedHeight] = useState<number | 'auto'>('auto');
  const [details, setDetails] = useState<any>(null);
  const videoRef = useRef<any>(null);
  const resumeAppliedRef = useRef(false);
  const lastReportedRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);

  useEffect(() => {
    getContentDetails(id).then(setDetails).catch(() => {});
  }, [id]);

  useEffect(() => {
    api.get('/watch-history').then((res) => {
      const entry = res.data.find((h: any) => h.content_id === Number(id));
      if (entry && entry.progress_seconds > 5) {
        resumeAppliedRef.current = false;
        (Watch as any)._resumeSeconds = entry.progress_seconds;
      } else {
        (Watch as any)._resumeSeconds = null;
      }
    }).catch(() => {
      (Watch as any)._resumeSeconds = null;
    });
  }, [id]);

  function sendProgress() {
    if (currentTimeRef.current < 1) return;
    api.post('/watch-history', {
      content_id: Number(id),
      progress_seconds: Math.floor(currentTimeRef.current),
      duration_seconds: durationRef.current ? Math.floor(durationRef.current) : null,
    }).catch(() => {});
  }

  function handleLoad(data: any) {
    durationRef.current = data.duration;
    const resumeSeconds = (Watch as any)._resumeSeconds;
    if (resumeSeconds && !resumeAppliedRef.current && videoRef.current) {
      videoRef.current.seek(resumeSeconds);
      resumeAppliedRef.current = true;
    }
  }

  function handleProgress(data: any) {
    currentTimeRef.current = data.currentTime;
    if (data.currentTime - lastReportedRef.current >= 10) {
      lastReportedRef.current = data.currentTime;
      sendProgress();
    }
  }

  useEffect(() => {
    return () => { sendProgress(); };
  }, []);

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

  return (
    <SafeAreaView style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri }}
        style={styles.video}
        controls
        resizeMode="contain"
        onLoad={handleLoad}
        onProgress={handleProgress}
        selectedVideoTrack={
          selectedHeight === 'auto'
            ? { type: SelectedVideoTrackType.AUTO }
            : { type: SelectedVideoTrackType.RESOLUTION, value: selectedHeight }
        }
        onVideoTracks={(e) => setTracks(e.videoTracks)}
      />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>{title}</Text>

        {details && (
          <View style={styles.interactionRow}>
            <TouchableOpacity style={[styles.pillBtn, details.in_watchlist && styles.pillBtnActive]} onPress={handleWatchlist}>
              <Text style={[styles.pillText, details.in_watchlist && styles.pillTextActive]}>
                {details.in_watchlist ? '✓ Watchlist' : '+ Watchlist'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, details.my_rating === 1 && styles.pillBtnActive]} onPress={() => handleRate(1)}>
              <Text style={[styles.pillText, details.my_rating === 1 && styles.pillTextActive]}>👍 {details.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pillBtn, details.my_rating === -1 && styles.pillBtnActive]} onPress={() => handleRate(-1)}>
              <Text style={[styles.pillText, details.my_rating === -1 && styles.pillTextActive]}>👎 {details.dislikes}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.qualityRow}>
          <TouchableOpacity style={[styles.chip, selectedHeight === 'auto' && styles.chipActive]} onPress={() => setSelectedHeight('auto')}>
            <Text style={styles.chipText}>Auto</Text>
          </TouchableOpacity>
          <Text style={styles.qualityLabel}>Playing: {selectedHeight === 'auto' ? 'Auto' : `${selectedHeight}p`}</Text>
          {tracks
            .filter((t) => t.height)
            .sort((a, b) => (b.height || 0) - (a.height || 0))
            .map((t) => (
              <TouchableOpacity key={t.index} style={[styles.chip, selectedHeight === t.height && styles.chipActive]} onPress={() => setSelectedHeight(t.height!)}>
                <Text style={styles.chipText}>{t.height}p</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { fontSize: 20, fontWeight: '700', color: '#F5F5F0', marginBottom: 14 },
  video: { width: '100%', height: 220, backgroundColor: '#000' },
  interactionRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  pillBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', backgroundColor: '#171B24' },
  pillBtnActive: { borderColor: '#F2A93B' },
  pillText: { color: '#8A8F98', fontSize: 12, fontWeight: '500' },
  pillTextActive: { color: '#F2A93B' },
  qualityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  chip: { borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#171B24' },
  chipActive: { borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.15)' },
  chipText: { color: '#F5F5F0', fontSize: 12 },
  qualityLabel: { color: '#8A8F98', fontSize: 12 },
});