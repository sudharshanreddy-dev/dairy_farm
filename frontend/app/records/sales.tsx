import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SalesRecords() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    try {
      const resp = await api.get('farm/sales');
      setRecords(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = records.reduce((sum, r) => sum + (r.totalAmount || 0), 0);

  const renderItem = ({ item }: any) => {
    const isPaid = item.paymentStatus === 'Paid';
    return (
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: colors.amberDim }]}>
            <MaterialCommunityIcons name="cash-register" size={20} color={colors.amber} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.buyerName, { color: colors.text }]}>{item.buyerName || 'General Store'}</Text>
            <Text style={[s.date, { color: colors.muted }]}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.amount, { color: colors.text }]}>₹{(item.totalAmount || 0).toLocaleString()}</Text>
            <View style={[s.statusBadge, { backgroundColor: isPaid ? colors.greenDim : colors.amberDim }]}>
              <Text style={[s.statusText, { color: isPaid ? colors.green : colors.amber }]}>{item.paymentStatus || 'Pending'}</Text>
            </View>
          </View>
        </View>
        <View style={[s.footer, { borderTopColor: 'rgba(139,148,158,0.1)' }]}>
          <View style={s.footerItem}>
            <MaterialCommunityIcons name="water" size={13} color={colors.muted} />
            <Text style={[s.footerText, { color: colors.muted }]}>{item.quantityLiters} L</Text>
          </View>
          <View style={s.footerItem}>
            <MaterialCommunityIcons name="currency-inr" size={13} color={colors.muted} />
            <Text style={[s.footerText, { color: colors.muted }]}>₹{item.pricePerLiter}/L</Text>
          </View>
          <View style={s.footerItem}>
            <MaterialCommunityIcons name="credit-card" size={13} color={colors.muted} />
            <Text style={[s.footerText, { color: colors.muted }]}>{item.paymentMethod || 'Cash'}</Text>
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
          <Text style={[s.title, { color: colors.text }]}>Sales & Revenue</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{records.length} sales · ₹{totalRevenue.toLocaleString()} total</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/records/add-sale' as any)}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.amber} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.amber} /></View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="cash-remove" size={60} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No sales recorded yet.</Text>
              <TouchableOpacity style={[s.emptyBtn, { backgroundColor: colors.amber }]} onPress={() => router.push('/records/add-sale' as any)}>
                <Text style={s.emptyBtnText}>Record First Sale</Text>
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
  buyerName: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '900' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
    paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});
