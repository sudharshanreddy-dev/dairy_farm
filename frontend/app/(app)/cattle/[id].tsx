import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, StatusBar, Share, Modal, Dimensions, Alert, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import api from '../../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { saveAndShareFile } from '../../../src/utils/export';

const W = Dimensions.get('window').width;

// --- Pedigree Components ---
const Node = ({ cattle, type, colors, onPress }: any) => (
  <TouchableOpacity 
    style={[s.nodeBox, { backgroundColor: colors.surface, borderColor: colors.border }, cattle?.isCurrent && { borderColor: colors.green, borderWidth: 2 }]}
    onPress={() => cattle?.id && onPress && onPress(cattle.id)}
    disabled={!cattle?.id}
  >
    <Text style={[s.nodeName, { color: colors.text }]} numberOfLines={1}>
      {cattle?.name || (cattle?.id ? 'Unnamed' : 'Unknown')}
    </Text>
    {cattle?.tagNumber && <Text style={[s.nodeTag, { color: colors.muted }]}>#{cattle.tagNumber}</Text>}
    {type && <Text style={[s.nodeLabel, { color: type.includes('Sire') ? colors.blue : colors.red }]}>{type}</Text>}
  </TouchableOpacity>
);

const TreeCol = ({ children, style }: any) => (
  <View style={[s.treeCol, style]}>{children}</View>
);

// --- History Components (Vertical Timeline) ---
const TimelineItem = ({ item, type, colors, isLast }: any) => {
  const iconMap: any = { milk: 'water', health: 'medical-bag', vax: 'shield-check' };
  const colorMap: any = { milk: colors.blue, health: colors.red, vax: colors.green };
  
  return (
    <View style={s.timelineItem}>
      <View style={s.timelineLeft}>
        <View style={[s.timelineDot, { backgroundColor: colorMap[type] }]} />
        {!isLast && <View style={[s.timelineLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={[s.timelineContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.timelineHeader}>
          <View style={[s.timelineIconWrap, { backgroundColor: colorMap[type] + '22' }]}>
            <MaterialCommunityIcons name={iconMap[type]} size={16} color={colorMap[type]} />
          </View>
          <Text style={[s.timelineDate, { color: colors.muted }]}>
            {new Date(item.date || item.dateGiven).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <Text style={[s.timelineTitle, { color: colors.text }]}>
          {type === 'milk' ? `${item.totalYield} Liters` : type === 'health' ? item.condition : item.vaccineName}
        </Text>
        <View style={s.timelineFooter}>
           <Text style={[s.timelineMeta, { color: colors.muted }]}>
             {type === 'milk' ? (item.quality || 'Good Quality') : type === 'health' ? item.status : `Next: ${item.nextDueDate ? new Date(item.nextDueDate).toLocaleDateString() : '—'}`}
           </Text>
           {item.cost ? <Text style={[s.timelineCost, { color: colors.green }]}>₹{item.cost}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const HistoryTimeline = ({ data, type, colors }: any) => {
  if (!data || data.length === 0) return (
    <View style={s.emptyHist}>
      <MaterialCommunityIcons name="history" size={48} color={colors.muted} />
      <Text style={{ color: colors.muted, marginTop: 10 }}>No records found</Text>
    </View>
  );

  return (
    <View style={s.timelineContainer}>
      {data.map((item: any, idx: number) => (
        <TimelineItem 
          key={idx} 
          item={item} 
          type={type} 
          colors={colors} 
          isLast={idx === data.length - 1} 
        />
      ))}
    </View>
  );
};

export default function CattleDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  useEffect(() => { fetchDetail(); }, [id]);

  const fetchDetail = async () => {
    if (!id || id === '[id]') {
      setLoading(false);
      return;
    }
    try {
      const resp = await api.get(`cattle/${id}`);
      setData(resp.data);
    } catch (e: any) {
      console.error(e);
      if (e.response?.status === 401) {
        Alert.alert('Session Expired', 'Please log in again.');
      } else {
        Alert.alert('Error', 'Failed to load cattle details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchQr = async () => {
    try {
      const resp = await api.get(`cattle/${id}/share`);
      setQrData(resp.data);
      setQrModal(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate QR code');
    }
  };

  const handleShare = async () => {
    if (!qrData) return;
    try {
      await Share.share({
        message: `Check out ${data.name || 'this cattle'} on DairyFarm Pro: ${qrData.link}`,
      });
    } catch (e) {}
  };

  const handleExportHistory = async () => {
    try {
      const res = await api.get(`reports/cattle/${id}`);
      await saveAndShareFile(res.data, `cattle_${data.tagNumber}_history.csv`);
    } catch (e) {
      Alert.alert('Export Failed', 'Unable to generate cattle history report.');
    }
  };

  const handleDelete = async () => {
    console.log('handleDelete called');
    const performDelete = async () => {
      try {
        console.log('Performing delete for cattle:', id);
        const res = await api.delete(`cattle/${id}`);
        console.log('Delete response:', res.data);
        router.replace('/(app)/cattle' as any);
      } catch (e: any) {
        console.error('Delete error details:', e);
        const msg = e.response?.data?.error || e.message || 'Failed to delete cattle record.';
        if (Platform.OS === 'web') {
          window.alert('Error: ' + msg);
        } else {
          Alert.alert('Error', msg);
        }
      }
    };

    if (Platform.OS === 'web') {
      console.log('Showing web confirm dialog');
      if (window.confirm("Delete Cattle?\nAll medical, milk, and vaccination records for this animal will be permanently removed. This cannot be undone.")) {
        console.log('Web confirm: OK');
        performDelete();
      } else {
        console.log('Web confirm: Cancel');
      }
    } else {
      Alert.alert(
        "Delete Cattle?",
        "All medical, milk, and vaccination records for this animal will be permanently removed. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete Permanently", 
            style: "destructive",
            onPress: performDelete
          }
        ]
      );
    }
  };

  if (loading) return (
    <View style={[s.center, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.green} /></View>
  );

  if (!data) return (
    <View style={[s.center, { backgroundColor: colors.bg }]}>
      <Text style={{ color: colors.text }}>Cattle not found</Text>
      <TouchableOpacity style={[s.backBtn, { backgroundColor: colors.green }]} onPress={() => router.back()}><Text style={{ color: '#fff' }}>Go Back</Text></TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      {/* Premium Header */}
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.navigate('/(app)/cattle' as any)}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.topTitle, { color: colors.text }]}>{data.name || 'Profile'}</Text>
        <View style={{ flexDirection: 'row' }}>
           <TouchableOpacity style={s.iconBtn} onPress={() => router.push(`/(app)/cattle/add?id=${id}` as any)}>
             <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.text} />
           </TouchableOpacity>
           <TouchableOpacity style={s.iconBtn} onPress={handleDelete}>
             <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.red} />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile Hero Section */}
        <View style={s.hero}>
           <View style={[s.heroIcon, { backgroundColor: colors.surface2 }]}>
              <MaterialCommunityIcons name="cow" size={64} color={colors.green} />
           </View>
           <Text style={[s.heroName, { color: colors.text }]}>{data.name || 'Unnamed'}</Text>
           <View style={[s.heroTagBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[s.heroTag, { color: colors.muted }]}>#{data.tagNumber}</Text>
           </View>

           <View style={s.bentoGrid}>
              <View style={[s.bentoSmall, { backgroundColor: colors.greenDim }]}>
                 <Text style={[s.bentoVal, { color: colors.green }]}>{data.status}</Text>
                 <Text style={[s.bentoLabel, { color: colors.green }]}>Status</Text>
              </View>
              <View style={[s.bentoSmall, { backgroundColor: colors.blueDim }]}>
                 <Text style={[s.bentoVal, { color: colors.blue }]}>{data.weight}kg</Text>
                 <Text style={[s.bentoLabel, { color: colors.blue }]}>Weight</Text>
              </View>
              <View style={[s.bentoSmall, { backgroundColor: colors.violetDim }]}>
                 <Text style={[s.bentoVal, { color: colors.violet }]}>{data.breed}</Text>
                 <Text style={[s.bentoLabel, { color: colors.violet }]}>Breed</Text>
              </View>
           </View>

           {/* Relocated Share Action */}
           <TouchableOpacity 
             style={[s.heroShareBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]} 
             onPress={fetchQr}
           >
              <MaterialCommunityIcons name="share-variant" size={20} color={colors.text} />
              <Text style={[s.heroShareText, { color: colors.text }]}>Share Public Profile</Text>
           </TouchableOpacity>
        </View>

        {/* Tab Selection */}
        <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {[
            { id: 'info', label: 'Overview' },
            { id: 'pedigree', label: 'Pedigree' },
            { id: 'history', label: 'History' }
          ].map(t => (
            <TouchableOpacity 
              key={t.id} 
              style={[s.tab, activeTab === t.id && { borderBottomColor: colors.green }]}
              onPress={() => setActiveTab(t.id)}
            >
              <Text style={[s.tabText, { color: activeTab === t.id ? colors.green : colors.muted }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.tabContent}>
           {activeTab === 'info' && (
             <View style={s.pane}>
                <View style={[s.infoBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                   <DetailItem label="Gender" val={data.gender} colors={colors} />
                   <DetailItem label="Quality" val={data.quality} colors={colors} />
                   <DetailItem label="Date of Birth" val={data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'} colors={colors} />
                   <DetailItem label="Purchase Price" val={`₹${data.purchasePrice}`} colors={colors} />
                   <DetailItem label="Acquisition" val={data.purchaseDate ? new Date(data.purchaseDate).toLocaleDateString() : 'Self-reared'} colors={colors} />
                   <DetailItem label="Notes" val={data.notes || 'No specific notes recorded for this cattle.'} full colors={colors} />
                </View>
             </View>
           )}

           {activeTab === 'pedigree' && (
             <View style={s.pane}>
                <Text style={[s.paneHeader, { color: colors.text }]}>Visual Lineage</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.treeScroll}>
                   <View style={s.treeContainer}>
                      <TreeCol style={{ gap: 12 }}>
                        <Node cattle={data.dam?.dam} type="M-Granddam" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                        <Node cattle={data.dam?.sire} type="M-Grandsire" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                        <Node cattle={data.sire?.dam} type="P-Granddam" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                        <Node cattle={data.sire?.sire} type="P-Grandsire" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                      </TreeCol>
                      <View style={s.spacer} />
                      <TreeCol style={{ gap: 40 }}>
                        <Node cattle={data.dam} type="Dam (Mother)" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                        <Node cattle={data.sire} type="Sire (Father)" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                      </TreeCol>
                      <View style={s.spacer} />
                      <TreeCol>
                        <Node cattle={{ ...data, isCurrent: true }} type="Selected" colors={colors} />
                      </TreeCol>
                      <View style={s.spacer} />
                      {([...(data.damOffspring || []), ...(data.sireOffspring || [])].length > 0) && (
                        <TreeCol style={{ gap: 15 }}>
                          {[...(data.damOffspring || []), ...(data.sireOffspring || [])].map((c: any) => (
                             <Node key={c.id} cattle={c} type="Offspring" colors={colors} onPress={(id: any) => router.push(`/(app)/cattle/${id}`)} />
                          ))}
                        </TreeCol>
                      )}
                   </View>
                </ScrollView>
             </View>
           )}

           {activeTab === 'history' && (
             <View style={s.pane}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                   <Text style={[s.paneHeader, { color: colors.text, marginBottom: 0 }]}>Complete History</Text>
                   <TouchableOpacity style={[s.miniExportBtn, { backgroundColor: colors.surface2 }]} onPress={handleExportHistory}>
                      <MaterialCommunityIcons name="file-download-outline" size={18} color={colors.text} />
                      <Text style={[s.miniExportText, { color: colors.text }]}>Export CSV</Text>
                   </TouchableOpacity>
                </View>

                <HistorySection title="Milk Yields" icon="flask" colors={colors} data={data.milkRecords} type="milk" />
                <HistorySection title="Medical Records" icon="heart" colors={colors} data={data.healthRecords} type="health" />
                <HistorySection title="Vaccinations" icon="shield-check" colors={colors} data={data.vaccinations} type="vax" />
             </View>
           )}
        </View>
      </ScrollView>

      {/* QR Sharing Modal */}
      <Modal visible={qrModal} transparent animationType="slide" onRequestClose={() => setQrModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.qrModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.qrHeader}>
               <Text style={[s.qrTitle, { color: colors.text }]}>Share Identity</Text>
               <TouchableOpacity onPress={() => setQrModal(false)}><MaterialCommunityIcons name="close" size={24} color={colors.muted} /></TouchableOpacity>
            </View>
            <View style={s.qrContainer}>
               {qrData ? (
                 <>
                   <Image source={{ uri: qrData.qrCode }} style={s.qrImg} />
                   <Text style={[s.qrHint, { color: colors.muted }]}>Point camera here to view full profile</Text>
                 </>
               ) : <ActivityIndicator color={colors.green} />}
            </View>
            <TouchableOpacity style={[s.shareBtn, { backgroundColor: colors.accent }]} onPress={handleShare}>
               <Text style={s.shareBtnText}>Share Public Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const DetailItem = ({ label, val, colors, full }: any) => (
  <View style={[s.detailItem, full && { width: '100%' }]}>
    <Text style={[s.detailLabel, { color: colors.muted }]}>{label}</Text>
    <Text style={[s.detailVal, { color: colors.text }]}>{val}</Text>
  </View>
);

const HistorySection = ({ title, icon, colors, data, type }: any) => (
  <View style={s.histSec}>
     <View style={s.histSecHeader}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.green} />
        <Text style={[s.histSecTitle, { color: colors.text }]}>{title}</Text>
     </View>
     <HistoryTimeline data={data} type={type} colors={colors} />
  </View>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, height: 60, borderBottomWidth: 1, paddingTop: 10 },
  topTitle: { fontSize: 16, fontWeight: '800' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backBtn: { padding: 12, borderRadius: 12, marginTop: 20 },
  hero: { alignItems: 'center', paddingVertical: 32 },
  heroIcon: { width: 120, height: 120, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroName: { fontSize: 26, fontWeight: '800' },
  heroTagBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  heroTag: { fontSize: 13, fontWeight: '700' },
  bentoGrid: { flexDirection: 'row', gap: 10, marginTop: 24, paddingHorizontal: 20 },
  bentoSmall: { flex: 1, padding: 12, borderRadius: 20, alignItems: 'center' },
  bentoVal: { fontSize: 14, fontWeight: '800' },
  bentoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 2 },
  heroShareBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 24, borderWidth: 1, marginTop: 24 },
  heroShareText: { fontSize: 14, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '700' },
  tabContent: { padding: 20 },
  pane: { gap: 16 },
  paneHeader: { fontSize: 15, fontWeight: '800', marginBottom: 8 },
  infoBox: { borderRadius: 24, padding: 20, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap' },
  detailItem: { width: '50%', marginBottom: 16 },
  detailLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailVal: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  treeScroll: { paddingVertical: 10 },
  treeContainer: { flexDirection: 'row', alignItems: 'center' },
  treeCol: { width: 140 },
  spacer: { width: 30, height: 1, backgroundColor: 'rgba(139,148,158,0.1)' },
  nodeBox: { padding: 12, borderRadius: 20, borderWidth: 1, minWidth: 130 },
  nodeName: { fontSize: 12, fontWeight: '800' },
  nodeTag: { fontSize: 10, marginTop: 2 },
  nodeLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 4 },
  histSec: { marginBottom: 24 },
  histSecHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  histSecTitle: { fontSize: 15, fontWeight: '800' },
  timelineContainer: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  timelineLeft: { alignItems: 'center', width: 20 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 10 },
  timelineLine: { width: 2, flex: 1, marginTop: 4 },
  timelineContent: { flex: 1, borderRadius: 20, padding: 16, borderWidth: 1 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timelineIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  timelineDate: { fontSize: 11, fontWeight: '700' },
  timelineTitle: { fontSize: 15, fontWeight: '800' },
  timelineFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(139,148,158,0.1)' },
  timelineMeta: { fontSize: 12, fontWeight: '600' },
  timelineCost: { fontSize: 13, fontWeight: '700' },
  emptyHist: { padding: 40, alignItems: 'center', opacity: 0.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  qrModal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40, borderWidth: 1 },
  qrHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qrTitle: { fontSize: 18, fontWeight: '800' },
  qrContainer: { alignItems: 'center', padding: 32, backgroundColor: '#f6f8fa', borderRadius: 24, marginBottom: 24 },
  qrImg: { width: 220, height: 220 },
  qrHint: { fontSize: 13, fontWeight: '600', marginTop: 16 },
  shareBtn: { height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  miniExportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
  miniExportText: { fontSize: 11, fontWeight: '700' },
});

