import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { saveAndShareFile } from '../../src/utils/export';

function Badge({ text, type, colors }: any) {
  const bgMap: any = { green: colors.greenDim, amber: colors.amberDim, red: colors.redDim, gray: colors.surface2 };
  const fgMap: any = { green: colors.green, amber: colors.amber, red: colors.red, gray: colors.muted };
  return (
    <View style={[s.badge, { backgroundColor: bgMap[type] || bgMap.gray }]}>
      <Text style={[s.badgeText, { color: fgMap[type] || fgMap.gray }]}>{text}</Text>
    </View>
  );
}

export default function CattleList() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [cattle, setCattle] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      fetchCattle();
    }, [])
  );

  const fetchCattle = async () => {
    try {
      const r = await api.get('cattle');
      setCattle(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('reports/herd');
      await saveAndShareFile(res.data, 'herd_roster.csv');
    } catch (e) {
      Alert.alert('Export Failed', 'Unable to generate herd report.');
    }
  };

  const statusColor = (s: string) => 
    s === 'Active' ? 'green' : 
    (s === 'Sold' || s === 'Pregnant') ? 'amber' : 'red';

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => router.push(`/(app)/cattle/${item.id}`)}>
      <View style={s.cardTop}>
         <View style={[s.avatar, { backgroundColor: colors.surface2 }]}>
            <MaterialCommunityIcons name="cow" size={24} color={colors.muted} />
         </View>
         <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[s.cattleName, { color: colors.text }]}>{item.name || 'Unnamed'}</Text>
            <Text style={[s.tagNumber, { color: colors.muted }]}>Tag: #{item.tagNumber}</Text>
         </View>
         <Badge text={item.status} type={statusColor(item.status)} colors={colors} />
      </View>
      <View style={s.cardBottom}>
         <View style={s.infoBit}>
            <Text style={[s.infoKey, { color: colors.muted }]}>Breed</Text>
            <Text style={[s.infoVal, { color: colors.text }]}>{item.breed || '—'}</Text>
         </View>
         <View style={s.infoSeparator} />
         <View style={s.infoBit}>
            <Text style={[s.infoKey, { color: colors.muted }]}>Weight</Text>
            <Text style={[s.infoVal, { color: colors.text }]}>{item.weight}kg</Text>
         </View>
         <View style={s.infoSeparator} />
         <View style={s.infoBit}>
            <Text style={[s.infoKey, { color: colors.muted }]}>Quality</Text>
            <Text style={[s.infoVal, { color: colors.text }]}>{item.quality}</Text>
         </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
         <View>
           <Text style={[s.title, { color: colors.text }]}>My Herd</Text>
           <Text style={[s.count, { color: colors.muted }]}>{cattle.length} Registered</Text>
         </View>
         <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={s.headerIconBtn} onPress={handleExport}>
              <MaterialCommunityIcons name="file-download-outline" size={24} color={colors.text} />
            </TouchableOpacity>
         </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.green} /></View>
      ) : (
        <FlatList
          data={cattle}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="cow-off" size={64} color={colors.muted} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No cattle in your records.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={[s.fab, { backgroundColor: colors.accent }]} onPress={() => router.push('/cattle/add' as any)}>
         <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </TouchableOpacity>

    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '800' },
  count: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  headerIconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, gap: 16, paddingBottom: 100 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cattleName: { fontSize: 18, fontWeight: '800' },
  tagNumber: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  cardBottom: { flexDirection: 'row', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(139,148,158,0.1)' },
  infoBit: { flex: 1, alignItems: 'center' },
  infoSeparator: { width: 1, backgroundColor: 'rgba(139,148,158,0.1)' },
  infoKey: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoVal: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  fab: { position: 'absolute', right: 24, bottom: 24, width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)' },
});

