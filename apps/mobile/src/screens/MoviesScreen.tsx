import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, ImageBackground, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContent, getCategories } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

const GENRES_VISUALS: Record<string, { name: string; subtitle: string; image: string }> = {
  Action: {
    name: 'Action',
    subtitle: 'Explosive thrillers & blockbusters',
    image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
  },
  'Sci-Fi': {
    name: 'Sci-Fi',
    subtitle: 'Futuristic worlds & deep space',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
  },
  Horror: {
    name: 'Horror',
    subtitle: 'Supernatural chills & fear',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  },
  Comedy: {
    name: 'Comedy',
    subtitle: 'Laugh-out-loud hits',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  Anime: {
    name: 'Anime',
    subtitle: 'Epic Japanese fantasy',
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
  },
  Drama: {
    name: 'Drama',
    subtitle: 'Emotional & thought-provoking',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
  },
  Documentary: {
    name: 'Documentary',
    subtitle: 'Real discoveries & nature',
    image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  },
};

export default function MoviesScreen({ navigation }: any) {
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
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

  const filteredMovies = movies.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (m.title || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const top10List = filteredMovies.slice(0, 10);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, genres, or cast..."
            placeholderTextColor="#a0a4a8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => setSelectedCategory('')}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((c, index) => (
            <TouchableOpacity
              key={`cat-${c.id}-${index}`}
              style={[styles.chip, selectedCategory === c.name && styles.chipActive]}
              onPress={() => setSelectedCategory(c.name)}
            >
              <Text style={[styles.chipText, selectedCategory === c.name && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.chip} onPress={() => setSelectedCategory('4K')}>
            <Text style={styles.chipText}>4K Ultra HD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chip} onPress={() => setSelectedCategory('HDR')}>
            <Text style={styles.chipText}>HDR</Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? (
          <ActivityIndicator size="large" color="#e50914" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Top 10 in your Country with Giant Numbers */}
            {!selectedCategory && !searchQuery && top10List.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>Top 10 in your Country Today</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 4 }}>
                  {top10List.map((movie, idx) => (
                    <View key={movie.id} style={styles.top10Item}>
                      <Text style={styles.rankNumber}>{idx + 1}</Text>
                      <View style={{ zIndex: 2 }}>
                        <PosterCard
                          title={movie.title}
                          posterUrl={resolveMediaUrl(movie.poster_url || movie.thumbnail_url)}
                          status={movie.status}
                          badgeText={idx < 3 ? 'TOP 10' : null}
                          onPress={() => navigation.navigate('Watch', { id: movie.id, title: movie.title })}
                        />
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Filtered Movies */}
            {(selectedCategory || searchQuery) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>
                    {selectedCategory ? `${selectedCategory} Movies` : `Results for "${searchQuery}"`}
                  </Text>
                </View>
                <View style={styles.gridWrap}>
                  {filteredMovies.map((m, index) => (
                    <View key={`grid-${m.id}-${index}`} style={styles.gridItem}>
                      <PosterCard
                        title={m.title}
                        posterUrl={resolveMediaUrl(m.poster_url || m.thumbnail_url)}
                        status={m.status}
                        onPress={() => navigation.navigate('Watch', { id: m.id, title: m.title })}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Explore by Genre Visual Grid */}
            {!selectedCategory && !searchQuery && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionAccent} />
                  <Text style={styles.sectionTitle}>Explore by Genre</Text>
                </View>
                <View style={styles.genreList}>
                  {Object.entries(GENRES_VISUALS).map(([key, item]) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.genreCard}
                      onPress={() => setSelectedCategory(key)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: item.image }} style={styles.genreImg} />
                      <View style={styles.genreOverlay} />
                      <View style={styles.genreContent}>
                        <Text style={styles.genreTitle}>{item.name}</Text>
                        <Text style={styles.genreSub}>{item.subtitle}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0f0f' },
  scrollContainer: { paddingBottom: 110, paddingTop: 8 },
  searchWrap: { paddingHorizontal: 16, marginBottom: 12 },
  searchInput: {
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 24,
    color: '#ffffff',
    fontSize: 14,
    paddingHorizontal: 20,
    height: 48,
  },
  chipRow: { paddingLeft: 16, marginBottom: 24 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#e50914',
    borderColor: '#e50914',
  },
  chipText: { color: '#a0a4a8', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#ffffff', fontWeight: '800' },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  sectionAccent: { width: 3, height: 16, backgroundColor: '#e50914', borderRadius: 2 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  top10Item: { flexDirection: 'row', alignItems: 'flex-end', marginRight: 18 },
  rankNumber: {
    fontSize: 90,
    fontWeight: '900',
    color: '#0c0f0f',
    marginRight: -20,
    zIndex: 1,
    textShadowColor: 'rgba(255,255,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  gridWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 16 },
  genreList: { gap: 12 },
  genreCard: {
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 14,
  },
  genreImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, resizeMode: 'cover' },
  genreOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 15, 15, 0.65)',
  },
  genreContent: { zIndex: 3 },
  genreTitle: { color: '#ffffff', fontSize: 20, fontWeight: '800' },
  genreSub: { color: '#a0a4a8', fontSize: 12, marginTop: 2 },
});
