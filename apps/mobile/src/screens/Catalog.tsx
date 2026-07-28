import React, { useState, useLayoutEffect, useCallback } from 'react';
import { ScrollView, Text, StyleSheet, ActivityIndicator, TouchableOpacity, View, FlatList, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { getContent, getSeries, getTrending, getCategories } from '../api/catalog';
import { resolveMediaUrl } from '../api/media';
import PosterCard from '../components/PosterCard';
import { useAuth } from '../context/AuthContext';

export default function Catalog({ navigation }: any) {
  const [content, setContent] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [q, setQ] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { logout, role } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {(role === 'uploader' || role === 'admin') && (
            <TouchableOpacity onPress={() => navigation.navigate('Upload')}>
              <Text style={{ color: '#F2A93B' }}>Upload</Text>
            </TouchableOpacity>
          )}
          {role === 'admin' && (
            <TouchableOpacity onPress={() => navigation.navigate('Admin')}>
              <Text style={{ color: '#F2A93B' }}>Admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: '#F2A93B' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, role]);

  function fetchHistory() {
    api.get('/watch-history').then((res) => setHistory(res.data)).catch(() => setHistory([]));
  }

  function removeItem(contentId: number) {
    api.delete(`/watch-history/${contentId}`).then(fetchHistory).catch(() => { });
  }

  function fetchAll() {
    getContent({ q: q || undefined, category: activeCategory || undefined }).then(setContent);
    getSeries().then(setSeries);
    getTrending().then((t) => setTrending(t.overall || []));
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getCategories().then(setCategories);
      Promise.all([
        getContent({ q: q || undefined, category: activeCategory || undefined }).then(setContent),
        getSeries().then(setSeries),
        getTrending().then((t) => setTrending(t.overall || [])),
      ]).finally(() => setLoading(false));
      fetchHistory();
    }, [q, activeCategory])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#F2A93B" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <TextInput
          style={styles.search}
          placeholder="Search titles..."
          placeholderTextColor="#8A8F98"
          value={q}
          onChangeText={setQ}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity style={[styles.chip, !activeCategory && styles.chipActive]} onPress={() => setActiveCategory(null)}>
            <Text style={[styles.chipText, !activeCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity key={c.id} style={[styles.chip, activeCategory === c.name && styles.chipActive]} onPress={() => setActiveCategory(c.name)}>
              <Text style={[styles.chipText, activeCategory === c.name && styles.chipTextActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {trending.length > 0 && (
          <>
            <Text style={styles.header}>Trending Now</Text>
            <FlatList
              data={trending}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => `${item.type}-${item.id}`}
              contentContainerStyle={styles.row}
              renderItem={({ item }) => (
                <PosterCard
                  title={item.title}
                  posterUrl={resolveMediaUrl(item.poster_url)}
                  onPress={() => navigation.navigate(item.type === 'movie' ? 'Watch' : 'SeriesDetail', item.type === 'movie' ? { id: item.id, title: item.title } : { id: item.id })}
                />
              )}
            />
          </>
        )}

        {history.length > 0 && (
          <>
            <Text style={styles.header}>Continue Watching</Text>
            <FlatList
              data={history}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => String(item.content_id)}
              contentContainerStyle={styles.row}
              renderItem={({ item }) => {
                const pct = item.duration_seconds ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100)) : 0;
                return (
                  <View>
                    <PosterCard title={item.title} posterUrl={null} progressPct={pct} onPress={() => navigation.navigate('Watch', { id: item.content_id, title: item.title })} />
                    <TouchableOpacity onPress={() => removeItem(item.content_id)} style={styles.removeBtn}>
                      <Text style={styles.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </>
        )}

        <Text style={styles.header}>Movies</Text>
        <FlatList
          data={content}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.row}
          renderItem={({ item }) => (
            <PosterCard
              title={item.title}
              posterUrl={resolveMediaUrl(item.thumbnail_url)}
              status={item.status}
              onPress={() => navigation.navigate('Watch', { id: item.id, title: item.title })}
            />
          )}
        />

        <Text style={styles.header}>Series</Text>
        <FlatList
          data={series}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={[styles.row, { marginBottom: 24 }]}
          renderItem={({ item }) => (
            <PosterCard
              title={item.title}
              posterUrl={resolveMediaUrl(item.poster_url)}
              onPress={() => navigation.navigate('SeriesDetail', { id: item.id })}
            />
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  search: { margin: 16, marginBottom: 8, padding: 12, backgroundColor: '#171B24', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', color: '#F5F5F0', fontSize: 14 },
  chipRow: { paddingLeft: 16, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#171B24', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', marginRight: 8 },
  chipActive: { backgroundColor: '#F2A93B', borderColor: '#F2A93B' },
  chipText: { color: '#8A8F98', fontSize: 12, fontWeight: '500' },
  chipTextActive: { color: '#0D1117', fontWeight: '700' },
  header: { fontSize: 18, fontWeight: '700', color: '#F5F5F0', marginLeft: 16, marginTop: 16, marginBottom: 10 },
  row: { paddingLeft: 16 },
  removeBtn: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(13,17,23,0.85)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  removeBtnText: { color: '#8A8F98', fontSize: 9 },
});