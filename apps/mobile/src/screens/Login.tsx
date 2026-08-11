import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, register, verifyOtp, resendOtp, forgotPassword, resetPassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { DESIGN_TOKENS } from '@streamflix/ui';

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
      } else if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setInfo(res.message || `Verification code sent to ${email}`);
        setMode('reset');
      } else if (mode === 'reset') {
        const res = await resetPassword(email, otpCode, newPassword);
        setInfo(res.message || 'Password reset successfully! Please sign in.');
        setPassword('');
        setMode('login');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.logoRow}>
              <Text style={styles.logoStream}>STREAM</Text>
              <Text style={styles.logoFlix}>FLIX</Text>
            </View>

            <Text style={styles.header}>
              {mode === 'login'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : mode === 'verify'
                ? 'Verify Email'
                : mode === 'forgot'
                ? 'Reset Password'
                : 'Set New Password'}
            </Text>

            {info ? <Text style={styles.info}>{info}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            {(mode === 'login' || mode === 'register' || mode === 'forgot' || mode === 'reset') && (
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor="#a0a4a8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={mode !== 'reset'}
              />
            )}

            {mode === 'register' && (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#a0a4a8"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            )}

            {(mode === 'login' || mode === 'register') && (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#a0a4a8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                {mode === 'login' && (
                  <TouchableOpacity onPress={() => setMode('forgot')} style={styles.forgotWrap}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {mode === 'verify' && (
              <View style={styles.verifyWrap}>
                <Text style={styles.verifySubtitle}>
                  Enter the 6-digit code sent to <Text style={styles.boldText}>{email}</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor="#a0a4a8"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity onPress={handleResend}>
                  <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'reset' && (
              <View style={styles.verifyWrap}>
                <TextInput
                  style={[styles.input, styles.otpInput]}
                  placeholder="6-digit code"
                  placeholderTextColor="#a0a4a8"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password (min 6 chars)"
                  placeholderTextColor="#a0a4a8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            )}

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {mode === 'login'
                    ? 'Sign In'
                    : mode === 'register'
                    ? 'Send Security Code'
                    : mode === 'verify'
                    ? 'Verify & Start Watching'
                    : mode === 'forgot'
                    ? 'Send Reset Code'
                    : 'Update Password & Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {mode === 'login' && (
              <TouchableOpacity onPress={() => setMode('register')} style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  New to StreamFlix? <Text style={styles.switchHighlight}>Sign up now.</Text>
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'register' && (
              <TouchableOpacity onPress={() => setMode('login')} style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  Already have an account? <Text style={styles.switchHighlight}>Sign in.</Text>
                </Text>
              </TouchableOpacity>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <TouchableOpacity onPress={() => setMode('login')} style={styles.switchWrap}>
                <Text style={styles.switchText}>
                  Remembered your password? <Text style={styles.switchHighlight}>Back to Sign In</Text>
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0f0f',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(26, 28, 28, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 28,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoStream: {
    fontFamily: DESIGN_TOKENS.fonts.heading,
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
  },
  logoFlix: {
    fontFamily: DESIGN_TOKENS.fonts.heading,
    fontSize: 26,
    fontWeight: '900',
    color: '#e50914',
    letterSpacing: 2,
  },
  header: {
    fontFamily: DESIGN_TOKENS.fonts.heading,
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#121414',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    color: '#ffffff',
    fontSize: 15,
    paddingHorizontal: 16,
    height: 52,
    marginBottom: 14,
  },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotText: {
    color: '#a0a4a8',
    fontSize: 13,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#e50914',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  switchWrap: {
    marginTop: 24,
    alignItems: 'center',
  },
  switchText: {
    color: '#a0a4a8',
    fontSize: 14,
  },
  switchHighlight: {
    color: '#e50914',
    fontWeight: '700',
  },
  info: {
    color: '#46d369',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  error: {
    color: '#e50914',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  verifyWrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  verifySubtitle: {
    color: '#a0a4a8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  boldText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: '700',
    color: '#e50914',
    width: '100%',
  },
  resendText: {
    color: '#e50914',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
});