import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getProfiles, selectProfile } from '../api/profiles';
import { useAuth } from '../context/AuthContext';

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#FFD166', '#A78BFA', '#F2A93B', '#06D6A0', '#EF476F', '#118AB2'];

type Profile = { id: number; name: string; avatar_url: string | null };

function ProfileTile({ profile, index, onPress }: { profile: Profile; index: number; onPress: () => void }) {
  const anim = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }).start();
  }, []);
  const color = AVATAR_COLORS[profile.id % AVATAR_COLORS.length];

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.ring}>
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarLetter}>{profile.name[0]?.toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ProfilePicker({ navigation }: any) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState('');
  const { selectProfile: setProfileToken, role } = useAuth();

  const isAdminOrUploader = role === 'admin' || role === 'uploader';

  useEffect(() => {
    getProfiles().then(setProfiles).catch(() => setError("Couldn't load profiles."));
  }, []);

  async function handlePick(profileId: number) {
    try {
      const token = await selectProfile(profileId);
      await setProfileToken(token);
    } catch {
      setError("Couldn't switch profile. Try again.");
    }
  }

  const displayedProfiles = isAdminOrUploader ? profiles.slice(0, 1) : profiles;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>STREAMFLIX</Text>
      <Text style={styles.heading}>Who's Watching?</Text>
      <View style={styles.gridContainer}>
        {displayedProfiles.map((p, idx) => (
          <ProfileTile key={p.id} profile={p} index={idx} onPress={() => handlePick(p.id)} />
        ))}

        {!isAdminOrUploader && (
          <TouchableOpacity
            style={styles.addTile}
            onPress={() => navigation.navigate('ProfileManage')}
            activeOpacity={0.7}
          >
            <View style={styles.addRing}>
              <Text style={styles.addPlus}>+</Text>
            </View>
            <Text style={styles.name}>Add Profile</Text>
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', paddingTop: 40, alignItems: 'center' },
  logo: { color: '#8A8F98', fontSize: 13, fontWeight: '600', letterSpacing: 2, marginBottom: 20 },
  heading: { fontSize: 26, fontWeight: '700', color: '#F5F5F0', marginBottom: 28 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16 },
  tile: { alignItems: 'center', width: 100, marginBottom: 20 },
  addTile: { alignItems: 'center', width: 100, marginBottom: 20 },
  ring: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(242,169,59,0.4)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  addRing: {
    width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  addPlus: { color: '#F5F5F0', fontSize: 32, fontWeight: '300' },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#0D1117', fontSize: 26, fontWeight: '700' },
  name: { color: '#8A8F98', fontSize: 13, fontWeight: '500' },
  error: { color: '#EF476F', marginTop: 16, fontSize: 13 },
});