import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, StatusBar, RefreshControl, Dimensions, Alert
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const W = Dimensions.get('window').width;

export default function Inventory() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const s = makeStyles(colors);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    try {
      const resp = await api.get('/farm/inventory');
      setItems(resp.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'feed': return 'barley';
      case 'medicine': return 'pill';
      case 'equipment': return 'tools';
      case 'hygiene': return 'hand-water';
      default: return 'package-variant';
    }
  };

  const getColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'feed': return colors.amber;
      case 'medicine': return colors.red;
      case 'equipment': return colors.blue;
      case 'hygiene': return colors.green;
      default: return colors.violet;
    }
  };

  const renderItem = ({ item }: any) => {
    const isLow = item.quantity <= item.minQuantity;
    const catColor = getColor(item.category);
    
    return (
      <TouchableOpacity 
        style={[s.card, { backgroundColor: colors.surface, borderColor: isLow ? colors.red : colors.border }]}
        onPress={() => { /* View transactions maybe? */ }}
      >
        <View style={s.cardTop}>
          <View style={[s.iconWrap, { backgroundColor: catColor + '15' }]}>
            <MaterialCommunityIcons name={getIcon(item.category) as any} size={22} color={catColor} />
          </View>
          <View style={s.headerText}>
            <Text style={[s.itemName, { color: colors.text }]}>{item.itemName}</Text>
            <Text style={[s.category, { color: colors.muted }]}>{item.category}</Text>
          </View>
          {isLow && (
            <View style={[s.lowBadge, { backgroundColor: colors.redDim }]}>
              <Text style={[s.lowText, { color: colors.red }]}>LOW</Text>
            </View>
          )}
        </View>
        
        <View style={s.cardBottom}>
          <View style={s.stat}>
            <Text style={[s.statLabel, { color: colors.muted }]}>Current Stock</Text>
            <Text style={[s.statVal, { color: isLow ? colors.red : colors.text }]}>
              {item.quantity} <Text style={s.unit}>{item.unit}</Text>
            </Text>
          </View>
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <View style={s.stat}>
            <Text style={[s.statLabel, { color: colors.muted }]}>Unit Cost</Text>
            <Text style={[s.statVal, { color: colors.text }]}>₹{item.costPerUnit}</Text>
          </View>
        </View>

        {isLow && (
          <View style={[s.warningBar, { backgroundColor: colors.red + '10' }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={12} color={colors.red} />
            <Text style={[s.warningMsg, { color: colors.red }]}>Stock is below reorder level ({item.minQuantity} {item.unit})</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <View style={[s.topbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>📦 Inventory</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{items.length} items registered</Text>
        </View>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.green }]} onPress={() => Alert.alert('Add Item', 'Inventory addition coming soon!')}>
           <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.green} /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInventory(); }} tintColor={colors.green} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <MaterialCommunityIcons name="package-variant-closed" size={60} color={colors.border} />
              <Text style={[s.emptyText, { color: colors.muted }]}>No items in inventory</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topbar: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, borderBottomWidth: 1 
  },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 18, gap: 16, paddingBottom: 40 },
  card: {
    borderRadius: 24, borderWidth: 1, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: '800' },
  category: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginTop: 2 },
  lowBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lowText: { fontSize: 9, fontWeight: '900' },
  cardBottom: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statVal: { fontSize: 18, fontWeight: '800' },
  unit: { fontSize: 11, fontWeight: '500', opacity: 0.7 },
  divider: { width: 1, height: 30, marginHorizontal: 16 },
  warningBar: { 
    marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6, 
    padding: 8, borderRadius: 8 
  },
  warningMsg: { fontSize: 10, fontWeight: '600' },
  empty: { padding: 60, alignItems: 'center', gap: 16 },
  emptyText: { fontSize: 14, fontWeight: '600' },
});
