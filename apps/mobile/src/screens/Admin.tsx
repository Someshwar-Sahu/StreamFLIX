import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listUsers, updateUserRole, getStorageUsage } from '../api/admin';

const ROLES = ['viewer', 'uploader', 'admin'];
const badgeStyleMap: Record<string, any> = {};

export default function Admin() {
  const [users, setUsers] = useState<any[]>([]);
  const [storage, setStorage] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    listUsers().then(setUsers).catch(() => setError("Couldn't load users."));
    getStorageUsage().then(setStorage).catch(() => {});
  }, []);

  async function handleRoleChange(userId: number, role: string) {
    try {
      const updated = await updateUserRole(userId, role);
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Role update failed');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.header}>Admin Panel</Text>

        {storage && (
          <>
            <Text style={styles.sectionHeader}>Storage</Text>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{storage.total_mb} MB</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{storage.transcoded_content_mb} MB</Text>
                <Text style={styles.statLabel}>Transcoded</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{storage.raw_leftover_mb} MB</Text>
                <Text style={styles.statLabel}>Raw Leftover</Text>
              </View>
            </View>
          </>
        )}

        <Text style={styles.sectionHeader}>Users</Text>
        {users.map((u) => (
          <View key={u.id} style={styles.userCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{u.username}</Text>
              <Text style={styles.userEmail}>{u.email}</Text>
            </View>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleChip, u.role === r && styles.roleChipActive]}
                  onPress={() => handleRoleChange(u.id, r)}
                >
                  <Text style={[styles.roleChipText, u.role === r && styles.roleChipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { fontSize: 24, fontWeight: '700', color: '#F5F5F0', marginBottom: 20 },
  sectionHeader: { fontSize: 16, fontWeight: '700', color: '#F5F5F0', marginTop: 8, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  statCard: { flex: 1, backgroundColor: '#171B24', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(242,169,59,0.15)' },
  statValue: { color: '#F2A93B', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#8A8F98', fontSize: 10, marginTop: 2 },
  userCard: { backgroundColor: '#171B24', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(138,143,152,0.1)' },
  userName: { color: '#F5F5F0', fontSize: 14, fontWeight: '600' },
  userEmail: { color: '#8A8F98', fontSize: 12, marginTop: 2, marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)' },
  roleChipActive: { backgroundColor: '#F2A93B', borderColor: '#F2A93B' },
  roleChipText: { color: '#8A8F98', fontSize: 11, fontWeight: '500' },
  roleChipTextActive: { color: '#0D1117', fontWeight: '700' },
  error: { color: '#EF476F', marginTop: 12, fontSize: 13 },
});