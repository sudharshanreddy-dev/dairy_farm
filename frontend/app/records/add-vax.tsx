import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AddVaccination() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [form, setForm] = useState({
    cattleId: '',
    dateGiven: new Date().toISOString().split('T')[0],
    vaccineName: '',
    nextDueDate: '',
    cost: '0',
    administeredBy: '',
  });
  const [cattle, setCattle] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    api.get('cattle').then(res => setCattle(res.data)).catch(() => {});
  }, []);

  const selectedCattle = cattle.find(c => c.id.toString() === form.cattleId);

  const handleSave = async () => {
    if (!form.cattleId) return Alert.alert('Error', 'Please select a cattle.');
    if (!form.vaccineName) return Alert.alert('Error', 'Vaccine name is required.');
    setSaving(true);
    try {
      await api.post('farm/vaccinations', {
        ...form,
        cost: parseFloat(form.cost) || 0,
      });
      Alert.alert('Success ✓', 'Vaccination logged!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('Error', 'Failed to save vaccination record.');
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
          <Text style={[s.title, { color: colors.text }]}>Log Vaccination</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>💉 Vaccination Schedule</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator size="small" color={colors.green} />
            : <MaterialCommunityIcons name="check" size={24} color={colors.green} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Cattle Selector */}
        <Section title="Select Cattle" colors={colors}>
          <TouchableOpacity
            style={[s.selector, { backgroundColor: colors.surface, borderColor: showPicker ? colors.green : colors.border }]}
            onPress={() => setShowPicker(!showPicker)}
          >
            <MaterialCommunityIcons name="cow" size={20} color={colors.muted} />
            <Text style={[s.selectorText, { color: selectedCattle ? colors.text : colors.muted }]}>
              {selectedCattle ? `${selectedCattle.name} (${selectedCattle.tagNumber})` : 'Tap to select...'}
            </Text>
            <MaterialCommunityIcons name={showPicker ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
          </TouchableOpacity>
          {showPicker && (
            <View style={[s.dropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {cattle.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[s.dropdownItem, form.cattleId === c.id.toString() && { backgroundColor: colors.greenDim }]}
                  onPress={() => { setForm({ ...form, cattleId: c.id.toString() }); setShowPicker(false); }}
                >
                  <Text style={[s.dropdownItemText, { color: form.cattleId === c.id.toString() ? colors.green : colors.text }]}>
                    {c.name} <Text style={{ color: colors.muted }}>#{c.tagNumber}</Text>
                  </Text>
                  {form.cattleId === c.id.toString() && <MaterialCommunityIcons name="check" size={16} color={colors.green} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Section>

        {/* Vaccine Details */}
        <Section title="Vaccine Details" colors={colors}>
          <Input label="Vaccine Name *" icon="needle" placeholder="e.g. FMD, Anthrax, Brucella" value={form.vaccineName} onChange={v => setForm({ ...form, vaccineName: v })} colors={colors} />
          <Input label="Administered By" icon="doctor" placeholder="e.g. Dr. Kumar" value={form.administeredBy} onChange={v => setForm({ ...form, administeredBy: v })} colors={colors} />
          <Input label="Cost (₹)" icon="cash" value={form.cost} onChange={v => setForm({ ...form, cost: v })} keyboard="numeric" colors={colors} />
        </Section>

        {/* Dates */}
        <Section title="Dates" colors={colors}>
          <View style={s.row}>
            <Input label="Date Given" icon="calendar" value={form.dateGiven} onChange={v => setForm({ ...form, dateGiven: v })} colors={colors} flex={1} />
            <View style={{ width: 12 }} />
            <Input label="Next Due Date" icon="calendar-clock" placeholder="Optional" value={form.nextDueDate} onChange={v => setForm({ ...form, nextDueDate: v })} colors={colors} flex={1} />
          </View>
        </Section>

        <TouchableOpacity
          style={[s.submitBtn, { backgroundColor: colors.green }, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <><MaterialCommunityIcons name="shield-check" size={20} color="#fff" /><Text style={s.submitText}>Record Vaccination</Text></>}
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
  sectionLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 10 },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 10, height: 52,
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 14,
  },
  selectorText: { flex: 1, fontSize: 15, fontWeight: '500' },
  dropdown: { borderRadius: 16, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(139,148,158,0.15)',
  },
  dropdownItemText: { fontSize: 14, fontWeight: '600' },
  row: { flexDirection: 'row' },
  inputWrap: { marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginLeft: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, height: 52 },
  input: { flex: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '500' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 58, borderRadius: 20, marginTop: 8, elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
