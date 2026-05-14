import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator, StatusBar, Dimensions, TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import api from '../../src/api/axios';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { saveAndShareFile } from '../../src/utils/export';
import Toast from 'react-native-toast-message';
import { Alert, TextInput, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const W = Dimensions.get('window').width;

const Card = ({ title, children, colors }: any) => (
  <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[s.cardTitle, { color: colors.text }]}>{title}</Text>
    {children}
  </View>
);

const StatCard = ({ label, value, sub, icon, color, bg, colors }: any) => (
  <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
     <View style={[s.statIcon, { backgroundColor: bg }]}>
        <FontAwesome5 name={icon} size={16} color={color} />
     </View>
     <View style={{ flex: 1 }}>
        <Text style={[s.statLabel, { color: colors.muted }]}>{label}</Text>
        <Text style={[s.statVal, { color: colors.text }]}>{value}</Text>
        {sub && <Text style={[s.statSub, { color: colors.muted }]}>{sub}</Text>}
     </View>
  </View>
);

export default function Analytics() {
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  const [dates, setDates] = useState({
    start_date: thirtyDaysAgo.toISOString().split('T')[0],
    end_date: today.toISOString().split('T')[0]
  });

  // Internal Date objects for the picker
  const [filterDates, setFilterDates] = useState({
    start: thirtyDaysAgo,
    end: today
  });

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => { 
    fetchData(); 
  }, [dates]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const resp = await api.get('farm/analytics', { params: dates });
      setData(resp.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const applyFilters = () => {
    setDates({
      start_date: filterDates.start.toISOString().split('T')[0],
      end_date: filterDates.end.toISOString().split('T')[0]
    });
    setShowFilters(false);
  };

  const onDateChange = (event: any, selectedDate: Date | undefined, type: 'start' | 'end') => {
    if (Platform.OS === 'android') {
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
    if (selectedDate) {
      setFilterDates({ ...filterDates, [type]: selectedDate });
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('reports/financials');
      await saveAndShareFile(res.data, 'financial_report.csv');
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Export Failed', text2: 'Unable to generate financial report.' });
    }
  };

  if (loading && !data) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    color: (op = 1) => `rgba(63,185,80,${op})`,
    labelColor: () => colors.muted,
    strokeWidth: 2,
    barPercentage: 0.6,
    decimalPlaces: 0,
  };

  const productionChart = {
    labels: data?.productionData?.map((d: any) => d.month.slice(5)) || [],
    datasets: [{ data: data?.productionData?.map((d: any) => d.total || 0) || [0] }],
  };

  const revenueChart = {
    labels: data?.revenueTrend?.map((d: any) => d.month.slice(5)) || [],
    datasets: [{ data: data?.revenueTrend?.map((d: any) => d.total || 0) || [0] }],
  };

  const cattleData = {
    labels: data?.topCattle?.map((c: any) => c.name.split(' ')[0]) || [],
    datasets: [{ data: data?.topCattle?.map((c: any) => c.total) || [0] }],
  };

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <View style={[s.topbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[s.title, { color: colors.text }]}>Analytics Dashboard</Text>
          <Text style={[s.subtitle, { color: colors.muted }]}>{data?.start_date} to {data?.end_date}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={[s.filterBtn, { backgroundColor: colors.surface2 }]} onPress={handleExport}>
            <MaterialCommunityIcons name="file-download-outline" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.filterBtn, { backgroundColor: colors.surface2 }]} onPress={() => setShowFilters(true)}>
            <FontAwesome5 name="calendar-alt" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Efficiency KPIs */}
        <View style={s.statsGrid}>
          <StatCard 
            label="Cost Per Liter" 
            value={`₹${(data?.costPerLiter || 0).toFixed(2)}`} 
            sub="Target: < ₹25"
            icon="tag" 
            color={colors.blue} 
            bg={colors.blueDim} 
            colors={colors} 
          />
          <StatCard 
            label="Feed Efficiency" 
            value={`${(data?.feedEfficiency || 0).toFixed(2)}`} 
            sub="Feed cost per Litre"
            icon="leaf" 
            color={colors.green} 
            bg={colors.greenDim} 
            colors={colors} 
          />
        </View>

        {/* Financial KPIs */}
        <View style={s.bentoContainer}>
           <View style={[s.bentoMain, { backgroundColor: colors.violetDim, borderColor: colors.violet }]}>
              <Text style={[s.bentoLabel, { color: colors.violet }]}>Net Profit</Text>
              <Text style={[s.bentoValLarge, { color: colors.text }]}>₹{(data?.netProfit || 0).toLocaleString()}</Text>
              <View style={s.bentoIndicator}><FontAwesome5 name="chart-line" size={16} color={colors.violet} /></View>
           </View>
           <View style={s.bentoSide}>
              <View style={[s.bentoSmall, { backgroundColor: colors.greenDim }]}>
                <Text style={[s.bentoLabelSmall, { color: colors.green }]}>Revenue</Text>
                <Text style={[s.bentoValSmall, { color: colors.text }]}>₹{(data?.revenue || 0).toLocaleString()}</Text>
              </View>
              <View style={[s.bentoSmall, { backgroundColor: colors.redDim }]}>
                <Text style={[s.bentoLabelSmall, { color: colors.red }]}>Expenses</Text>
                <Text style={[s.bentoValSmall, { color: colors.text }]}>₹{(data?.totalExpenses || 0).toLocaleString()}</Text>
              </View>
           </View>
        </View>

        {/* Expense Breakdown Pie Chart */}
        <Card title="📊 Expense Breakdown" colors={colors}>
           <PieChart
             data={data?.expenseBreakdown?.filter((e: any) => e.value > 0).map((e: any) => ({
               ...e,
               name: e.label,
               legendFontColor: colors.text,
               legendFontSize: 12
             })) || []}
             width={W - 60} height={180}
             chartConfig={chartConfig}
             accessor="value" backgroundColor="transparent"
             paddingLeft="15" absolute
           />
        </Card>

        {/* Production Trend */}
        <Card title="🥛 Milk Production Trend (Liters)" colors={colors}>
          <LineChart
            data={productionChart} width={W - 60} height={180}
            chartConfig={{...chartConfig, color: (op=1) => `rgba(63,185,80,${op})` }}
            bezier withInnerLines={false} style={s.chart}
          />
        </Card>

        {/* Revenue Trend */}
        <Card title="💰 Monthly Revenue (₹)" colors={colors}>
          <BarChart
            data={revenueChart} width={W - 60} height={180} yAxisLabel="₹" yAxisSuffix=""
            chartConfig={{...chartConfig, color: (op=1) => `rgba(88,166,255,${op})` }}
            withInnerLines={false} style={s.chart}
          />
        </Card>

        {/* Top Producers */}
        <Card title="👑 Top Producer Cattle" colors={colors}>
           {data?.topCattle?.length > 0 ? (
             <BarChart
               data={cattleData} width={W - 60} height={200}
               yAxisLabel="" yAxisSuffix="L"
               chartConfig={{...chartConfig, color: (op=1) => `rgba(188,140,255,${op})`, barPercentage: 0.4 }}
               verticalLabelRotation={0} style={s.chart}
             />
           ) : (
             <Text style={{ textAlign: 'center', margin: 20, color: colors.muted }}>No production data yet</Text>
           )}
        </Card>
      </ScrollView>

      <Modal visible={showFilters} transparent animationType="fade" onRequestClose={() => setShowFilters(false)}>
         <View style={s.modalOverlay}>
            <View 
              style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
               <View style={s.modalHeader}>
                  <Text style={[s.modalTitle, { color: colors.text }]}>Filter by Date Range</Text>
                  <TouchableOpacity onPress={() => setShowFilters(false)} style={s.closeBtn}>
                     <FontAwesome5 name="times" size={18} color={colors.muted} />
                  </TouchableOpacity>
               </View>
               <View style={s.modalFields}>
                  <View style={{ flex: 1 }}>
                     <Text style={[s.label, { color: colors.muted }]}>Start Date</Text>
                     <TouchableOpacity 
                        style={[s.input, { backgroundColor: colors.surface2, borderColor: colors.border, justifyContent: 'center' }]} 
                        onPress={() => setShowStartPicker(true)}
                     >
                        <Text style={{ color: colors.text }}>{filterDates.start.toDateString()}</Text>
                     </TouchableOpacity>
                     {Platform.OS === 'web' && showStartPicker && (
                        <input
                           type="date"
                           value={filterDates.start.toISOString().split('T')[0]}
                           onChange={(e: any) => onDateChange({}, new Date(e.target.value), 'start')}
                           style={{
                              height: 40,
                              marginTop: 10,
                              borderRadius: 10,
                              borderWidth: 1,
                              padding: 10,
                              backgroundColor: colors.surface2,
                              color: colors.text,
                              borderColor: colors.border
                           }}
                        />
                     )}
                     {Platform.OS !== 'web' && showStartPicker && (
                        <DateTimePicker
                          value={filterDates.start}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                          themeVariant={isDark ? 'dark' : 'light'}
                          onChange={(e, d) => onDateChange(e, d, 'start')}
                          maximumDate={filterDates.end}
                        />
                     )}
                  </View>
                  <View style={{ flex: 1 }}>
                     <Text style={[s.label, { color: colors.muted }]}>End Date</Text>
                     <TouchableOpacity 
                        style={[s.input, { backgroundColor: colors.surface2, borderColor: colors.border, justifyContent: 'center' }]} 
                        onPress={() => setShowEndPicker(true)}
                     >
                        <Text style={{ color: colors.text }}>{filterDates.end.toDateString()}</Text>
                     </TouchableOpacity>
                     {Platform.OS === 'web' && showEndPicker && (
                        <input
                           type="date"
                           value={filterDates.end.toISOString().split('T')[0]}
                           onChange={(e: any) => onDateChange({}, new Date(e.target.value), 'end')}
                           style={{
                              height: 40,
                              marginTop: 10,
                              borderRadius: 10,
                              borderWidth: 1,
                              padding: 10,
                              backgroundColor: colors.surface2,
                              color: colors.text,
                              borderColor: colors.border
                           }}
                        />
                     )}
                     {Platform.OS !== 'web' && showEndPicker && (
                        <DateTimePicker
                          value={filterDates.end}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                          themeVariant={isDark ? 'dark' : 'light'}
                          onChange={(e, d) => onDateChange(e, d, 'end')}
                          minimumDate={filterDates.start}
                          maximumDate={new Date()}
                        />
                     )}
                  </View>
               </View>
               <TouchableOpacity style={[s.applyBtn, { backgroundColor: colors.green }]} onPress={applyFilters}>
                  <Text style={s.applyText}>Apply Filters</Text>
               </TouchableOpacity>
            </View>
         </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topbar: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 11, marginTop: 2 },
  filterBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 18, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  statVal: { fontSize: 16, fontWeight: '800' },
  statSub: { fontSize: 9, marginTop: 2 },
  bentoContainer: { flexDirection: 'row', gap: 12, height: 160 },
  bentoMain: { flex: 1.5, borderRadius: 24, padding: 20, borderWidth: 1, position: 'relative' },
  bentoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  bentoValLarge: { fontSize: 26, fontWeight: '800', marginTop: 10 },
  bentoIndicator: { position: 'absolute', right: 15, bottom: 15 },
  bentoSide: { flex: 1, gap: 12 },
  bentoSmall: { flex: 1, borderRadius: 20, padding: 12, justifyContent: 'center' },
  bentoLabelSmall: { fontSize: 10, fontWeight: '700' },
  bentoValSmall: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  card: { borderRadius: 24, padding: 20, borderWidth: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', marginBottom: 15 },
  chart: { marginTop: 10, alignSelf: 'center', borderRadius: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, borderWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  closeBtn: { padding: 5 },
  modalFields: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { height: 50, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, fontSize: 14 },
  applyBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  applyText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
