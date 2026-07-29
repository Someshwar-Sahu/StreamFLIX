import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { getCategories } from '../api/catalog';
import { DESIGN_TOKENS } from '@streamflix/ui';

const PREDEFINED_CATEGORIES = [
  'Action',
  'Thriller',
  'Sci-Fi',
  'Fantasy',
  'Comedy',
  'Drama',
  'Romance',
  'Horror',
  'Mystery',
  'Adventure',
  'Animation',
  'Anime',
  'Crime',
  'Documentary',
  'Family',
  'History',
  'Music',
  'Superhero',
  'War',
  'Western',
  'Biopic',
  'Short Film',
  'Sports',
  'Reality TV',
  'K-Drama',
];

type Props = {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
};

export default function CategoryTagSelector({ selectedCategories = [], onChange }: Props) {
  const [search, setSearch] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>(PREDEFINED_CATEGORIES);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getCategories()
      .then((list) => {
        if (list && list.length > 0) {
          const names = list.map((c: any) => c.name);
          const combined = Array.from(new Set([...PREDEFINED_CATEGORIES, ...names]));
          setAvailableCategories(combined);
        }
      })
      .catch(() => {});
  }, []);

  const filtered = availableCategories.filter(
    (c) =>
      c.toLowerCase().includes(search.toLowerCase()) &&
      !selectedCategories.includes(c)
  );

  const addCategory = (cat: string) => {
    onChange([...selectedCategories, cat]);
    setSearch('');
    setIsOpen(false);
  };

  const removeCategory = (cat: string) => {
    onChange(selectedCategories.filter((c) => c !== cat));
  };

  return (
    <View style={styles.container}>
      {/* Selected Tags Row */}
      {selectedCategories.length > 0 && (
        <View style={styles.tagsRow}>
          {selectedCategories.map((cat) => (
            <View key={cat} style={styles.tagPill}>
              <Text style={styles.tagText}>{cat}</Text>
              <TouchableOpacity onPress={() => removeCategory(cat)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Type to search and add categories (e.g. Action, Anime)..."
        placeholderTextColor={DESIGN_TOKENS.colors.textMuted}
        value={search}
        onChangeText={(text) => {
          setSearch(text);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
      />

      {/* Dropdown Options */}
      {isOpen && filtered.length > 0 && (
        <View style={styles.dropdown}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {filtered.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.dropdownItem}
                onPress={() => addCategory(cat)}
              >
                <Text style={styles.dropdownText}>+ {cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 169, 59, 0.15)',
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.accentAmber,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6,
  },
  removeBtn: {
    padding: 2,
  },
  removeText: {
    color: DESIGN_TOKENS.colors.accentAmber,
    fontSize: 12,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    color: DESIGN_TOKENS.colors.textPrimary,
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: DESIGN_TOKENS.colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(242, 169, 59, 0.4)',
    borderRadius: 8,
    marginTop: 4,
    zIndex: 100,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownText: {
    color: DESIGN_TOKENS.colors.textPrimary,
    fontSize: 13,
  },
});
