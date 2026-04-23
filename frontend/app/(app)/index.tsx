import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, StatusBar, Modal, Dimensions,
} from 'react-native';
import { useRouter, useNavigation, useFocusEffect } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const W = Dimensions.get('window').width;

function BentoCard({ label, value, icon, colors, color, size = 'small', width: customWidth }: any) {
  const bg = color + '22';
  return (
    <View style={[s.bentoCard, { 
      backgroundColor: colors.surface, 
      borderColor: colors.border,
      width: customWidth || (size === 'wide' ? '100%' : '48%'),
      height: size === 'large' ? 240 : 114,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10
    }]}>
      <View style={[s.bentoIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <View style={{ marginTop: 'auto' }}>
        <Text 
          style={[s.bentoVal, { color: colors.text, fontSize: size === 'large' ? 32 : 22 }]} 
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {value}
        </Text>
        <Text style={[s.bentoLabel, { color: colors.muted }]} numberOfLines={1}>{label}</Text>
      </View>
    </View>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, logout } = useContext(AuthContext);
  const { colors, isDark, themeMode, setThemeMode } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [themeModal, setThemeModal] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchData();
      }
    }, [user])
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      await api.post('farm/alerts/check');
      const [statsResp, alertsResp] = await Promise.all([
        api.get('farm/dashboard'),
        api.get('farm/alerts'),
      ]);
      setStats(statsResp.data);
      setAlerts(alertsResp.data.filter((a: any) => !a.isRead));
    } catch (e: any) {
      console.error('Dashboard data fetch error:', e);
      if (e.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const markRead = async (id: number) => {
    try {
      await api.post(`farm/alerts/${id}/read`);
      setAlerts(alerts.filter((a: any) => a.id !== id));
    } catch (e) {}
  };

  if (!user && !loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const milkChartData = {
    labels: stats?.charts?.milkTrend?.map((d: any) => d.date.slice(8)) || [],
    datasets: [{ data: stats?.charts?.milkTrend?.map((d: any) => d.total || 0) || [0] }],
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />

      {/* Header Section */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity 
            style={s.hamburger} 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[s.greeting, { color: colors.muted }]}>{getGreeting()},</Text>
            <Text style={[s.name, { color: colors.text }]}>{user?.fullName?.split(' ')[0] || 'Farmer'} 👋</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: colors.surface2 }]} onPress={() => setThemeModal(true)}>
             <MaterialCommunityIcons name={isDark ? 'weather-night' : 'weather-sunny'} size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.roundBtn, { backgroundColor: colors.redDim }]} onPress={logout}>
             <MaterialCommunityIcons name="logout" size={20} color={colors.red} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Urgent Alerts Horizontal Scroll */}
        {alerts.length > 0 && (
          <View style={s.alertSection}>
            <View style={s.secHeader}>
              <Text style={[s.secTitle, { color: colors.text }]}>Active Alerts</Text>
              <View style={[s.badge, { backgroundColor: colors.redDim }]}>
                <Text style={{ color: colors.red, fontSize: 10, fontWeight: '800' }}>{alerts.length}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.alertScroll}>
              {alerts.map((a: any) => (
                <TouchableOpacity key={a.id} style={[s.alertCard, { backgroundColor: colors.surface, borderColor: a.severity === 'high' ? colors.red : colors.border }]} onPress={() => markRead(a.id)}>
                   <View style={[s.alertIndicator, { backgroundColor: a.severity === 'high' ? colors.red : colors.amber }]} />
                   <Text style={[s.alertText, { color: colors.text }]} numberOfLines={2}>{a.message}</Text>
                   <MaterialCommunityIcons name="close-circle-outline" size={16} color={colors.muted} style={{ marginTop: 8 }} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bento Grid KPIs */}
        <View style={s.bentoGrid}>
          <BentoCard label="Today's Milk" value={`${(stats?.kpis?.todayMilk ?? 0).toFixed(1)}L`} icon="water" color={colors.blue} colors={colors} size="large" />
          <View style={{ width: '48%', gap: 12 }}>
             <BentoCard label="Herd Size" value={stats?.kpis?.totalCattle ?? 0} icon="cow" color={colors.green} colors={colors} size="small" width="100%" />
             <BentoCard label="Revenue" value={`₹${(stats?.kpis?.monthlyRevenue ?? 0).toLocaleString()}`} icon="cash" color={colors.amber} colors={colors} size="small" width="100%" />
          </View>
        </View>

        {/* Hero Chart Container */}
        <View style={[s.chartContainer, { backgroundColor: colors.surface, borderColor: colors.border, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 }]}>
          <View style={s.chartHeader}>
             <View>
               <Text style={[s.chartTitle, { color: colors.text }]}>Production Trend</Text>
               <Text style={[s.chartSub, { color: colors.muted }]}>Daily Total (Liters)</Text>
             </View>
             <MaterialCommunityIcons name="trending-up" size={24} color={colors.green} />
          </View>
          <LineChart
            data={milkChartData}
            width={W - 80}
            height={180}
            chartConfig={{
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              color: (op = 1) => colors.green,
              labelColor: (op = 1) => colors.muted,
              strokeWidth: 3,
              propsForDots: { r: '4', strokeWidth: '0', fill: colors.green },
            }}
            bezier
            withDots
            withInnerLines={false}
            withOuterLines={false}
            style={{ marginTop: 10, alignSelf: 'center', borderRadius: 16 }}
          />
        </View>

        {/* Quick Actions */}
        <View style={s.quickActions}>
          <Text style={[s.secTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={s.actionRow}>
             <ActionBtn icon="cow" label="Add Cattle" color={colors.green} onPress={() => router.push('/(app)/cattle/add' as any)} colors={colors} />
             <ActionBtn icon="water" label="Log Milk" color={colors.blue} onPress={() => router.push('/records/add-milk' as any)} colors={colors} />
             <ActionBtn icon="qrcode-scan" label="Scan Tag" color={colors.violet} onPress={() => router.push('/scan' as any)} colors={colors} />
             <ActionBtn icon="medical-bag" label="Health" color={colors.red} onPress={() => router.push('/records/add-health' as any)} colors={colors} />
          </View>
        </View>
      </ScrollView>

      {/* Theme Modal */}
      <Modal visible={themeModal} transparent animationType="slide" onRequestClose={() => setThemeModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setThemeModal(false)}>
          <View style={[s.themeModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.themeTitle, { color: colors.text }]}>Display Theme</Text>
            {['light', 'dark', 'system'].map(m => (
              <TouchableOpacity key={m} style={[s.themeOpt, themeMode === m && { backgroundColor: colors.greenDim }]} onPress={() => { setThemeMode(m as any); setThemeModal(false); }}>
                <Text style={[s.themeOptLabel, { color: themeMode === m ? colors.green : colors.text }]}>{m.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ActionBtn = ({ icon, label, color, onPress, colors }: any) => (
  <TouchableOpacity style={s.actionBtn} onPress={onPress}>
    <View style={[s.actionCircle, { backgroundColor: color + '22' }]}>
      <MaterialCommunityIcons name={icon} size={28} color={color} />
    </View>
    <Text style={[s.actionLabel, { color: colors.muted }]}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hamburger: { padding: 4, marginLeft: -4 },
  greeting: { fontSize: 13, fontWeight: '600', opacity: 0.6 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 10 },
  roundBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scrollContainer: { padding: 20, gap: 24, paddingBottom: 40 },
  secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  secTitle: { fontSize: 16, fontWeight: '800' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  alertSection: {},
  alertScroll: { gap: 12, paddingBottom: 8 },
  alertCard: { 
    width: 220, padding: 16, borderRadius: 20, borderWidth: 1,
    position: 'relative', overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8
  },
  alertIndicator: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 6 },
  alertText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  bentoGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  bentoCard: { padding: 16, borderRadius: 32, borderWidth: 1, justifyContent: 'space-between' },
  bentoIcon: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bentoVal: { fontWeight: '800' },
  bentoLabel: { fontSize: 13, fontWeight: '700', opacity: 0.6 },
  chartContainer: { padding: 20, borderRadius: 32, borderWidth: 1 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  chartTitle: { fontSize: 16, fontWeight: '800' },
  chartSub: { fontSize: 12 },
  quickActions: {},
  actionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { alignItems: 'center', gap: 10 },
  actionCircle: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  themeModal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1 },
  themeTitle: { fontSize: 18, fontWeight: '800', marginBottom: 24 },
  themeOpt: { padding: 18, borderRadius: 16, marginBottom: 8 },
  themeOptLabel: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
