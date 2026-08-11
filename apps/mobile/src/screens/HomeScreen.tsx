import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, ImageBackground, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTrending, getContent, getSeries } from '../api/catalog';
import { getWatchHistory } from '../api/interactions';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function HomeScreen({ navigation }: any) {
  const [trending, setTrending] = useState<{ movies: any[]; series: any[]; overall: any[] }>({ movies: [], series: [], overall: [] });
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [trendData, allMovies, allSeries, historyData] = await Promise.all([
          getTrending().catch(() => ({ movies: [], series: [], overall: [] })),
          getContent().catch(() => []),
          getSeries().catch(() => []),
          getWatchHistory().catch(() => []),
        ]);

        const movies = trendData?.movies?.length ? trendData.movies : allMovies || [];
        const series = trendData?.series?.length ? trendData.series : allSeries || [];
        const overall = trendData?.overall?.length ? trendData.overall : [...movies, ...series];

        setTrending({ movies, series, overall });
        setContinueWatching(historyData || []);
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
        <ActivityIndicator size="large" color="#e50914" />
      </View>
    );
  }

  const featuredItem = trending.overall[0] || trending.movies[0] || trending.series[0];
  const hasItems = trending.overall.length > 0 || trending.movies.length > 0 || trending.series.length > 0;

  const renderSection = (title: string, items: any[], type: 'movie' | 'series') => {
    if (!items || items.length === 0) return null;
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {items.map((item, index) => {
            const itemType = item.type || (item.seasons ? 'series' : type);
            const badgeText = index < 3 ? `TOP ${index + 1}` : null;
            return (
              <PosterCard
                key={`${itemType}-${item.id}-${index}`}
                title={item.title}
                posterUrl={resolveMediaUrl(item.poster_url || item.thumbnail_url)}
                status={item.status}
                badgeText={badgeText}
                onPress={() =>
                  itemType === 'series'
                    ? navigation.navigate('SeriesDetail', { id: item.id })
                    : navigation.navigate('Watch', { id: item.id, title: item.title })
                }
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Top App Bar with STREAMFLIX Logo */}
        <View style={styles.topLogoRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.logoStream}>STREAM</Text>
            <Text style={styles.logoFlix}>FLIX</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('SearchTab')}>
            <Text style={{ fontSize: 20 }}>🔍</Text>
          </TouchableOpacity>
        </View>

        {!hasItems ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>No Content Available Yet</Text>
            <Text style={styles.emptySub}>Upload your first movie or series in the Creator Studio.</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={() => navigation.navigate('Upload')}>
              <Text style={styles.uploadBtnText}>+ Upload Content</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {featuredItem && (
              <View style={styles.heroCard}>
                <ImageBackground
                  source={{ uri: resolveMediaUrl(featuredItem.poster_url || featuredItem.thumbnail_url) || '' }}
                  style={styles.heroBg}
                  imageStyle={{ borderRadius: 20 }}
                >
                  <View style={styles.heroOverlay}>
                    <View style={styles.heroBadgeRow}>
                      <View style={styles.pillBadge}>
                        <Text style={styles.pillBadgeText}>STREAMFLIX ORIGINAL</Text>
                      </View>
                      <Text style={styles.matchScore}>98% Match</Text>
                    </View>

                    <Text style={styles.heroTitle} numberOfLines={2}>{featuredItem.title}</Text>

                    <View style={styles.heroActionRow}>
                      <TouchableOpacity
                        style={styles.heroPlayBtn}
                        onPress={() =>
                          featuredItem.type === 'series'
                            ? navigation.navigate('SeriesDetail', { id: featuredItem.id })
                            : navigation.navigate('Watch', { id: featuredItem.id, title: featuredItem.title })
                        }
                      >
                        <Text style={styles.heroPlayBtnText}>▶ Play</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.heroInfoBtn}
                        onPress={() =>
                          featuredItem.type === 'series'
                            ? navigation.navigate('SeriesDetail', { id: featuredItem.id })
                            : navigation.navigate('Watch', { id: featuredItem.id, title: featuredItem.title })
                        }
                      >
                        <Text style={styles.heroInfoBtnText}>ⓘ Details</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </ImageBackground>
              </View>
            )}

            {/* Continue Watching Section */}
            {continueWatching.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>Continue Watching</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {continueWatching.map((item, idx) => {
                    const progressPct =
                      item.duration_seconds && item.progress_seconds
                        ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
                        : 50;

                    return (
                      <TouchableOpacity
                        key={`cw-${item.content_id || item.id}-${idx}`}
                        style={styles.continueCard}
                        onPress={() => navigation.navigate('Watch', { id: item.content_id || item.id, title: item.title })}
                        activeOpacity={0.85}
                      >
                        <Image
                          source={{ uri: resolveMediaUrl(item.thumbnail_url || item.poster_url) || '' }}
                          style={styles.continuePoster}
                        />
                        <View style={styles.continueOverlay}>
                          <Text style={styles.continueTitle} numberOfLines={1}>{item.title}</Text>
                          <Text style={styles.continueSub}>{progressPct}% completed</Text>
                        </View>
                        <View style={styles.continueTrack}>
                          <View style={[styles.continueFill, { width: `${progressPct}%` }]} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {renderSection('Trending Now', trending.overall, 'movie')}
            {renderSection('Blockbuster Movies', trending.movies, 'movie')}
            {renderSection('Bingeworthy Series', trending.series, 'series')}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0f0f' },
  scrollContainer: { paddingBottom: 110, paddingTop: 8 },
  topLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginBottom: 8,
  },
  logoStream: { fontSize: 20, fontWeight: '900', color: '#ffffff', letterSpacing: 1.5 },
  logoFlix: { fontSize: 20, fontWeight: '900', color: '#e50914', letterSpacing: 1.5 },
  center: { flex: 1, backgroundColor: '#0c0f0f', justifyContent: 'center', alignItems: 'center' },
  heroCard: {
    marginHorizontal: 16,
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroBg: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: {
    padding: 16,
    backgroundColor: 'rgba(12, 15, 15, 0.75)',
  },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  pillBadge: {
    backgroundColor: '#e50914',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pillBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900' },
  matchScore: { color: '#46d369', fontSize: 11, fontWeight: '700' },
  heroTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginBottom: 12 },
  heroActionRow: { flexDirection: 'row', gap: 10 },
  heroPlayBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  heroPlayBtnText: { color: '#0c0f0f', fontWeight: '800', fontSize: 14 },
  heroInfoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  heroInfoBtnText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  sectionAccent: { width: 3, height: 16, backgroundColor: '#e50914', borderRadius: 2 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  emptyCard: {
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: '#1a1c1c',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#a0a4a8', textAlign: 'center', fontSize: 13, lineHeight: 18, marginBottom: 20 },
  uploadBtn: { backgroundColor: '#e50914', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  uploadBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  continueCard: {
    width: 180,
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#1a1c1c',
    marginRight: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  continuePoster: { width: '100%', height: '100%', resizeMode: 'cover' },
  continueOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(12, 15, 15, 0.7)',
  },
  continueTitle: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  continueSub: { color: '#a0a4a8', fontSize: 10 },
  continueTrack: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.6)' },
  continueFill: { height: '100%', backgroundColor: '#e50914' },
});
