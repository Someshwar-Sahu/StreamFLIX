import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getContent } from '../api/catalog';
import PosterCard from '../components/PosterCard';
import { resolveMediaUrl } from '../api/media';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function SearchScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current; // 0 = centered hero, 1 = top header

  useEffect(() => {
    Animated.timing(heroAnim, {
      toValue: isFocused || query.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isFocused, query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await getContent({ q: query });
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const marginTopAnim = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrap}>
        <Text style={styles.header}>Search</Text>
      </View>

      <Animated.View style={[styles.heroWrap, { marginTop: marginTopAnim }]}>
        {!isFocused && query.length === 0 && (
          <Text style={styles.heroTitle}>What would you like to watch today?</Text>
        )}
        <View style={styles.inputWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, series, or genres..."
            placeholderTextColor={DESIGN_TOKENS.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </View>
      </Animated.View>

      {loading && <ActivityIndicator size="large" color={DESIGN_TOKENS.colors.accentAmber} style={{ marginTop: 24 }} />}

      {!loading && query.length > 0 && results.length === 0 && (
        <Text style={styles.emptyText}>No titles found matching "{query}"</Text>
      )}

      <ScrollView contentContainerStyle={styles.grid}>
        {results.map((item) => (
          <PosterCard
            key={item.id}
            title={item.title}
            posterUrl={resolveMediaUrl(item.poster_url || item.thumbnail_url)}
            onPress={() =>
              item.type === 'series'
                ? navigation.navigate('SeriesDetail', { id: item.id })
                : navigation.navigate('Watch', { id: item.id, title: item.title })
            }
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '700' },
  heroWrap: { paddingHorizontal: 16 },
  heroTitle: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: 16,
    zIndex: 2,
    fontSize: 16,
    color: DESIGN_TOKENS.colors.textMuted,
  },
  searchInput: {
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    color: DESIGN_TOKENS.colors.textPrimary,
    paddingVertical: 14,
    paddingLeft: 46,
    paddingRight: 16,
    borderRadius: 24,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(242, 169, 59, 0.3)',
  },
  emptyText: {
    color: DESIGN_TOKENS.colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  grid: { padding: 16, paddingBottom: 110, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
});
