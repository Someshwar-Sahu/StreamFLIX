import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getSeries } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function SeriesScreen({ navigation }: any) {
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getSeries();
        setSeriesList(data || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const featuredSeries = seriesList[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.header}>Series</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.accentAmber} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Featured Series Hero Banner */}
            {featuredSeries && (
              <View style={styles.heroCard}>
                <ImageBackground
                  source={{ uri: resolveMediaUrl(featuredSeries.poster_url) || '' }}
                  style={styles.heroBg}
                  imageStyle={{ borderRadius: 16 }}
                >
                  <View style={styles.heroOverlay}>
                    <Text style={styles.heroTag}>FEATURED SERIES</Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>{featuredSeries.title}</Text>
                    <TouchableOpacity
                      style={styles.heroPlayBtn}
                      onPress={() => navigation.navigate('SeriesDetail', { id: featuredSeries.id })}
                    >
                      <Text style={styles.heroPlayBtnText}>📺 View Seasons & Episodes</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            )}

            {/* Popular Series Horizontal Row */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Series</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={144}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {seriesList.map((s) => (
                <PosterCard
                  key={s.id}
                  title={s.title}
                  posterUrl={resolveMediaUrl(s.poster_url)}
                  onPress={() => navigation.navigate('SeriesDetail', { id: s.id })}
                />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  scrollContainer: { paddingBottom: 110, paddingTop: 12 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  heroCard: { marginHorizontal: 16, height: 200, borderRadius: 16, overflow: 'hidden', marginBottom: 24, backgroundColor: '#171B24' },
  heroBg: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: { padding: 16, backgroundColor: 'rgba(13,17,23,0.7)' },
  heroTag: { color: DESIGN_TOKENS.colors.accentAmber, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  heroTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 20, fontWeight: '700', marginBottom: 10 },
  heroPlayBtn: { backgroundColor: DESIGN_TOKENS.colors.accentAmber, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, alignSelf: 'flex-start' },
  heroPlayBtnText: { color: '#0D1117', fontWeight: '700', fontSize: 13 },
  sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '700' },
});
