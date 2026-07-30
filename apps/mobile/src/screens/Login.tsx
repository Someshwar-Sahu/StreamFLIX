import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, register, verifyOtp, resendOtp } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { saveToken } = useAuth();

  async function handleSubmit() {
    setError('');
    setInfo('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const token = await login(email, password);
        await saveToken(token);
      } else if (mode === 'register') {
        const res = await register(email, username, password);
        setInfo(res.message || 'Security code sent to your email');
        setMode('verify');
      } else if (mode === 'verify') {
        const token = await verifyOtp(email, otpCode);
        await saveToken(token);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    setInfo('');
    try {
      const res = await resendOtp(email);
      setInfo(res.message || 'A new code has been sent');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to resend code');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>STREAMFLIX</Text>
      <Text style={styles.header}>
        {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Create Account' : 'Verify Email'}
      </Text>

      {info ? <Text style={styles.info}>{info}</Text> : null}

      {mode !== 'verify' && (
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#8A8F98"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      )}

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

      {mode !== 'verify' && (
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#8A8F98"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      )}

      {mode === 'verify' && (
        <View style={styles.verifyWrap}>
          <Text style={styles.verifySubtitle}>
            Enter the 6-digit code sent to <Text style={styles.boldText}>{email}</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.otpInput]}
            placeholder="000000"
            placeholderTextColor="rgba(242,169,59,0.3)"
            maxLength={6}
            keyboardType="number-pad"
            value={otpCode}
            onChangeText={(t) => setOtpCode(t.replace(/\D/g, ''))}
          />
          <TouchableOpacity onPress={handleResend} style={{ marginTop: 8 }}>
            <Text style={styles.resendText}>Didn't receive code? <Text style={{ color: '#F2A93B' }}>Resend</Text></Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0D1117" />
        ) : (
          <Text style={styles.buttonText}>
            {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Send Security Code' : 'Verify & Start Streaming'}
          </Text>
        )}
      </TouchableOpacity>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {mode !== 'verify' && (
        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "New here? Create an account" : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      )}

      {mode === 'verify' && (
        <TouchableOpacity onPress={() => setMode('register')}>
          <Text style={styles.switchText}>← Change email or register again</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#0D1117', justifyContent: 'center' },
  logo: { color: '#8A8F98', fontSize: 13, fontWeight: '600', letterSpacing: 2, marginBottom: 16 },
  header: { fontSize: 28, fontWeight: '700', color: '#F5F5F0', marginBottom: 20 },
  info: { color: '#F2A93B', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  input: {
    borderWidth: 1, borderColor: 'rgba(138,143,152,0.25)', borderRadius: 8, padding: 14,
    color: '#F5F5F0', backgroundColor: '#171B24', marginBottom: 14, fontSize: 15,
  },
  verifyWrap: { marginBottom: 16, alignItems: 'center' },
  verifySubtitle: { color: '#8A8F98', fontSize: 14, marginBottom: 16, textAlign: 'center' },
  boldText: { color: '#F5F5F0', fontWeight: '700' },
  otpInput: { width: '100%', textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '700', color: '#F2A93B' },
  resendText: { color: '#8A8F98', fontSize: 13 },
  button: { backgroundColor: '#F2A93B', borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#0D1117', fontWeight: '700', fontSize: 15 },
  error: { color: '#EF476F', marginTop: 14, fontSize: 13, textAlign: 'center' },
  switchText: { color: '#8A8F98', marginTop: 20, textAlign: 'center', fontSize: 13, textDecorationLine: 'underline' },
});