import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DESIGN_TOKENS } from '@streamflix/ui';
import {
  DownloadedItem,
  getDownloadsStore,
  loadPersistedDownloads,
  subscribeDownloads,
  removeDownload,
} from '../utils/downloads';

export default function DownloadsScreen({ navigation }: any) {
  const [downloads, setDownloads] = useState<DownloadedItem[]>(getDownloadsStore());

  useEffect(() => {
    const unsubscribe = subscribeDownloads(setDownloads);
    loadPersistedDownloads();
    return unsubscribe;
  }, []);

  const totalUsedMb = downloads.reduce((acc, item) => acc + item.sizeMb, 0);

  const handleDelete = (contentId: number | string, title: string) => {
    Alert.alert('Delete Download', `Are you sure you want to remove "${title}" from offline storage?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeDownload(contentId);
        },
      },
    ]);
  };

  const handlePlayOffline = (item: DownloadedItem) => {
    navigation.navigate('Watch', { id: item.contentId, title: item.title });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Offline Downloads</Text>
      </View>

      <View style={styles.contentWrap}>
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Text style={styles.storageTitle}>Device Storage</Text>
            <Text style={styles.storageValue}>{totalUsedMb.toFixed(1)} MB Used</Text>
          </View>
          <View style={styles.storageBarTrack}>
            <View style={[styles.storageBarFill, { width: `${Math.min((totalUsedMb / 500) * 100, 100)}%` }]} />
          </View>
          <Text style={styles.storageSubtitle}>StreamFlix Downloads • High Quality (HLS)</Text>
        </View>

        {downloads.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📥</Text>
            <Text style={styles.emptyTitle}>No Offline Downloads</Text>
            <Text style={styles.emptyText}>
              Tap the Download button on any movie or series episode to watch offline without Wi-Fi or mobile data.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {downloads.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.itemCard}
                onPress={() => handlePlayOffline(item)}
                activeOpacity={0.8}
              >
                <View style={styles.posterPlaceholder}>
                  <Text style={styles.posterText}>{item.title[0]}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Text style={styles.resBadge}>{item.resolution}</Text>
                    <Text style={styles.metaText}>{item.duration}</Text>
                    <Text style={styles.metaText}>• {item.sizeMb} MB</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.contentId, item.title)}
                >
                  <Text style={styles.deleteIcon}>🗑️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  contentWrap: { flex: 1, padding: 16 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 16 },
  storageCard: {
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  storageHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  storageTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontWeight: '600', fontSize: 14 },
  storageValue: { color: DESIGN_TOKENS.colors.accentAmber, fontWeight: '700', fontSize: 14 },
  storageBarTrack: { height: 8, backgroundColor: DESIGN_TOKENS.colors.bgSurface, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  storageBarFill: { height: '100%', backgroundColor: DESIGN_TOKENS.colors.accentAmber },
  storageSubtitle: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyText: { color: DESIGN_TOKENS.colors.textMuted, textAlign: 'center', fontSize: 13, lineHeight: 18 },
  list: { flex: 1 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  posterPlaceholder: { width: 50, height: 70, borderRadius: 6, backgroundColor: DESIGN_TOKENS.colors.bgSurface, alignItems: 'center', justifyContent: 'center' },
  posterText: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 20, fontWeight: '700' },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: 4 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resBadge: { backgroundColor: 'rgba(242,169,59,0.2)', color: DESIGN_TOKENS.colors.accentAmber, fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  metaText: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
});
