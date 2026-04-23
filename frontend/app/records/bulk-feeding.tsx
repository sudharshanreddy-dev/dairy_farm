import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function BulkFeeding() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    inventoryId: '',
    totalQuantity: '',
    cattleCount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const r = await api.get('farm/inventory');
      // Filter for items that might be feed
      const feedItems = r.data.filter((item: any) => 
        item.category?.toLowerCase() === 'feed' || 
        item.category?.toLowerCase() === 'fodder' ||
        item.itemName?.toLowerCase().includes('feed')
      );
      setInventory(feedItems.length > 0 ? feedItems : r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.inventoryId || !form.totalQuantity || !form.cattleCount) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      await api.post('farm/feeding', {
        ...form,
        totalQuantity: parseFloat(form.totalQuantity),
        cattleCount: parseInt(form.cattleCount)
      });
      Alert.alert('Success', 'Feeding log saved successfully');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to save feeding log');
    } finally {
      setSaving(false);
    }
  };

  const selectedItem = inventory.find(i => i.id.toString() === form.inventoryId);

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={32} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Log Bulk Feeding</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.green} /></View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <View style={s.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color={colors.muted} />
            <Text style={[s.infoText, { color: colors.muted }]}>
              Use this form to log feeding for a group of animals. Stock will be auto-deducted from inventory.
            </Text>
          </View>

          <View style={s.section}>
            <Text style={[s.label, { color: colors.text }]}>1. Select Feed Item</Text>
            <View style={s.itemGrid}>
              {inventory.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    s.itemCard, 
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    form.inventoryId === item.id.toString() && { borderColor: colors.green, borderWidth: 2 }
                  ]}
                  onPress={() => setForm({ ...form, inventoryId: item.id.toString() })}
                >
                  <MaterialCommunityIcons name="corn" size={24} color={form.inventoryId === item.id.toString() ? colors.green : colors.muted} />
                  <Text style={[s.itemName, { color: colors.text }]} numberOfLines={1}>{item.itemName}</Text>
                  <Text style={[s.itemStock, { color: colors.muted }]}>{item.quantity} {item.unit} left</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={s.formGroup}>
            <Text style={[s.label, { color: colors.text }]}>2. Quantity Per Animal (kg/liters)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. 5"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.totalQuantity}
              onChangeText={v => setForm({ ...form, totalQuantity: v })}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={[s.label, { color: colors.text }]}>3. Animal Count</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="How many animals were fed?"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={form.cattleCount}
              onChangeText={v => setForm({ ...form, cattleCount: v })}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={[s.label, { color: colors.text }]}>Date</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={form.date}
              onChangeText={v => setForm({ ...form, date: v })}
            />
          </View>

          <View style={s.formGroup}>
            <Text style={[s.label, { color: colors.text }]}>Notes (Optional)</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, height: 80, textAlignVertical: 'top' }]}
              placeholder="Add any specific details..."
              placeholderTextColor={colors.muted}
              multiline
              value={form.notes}
              onChangeText={v => setForm({ ...form, notes: v })}
            />
          </View>

          <TouchableOpacity 
            style={[s.submitBtn, { backgroundColor: colors.green }]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Save Feeding Log</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 16, borderBottomWidth: 1 
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, gap: 24, paddingBottom: 60 },
  infoBox: { flexDirection: 'row', gap: 10, padding: 16, borderRadius: 12, backgroundColor: 'rgba(139,148,158,0.1)' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  section: { gap: 12 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  itemGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  itemCard: { width: '48%', padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemStock: { fontSize: 11 },
  formGroup: { gap: 8 },
  input: { height: 52, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 16 },
  submitBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
