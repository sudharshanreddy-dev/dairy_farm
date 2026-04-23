import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Vaccinations() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const resp = await api.get('farm/vaccinations');
      setRecords(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isDueSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const daysLeft = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return daysLeft >= 0 && daysLeft <= 14;
  };

  const renderItem = ({ item }: any) => {
    const dueSoon = isDueSoon(item.nextDueDate);

    return (
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: dueSoon ? colors.amber : colors.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: colors.greenDim }]}>
            <MaterialCommunityIcons name="shield-check" size={20} color={colors.green} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.vaccineName, { color: colors.text }]}>{item.vaccineName}</Text>
            <Text style={[s.cattleName, { color: colors.muted }]}>
              {item.cattle?.name} <Text style={{ fontWeight: '500' }}>#{item.cattle?.tagNumber}</Text>
            </Text>
          </View>
          <Text style={[s.dateGiven, { color: colors.muted }]}>
            {new Date(item.dateGiven).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>

        <View style={[s.footer, { borderTopColor: 'rgba(139,148,158,0.1)' }]}>
          {item.nextDueDate ? (
            <View style={[s.dueChip, { backgroundColor: dueSoon ? colors.amberDim : colors.surface2 }]}>
              <MaterialCommunityIcons name="calendar-clock" size={13} color={dueSoon ? colors.amber : colors.muted} />
              <Text style={[s.dueText, { color: dueSoon ? colors.amber : colors.muted }]}>
                Next Due: {new Date(item.nextDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
            </View>
          ) : (
            <View style={[s.dueChip, { backgroundColor: colors.surface2 }]}>
              <MaterialCommunityIcons name="check-circle" size={13} color={colors.muted} />
              <Text style={[s.dueText, { color: colors.muted }]}>No follow-up required</Text>
            </View>
          )}
          {item.administeredBy && (
            <Text style={[s.adminText, { color: colors.muted }]}>by {item.administeredBy}</Text>
          )}
        </View>
      </View>
    );
  };

  const dueSoonCount = records.filter(r => isDueSoon(r.nextDueDate)).length;

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Vaccinations</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{records.length} total{dueSoonCount > 0 ? ` · ${dueSoonCount} due soon` : ''}</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/records/add-vax' as any)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.green} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.green} /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="shield-off" size={60} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No vaccination records yet.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.green }]} onPress={() => router.push('/records/add-vax' as any)}>
                <Text style={s.emptyBtnText}>Log Vaccination</Text>
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
  vaccineName: { fontSize: 16, fontWeight: '800' },
  cattleName: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  dateGiven: { fontSize: 12, fontWeight: '600' },
  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  dueChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  dueText: { fontSize: 11, fontWeight: '700' },
  adminText: { fontSize: 11, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
