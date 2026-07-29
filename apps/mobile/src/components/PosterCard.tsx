import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  title: string;
  posterUrl: string | null;
  status?: string;
  progressPct?: number;
  onPress: () => void;
};

export default function PosterCard({ title, posterUrl, status, progressPct, onPress }: Props) {
  const isProcessing = status === 'processing';
  const isFailed = status === 'failed';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.posterWrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderLetter}>{title[0]?.toUpperCase()}</Text>
          </View>
        )}

        {/* Processing or Failed Overlay Banner Badge */}
        {isProcessing && (
          <View style={[styles.badge, styles.processingBadge]}>
            <Text style={styles.processingBadgeText}>⏳ PROCESSING</Text>
          </View>
        )}

        {isFailed && (
          <View style={[styles.badge, styles.failedBadge]}>
            <Text style={styles.failedBadgeText}>❌ FAILED</Text>
          </View>
        )}

        {status === 'ready' && (
          <View style={[styles.badge, styles.readyBadge]}>
            <Text style={styles.readyBadgeText}>✓ READY</Text>
          </View>
        )}

        {progressPct != null && (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { width: 132, marginRight: 12 },
  posterWrap: { width: 132, height: 192, borderRadius: 10, overflow: 'hidden', backgroundColor: '#171B24', borderWidth: 1, borderColor: 'rgba(242,169,59,0.2)', position: 'relative' },
  poster: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderLetter: { fontSize: 36, fontWeight: '700', color: '#8A8F98' },
  badge: { position: 'absolute', top: 6, right: 6, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  processingBadge: { backgroundColor: 'rgba(242,169,59,0.9)' },
  processingBadgeText: { color: '#0D1117', fontSize: 9, fontWeight: '800' },
  failedBadge: { backgroundColor: 'rgba(239,71,111,0.9)' },
  failedBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  readyBadge: { backgroundColor: 'rgba(46,196,182,0.85)' },
  readyBadgeText: { color: '#0D1117', fontSize: 8, fontWeight: '800' },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.5)' },
  progressFill: { height: '100%', backgroundColor: '#F2A93B' },
  title: { marginTop: 6, fontSize: 13, color: '#F5F5F0', fontWeight: '500' },
});