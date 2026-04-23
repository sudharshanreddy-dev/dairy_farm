import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import api from '../../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PREFILLED_BREEDS = [
  'Holstein Friesian',
  'Jersey',
  'Sahiwal',
  'Gir',
  'Red Sindhi',
  'Murrah Buffalo',
  'Other'
];

export default function AddCattle() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [showOtherInput, setShowOtherInput] = useState(false);
  
  const [form, setForm] = useState({
    tagNumber: '',
    name: '',
    breed: '',
    gender: 'Female',
    weight: '',
    quality: 'Good',
    purchasePrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    status: 'Active',
    damId: '',
    sireId: '',
    notes: ''
  });

  const handleBreedSelect = (breed: string) => {
    if (breed === 'Other') {
      setShowOtherInput(true);
      setForm({ ...form, breed: '' });
    } else {
      setShowOtherInput(false);
      setForm({ ...form, breed });
    }
  };

  useEffect(() => {
    if (id) {
      api.get(`cattle/${id}`).then(res => {
        const d = res.data;
        setForm({
          tagNumber: d.tagNumber || '',
          name: d.name || '',
          breed: d.breed || '',
          gender: d.gender || 'Female',
          weight: d.weight ? d.weight.toString() : '',
          quality: d.quality || 'Good',
          purchasePrice: d.purchasePrice ? d.purchasePrice.toString() : '',
          purchaseDate: d.purchaseDate ? d.purchaseDate.split('T')[0] : new Date().toISOString().split('T')[0],
          dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : '',
          status: d.status || 'Active',
          damId: d.damId ? d.damId.toString() : '',
          sireId: d.sireId ? d.sireId.toString() : '',
          notes: d.notes || ''
        });
        if (d.breed && !PREFILLED_BREEDS.includes(d.breed)) setShowOtherInput(true);
        setLoading(false);
      }).catch(() => {
        Alert.alert('Error', 'Failed to load cattle data');
        setLoading(false);
      });
    }
  }, [id]);

  const handleSave = async () => {
    if (!form.name || !form.breed || !form.weight || !form.purchasePrice) {
      Alert.alert('Required Fields', 'Please fill in Name, Breed, Weight, and Purchase Price.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        weight: parseFloat(form.weight),
        purchasePrice: parseFloat(form.purchasePrice),
        damId: form.damId ? parseInt(form.damId) : null,
        sireId: form.sireId ? parseInt(form.sireId) : null,
        dateOfBirth: form.dateOfBirth ? new Date(form.dateOfBirth).toISOString() : null,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
      };

      if (id) {
        await api.put(`cattle/${id}`, payload);
      } else {
        await api.post('cattle', payload);
      }
      
      Alert.alert('Success', id ? 'Cattle updated successfully' : 'Cattle registered successfully', [
        { text: 'OK', onPress: () => router.navigate('/(app)/cattle' as any) }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || (id ? 'Update failed' : 'Registration failed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={[s.flex, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.green} />
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={[s.flex, { backgroundColor: colors.bg }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.navigate('/(app)/cattle' as any)}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>{id ? 'Edit Cattle' : 'Register Cattle'}</Text>
        <TouchableOpacity style={s.iconBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={colors.green} /> : <MaterialCommunityIcons name="check" size={24} color={colors.green} />}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.form}>
           <SectionTitle title="Basic Information" colors={colors} />
           <Input 
             label="Tag Number (Optional)" 
             placeholder="e.g. F001 (Auto-generated if empty)"
             value={form.tagNumber} 
             onChange={(v: string) => setForm({...form, tagNumber: v})} 
             colors={colors} 
           />
           <Input 
             label="Name *" 
             placeholder="Cattle Name"
             value={form.name} 
             onChange={(v: string) => setForm({...form, name: v})} 
             colors={colors} 
           />

           <Label label="Select Breed *" colors={colors} />
           <View style={s.breedGrid}>
              {PREFILLED_BREEDS.map(b => {
                const isSelected = showOtherInput ? (b === 'Other') : (form.breed === b);
                return (
                  <TouchableOpacity 
                    key={b} 
                    style={[s.breedChip, { backgroundColor: colors.surface, borderColor: isSelected ? colors.green : colors.border }]}
                    onPress={() => handleBreedSelect(b)}
                  >
                    <Text style={[s.breedChipText, { color: isSelected ? colors.green : colors.text }]}>{b}</Text>
                  </TouchableOpacity>
                );
              })}
           </View>

           {showOtherInput && (
             <Input 
               label="Specify Other Breed *" 
               placeholder="Type breed name here..."
               value={form.breed} 
               onChange={(v: string) => setForm({...form, breed: v})} 
               colors={colors} 
               style={{ marginTop: 10 }}
             />
           )}

           <View style={s.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                 <Label label="Gender" colors={colors} />
                 <CustomPicker 
                    value={form.gender} 
                    options={['Female', 'Male']} 
                    onSelect={(v: string) => setForm({...form, gender: v})} 
                    colors={colors} 
                 />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                 <Label label="Quality" colors={colors} />
                 <CustomPicker 
                    value={form.quality} 
                    options={['Excellent', 'Good', 'Average']} 
                    onSelect={(v: string) => setForm({...form, quality: v})} 
                    colors={colors} 
                 />
              </View>
           </View>

           <SectionTitle title="Growth & Purchase" colors={colors} />
           <View style={s.row}>
              <Input 
                 label="Weight (kg) *" 
                 value={form.weight} 
                 onChange={(v: string) => setForm({...form, weight: v})} 
                 keyboard="numeric"
                 colors={colors} 
                 flex={1}
                 style={{ marginRight: 8 }}
              />
              <Input 
                 label="Purchase Price (₹) *" 
                 value={form.purchasePrice} 
                 onChange={(v: string) => setForm({...form, purchasePrice: v})} 
                 keyboard="numeric"
                 colors={colors} 
                 flex={1}
                 style={{ marginLeft: 8 }}
              />
           </View>
           <Input 
             label="Purchase Date (YYYY-MM-DD)" 
             value={form.purchaseDate} 
             onChange={(v: string) => setForm({...form, purchaseDate: v})} 
             colors={colors} 
           />
           <Input 
             label="DOB (YYYY-MM-DD)" 
             placeholder="Optional"
             value={form.dateOfBirth} 
             onChange={(v: string) => setForm({...form, dateOfBirth: v})} 
             colors={colors} 
           />

           <SectionTitle title="Lineage & Status" colors={colors} />
           <View style={s.row}>
              <Input 
                 label="Dam ID (Mother)" 
                 value={form.damId} 
                 onChange={(v: string) => setForm({...form, damId: v})} 
                 keyboard="numeric"
                 colors={colors} 
                 flex={1}
                 style={{ marginRight: 8 }}
              />
              <Input 
                 label="Sire ID (Father)" 
                 value={form.sireId} 
                 onChange={(v: string) => setForm({...form, sireId: v})} 
                 keyboard="numeric"
                 colors={colors} 
                 flex={1}
                 style={{ marginLeft: 8 }}
              />
           </View>

           <Label label="Current Status" colors={colors} />
           <CustomPicker 
              value={form.status} 
              options={['Active', 'Pregnant', 'Sick', 'Sold', 'Dry']} 
              onSelect={(v: string) => setForm({...form, status: v})} 
              colors={colors} 
           />

           <SectionTitle title="Additional Notes" colors={colors} />
           <TextInput
             style={[s.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
             value={form.notes}
             onChangeText={v => setForm({...form, notes: v})}
             placeholder="Any special remarks..."
             placeholderTextColor={colors.muted}
             multiline
             numberOfLines={4}
           />

            <TouchableOpacity 
             style={[s.submitBtn, { backgroundColor: colors.accent }]} 
             onPress={handleSave}
             disabled={saving}
           >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>{id ? 'Update Cattle' : 'Register New Cattle'}</Text>}
           </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const SectionTitle = ({ title, colors }: any) => (
  <Text style={[s.sectionTitle, { color: colors.green }]}>{title}</Text>
);

const Label = ({ label, colors }: any) => (
  <Text style={[s.label, { color: colors.muted }]}>{label}</Text>
);

const Input = ({ label, value, onChange, placeholder, keyboard, colors, flex, style }: any) => (
  <View style={[s.inputWrap, flex && { flex }, style]}>
    <Label label={label} colors={colors} />
    <TextInput
      style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      keyboardType={keyboard || 'default'}
    />
  </View>
);

const CustomPicker = ({ value, options, onSelect, colors }: any) => (
  <View style={[s.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    {options.map((opt: string) => (
      <TouchableOpacity 
        key={opt} 
        style={[s.pickerOpt, value === opt && { backgroundColor: colors.greenDim }]} 
        onPress={() => onSelect(opt)}
      >
        <Text style={[s.pickerOptText, { color: value === opt ? colors.green : colors.text }]}>{opt}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 8, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1 
  },
  title: { fontSize: 18, fontWeight: '800' },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 40 },
  form: { padding: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginTop: 24, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },
  inputWrap: { marginBottom: 16 },
  input: { height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '500' },
  breedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  breedChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  breedChipText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row', marginBottom: 8 },
  picker: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 4, flexWrap: 'wrap', gap: 4 },
  pickerOpt: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12 },
  pickerOptText: { fontSize: 13, fontWeight: '700' },
  textArea: { borderRadius: 16, borderWidth: 1, padding: 16, fontSize: 15, height: 120, textAlignVertical: 'top' },
  submitBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 32, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
