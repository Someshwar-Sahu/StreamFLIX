import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories } from '../api/catalog';
import api from '../api/client';
import { DESIGN_TOKENS } from '@streamflix/ui';

const CATEGORY_TILES = [
  { name: 'Action', subtitle: 'Explosive thrillers & blockbusters', image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Sci-Fi', subtitle: 'Futuristic worlds & deep space', image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80' },
  { name: 'Horror', subtitle: 'Supernatural chills & fear', image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Comedy', subtitle: 'Laugh-out-loud hits', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80' },
  { name: 'Anime', subtitle: 'Epic animation sagas', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
  { name: 'Drama', subtitle: 'Compelling emotional stories', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80' },
  { name: 'Documentary', subtitle: 'Real discoveries & nature', image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80' },
];

export default function CategoriesScreen({ navigation }: any) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const list = await getCategories();
      setCategories(list || []);
    } catch {}
  }

  async function handleAddCategory() {
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      fetchCategories();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id: number, name: string) {
    Alert.alert('Delete Category', `Are you sure you want to delete category "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/categories/${id}`);
            fetchCategories();
          } catch (err: any) {
            Alert.alert('Error', err.response?.data?.detail || 'Failed to delete category');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Categories</Text>
        <Text style={styles.subText}>
          Explore our vast cinematic universe. Choose a genre to discover your next favorite movie or TV show.
        </Text>

        {/* Visual Genre Tiles */}
        <View style={styles.tileList}>
          {CATEGORY_TILES.map((tile) => (
            <TouchableOpacity
              key={tile.name}
              style={styles.visualCard}
              onPress={() => navigation.navigate('MoviesTab')}
              activeOpacity={0.85}
            >
              <Image source={{ uri: tile.image }} style={styles.visualImg} />
              <View style={styles.visualOverlay} />
              <View style={styles.visualContent}>
                <Text style={styles.visualTitle}>{tile.name}</Text>
                <Text style={styles.visualSub}>{tile.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Management */}
        <View style={styles.adminSection}>
          <Text style={styles.adminTitle}>Category Studio</Text>
          <View style={styles.addCard}>
            <TextInput
              style={styles.input}
              placeholder="Add custom category name..."
              placeholderTextColor="#a0a4a8"
              value={newCatName}
              onChangeText={setNewCatName}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
              <Text style={styles.addBtnText}>+ Add Category</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tagGrid}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.tagPill}>
                <Text style={styles.tagName}>{cat.name}</Text>
                <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)} style={styles.deleteBtn}>
                  <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0c0f0f' },
  scrollContent: { padding: 16, paddingBottom: 110 },
  header: { color: '#ffffff', fontSize: 26, fontWeight: '800', marginBottom: 6 },
  subText: { color: '#a0a4a8', fontSize: 13, lineHeight: 18, marginBottom: 24 },
  tileList: { gap: 14, marginBottom: 36 },
  visualCard: {
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1c1c',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    justifyContent: 'flex-end',
    padding: 16,
  },
  visualImg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, resizeMode: 'cover' },
  visualOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(12, 15, 15, 0.65)',
  },
  visualContent: { zIndex: 3 },
  visualTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800' },
  visualSub: { color: '#a0a4a8', fontSize: 12, marginTop: 2 },
  adminSection: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 24 },
  adminTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700', marginBottom: 14 },
  addCard: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    backgroundColor: '#121414',
    marginBottom: 10,
    fontSize: 14,
  },
  addBtn: { backgroundColor: '#e50914', padding: 12, borderRadius: 10, alignItems: 'center' },
  addBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1a1c1c',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tagName: { color: '#ffffff', fontSize: 13, fontWeight: '600' },
  deleteBtn: { padding: 2 },
  deleteText: { color: '#ffb4aa', fontSize: 12, fontWeight: '800' },
});
