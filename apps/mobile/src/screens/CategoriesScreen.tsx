import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategories } from '../api/catalog';
import api from '../api/client';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const list = await getCategories();
      setCategories(list || []);
    } finally {
      setLoading(false);
    }
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Category Management</Text>
        <Text style={styles.subText}>Add or remove streaming categories available for uploaders.</Text>

        <View style={styles.addCard}>
          <TextInput
            style={styles.input}
            placeholder="New Category Name (e.g. K-Drama, Anime)..."
            placeholderTextColor="#8A8F98"
            value={newCatName}
            onChangeText={setNewCatName}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAddCategory}>
            <Text style={styles.addBtnText}>+ Add Category</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.catCard}>
              <Text style={styles.catName}>{cat.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)} style={styles.deleteBtn}>
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  scrollContent: { padding: 16 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subText: { color: DESIGN_TOKENS.colors.textMuted, fontSize: 13, marginBottom: 20 },
  addCard: { backgroundColor: DESIGN_TOKENS.colors.bgElevated, borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  input: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 12, color: DESIGN_TOKENS.colors.textPrimary, backgroundColor: '#0D1117', marginBottom: 12, fontSize: 14 },
  addBtn: { backgroundColor: DESIGN_TOKENS.colors.accentAmber, padding: 12, borderRadius: 8, alignItems: 'center' },
  addBtnText: { color: '#0D1117', fontWeight: '700', fontSize: 14 },
  grid: { gap: 10 },
  catCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: DESIGN_TOKENS.colors.bgElevated, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  catName: { color: DESIGN_TOKENS.colors.textPrimary, fontWeight: '600', fontSize: 14 },
  deleteBtn: { padding: 4 },
  deleteIcon: { fontSize: 16 },
});
