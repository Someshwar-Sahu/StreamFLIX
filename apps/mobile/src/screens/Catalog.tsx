import React, { useState, useLayoutEffect, useCallback } from 'react';
import { FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

type Content = {
  id: number;
  title: string;
  status: string;
};

export default function Catalog({ navigation }: any) {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const { logout, role } = useAuth();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {role === 'uploader' && (
            <TouchableOpacity onPress={() => navigation.navigate('Upload')}>
              <Text style={{ color: '#1e90ff' }}>Upload</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={logout}>
            <Text style={{ color: '#1e90ff' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, role]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.get('/content')
        .then((res) => setContent(res.data))
        .catch((err) => console.log('Error fetching content:', err.message))
        .finally(() => setLoading(false));
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Catalog</Text>
      <FlatList
        data={content}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            disabled={item.status !== 'ready'}
            onPress={() => navigation.navigate('Watch', { id: item.id, title: item.title })}
          >
            <Text style={styles.itemText}>
              {item.title} — {item.status}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  item: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
  itemText: { fontSize: 16, color: '#ccc' },
});