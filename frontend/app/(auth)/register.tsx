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

function PasswordStrength({ password }: { password: string }) {
  const { colors } = useTheme();
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  const levels = [
    { pct: 0, color: colors.border, text: '' },
    { pct: 0.2, color: colors.red, text: 'Very Weak' },
    { pct: 0.4, color: colors.amber, text: 'Weak' },
    { pct: 0.6, color: colors.blue, text: 'Good' },
    { pct: 0.8, color: colors.green, text: 'Strong' },
    { pct: 1.0, color: colors.green, text: '💪 Secure' },
  ];
  const l = levels[Math.min(score, 5)];

  if (!password) return null;
  return (
    <View style={{ marginTop: 8 }}>
      <View style={{ height: 3, backgroundColor: colors.border, borderRadius: 2 }}>
        <View style={{ height: 3, width: `${l.pct * 100}%` as any, backgroundColor: l.color, borderRadius: 2 }} />
      </View>
      <Text style={{ fontSize: 11, color: l.color, marginTop: 4 }}>{l.text}</Text>
    </View>
  );
}

export default function Register() {
  const [form, setForm] = useState({
    username: '', password: '', confirm_password: '', full_name: '', farm_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const s = makeStyles(colors);

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const passwordMatch = form.confirm_password
    ? form.password === form.confirm_password
    : null;

  const handleRegister = async () => {
    setError('');
    if (!form.full_name || !form.farm_name || !form.username || !form.password || !form.confirm_password) {
      setError('All fields are required.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { confirm_password, ...payload } = form;
      const response = await api.post('auth/register', { ...payload, username: payload.username.trim() });
      await login(response.data.token, response.data.user);
    } catch (e: any) {
      const msg = e.response?.data?.error || 'Registration failed. Please try again.';
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
          <View style={s.logoIcon}><Text style={s.logoEmoji}>🐄</Text></View>
          <Text style={s.appName}>DairyFarm Pro</Text>
          <Text style={s.appSub}>Create your farm account</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Create Account</Text>
          <Text style={s.cardSub}>Fill in the details below to register</Text>

          {error ? (
            <View style={s.errorBox}><Text style={s.errorText}>⚠ {error}</Text></View>
          ) : null}

          {/* Section: Personal Info */}
          <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>Personal Info</Text><View style={s.dividerLine} /></View>

          <View style={s.formRow}>
            <View style={[s.formGroup, { flex: 1 }]}>
              <Text style={s.label}>Full Name *</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>👤</Text>
                <TextInput style={s.input} placeholder="Ravi Kumar" placeholderTextColor={colors.muted}
                  value={form.full_name} onChangeText={v => update('full_name', v)} />
              </View>
            </View>
            <View style={[s.formGroup, { flex: 1 }]}>
              <Text style={s.label}>Farm Name *</Text>
              <View style={s.inputWrap}>
                <Text style={s.inputIcon}>🏡</Text>
                <TextInput style={s.input} placeholder="Krishna Dairy" placeholderTextColor={colors.muted}
                  value={form.farm_name} onChangeText={v => update('farm_name', v)} />
              </View>
            </View>
          </View>

          {/* Section: Credentials */}
          <View style={s.divider}><View style={s.dividerLine} /><Text style={s.dividerText}>Login Credentials</Text><View style={s.dividerLine} /></View>

          <View style={s.formGroup}>
            <Text style={s.label}>Username *</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>@</Text>
              <TextInput style={s.input} placeholder="Choose a username" placeholderTextColor={colors.muted}
                value={form.username} onChangeText={v => update('username', v.trim())}
                autoCapitalize="none" autoCorrect={false} />
            </View>
            <Text style={s.hint}>4-30 chars, letters, numbers, dots or underscores</Text>
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Password *</Text>
            <View style={s.inputWrap}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput style={[s.input, { paddingRight: 48 }]} placeholder="Min. 8 characters" placeholderTextColor={colors.muted}
                value={form.password} onChangeText={v => update('password', v)}
                secureTextEntry={!showPassword} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword(!showPassword)}>
                <Text style={s.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <PasswordStrength password={form.password} />
          </View>

          <View style={s.formGroup}>
            <Text style={s.label}>Confirm Password *</Text>
            <View style={[s.inputWrap, passwordMatch === false && { borderColor: colors.red }]}>
              <Text style={s.inputIcon}>🔒</Text>
              <TextInput style={[s.input, { paddingRight: 48 }]} placeholder="Re-enter password" placeholderTextColor={colors.muted}
                value={form.confirm_password} onChangeText={v => update('confirm_password', v)}
                secureTextEntry={!showConfirm} />
              <TouchableOpacity style={s.eyeBtn} onPress={() => setShowConfirm(!showConfirm)}>
                <Text style={s.eyeIcon}>{showConfirm ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            {form.confirm_password ? (
              <Text style={[s.hint, { color: passwordMatch ? colors.green : colors.red }]}>
                {passwordMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity style={s.submitBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create Account</Text>}
          </TouchableOpacity>
        </View>

        <Text style={s.bottomText}>
          Already have an account?{' '}
          <Text style={s.linkText} onPress={() => router.back()}>Sign in</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, alignItems: 'center', padding: 20, paddingVertical: 32 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoIcon: {
    width: 64, height: 64, backgroundColor: c.accent, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    shadowColor: c.accent, shadowOffset: { width: 0, height: 0 }, shadowRadius: 20, shadowOpacity: 0.5, elevation: 8,
  },
  logoEmoji: { fontSize: 30 },
  appName: { fontSize: 22, fontWeight: '700', color: c.text },
  appSub: { fontSize: 13, color: c.muted, marginTop: 4 },
  card: {
    width: '100%', maxWidth: 480, backgroundColor: c.surface,
    borderRadius: 16, padding: 28, borderWidth: 1, borderColor: c.border,
    shadowColor: c.cardShadow, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, shadowOpacity: 0.15, elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginBottom: 4 },
  cardSub: { fontSize: 13, color: c.muted, marginBottom: 18 },
  errorBox: { backgroundColor: c.redDim, borderColor: c.red, borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 14 },
  errorText: { color: c.red, fontSize: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.border },
  dividerText: { fontSize: 10, color: c.muted, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  formRow: { flexDirection: 'row', gap: 12 },
  formGroup: { marginBottom: 14 },
  label: { fontSize: 12, color: c.muted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2,
    borderRadius: 10, borderWidth: 1, borderColor: c.border,
  },
  inputIcon: { padding: 11, fontSize: 15 },
  input: { flex: 1, paddingVertical: 10, paddingRight: 12, fontSize: 13.5, color: c.text },
  eyeBtn: { padding: 11 },
  eyeIcon: { fontSize: 15 },
  hint: { fontSize: 11, color: c.muted, marginTop: 5 },
  submitBtn: { backgroundColor: c.accent, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginTop: 8 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bottomText: { color: c.muted, fontSize: 13, marginTop: 20, textAlign: 'center' },
  linkText: { color: c.green, fontWeight: '600' },
});
