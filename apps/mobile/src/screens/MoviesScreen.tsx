import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContent, getCategories } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function MoviesScreen({ navigation }: any) {
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [movieList, catList] = await Promise.all([
          getContent(selectedCategory ? { category: selectedCategory } : {}),
          getCategories(),
        ]);
        setMovies(movieList || []);
        setCategories(catList || []);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedCategory]);

  const featuredMovie = movies[0];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerWrap}>
          <Text style={styles.header}>Movies</Text>
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All Movies</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, selectedCategory === c.name && styles.chipActive]}
              onPress={() => setSelectedCategory(c.name)}
            >
              <Text style={[styles.chipText, selectedCategory === c.name && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.accentAmber} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Featured Hero Banner */}
            {featuredMovie && !selectedCategory && (
              <View style={styles.heroCard}>
                <ImageBackground
                  source={{ uri: resolveMediaUrl(featuredMovie.poster_url || featuredMovie.thumbnail_url) || '' }}
                  style={styles.heroBg}
                  imageStyle={{ borderRadius: 16 }}
                >
                  <View style={styles.heroOverlay}>
                    <Text style={styles.heroTag}>FEATURED MOVIE</Text>
                    <Text style={styles.heroTitle} numberOfLines={1}>{featuredMovie.title}</Text>
                    <TouchableOpacity
                      style={styles.heroPlayBtn}
                      onPress={() => navigation.navigate('Watch', { id: featuredMovie.id, title: featuredMovie.title })}
                    >
                      <Text style={styles.heroPlayBtnText}>▶ Watch Now</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            )}

            {/* Horizontal Movies Row */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {selectedCategory ? `${selectedCategory} Movies` : 'Popular Movies'}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={144}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 16 }}
            >
              {movies.map((m) => (
                <PosterCard
                  key={m.id}
                  title={m.title}
                  posterUrl={resolveMediaUrl(m.thumbnail_url || m.poster_url)}
                  status={m.status}
                  onPress={() => navigation.navigate('Watch', { id: m.id, title: m.title })}
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
  chipRow: { maxHeight: 44, paddingHorizontal: 16, marginBottom: 20 },
  chip: { backgroundColor: DESIGN_TOKENS.colors.bgElevated, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  chipActive: { borderColor: DESIGN_TOKENS.colors.accentAmber, backgroundColor: 'rgba(242,169,59,0.15)' },
  chipText: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: DESIGN_TOKENS.colors.accentAmber, fontWeight: '700' },
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
