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
  const disabled = status ? status !== 'ready' : false;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={disabled} activeOpacity={0.8}>
      <View style={styles.posterWrap}>
        {posterUrl ? (
          <Image source={{ uri: posterUrl }} style={styles.poster} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderLetter}>{title[0]?.toUpperCase()}</Text>
          </View>
        )}
        {status && status !== 'ready' && (
          <View style={styles.badge}><Text style={styles.badgeText}>{status}</Text></View>
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
  card: { width: 120, marginRight: 12 },
  posterWrap: { width: 120, height: 172, borderRadius: 8, overflow: 'hidden', backgroundColor: '#171B24', borderWidth: 1, borderColor: 'rgba(242,169,59,0.1)' },
  poster: { width: '100%', height: '100%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholderLetter: { fontSize: 36, fontWeight: '700', color: '#8A8F98' },
  badge: { position: 'absolute', top: 6, right: 6, backgroundColor: 'rgba(13,17,23,0.85)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#F2A93B', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
  progressTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.5)' },
  progressFill: { height: '100%', backgroundColor: '#F2A93B' },
  title: { marginTop: 6, fontSize: 12, color: '#F5F5F0', fontWeight: '500' },
});