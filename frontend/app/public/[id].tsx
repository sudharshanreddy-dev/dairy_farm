import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, TouchableOpacity,
  Share, ScrollView, StatusBar, Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';
import { BASE_URL } from '../../src/api/config';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

const W = Dimensions.get('window').width;

const Node = ({ cattle, colors, onPress }: any) => (
  <TouchableOpacity 
    style={[s.nodeBox, { backgroundColor: colors.surface, borderColor: colors.border }, cattle?.isCurrent && { borderColor: colors.green, borderWidth: 2 }]}
    onPress={() => cattle?.id && onPress && onPress(cattle.id)}
    disabled={!cattle?.id}
  >
    <Text style={[s.nodeName, { color: colors.text }]} numberOfLines={1}>{cattle?.name || (cattle?.id ? 'Unnamed' : 'Unknown')}</Text>
    {cattle?.tagNumber && <Text style={[s.nodeTag, { color: colors.muted }]}>#{cattle.tagNumber}</Text>}
  </TouchableOpacity>
);

export default function PublicProfile() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublic = async () => {
      try {
        const resp = await api.get(`cattle/public/${id}`);
        // The backend returns { isOwner, cattle: { ... } }
        setData(resp.data.cattle || resp.data);
      } catch (e) {
        console.error('Failed to fetch public profile:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPublic();
  }, [id]);

  const handleShare = async () => {
    try {
      const farmName = data?.user?.farmName || data?.user?.fullName || data?.farm || 'Unknown Farm';
      await Share.share({
        message: `Check out ${data.name} on DairyFarm Pro! \nBreed: ${data.breed}\nFarm: ${farmName}`,
        url: `${BASE_URL}cattle/public/${id}`
      });
    } catch (e) {}
  };

  if (loading) return <View style={[s.center, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.green} /></View>;
  if (!data) return <View style={[s.center, { backgroundColor: colors.bg }]}><Text style={{ color: colors.text }}>Profile not found or is private.</Text></View>;

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Visual Header */}
        <View style={[s.header, { backgroundColor: colors.surface }]}>
           <View style={[s.iconBg, { backgroundColor: colors.greenDim }]}>
              <MaterialCommunityIcons name="cow" size={60} color={colors.green} />
           </View>
           <Text style={[s.name, { color: colors.text }]}>{data.name}</Text>
           <Text style={[s.tag, { color: colors.muted }]}>Official Tag: #{data.tagNumber}</Text>
        </View>

        <View style={s.content}>
           {/* Farm Attribution Card */}
           <View style={[s.farmCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.farmIcon, { backgroundColor: colors.blueDim }]}>
                 <MaterialCommunityIcons name="storefront" size={24} color={colors.blue} />
              </View>
              <View>
                 <Text style={[s.farmLabel, { color: colors.muted }]}>Owned by</Text>
                 <Text style={[s.farmName, { color: colors.text }]}>
                   {data?.user?.farmName || data?.user?.fullName || data?.farm || 'Unknown Farm'}
                 </Text>
              </View>
           </View>

           {/* Stats Bento */}
           <View style={s.bentoRow}>
              <StatItem label="Breed" val={data.breed} color={colors.violet} bg={colors.violetDim} />
              <StatItem label="Status" val={data.status} color={colors.green} bg={colors.greenDim} />
           </View>

           {/* Pedigree Section */}
           <View style={s.sec}>
              <Text style={[s.secTitle, { color: colors.text }]}>Visual Pedigree</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.treeScroll}>
                 <View style={s.treeContainer}>
                    <View style={s.treeCol}>
                       <Node cattle={data.dam} colors={colors} />
                       <View style={{ height: 20 }} />
                       <Node cattle={data.sire} colors={colors} />
                    </View>
                    <View style={[s.connector, { borderColor: colors.border }]} />
                    <View style={s.treeCol}>
                       <Node cattle={{ ...data, isCurrent: true }} colors={colors} />
                    </View>
                 </View>
              </ScrollView>
           </View>

           <TouchableOpacity style={[s.shareBtn, { backgroundColor: colors.accent }]} onPress={handleShare}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#fff" />
              <Text style={s.shareText}>Invite to View</Text>
           </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const StatItem = ({ label, val, color, bg }: any) => (
  <View style={[s.statItem, { backgroundColor: bg }]}>
    <Text style={[s.statVal, { color }]}>{val}</Text>
    <Text style={[s.statLabel, { color }]}>{label}</Text>
  </View>
);

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 50, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
  iconBg: { width: 100, height: 100, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 28, fontWeight: '900' },
  tag: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  content: { padding: 24, gap: 20 },
  farmCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, borderRadius: 24, borderWidth: 1 },
  farmIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  farmLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  farmName: { fontSize: 18, fontWeight: '800' },
  bentoRow: { flexDirection: 'row', gap: 12 },
  statItem: { flex: 1, padding: 20, borderRadius: 24, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', marginTop: 4 },
  sec: { marginTop: 10 },
  secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 16 },
  treeScroll: { paddingVertical: 10 },
  treeContainer: { flexDirection: 'row', alignItems: 'center' },
  treeCol: { width: 140, gap: 10 },
  connector: { width: 30, height: 1, borderTopWidth: 1 },
  nodeBox: { padding: 12, borderRadius: 16, borderWidth: 1, minWidth: 130, alignItems: 'center' },
  nodeName: { fontSize: 13, fontWeight: '800' },
  nodeTag: { fontSize: 10, marginTop: 2, fontWeight: '600' },
  shareBtn: { height: 60, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },
  shareText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
