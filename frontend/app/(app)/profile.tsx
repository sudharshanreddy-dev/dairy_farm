import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profile() {
  const { user, updateUserData } = useContext(AuthContext);
  const { colors } = useTheme();
  
  const [form, setForm] = useState({
    full_name: user?.fullName || '',
    farm_name: user?.farmName || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('auth/profile');
      setForm({
        full_name: res.data.fullName,
        farm_name: res.data.farmName || '',
        email: res.data.email || '',
      });
      // Update local storage if backend has more info
      updateUserData({
        fullName: res.data.fullName,
        farmName: res.data.farmName,
        email: res.data.email
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.full_name || !form.farm_name) {
      Alert.alert('Error', 'Full Name and Farm Name are required.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('auth/profile', form);
      await updateUserData(res.data.user);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.flex, { backgroundColor: colors.bg }]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
           <View style={[styles.avatar, { backgroundColor: colors.surface2 }]}>
              <MaterialCommunityIcons name="account-edit" size={48} color={colors.green} />
           </View>
           <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
           <Text style={[styles.subtitle, { color: colors.muted }]}>Manage your account and farm details</Text>
        </View>

        <View style={styles.form}>
           <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={form.full_name}
                onChangeText={(t) => setForm({ ...form, full_name: t })}
                placeholder="Your full name"
                placeholderTextColor={colors.muted}
              />
           </View>

           <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Farm Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={form.farm_name}
                onChangeText={(t) => setForm({ ...form, farm_name: t })}
                placeholder="Your farm's registered name"
                placeholderTextColor={colors.muted}
              />
           </View>

           <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.muted }]}>Email Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={form.email}
                onChangeText={(t) => setForm({ ...form, email: t })}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={colors.muted}
              />
           </View>

           <TouchableOpacity 
             style={[styles.saveBtn, { backgroundColor: colors.accent }]} 
             onPress={handleSave}
             disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
           </TouchableOpacity>
        </View>

        <View style={styles.securityInfo}>
           <MaterialCommunityIcons name="shield-check" size={16} color={colors.muted} />
           <Text style={[styles.securityText, { color: colors.muted }]}>
             Your data is securely stored and only used for farm management.
           </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingTop: 40 },
  header: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    height: 54,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  securityInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, opacity: 0.7 },
  securityText: { fontSize: 11, fontWeight: '500' },
});

