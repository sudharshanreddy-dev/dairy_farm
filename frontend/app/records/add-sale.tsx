import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddSale() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    buyerName: '',
    quantityLiters: '',
    pricePerLiter: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const total = (parseFloat(form.quantityLiters) || 0) * (parseFloat(form.pricePerLiter) || 0);

  const handleSave = async () => {
    if (!form.quantityLiters || !form.pricePerLiter) {
      return Alert.alert('Error', 'Quantity and Price per liter are required.');
    }
    setSaving(true);
    try {
      await api.post('farm/sales', {
        ...form,
        quantityLiters: parseFloat(form.quantityLiters),
        pricePerLiter: parseFloat(form.pricePerLiter),
        totalAmount: total,
      });
      Alert.alert('Success ✓', 'Sale recorded!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save sale record.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Record Sale</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>💰 Revenue Entry</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.amber} />
            : <MaterialCommunityIcons name="check" size={24} color={colors.green} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Live Total Banner */}
        {total > 0 && (
          <View style={[s.totalBanner, { backgroundColor: colors.greenDim, borderColor: colors.green }]}>
            <Text style={[s.totalLabel, { color: colors.green }]}>Transaction Amount</Text>
            <Text style={[s.totalValue, { color: colors.text }]}>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
          </View>
        )}

        {/* Sale Details */}
        <Section title="Sale Details" colors={colors}>
          <Input label="Date (YYYY-MM-DD)" icon="calendar" value={form.date} onChange={v => setForm({ ...form, date: v })} colors={colors} />
          <Input label="Buyer Name" icon="account" placeholder="e.g. Ram Dairy, Local Coop" value={form.buyerName} onChange={v => setForm({ ...form, buyerName: v })} colors={colors} />
        </Section>

        {/* Quantity & Pricing */}
        <Section title="Quantity & Pricing" colors={colors}>
          <View style={s.row}>
            <Input label="Quantity (Liters)" icon="water" value={form.quantityLiters} onChange={v => setForm({ ...form, quantityLiters: v })} keyboard="numeric" colors={colors} flex={1} />
            <View style={{ width: 12 }} />
            <Input label="Price / Liter (₹)" icon="currency-inr" value={form.pricePerLiter} onChange={v => setForm({ ...form, pricePerLiter: v })} keyboard="numeric" colors={colors} flex={1} />
          </View>
        </Section>

        {/* Payment Method */}
        <Section title="Payment Method" colors={colors}>
          <View style={[s.segmented, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {['Cash', 'UPI', 'Bank Transfer', 'Credit'].map(opt => (
              <TouchableOpacity
                key={opt}
                style={[s.segment, form.paymentMethod === opt && { backgroundColor: colors.amberDim }]}
                onPress={() => setForm({ ...form, paymentMethod: opt })}
              >
                <Text style={[s.segmentText, { color: form.paymentMethod === opt ? colors.amber : colors.muted }]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: colors.amber }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <><MaterialCommunityIcons name="cash-register" size={20} color="#fff" /><Text style={s.submitText}>Complete Sale</Text></>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const Section = ({ title, children, colors }: any) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={[s.sectionLabel, { color: colors.green }]}>{title.toUpperCase()}</Text>
    {children}
  </View>
);

const Input = ({ label, icon, placeholder, value, onChange, keyboard, colors, flex }: {
  label: string; icon?: string; placeholder?: string; value: string;
  onChange: (v: string) => void; keyboard?: string; colors: any; flex?: number;
}) => (
  <View style={[s.inputWrap, flex ? { flex } : undefined]}>
    <Text style={[s.inputLabel, { color: colors.muted }]}>{label}</Text>
    <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon && <MaterialCommunityIcons name={icon as any} size={18} color={colors.muted} style={{ marginLeft: 14 }} />}
      <TextInput
        style={[s.input, { color: colors.text }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboard as any || 'default'}
      />
    </View>
  </View>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 1 },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20, paddingBottom: 60 },
  totalBanner: {
    borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 24,
  },
  totalLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  totalValue: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: 'row' },
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, height: 52 },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '500' },
  segmented: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  segment: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 58, borderRadius: 20, marginTop: 8, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
