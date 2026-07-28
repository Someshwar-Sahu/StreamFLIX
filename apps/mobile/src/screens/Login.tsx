import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, register } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { saveToken } = useAuth();

  async function handleSubmit() {
    setError('');
    try {
      const token = mode === 'login'
        ? await login(email, password)
        : await register(email, username, password);
      await saveToken(token);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>STREAMFLIX</Text>
      <Text style={styles.header}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#8A8F98"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {mode === 'register' && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#8A8F98"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#8A8F98"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{mode === 'login' ? 'Sign In' : 'Register'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={styles.switchText}>
          {mode === 'login' ? "New here? Create an account" : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0D1117', justifyContent: 'center' },
  logo: { color: '#8A8F98', fontSize: 13, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  header: { fontSize: 28, fontWeight: '700', color: '#F5F5F0', marginBottom: 28 },
  input: {
    borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', borderRadius: 8, padding: 14,
    color: '#F5F5F0', backgroundColor: '#171B24', marginBottom: 14, fontSize: 15,
  },
  button: { backgroundColor: '#F2A93B', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#0D1117', fontWeight: '700', fontSize: 15 },
  error: { color: '#EF476F', marginTop: 14, fontSize: 13 },
  switchText: { color: '#8A8F98', marginTop: 20, textAlign: 'center', fontSize: 13, textDecorationLine: 'underline' },
});