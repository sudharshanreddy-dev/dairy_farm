import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, TouchableOpacity,
} from 'react-native';
import api from '../../src/api/axios';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FilterModal, { FilterSection } from '../../src/components/FilterModal';

export default function FarmExpenses() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterVisible, setFilterVisible] = useState(false);
  const [filters, setFilters] = useState<any>({});

  useEffect(() => { fetchRecords(); }, [filters]);

  const fetchRecords = async () => {
    try {
      const resp = await api.get('farm/expenses', { params: filters });
      setRecords(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const EXPENSE_SECTIONS: FilterSection[] = [
    {
      title: 'Category',
      key: 'category',
      type: 'select',
      options: [
        { label: 'Labour', value: 'Labour' },
        { label: 'Electricity', value: 'Electricity' },
        { label: 'Water', value: 'Water' },
        { label: 'Maintenance', value: 'Maintenance' },
        { label: 'Rent', value: 'Rent' },
        { label: 'Fuel', value: 'Fuel' },
      ]
    }
  ];

  const totalExpense = records.reduce((sum, r) => sum + (r.amount || 0), 0);

  const renderItem = ({ item }: any) => {
    return (
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.cardHeader}>
          <View style={[s.iconWrap, { backgroundColor: colors.violetDim }]}>
            <MaterialCommunityIcons name="wallet" size={20} color={colors.violet} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[s.category, { color: colors.text }]}>{item.category}</Text>
            <Text style={[s.date, { color: colors.muted }]}>
              {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[s.amount, { color: colors.red }]}>₹{(item.amount || 0).toLocaleString()}</Text>
          </View>
        </View>
        {item.description ? (
          <View style={[s.footer, { borderTopColor: 'rgba(139,148,158,0.1)' }]}>
            <Text style={[s.footerText, { color: colors.muted }]}>{item.description}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(app)/records')}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Operating Expenses</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{records.length} logs · ₹{totalExpense.toLocaleString()} total</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
           <TouchableOpacity style={s.iconBtn} onPress={() => setFilterVisible(true)}>
             <MaterialCommunityIcons name="filter-variant" size={24} color={Object.keys(filters).length > 0 ? colors.violet : colors.text} />
           </TouchableOpacity>
           <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/records/add-expense' as any)}>
             <MaterialCommunityIcons name="plus" size={24} color={colors.violet} />
           </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.violet} /></View>
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
              <Text style={[s.emptyText, { color: colors.muted }]}>No operating expenses recorded.</Text>
            </View>
          }
        />
      )}

      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        sections={EXPENSE_SECTIONS}
        filters={filters}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />
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
  category: { fontSize: 15, fontWeight: '700' },
  date: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 17, fontWeight: '900' },
  footer: {
    marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerText: { fontSize: 12, fontWeight: '500' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 100, gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
