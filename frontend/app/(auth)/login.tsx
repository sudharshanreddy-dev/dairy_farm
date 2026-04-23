import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, StatusBar, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const s = makeStyles(colors);

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('auth/login', { username: username.trim(), password });
      await login(response.data.token, response.data.user);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Login failed. Check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoIcon}>
            <Text style={s.logoEmoji}>🐄</Text>
          </View>
          <Text style={s.appName}>DairyFarm Pro</Text>
          <Text style={s.appSub}>Smart Dairy Farm Management</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to manage your farm</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Username */}
          <View style={s.formGroup}>
            <Text style={s.label}>Username</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>👤</Text>
              <TextInput
                style={s.input}
                placeholder="Enter username"
                placeholderTextColor={colors.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.formGroup}>
            <Text style={s.label}>Password</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput
                style={[s.input, { paddingRight: 48 }]}
                placeholder="Enter password"
                placeholderTextColor={colors.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.submitBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.submitText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={s.bottomText}>
          New here?{' '}
          <Text style={s.linkText} onPress={() => router.push('/(auth)/register')}>
            Create an account
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logoIcon: {
    width: 68, height: 68, backgroundColor: c.accent, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: c.accent, shadowOffset: { width: 0, height: 0 }, shadowRadius: 24, shadowOpacity: 0.5, elevation: 10,
  },
  logoEmoji: { fontSize: 32 },
  appName: { fontSize: 24, fontWeight: '700', color: c.text, letterSpacing: -0.5 },
  appSub: { fontSize: 13, color: c.muted, marginTop: 4 },
  card: {
    width: '100%', maxWidth: 400, backgroundColor: c.surface,
    borderRadius: 16, padding: 28, borderWidth: 1, borderColor: c.border,
    shadowColor: c.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: 0.15, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: c.muted, marginBottom: 20 },
  errorBox: { backgroundColor: c.redDim, borderColor: c.red, borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 16 },
  errorText: { color: c.red, fontSize: 13 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: c.muted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, borderRadius: 10, borderWidth: 1, borderColor: c.border },
  inputIcon: { padding: 12, fontSize: 16 },
  input: { flex: 1, paddingVertical: 11, paddingRight: 12, fontSize: 14, color: c.text },
  eyeBtn: { padding: 12 },
  eyeIcon: { fontSize: 16 },
  submitBtn: {
    backgroundColor: c.accent, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 8,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomText: { color: c.muted, fontSize: 13, marginTop: 20, textAlign: 'center' },
  linkText: { color: c.green, fontWeight: '600' },
});
