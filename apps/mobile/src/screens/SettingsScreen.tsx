import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

export default function SettingsScreen() {
  const [hostIp, setHostIp] = useState(API_BASE_URL);

  const handleSaveIp = async () => {
    await AsyncStorage.setItem('custom_host_ip', hostIp);
    Alert.alert('Settings Saved', 'LAN Backend Host IP saved.');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Backend LAN Host IP</Text>
        <TextInput
          style={styles.input}
          value={hostIp}
          onChangeText={setHostIp}
          placeholder="http://192.168.x.x:8000"
          placeholderTextColor="#8A8F98"
        />
        <TouchableOpacity style={styles.btn} onPress={handleSaveIp}>
          <Text style={styles.btnText}>Save Host IP</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: 24 }]}>App Info</Text>
        <Text style={styles.info}>StreamFlix React Native Client v0.1.0 (Phase 19)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', padding: 16 },
  header: { color: '#F5F5F0', fontSize: 24, fontWeight: '700', marginBottom: 16 },
  card: { backgroundColor: '#171B24', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  label: { color: '#F5F5F0', fontWeight: '600', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#0D1117', color: '#F5F5F0', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginBottom: 16 },
  btn: { backgroundColor: '#F2A93B', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#0D1117', fontWeight: '700' },
  info: { color: '#8A8F98', fontSize: 13 },
});
