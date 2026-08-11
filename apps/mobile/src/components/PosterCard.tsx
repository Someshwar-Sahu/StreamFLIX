import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DESIGN_TOKENS } from '@streamflix/ui';

type Props = {
  title: string;
  posterUrl: string | null;
  status?: string;
  progressPct?: number;
  badgeText?: string | null;
  onPress: () => void;
};

export default function PosterCard({ title, posterUrl, status, progressPct, badgeText, onPress }: Props) {
  const isProcessing = status === 'processing';
  const isFailed = status === 'failed';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.posterWrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderLetter}>{title[0]?.toUpperCase()}</Text>
          </View>
        )}

        {badgeText && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>{badgeText}</Text>
          </View>
        )}

        <View style={styles.qualityBadge}>
          <Text style={styles.qualityBadgeText}>4K HDR</Text>
        </View>

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
  card: { width: 136, marginRight: 14 },
  posterWrap: {
    width: 136,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    position: 'relative',
  },
  poster: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderLetter: { fontSize: 36, fontWeight: '700', color: '#a0a4a8' },
  topBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#e50914',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 5,
  },
  topBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  qualityBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(12, 15, 15, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 5,
  },
  qualityBadgeText: { color: '#ffffff', fontSize: 8, fontWeight: '800' },
  badge: { position: 'absolute', bottom: 10, right: 6, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  processingBadge: { backgroundColor: 'rgba(229, 9, 20, 0.9)' },
  processingBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  failedBadge: { backgroundColor: 'rgba(239, 71, 111, 0.9)' },
  failedBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  progressFill: { height: '100%', backgroundColor: '#e50914' },
  title: {
    marginTop: 6,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
    fontFamily: DESIGN_TOKENS.fonts.body,
  },
});