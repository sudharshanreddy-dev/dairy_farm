import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';

import { MaterialCommunityIcons } from '@expo/vector-icons';

const menuItems = [
  { title: 'Milk Production', icon: 'flask', desc: 'Log daily yields', path: '/records/milk', addPath: '/records/add-milk', color: '#58a6ff' },
  { title: 'Health Records', icon: 'medical-bag', desc: 'Track treatments', path: '/records/health', addPath: '/records/add-health', color: '#f85149' },
  { title: 'Vaccinations', icon: 'needle', desc: 'Vaccination schedule', path: '/records/vaccinations', addPath: '/records/add-vax', color: '#3fb950' },
  { title: 'Bulk Feeding', icon: 'barley', desc: 'Log group rations', path: '/records/bulk-feeding', addPath: '/records/bulk-feeding', color: '#bc8cff' },
  { title: 'Sales & Revenue', icon: 'cash-register', desc: 'Record transactions', path: '/records/sales', addPath: '/records/add-sale', color: '#d29922' },
];

export default function RecordsMenu() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const s = makeStyles(colors);


  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <View style={s.topbar}>
        <Text style={s.title}>📋 Farm Logs</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        {menuItems.map((item, idx) => {
        return (
            <View key={idx} style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 }}>
                <View style={[s.iconWrap, { backgroundColor: item.color + '22' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.itemTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.itemDesc, { color: colors.muted }]}>{item.desc}</Text>
                </View>
              </View>
              <View style={s.actions}>
                <TouchableOpacity style={[s.viewBtn, { borderColor: item.color, borderWidth: 1 }]}
                  onPress={() => router.push(item.path as any)}>
                  <Text style={[s.viewBtnText, { color: item.color }]}>View History</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.addBtn, { backgroundColor: item.color }]}
                  onPress={() => router.push(item.addPath as any)}>
                  <Text style={s.addBtnText}>+ Log New</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  flex: { flex: 1 },
  topbar: {
    backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  title: { fontSize: 18, fontWeight: '700', color: c.text },
  content: { padding: 14, gap: 12, paddingBottom: 24 },
  card: {
    borderRadius: 24, borderWidth: 1, padding: 20,
    gap: 16,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, fontWeight: '700' },
  itemDesc: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  viewBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  viewBtnText: { fontSize: 13, fontWeight: '700' },
  addBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
