import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, TextInput, Alert, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../src/context/ThemeContext';
import api from '../../../src/api/axios';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { getRelativeTime } from '../community';

export default function CommunityDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    try {
      const r = await api.get(`farm/community/${id}`);
      setPost(r.data);
    } catch (e) {
      console.error(e);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to load discussion' });
    } finally {
      setLoading(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await api.post(`farm/community/${id}/comments`, { 
        content: comment,
        parentId: replyingTo?.id || null 
      });
      setComment('');
      setReplyingTo(null);
      Toast.show({ type: 'success', text1: 'Success', text2: 'Comment added' });
      fetchPost();
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add comment' });
    } finally {
      setSaving(false);
    }
  };

  const buildCommentTree = (comments: any[]) => {
    const map: any = {};
    const roots: any[] = [];
    comments.forEach(c => map[c.id] = { ...c, replies: [] });
    comments.forEach(c => {
      if (c.parentId && map[c.parentId]) {
        map[c.parentId].replies.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  const commentTree = post?.comments ? buildCommentTree(post.comments) : [];

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
        <TouchableOpacity style={s.iconBtn} onPress={() => router.push('/(app)/community')}>
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
              <Text style={[s.postDate, { color: colors.muted }]}>{getRelativeTime(post.createdAt)}</Text>
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
        
        {commentTree.map((c: any) => (
          <CommentItem 
             key={c.id} 
             comment={c} 
             depth={0} 
             onReply={setReplyingTo} 
             postAuthor={post.author} 
             colors={colors} 
             isDark={isDark} 
          />
        ))}

        {(!post.comments || post.comments.length === 0) && (
          <View style={s.empty}>
             <Text style={{ color: colors.muted }}>No comments yet. Be the first!</Text>
          </View>
        )}
      </ScrollView>

      {/* Reply Bar */}
      <View style={[s.replyBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
         <View style={{ flex: 1 }}>
           {replyingTo && (
             <View style={s.replyingToHeader}>
               <Text style={[s.replyingToText, { color: colors.muted }]}>Replying to {replyingTo.author}</Text>
               <TouchableOpacity onPress={() => setReplyingTo(null)}>
                 <MaterialCommunityIcons name="close" size={16} color={colors.muted} />
               </TouchableOpacity>
             </View>
           )}
           <TextInput 
             style={[s.replyInput, { backgroundColor: colors.surface2, color: colors.text, borderColor: colors.border }, replyingTo && { borderTopLeftRadius: 0, borderTopRightRadius: 0, borderTopWidth: 0 }]}
             placeholder="Add a comment..."
           placeholderTextColor={colors.muted}
           value={comment}
           onChangeText={setComment}
           multiline
         />
         </View>
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

const CommentItem = ({ comment, depth = 0, onReply, postAuthor, colors, isDark }: any) => {
  const isAuthor = comment.author === postAuthor;
  const [expanded, setExpanded] = useState(false);
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <View style={[{ paddingLeft: depth > 0 ? 16 : 0 }, depth > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border, marginLeft: 8 }]}>
      <View style={[s.commentCard, depth > 0 && { borderBottomWidth: 0, paddingVertical: 12 }]}>
         <View style={s.commentHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[s.commentAuthor, { color: isAuthor ? colors.accent : colors.text }]}>{comment.author}</Text>
              {isAuthor && <View style={[s.authorBadge, { backgroundColor: colors.accent }]}><Text style={s.authorBadgeText}>Author</Text></View>}
            </View>
            <Text style={[s.commentDate, { color: colors.muted }]}>{getRelativeTime(comment.createdAt)}</Text>
         </View>
         <Text style={[s.commentText, { color: colors.text }]}>{comment.content}</Text>
         <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
           <TouchableOpacity onPress={() => onReply(comment)}>
              <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>Reply</Text>
           </TouchableOpacity>
           {hasReplies && (
             <TouchableOpacity onPress={() => setExpanded(!expanded)}>
                <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>
                  {expanded ? 'Hide replies' : `Show ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}`}
                </Text>
             </TouchableOpacity>
           )}
         </View>
      </View>
      {expanded && hasReplies && comment.replies.map((reply: any) => (
        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} postAuthor={postAuthor} colors={colors} isDark={isDark} />
      ))}
    </View>
  );
};

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
  authorBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  authorBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  commentDate: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  empty: { padding: 40, alignItems: 'center' },
  replyBar: { flexDirection: 'row', padding: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1, alignItems: 'flex-end', gap: 8 },
  replyInput: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, maxHeight: 100 },
  replyingToHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(139,148,158,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0, borderColor: 'rgba(139,148,158,0.2)' },
  replyingToText: { fontSize: 12, fontWeight: '600' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
