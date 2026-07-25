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

type HistoryItem = {
  content_id: number;
  title: string;
  progress_seconds: number;
  duration_seconds: number | null;
};

export default function Catalog({ navigation }: any) {
  const [content, setContent] = useState<Content[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
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

  function fetchHistory() {
    api.get('/watch-history')
      .then((res) => setHistory(res.data))
      .catch(() => setHistory([]));
  }

  function removeItem(contentId: number) {
    api.delete(`/watch-history/${contentId}`)
      .then(() => fetchHistory())
      .catch(() => {});
  }

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      api.get('/content')
        .then((res) => setContent(res.data))
        .catch((err) => console.log('Error fetching content:', err.message))
        .finally(() => setLoading(false));
      fetchHistory();
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
      {history.length > 0 && (
        <View style={{ marginBottom: 16 }}>
          <Text style={styles.header}>Continue Watching</Text>
          {history.map((item) => {
            const pct = item.duration_seconds
              ? Math.min(100, Math.round((item.progress_seconds / item.duration_seconds) * 100))
              : 0;
            return (
              <View key={item.content_id} style={styles.historyRow}>
                <TouchableOpacity
                  style={{ flex: 1 }}
                  onPress={() => navigation.navigate('Watch', { id: item.content_id, title: item.title })}
                >
                  <Text style={styles.itemText}>{item.title}</Text>
                  <View style={{ height: 4, backgroundColor: '#333', marginTop: 4, width: '100%' }}>
                    <View style={{ height: 4, backgroundColor: '#1e90ff', width: `${pct}%` }} />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeItem(item.content_id)}>
                  <Text style={{ color: '#1e90ff', paddingHorizontal: 12 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

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
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#333' },
});