import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MilkProduction() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const resp = await api.get('farm/milk');
      setRecords(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalToday = records
    .filter(r => r.date?.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, r) => sum + (r.totalYield || 0), 0);

  const renderItem = ({ item }: any) => (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.cardHeader}>
        <View style={[s.iconWrap, { backgroundColor: colors.blueDim }]}>
          <MaterialCommunityIcons name="water" size={20} color={colors.blue} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.cattleName, { color: colors.text }]}>
            {item.cattle?.name || 'Unknown'} <Text style={[s.tagNum, { color: colors.muted }]}>#{item.cattle?.tagNumber}</Text>
          </Text>
          <Text style={[s.date, { color: colors.muted }]}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
        </View>
        <View style={[s.totalBadge, { backgroundColor: colors.blueDim }]}>
          <Text style={[s.totalText, { color: colors.blue }]}>{item.totalYield} L</Text>
        </View>
      </View>
      <View style={s.breakdown}>
        <View style={[s.breakItem, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="weather-sunset-up" size={14} color={colors.muted} />
          <Text style={[s.breakLabel, { color: colors.muted }]}>Morning</Text>
          <Text style={[s.breakVal, { color: colors.text }]}>{item.morningYield} L</Text>
        </View>
        <View style={[s.breakItem, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="weather-sunset-down" size={14} color={colors.muted} />
          <Text style={[s.breakLabel, { color: colors.muted }]}>Evening</Text>
          <Text style={[s.breakVal, { color: colors.text }]}>{item.eveningYield} L</Text>
        </View>
        {item.notes ? (
          <View style={[s.breakItem, { borderColor: colors.border, flex: 2 }]}>
            <MaterialCommunityIcons name="note-text" size={14} color={colors.muted} />
            <Text style={[s.breakLabel, { color: colors.muted }]}>{item.notes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Milk Production</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{records.length} records · Today: {totalToday.toFixed(1)} L</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/records/add-milk' as any)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.blue} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.blue} /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="water-off" size={60} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No milk records yet.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.blue }]} onPress={() => router.push('/records/add-milk' as any)}>
                <Text style={s.emptyBtnText}>Log First Record</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 8, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 1 },
  iconBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  card: { borderRadius: 20, borderWidth: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cattleName: { fontSize: 15, fontWeight: '700' },
  tagNum: { fontSize: 13, fontWeight: '500' },
  date: { fontSize: 11, marginTop: 2 },
  totalBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  totalText: { fontSize: 15, fontWeight: '800' },
  breakdown: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(139,148,158,0.15)' },
  breakItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  breakLabel: { fontSize: 11, fontWeight: '600' },
  breakVal: { fontSize: 13, fontWeight: '700', marginLeft: 'auto' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
