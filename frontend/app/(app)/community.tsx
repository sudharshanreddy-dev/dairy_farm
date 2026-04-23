import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, Modal, Alert, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import api from '../../src/api/axios';

export default function Community() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);
  const s = makeStyles(colors);

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const r = await api.get('farm/community');
      setPosts(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newPost.title || !newPost.content) { Alert.alert('Error', 'Please fill all fields'); return; }
    setSaving(true);
    try {
      await api.post('farm/community', newPost);
      setNewPost({ title: '', content: '' });
      setShowForm(false);
      fetchPosts();
    } catch (e) { Alert.alert('Error', 'Failed to create post'); }
    finally { setSaving(false); }
  };

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/(app)/community/${item.id}`)}>
      <View style={s.cardHeader}>
        <View style={s.authorDot}><Text style={{ fontSize: 14 }}>👤</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.author}>{item.author}</Text>
          <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</Text>
        </View>
      </View>
      <Text style={s.postTitle}>{item.title}</Text>
      <Text style={s.postContent} numberOfLines={3}>{item.content}</Text>
      <View style={s.cardFooter}>
        <Text style={s.commentCount}>💬 {item._count?.comments || 0} comments</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      <View style={s.topbar}>
        <Text style={s.title}>👥 Community</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)}>
          <Text style={s.addBtnText}>+ Post</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={colors.green} /></View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 48 }}>💬</Text>
              <Text style={s.emptyText}>No discussions yet. Start one!</Text>
            </View>
          }
        />
      )}

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>New Discussion</Text>
              <TouchableOpacity onPress={() => setShowForm(false)}><Text style={{ color: colors.muted, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>Title</Text>
              <TextInput style={s.fieldInput} placeholder="Discussion topic..." placeholderTextColor={colors.muted}
                value={newPost.title} onChangeText={t => setNewPost(p => ({ ...p, title: t }))} />
            </View>
            <View style={s.field}>
              <Text style={s.fieldLabel}>Content</Text>
              <TextInput style={[s.fieldInput, { height: 100, textAlignVertical: 'top' }]}
                placeholder="What's on your mind?" placeholderTextColor={colors.muted}
                value={newPost.content} onChangeText={t => setNewPost(p => ({ ...p, content: t }))} multiline />
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1, flex: 1 }]} onPress={() => setShowForm(false)}>
                <Text style={{ color: colors.text, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, { backgroundColor: colors.accent, flex: 1 }]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '600' }}>Post</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const makeStyles = (c: any) => StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topbar: {
    backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border,
    paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: c.text },
  addBtn: { backgroundColor: c.accent, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  list: { padding: 14, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: c.surface, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  authorDot: { width: 36, height: 36, backgroundColor: c.greenDim, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  author: { fontSize: 13, fontWeight: '700', color: c.text },
  date: { fontSize: 11, color: c.muted, marginTop: 1 },
  postTitle: { fontSize: 16, fontWeight: '700', color: c.text, marginBottom: 6 },
  postContent: { fontSize: 13.5, color: c.muted, lineHeight: 20 },
  cardFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border },
  commentCount: { fontSize: 12, color: c.muted },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, color: c.muted },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, borderWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, color: c.muted, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  fieldInput: { backgroundColor: c.surface2, borderRadius: 10, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: c.text },
  modalBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});
