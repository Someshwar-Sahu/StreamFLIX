import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { getProfiles, Profile } from '../api/profiles';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function MySpaceScreen({ navigation }: any) {
  const { profileId, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const list = await getProfiles();
        const active = list.find((p) => p.id === profileId) || list[0] || null;
        setProfile(active);
      } catch (err) {
        console.error(err);
      }
    }
    loadProfile();
  }, [profileId]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerWrap}>
          <Text style={styles.header}>My Space</Text>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{profile?.name?.[0]?.toUpperCase() || 'P'}</Text>
            </View>
            <Text style={styles.profileName}>{profile?.name || 'Profile'}</Text>
          </View>

          <View style={styles.card}>
            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Watchlist')}>
              <Text style={styles.btnText}>🔖 Saved Watchlist</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('History')}>
              <Text style={styles.btnText}>🕒 Watch History</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Downloads')}>
              <Text style={styles.btnText}>📥 Offline Downloads</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Upload')}>
              <Text style={styles.btnText}>📤 Upload Movies & Series</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Categories')}>
              <Text style={styles.btnText}>🏷️ Category Management</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('ProfileManage')}>
              <Text style={styles.btnText}>⚙️ Manage Profiles & Avatars</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.btnText}>🔧 App Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.logoutBtn]} onPress={logout}>
              <Text style={[styles.btnText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DESIGN_TOKENS.colors.bgVoid },
  scrollContent: { paddingBottom: 110 },
  headerWrap: { paddingHorizontal: 16, paddingTop: 16, marginBottom: 12 },
  header: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 24, fontWeight: '700' },
  contentWrap: { paddingHorizontal: 16 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: DESIGN_TOKENS.colors.bgElevated, borderWidth: 2, borderColor: DESIGN_TOKENS.colors.accentAmber, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarLetter: { color: DESIGN_TOKENS.colors.accentAmber, fontSize: 24, fontWeight: '700' },
  profileName: { color: DESIGN_TOKENS.colors.textPrimary, fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: DESIGN_TOKENS.colors.bgElevated, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  btn: { backgroundColor: DESIGN_TOKENS.colors.bgSurface, padding: 14, borderRadius: 8, marginBottom: 10 },
  logoutBtn: { backgroundColor: 'rgba(230,57,70,0.15)', borderWidth: 1, borderColor: 'rgba(230,57,70,0.4)', marginTop: 8 },
  btnText: { color: DESIGN_TOKENS.colors.textPrimary, fontWeight: '600', fontSize: 14 },
  logoutText: { color: DESIGN_TOKENS.colors.dangerRed },
});
