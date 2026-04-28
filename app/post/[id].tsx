import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { postsService, type Post } from '@/services/posts.service';
import { commentsService } from '@/services/comments.service';
import { CommentItem } from '@/components/CommentItem';
import { UserAvatar } from '@/components/UserAvatar';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { BASE_URL } from '@/services/api';

const { width: SW } = Dimensions.get('window');

const TAG_COLORS: Record<string, string> = {
  Senang: '#3FB950', Sedih: '#4F8EF7', Marah: '#F85149',
  Kecewa: '#D29922', Bersemangat: '#BC8CFF', Takut: '#8B949E', Bangga: '#FF9F1C',
};
const CAT_COLORS: Record<string, string> = {
  '#Belajar': '#4F8EF7', '#Curhat': '#BC8CFF', '#Prestasi': '#3FB950',
  '#Ekskul': '#FF9F1C', '#Sekolah': '#D29922',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sending, setSending] = useState(false);
  const [likes, setLikes] = useState(0);
  const [reposts, setReposts] = useState(0);
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const loadPost = useCallback(async () => {
    try {
      const res = await postsService.getById(Number(id));
      setPost(res.data);
      setLikes(res.data.likes_count);
      setReposts(res.data.repost_count);
      setLiked(res.data.is_liked ?? false);
      setReposted(res.data.is_reposted ?? false);
    } catch {
      Alert.alert('Error', 'Postingan tidak ditemukan');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPost(); }, [loadPost]);

  const handleLike = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((l) => wasLiked ? l - 1 : l + 1);
    try { await postsService.like(Number(id)); }
    catch {
      setLiked(wasLiked);
      setLikes((l) => wasLiked ? l + 1 : l - 1);
    } finally { setLikeLoading(false); }
  };

  const handleRepost = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (repostLoading) return;
    setRepostLoading(true);
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setReposts((r) => wasReposted ? r - 1 : r + 1);
    try { await postsService.repost(Number(id)); }
    catch {
      setReposted(wasReposted);
      setReposts((r) => wasReposted ? r + 1 : r - 1);
    } finally { setRepostLoading(false); }
  };

  const handleComment = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!comment.trim()) return;
    setSending(true);
    try {
      await commentsService.create(Number(id), comment.trim());
      setComment('');
      loadPost();
    } catch {
      Alert.alert('Error', 'Gagal mengirim komentar');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) return null;

  const postUser = post.user || {
    id: 0,
    name: 'Pengguna Dihapus',
    profile_picture: null,
  };

  const mediaUri = post.photo_video
    ? post.photo_video.startsWith('http')
      ? post.photo_video
      : `${BASE_URL}/storage/${post.photo_video}`
    : null;

  const tagColor = TAG_COLORS[post.tagline] ?? Colors.dark.primary;
  const catColor = CAT_COLORS[post.tag_kategori] ?? Colors.dark.primary;

  const isAuthor = user?.id === postUser.id;
  const postDate = new Date(post.created_at);
  const diffHours = (new Date().getTime() - postDate.getTime()) / (1000 * 60 * 60);
  const isEditable = isAuthor && diffHours < 1;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Postingan</Text>
        {isEditable ? (
          <TouchableOpacity onPress={() => router.push(`/post/edit/${post.id}`)} style={{ width: 40, alignItems: 'flex-end' }}>
            <Ionicons name="pencil" size={20} color={Colors.dark.textSecondary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={post.comments}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              {/* Post body */}
              <View style={styles.postBody}>
                <View style={styles.postAuthor}>
                  <UserAvatar
                    name={postUser.name}
                    profilePicture={postUser.profile_picture}
                    size={48}
                    onPress={() => router.push(`/user/${postUser.id}`)}
                  />
                  <View style={styles.authorInfo}>
                    <TouchableOpacity onPress={() => router.push(`/user/${postUser.id}`)}>
                      <Text style={styles.authorName}>{postUser.name}</Text>
                    </TouchableOpacity>
                    <Text style={styles.postTime}>{formatTime(post.created_at)}</Text>
                  </View>
                </View>

                {/* Tags */}
                <View style={styles.tags}>
                  <View style={[styles.tag, { backgroundColor: `${tagColor}22`, borderColor: `${tagColor}44` }]}>
                    <Text style={[styles.tagText, { color: tagColor }]}>{post.tagline}</Text>
                  </View>
                  <View style={[styles.tag, { backgroundColor: `${catColor}22`, borderColor: `${catColor}44` }]}>
                    <Text style={[styles.tagText, { color: catColor }]}>{post.tag_kategori}</Text>
                  </View>
                  {post.tag_location && (
                    <View style={styles.locationTag}>
                      <Ionicons name="location-outline" size={12} color={Colors.dark.textMuted} />
                      <Text style={styles.locationText}>{post.tag_location}</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.caption}>{post.caption}</Text>

                {mediaUri && (
                  <Image source={{ uri: mediaUri }} style={styles.media} resizeMode="cover" />
                )}

                {/* Actions bar */}
                <View style={styles.actionBar}>
                  <TouchableOpacity style={styles.actionItem} onPress={() => inputRef.current?.focus()}>
                    <Ionicons name="chatbubble-outline" size={22} color='#555566' />
                    <Text style={[styles.actionCount, { color: '#555566' }]}>{post.comments_count}</Text>
                  </TouchableOpacity>
                  {!isAuthor && (
                    <TouchableOpacity style={styles.actionItem} onPress={handleRepost} disabled={repostLoading}>
                      <Ionicons name={reposted ? 'repeat' : 'repeat-outline'} size={22} color={repostLoading ? '#333344' : reposted ? '#3FB950' : '#555566'} />
                      <Text style={[styles.actionCount, { color: repostLoading ? '#333344' : reposted ? '#3FB950' : '#555566' }]}>{reposts}</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionItem} onPress={handleLike} disabled={likeLoading}>
                    <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={likeLoading ? '#333344' : liked ? '#F85149' : '#555566'} />
                    <Text style={[styles.actionCount, { color: likeLoading ? '#333344' : liked ? '#F85149' : '#555566' }]}>{likes}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Comments header */}
              <View style={styles.commentsHeader}>
                <Text style={styles.commentsTitle}>
                  {post.comments_count} Komentar
                </Text>
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <CommentItem comment={item} onDeleted={loadPost} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>Belum ada komentar. Jadilah yang pertama!</Text>
            </View>
          }
        />

        {/* Comment input */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Tambah komentar..."
              placeholderTextColor={Colors.dark.textMuted}
              value={comment}
              onChangeText={setComment}
              maxLength={140}
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.sendBtn, (!comment.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleComment}
            disabled={!comment.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.dark.text },
  listContent: { paddingBottom: 80 },
  postBody: {
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  postAuthor: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  authorInfo: { justifyContent: 'center' },
  authorName: { fontSize: Typography.md, fontWeight: FontWeight.semibold, color: Colors.dark.text },
  postTime: { fontSize: Typography.xs, color: Colors.dark.textMuted, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: { fontSize: Typography.xs, fontWeight: FontWeight.medium },
  locationTag: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  locationText: { fontSize: Typography.xs, color: Colors.dark.textMuted },
  caption: {
    fontSize: Typography.md,
    color: Colors.dark.text,
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  media: {
    width: '100%',
    height: 240,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.dark.surface,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.borderLight,
  },
  actionItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  actionCount: { fontSize: Typography.sm, fontWeight: FontWeight.medium },
  commentsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  commentsTitle: { fontSize: Typography.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary },
  emptyComments: { padding: Spacing.xl, alignItems: 'center' },
  emptyCommentsText: { fontSize: Typography.sm, color: Colors.dark.textMuted },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: Colors.dark.border,
    backgroundColor: Colors.dark.bg,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    maxHeight: 100,
  },
  input: { fontSize: Typography.sm, color: Colors.dark.text, lineHeight: 20 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
