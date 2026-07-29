import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWatchHistory } from '../api/interactions';
import { resolveMediaUrl } from '../api/media';

export default function HistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getWatchHistory();
        setHistory(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#F2A93B" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Watch History</Text>
      </View>

      {history.length === 0 ? (
        <Text style={styles.empty}>No watch history recorded yet.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {history.map((item) => {
            const content = item.content || {};
            const posterUrl = resolveMediaUrl(content.poster_url || content.thumbnail_url);
            const dateStr = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : '';

            return (
              <View key={item.id} style={styles.card}>
                {posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={styles.thumb} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>{content.title?.[0] || 'V'}</Text>
                  </View>
                )}
                <View style={styles.info}>
                  <Text style={styles.title} numberOfLines={1}>{content.title || `Video #${item.content_id}`}</Text>
                  <Text style={styles.meta}>Progress: {item.progress_seconds || 0}s</Text>
                  <Text style={styles.date}>{dateStr}</Text>
                </View>
                <TouchableOpacity
                  style={styles.replayBtn}
                  onPress={() => navigation.navigate('Watch', { id: content.id || item.content_id, title: content.title })}
                >
                  <Text style={styles.replayText}>▶ Play</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  center: { flex: 1, backgroundColor: '#0D1117', justifyContent: 'center', alignItems: 'center' },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  header: { color: '#F5F5F0', fontSize: 24, fontWeight: '700' },
  empty: { color: '#8A8F98', fontSize: 14, marginTop: 24, textAlign: 'center' },
  list: { padding: 16, paddingBottom: 110 },
  card: { flexDirection: 'row', backgroundColor: '#171B24', borderRadius: 10, padding: 10, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  thumb: { width: 60, height: 84, borderRadius: 6 },
  placeholder: { width: 60, height: 84, borderRadius: 6, backgroundColor: '#212631', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#8A8F98', fontSize: 24, fontWeight: '700' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: '#F5F5F0', fontSize: 15, fontWeight: '600', marginBottom: 4 },
  meta: { color: '#F2A93B', fontSize: 12 },
  date: { color: '#8A8F98', fontSize: 11, marginTop: 2 },
  replayBtn: { backgroundColor: '#F2A93B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  replayText: { color: '#0D1117', fontWeight: '700', fontSize: 12 },
});
