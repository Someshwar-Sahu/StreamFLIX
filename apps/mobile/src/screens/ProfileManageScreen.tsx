import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { getProfiles, createProfile, deleteProfile } from '../api/profiles';

const AVATAR_OPTIONS = [
  '/avatars/avatar-1.svg',
  '/avatars/avatar-2.svg',
  '/avatars/avatar-3.svg',
  '/avatars/avatar-4.svg',
  '/avatars/avatar-5.svg',
  '/avatars/avatar-6.svg',
  '/avatars/avatar-7.svg',
  '/avatars/avatar-8.svg',
];

export default function ProfileManageScreen() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('/avatars/avatar-1.svg');

  const loadData = async () => {
    try {
      const data = await getProfiles();
      setProfiles(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!newProfileName.trim()) return;
    try {
      await createProfile({ name: newProfileName, avatar_url: selectedAvatar });
      setNewProfileName('');
      loadData();
      Alert.alert('Success', 'Profile created!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Failed to create profile');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProfile(id);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete profile');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionHeader}>Existing Profiles</Text>

      {profiles.map((p) => (
        <View key={p.id} style={styles.profileRow}>
          <Text style={styles.profileName}>{p.name}</Text>
          <TouchableOpacity onPress={() => handleDelete(p.id)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.sectionHeader, { marginTop: 24 }]}>Create New Profile</Text>

      <TextInput
        style={styles.input}
        placeholder="Profile Name"
        placeholderTextColor="#8A8F98"
        value={newProfileName}
        onChangeText={setNewProfileName}
      />

      <Text style={styles.label}>Choose Avatar Illustration</Text>

      <View style={styles.avatarGrid}>
        {AVATAR_OPTIONS.map((avatar, idx) => (
          <TouchableOpacity
            key={avatar}
            style={[styles.avatarOption, selectedAvatar === avatar && styles.avatarSelected]}
            onPress={() => setSelectedAvatar(avatar)}
          >
            <Text style={styles.avatarText}>#{idx + 1}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
        <Text style={styles.createBtnText}>Create Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 16 },
  sectionHeader: { color: '#F5F5F0', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#171B24', padding: 14, borderRadius: 8, marginBottom: 8 },
  profileName: { color: '#F5F5F0', fontSize: 16 },
  deleteBtn: { backgroundColor: 'rgba(230,57,70,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4 },
  deleteText: { color: '#E63946', fontWeight: '600', fontSize: 12 },
  input: { backgroundColor: '#171B24', color: '#F5F5F0', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  label: { color: '#8A8F98', fontSize: 14, marginBottom: 8 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  avatarOption: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#212631', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: '#F2A93B', backgroundColor: 'rgba(242,169,59,0.2)' },
  avatarText: { color: '#F5F5F0', fontWeight: '700' },
  createBtn: { backgroundColor: '#F2A93B', padding: 14, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#0D1117', fontWeight: '700', fontSize: 16 },
});
