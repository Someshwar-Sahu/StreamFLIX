import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getWatchlist } from '../api/interactions';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';

export default function WatchlistScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWatchlist() {
      try {
        const data = await getWatchlist();
        setItems(data);
      } finally {
        setLoading(false);
      }
    }
    fetchWatchlist();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Saved Watchlist</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#F2A93B" style={{ marginTop: 32 }} />
      ) : items.length === 0 ? (
        <Text style={styles.empty}>Your watchlist is empty.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {items.map((item) => (
            <PosterCard
              key={`${item.type}-${item.id}`}
              title={item.title}
              posterUrl={resolveMediaUrl(item.poster_url)}
              onPress={() =>
                item.type === 'series'
                  ? navigation.navigate('SeriesDetail', { id: item.id })
                  : navigation.navigate('Watch', { id: item.id, title: item.title })
              }
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  header: { color: '#F5F5F0', fontSize: 24, fontWeight: '700' },
  empty: { color: '#8A8F98', marginTop: 24, fontSize: 14, textAlign: 'center' },
  grid: { padding: 16, paddingBottom: 110, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
