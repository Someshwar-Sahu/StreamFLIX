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
      <Text style={styles.header}>{mode === 'login' ? 'Login' : 'Register'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {mode === 'register' && (
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#888"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{mode === 'login' ? 'Login' : 'Register'}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={styles.switchText}>
          Switch to {mode === 'login' ? 'Register' : 'Login'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#000', justifyContent: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12,
    color: '#fff', marginBottom: 12,
  },
  button: { backgroundColor: '#1e90ff', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', marginTop: 12 },
  switchText: { color: '#1e90ff', marginTop: 16, textAlign: 'center' },
});