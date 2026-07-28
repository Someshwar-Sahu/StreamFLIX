import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { getSeriesDetails, toggleSeriesWatchlist, rateSeries, clearSeriesRating } from '../api/interactions';
import { resolveMediaUrl } from '../api/media';

export default function SeriesDetail({ navigation }: any) {
  const route = useRoute<any>();
  const { id } = route.params;
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    getSeriesDetails(id).then(setData).catch(() => {});
  }, [id]);

  if (!data) return null;
  const { series, likes, dislikes, my_rating, in_watchlist, episode_progress } = data;

  async function handleWatchlist() {
    await toggleSeriesWatchlist(Number(id), in_watchlist);
    setData((d: any) => ({ ...d, in_watchlist: !d.in_watchlist }));
  }

  async function handleRate(value: number) {
    if (my_rating === value) {
      await clearSeriesRating(Number(id));
      setData((d: any) => ({ ...d, my_rating: null }));
    } else {
      await rateSeries(Number(id), value);
      setData((d: any) => ({ ...d, my_rating: value }));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.hero}>
          {series.poster_url ? (
            <Image source={{ uri: resolveMediaUrl(series.poster_url)! }} style={styles.poster} />
          ) : (
            <View style={[styles.poster, styles.placeholder]}>
              <Text style={styles.placeholderLetter}>{series.title[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.title}>{series.title}</Text>
            {series.description && <Text style={styles.desc} numberOfLines={4}>{series.description}</Text>}
          </View>
        </View>

        <View style={styles.interactionRow}>
          <TouchableOpacity style={[styles.pillBtn, in_watchlist && styles.pillBtnActive]} onPress={handleWatchlist}>
            <Text style={[styles.pillText, in_watchlist && styles.pillTextActive]}>{in_watchlist ? '✓ Watchlist' : '+ Watchlist'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, my_rating === 1 && styles.pillBtnActive]} onPress={() => handleRate(1)}>
            <Text style={[styles.pillText, my_rating === 1 && styles.pillTextActive]}>👍 {likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pillBtn, my_rating === -1 && styles.pillBtnActive]} onPress={() => handleRate(-1)}>
            <Text style={[styles.pillText, my_rating === -1 && styles.pillTextActive]}>👎 {dislikes}</Text>
          </TouchableOpacity>
        </View>

        {series.seasons.map((season: any) => (
          <View key={season.id}>
            <Text style={styles.seasonHeading}>Season {season.season_number}</Text>
            {season.episodes.map((ep: any) => {
              const hasProgress = episode_progress[ep.content_id] != null;
              return (
                <TouchableOpacity
                  key={ep.id}
                  style={styles.episode}
                  onPress={() => navigation.navigate('Watch', { id: ep.content_id, title: ep.title || `Episode ${ep.episode_number}` })}
                >
                  <View style={styles.epNum}><Text style={styles.epNumText}>{ep.episode_number}</Text></View>
                  <Text style={styles.epTitle}>{ep.title || `Episode ${ep.episode_number}`}</Text>
                  {hasProgress && <View style={styles.progressDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  hero: { flexDirection: 'row', marginBottom: 20 },
  poster: { width: 110, height: 160, borderRadius: 8, backgroundColor: '#171B24' },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  placeholderLetter: { fontSize: 36, fontWeight: '700', color: '#8A8F98' },
  title: { fontSize: 20, fontWeight: '700', color: '#F5F5F0', marginBottom: 8 },
  desc: { fontSize: 13, color: '#8A8F98', lineHeight: 18 },
  interactionRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  pillBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', backgroundColor: '#171B24' },
  pillBtnActive: { borderColor: '#F2A93B' },
  pillText: { color: '#8A8F98', fontSize: 12, fontWeight: '500' },
  pillTextActive: { color: '#F2A93B' },
  seasonHeading: { fontSize: 16, fontWeight: '700', color: '#F5F5F0', marginTop: 16, marginBottom: 10 },
  episode: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#171B24', borderRadius: 8, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(138,143,152,0.1)' },
  epNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  epNumText: { color: '#8A8F98', fontSize: 11, fontWeight: '700' },
  epTitle: { flex: 1, color: '#F5F5F0', fontSize: 14, fontWeight: '500' },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F2A93B' },
});