import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Video, { SelectedVideoTrackType } from 'react-native-video';
import { useRoute } from '@react-navigation/native';
import { API_BASE_URL } from '../config';

type Track = { index: number; height?: number; bitrate?: number };

export default function Watch() {
  const route = useRoute<any>();
  const { id, title } = route.params;
  const uri = `${API_BASE_URL}/media/${id}/master.m3u8`;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedHeight, setSelectedHeight] = useState<number | 'auto'>('auto');

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>{title}</Text>
      <Video
        source={{ uri }}
        style={styles.video}
        controls
        resizeMode="contain"
        selectedVideoTrack={
          selectedHeight === 'auto'
            ? { type: SelectedVideoTrackType.AUTO }
            : { type: SelectedVideoTrackType.RESOLUTION, value: selectedHeight }
        }
        onVideoTracks={(e) => setTracks(e.videoTracks)}
      />
      <View style={styles.qualityRow}>
        <TouchableOpacity
          style={[styles.chip, selectedHeight === 'auto' && styles.chipActive]}
          onPress={() => setSelectedHeight('auto')}
        >
          <Text style={styles.chipText}>Auto</Text>
        </TouchableOpacity>
        <Text style={{ color: '#888', fontSize: 12, paddingHorizontal: 16 }}>
          Playing: {selectedHeight === 'auto' ? 'Auto' : `${selectedHeight}p`}
        </Text>
        {tracks
          .filter((t) => t.height)
          .sort((a, b) => (b.height || 0) - (a.height || 0))
          .map((t) => (
            <TouchableOpacity
              key={t.index}
              style={[styles.chip, selectedHeight === t.height && styles.chipActive]}
              onPress={() => setSelectedHeight(t.height!)}
            >
              <Text style={styles.chipText}>{t.height}p</Text>
            </TouchableOpacity>
          ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { fontSize: 18, fontWeight: 'bold', color: '#fff', padding: 16 },
  video: { width: '100%', height: 220 },
  qualityRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 8 },
  chip: { borderWidth: 1, borderColor: '#333', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { borderColor: '#1e90ff', backgroundColor: '#1e90ff33' },
  chipText: { color: '#fff' },
});