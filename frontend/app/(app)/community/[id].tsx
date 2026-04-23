import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import api from '../../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    try {
      const r = await api.get(`farm/community/${id}`);
      setPost(r.data);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to load discussion');
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`farm/community/${id}/comments`, { content: comment });
      setComment('');
      fetchPost();
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[s.flex, { backgroundColor: colors.bg }]} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.surface} />
      
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]} numberOfLines={1}>Discussion</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Post Card */}
        <View style={[s.postCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.authorRow}>
            <View style={[s.avatar, { backgroundColor: colors.greenDim }]}>
               <Text style={{ fontSize: 16 }}>👤</Text>
            </View>
            <View>
              <Text style={[s.authorName, { color: colors.text }]}>{post.author}</Text>
              <Text style={[s.postDate, { color: colors.muted }]}>{new Date(post.createdAt).toLocaleDateString()}</Text>
            </View>
          </View>
          <Text style={[s.postTitle, { color: colors.text }]}>{post.title}</Text>
          <Text style={[s.postBody, { color: colors.text }]}>{post.content}</Text>
          <View style={[s.tag, { backgroundColor: colors.surface2 }]}>
             <Text style={[s.tagText, { color: colors.muted }]}>{post.category}</Text>
          </View>
        </View>

        {/* Comments Section */}
        <Text style={[s.secHeader, { color: colors.text }]}>Comments ({post.comments?.length || 0})</Text>
        
        {post.comments?.map((c: any) => (
          <View key={c.id} style={[s.commentCard, { borderBottomColor: colors.border }]}>
             <View style={s.commentHead}>
                <Text style={[s.commentAuthor, { color: colors.text }]}>{c.author}</Text>
                <Text style={[s.commentDate, { color: colors.muted }]}>{new Date(c.createdAt).toLocaleDateString()}</Text>
             </View>
             <Text style={[s.commentText, { color: colors.text }]}>{c.content}</Text>
          </View>
        ))}

        {(!post.comments || post.comments.length === 0) && (
          <View style={s.empty}>
             <Text style={{ color: colors.muted }}>No comments yet. Be the first!</Text>
          </View>
        )}
      </ScrollView>

      {/* Reply Bar */}
      <View style={[s.replyBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
         <TextInput 
           style={[s.replyInput, { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border }]}
           placeholder="Add a comment..."
           placeholderTextColor={colors.muted}
           value={comment}
           onChangeText={setComment}
           multiline
         />
         <TouchableOpacity 
           style={[s.sendBtn, { backgroundColor: comment.trim() ? colors.accent : colors.surface2 }]} 
           onPress={handleComment}
           disabled={saving || !comment.trim()}
         >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <MaterialCommunityIcons name="send" size={20} color={comment.trim() ? "#fff" : colors.muted} />}
         </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 8, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1 
  },
  title: { fontSize: 16, fontWeight: '800', flex: 1, textAlign: 'center' },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 100 },
  postCard: { borderRadius: 20, padding: 20, borderWidth: 1, marginBottom: 24 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  authorName: { fontSize: 15, fontWeight: '700' },
  postDate: { fontSize: 12, marginTop: 2 },
  postTitle: { fontSize: 20, fontWeight: '800', marginBottom: 10 },
  postBody: { fontSize: 15, lineHeight: 24 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 16 },
  tagText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  secHeader: { fontSize: 16, fontWeight: '800', marginBottom: 16, marginLeft: 4 },
  commentCard: { paddingVertical: 16, borderBottomWidth: 1 },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '700' },
  commentDate: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  empty: { padding: 40, alignItems: 'center' },
  replyBar: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
  replyInput: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
