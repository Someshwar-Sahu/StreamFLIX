import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrending } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function HomeScreen({ navigation }: any) {
  const [trending, setTrending] = useState<{ movies: any[]; series: any[]; overall: any[] }>({ movies: [], series: [], overall: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const trendData = await getTrending();
        setTrending(trendData || { movies: [], series: [], overall: [] });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.accentAmber} />
      </View>
    );
  }

  const featuredItem = trending.overall[0] || trending.movies[0] || trending.series[0];

  const renderSection = (title: string, items: any[], type: 'movie' | 'series') => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.map((item) => (
            <PosterCard
              key={`${type}-${item.id}`}
              title={item.title}
              posterUrl={resolveMediaUrl(item.poster_url || item.thumbnail_url)}
              status={item.status}
              onPress={() =>
                type === 'series'
                  ? navigation.navigate('SeriesDetail', { id: item.id })
                  : navigation.navigate('Watch', { id: item.id, title: item.title })
              }
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.header}>Home</Text>
        </View>

        {/* Featured Hero Banner */}
        {featuredItem && (
          <View style={styles.heroCard}>
            <ImageBackground
              source={{ uri: resolveMediaUrl(featuredItem.poster_url || featuredItem.thumbnail_url) || '' }}
              style={styles.heroBg}
              imageStyle={{ borderRadius: 16 }}
            >
              <View style={styles.heroOverlay}>
                <Text style={styles.heroTag}>🔥 TRENDING NOW</Text>
                <Text style={styles.heroTitle} numberOfLines={1}>{featuredItem.title}</Text>
                <TouchableOpacity
                  style={styles.heroPlayBtn}
                  onPress={() =>
                    featuredItem.type === 'series'
                      ? navigation.navigate('SeriesDetail', { id: featuredItem.id })
                      : navigation.navigate('Watch', { id: featuredItem.id, title: featuredItem.title })
                  }
                >
                  <Text style={styles.heroPlayBtnText}>▶ Watch Now</Text>
                </TouchableOpacity>
              </View>
            </ImageBackground>
          </View>
        )}

        {renderSection('Trending Overall', trending.overall, 'movie')}
        {renderSection('Trending Movies', trending.movies, 'movie')}
        {renderSection('Trending Series', trending.series, 'series')}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  scrollContainer: { paddingBottom: 110, paddingTop: 12 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  center: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid, justifyContent: 'center', alignItems: 'center' },
  heroCard: { marginHorizontal: 16, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: '#171B24' },
  heroBg: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: { padding: 16, backgroundColor: 'rgba(13,17,23,0.7)' },
  heroTag: { color: DESIGN_TOKENS.colors.accentAmber, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  heroTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 10 },
  heroPlayBtn: { backgroundColor: DESIGN_TOKENS.colors.accentAmber, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  heroPlayBtnText: { color: '#0D1117', fontWeight: '700', fontSize: 13 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 12 },
});
