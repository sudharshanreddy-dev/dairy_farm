import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HealthRecords() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const resp = await api.get('farm/health');
      setRecords(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const ongoingCount = records.filter(r => r.status === 'Ongoing' || r.status === 'Critical').length;

  const renderItem = ({ item }: any) => {
    const isResolved = item.status === 'Resolved';
    const isCritical = item.status === 'Critical';
    const statusColor = isResolved ? colors.green : isCritical ? colors.red : colors.amber;
    const statusBg = isResolved ? colors.greenDim : isCritical ? colors.redDim : colors.amberDim;

    return (
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: statusColor, borderLeftWidth: 3 }]}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: statusBg }]}>
            <MaterialCommunityIcons name="medical-bag" size={20} color={statusColor} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.condition, { color: colors.text }]}>{item.condition}</Text>
            <Text style={[s.cattleName, { color: colors.muted }]}>
              {item.cattle?.name} <Text style={{ fontWeight: '500' }}>#{item.cattle?.tagNumber}</Text>
            </Text>
          </View>
          <View>
            <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[s.statusText, { color: statusColor }]}>{item.status}</Text>
            </View>
            <Text style={[s.cost, { color: colors.text }]}>₹{item.cost || 0}</Text>
          </View>
        </View>
        <View style={[s.details, { borderTopColor: 'rgba(139,148,158,0.1)' }]}>
          {item.treatment && (
            <View style={s.detailRow}>
              <MaterialCommunityIcons name="pill" size={14} color={colors.muted} />
              <Text style={[s.detailText, { color: colors.muted }]}>{item.treatment}</Text>
            </View>
          )}
          {item.vetName && (
            <View style={s.detailRow}>
              <MaterialCommunityIcons name="doctor" size={14} color={colors.muted} />
              <Text style={[s.detailText, { color: colors.muted }]}>Dr. {item.vetName}</Text>
            </View>
          )}
          <View style={s.detailRow}>
            <MaterialCommunityIcons name="calendar" size={14} color={colors.muted} />
            <Text style={[s.detailText, { color: colors.muted }]}>{new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Health Records</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{records.length} total · {ongoingCount} active</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/records/add-health' as any)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.red} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.red} /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="medical-bag" size={60} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No health records yet.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.red }]} onPress={() => router.push('/records/add-health' as any)}>
                <Text style={s.emptyBtnText}>Log Health Record</Text>
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
  card: { borderRadius: 20, borderWidth: 1, padding: 16, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  condition: { fontSize: 16, fontWeight: '800' },
  cattleName: { fontSize: 12, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-end' },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  cost: { fontSize: 13, fontWeight: '700', textAlign: 'right', marginTop: 4 },
  details: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 12, fontWeight: '500', flex: 1 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
