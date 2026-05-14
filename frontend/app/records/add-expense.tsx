import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../src/api/axios';
import Toast from 'react-native-toast-message';

const CATEGORIES = ['Labour', 'Electricity', 'Water', 'Maintenance', 'Rent', 'Fuel', 'Other'];

export default function AddExpense() {
  const router = useRouter();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    category: 'Labour',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleSubmit = async () => {
    if (!form.amount || Number(form.amount) <= 0) {
      Toast.show({ type: 'error', text1: 'Invalid Amount', text2: 'Please enter a valid expense amount' });
      return;
    }

    setLoading(true);
    try {
      await api.post('farm/expenses', form);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Expense recorded successfully' });
      router.push('/records/expenses');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e.response?.data?.error || 'Failed to record expense' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.title, { color: colors.text }]}>New Operating Expense</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={s.content}>
          <Text style={[s.label, { color: colors.muted }]}>Category</Text>
          <View style={s.catGrid}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  s.catBtn,
                  { borderColor: colors.border },
                  form.category === cat && { backgroundColor: colors.violet, borderColor: colors.violet }
                ]}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <Text style={[s.catText, { color: colors.text }, form.category === cat && { color: '#fff' }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.muted }]}>Amount (₹)</Text>
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="e.g. 5000"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.amount}
              onChangeText={t => setForm({ ...form, amount: t })}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.muted }]}>Date</Text>
            <TextInput
              style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={form.date}
              onChangeText={t => setForm({ ...form, date: t })}
            />
          </View>

          <View style={s.inputGroup}>
            <Text style={[s.label, { color: colors.muted }]}>Description (Optional)</Text>
            <TextInput
              style={[s.input, s.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
              placeholder="Details about the expense..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
              value={form.description}
              onChangeText={t => setForm({ ...form, description: t })}
            />
          </View>

          <TouchableOpacity
            style={[s.submitBtn, { backgroundColor: colors.violet }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitBtnText}>Save Expense</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  content: { padding: 20 },
  label: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  catText: { fontSize: 13, fontWeight: '600' },
  inputGroup: { marginBottom: 20 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  submitBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
