import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { UserAvatar } from './UserAvatar';
import type { Post } from '@/services/posts.service';
import { postsService } from '@/services/posts.service';
import { useAuth } from '@/hooks/use-auth';
import { BASE_URL } from '@/services/api';

interface PostCardProps {
  post: Post;
  onRefresh?: () => void;
  onPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}h`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

const TAG_COLORS: Record<string, string> = {
  Senang: '#3FB950',
  Sedih: '#4F8EF7',
  Marah: '#F85149',
  Kecewa: '#D29922',
  Bersemangat: '#BC8CFF',
  Takut: '#8B949E',
  Bangga: '#FF9F1C',
};

const CATEGORY_COLORS: Record<string, string> = {
  '#Belajar': '#4F8EF7',
  '#Curhat': '#BC8CFF',
  '#Prestasi': '#3FB950',
  '#Ekskul': '#FF9F1C',
  '#Sekolah': '#D29922',
};

const ICON_DEFAULT = '#555566';

export function PostCard({ post, onRefresh, onPress }: PostCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isRepostRecord = !!post.original_post;
  const displayPost = (post.original_post as Post) || post;

  const [likes, setLikes] = useState(displayPost.likes_count);
  const [reposts, setReposts] = useState(displayPost.repost_count);
  const [liked, setLiked] = useState(displayPost.is_liked ?? false);
  const [reposted, setReposted] = useState(displayPost.is_reposted ?? false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [repostLoading, setRepostLoading] = useState(false);

  if (!displayPost) return null;

  const postUser = displayPost.user || {
    id: 0,
    name: 'Pengguna Dihapus',
    profile_picture: null,
  };

  const isOwnPost = user?.id === postUser.id;
  const isOwner = user?.id === post.user?.id;

  const mediaUri = displayPost.photo_video
    ? displayPost.photo_video.startsWith('http')
      ? displayPost.photo_video
      : `${BASE_URL}/storage/${displayPost.photo_video}`
    : null;

  const isVideo = mediaUri?.match(/\.(mp4|mov)$/i);

  const tagColor = TAG_COLORS[displayPost.tagline] ?? Colors.dark.primary;
  const catColor = CATEGORY_COLORS[displayPost.tag_kategori] ?? Colors.dark.primary;

  const handleLike = useCallback(async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (likeLoading) return;
    setLikeLoading(true);
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikes((l) => wasLiked ? l - 1 : l + 1);
    try {
      await postsService.like(displayPost.id);
    } catch {
      setLiked(wasLiked);
      setLikes((l) => wasLiked ? l + 1 : l - 1);
    } finally {
      setLikeLoading(false);
    }
  }, [user, likeLoading, liked, post.id]);

  const handleRepost = useCallback(async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (repostLoading) return;
    setRepostLoading(true);
    const wasReposted = reposted;
    setReposted(!wasReposted);
    setReposts((r) => wasReposted ? r - 1 : r + 1);
    try {
      await postsService.repost(displayPost.id);
    } catch {
      setReposted(wasReposted);
      setReposts((r) => wasReposted ? r + 1 : r - 1);
    } finally {
      setRepostLoading(false);
    }
  }, [user, repostLoading, reposted, post.id]);

  const handleDelete = useCallback(() => {
    Alert.alert('Hapus Postingan', 'Yakin ingin menghapus postingan ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await postsService.delete(post.id);
            onRefresh?.();
          } catch {
            Alert.alert('Error', 'Gagal menghapus postingan');
          }
        },
      },
    ]);
  }, [post.id, onRefresh]);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={onPress ?? (() => router.push(`/post/${post.id}`))}
    >
      {/* Top Banner (If viewing a repost) */}
      {isRepostRecord && (
        <View style={styles.repostBanner}>
          <Ionicons name="repeat" size={12} color={Colors.dark.textMuted} />
          <Text style={styles.repostBannerText}>
            {post.user?.name} merepost
          </Text>
        </View>
      )}

      {/* Avatar column */}
      <View style={styles.avatarCol}>
        <UserAvatar
          name={postUser.name}
          profilePicture={postUser.profile_picture}
          size={44}
          onPress={() => router.push(`/user/${postUser.id}`)}
        />
      </View>

      {/* Content column */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push(`/user/${postUser.id}`)}>
              <Text style={styles.name}>{postUser.name}</Text>
            </TouchableOpacity>
            <Text style={styles.time}> · {formatTime(displayPost.created_at)}</Text>
          </View>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.moreBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}
        </View>



        {/* Tags */}
        <View style={styles.tags}>
          <View style={[styles.tag, { backgroundColor: `${tagColor}22`, borderColor: `${tagColor}44` }]}>
            <Text style={[styles.tagText, { color: tagColor }]}>{displayPost.tagline}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: `${catColor}22`, borderColor: `${catColor}44` }]}>
            <Text style={[styles.tagText, { color: catColor }]}>{displayPost.tag_kategori}</Text>
          </View>
          {displayPost.tag_location && (
            <View style={styles.locationTag}>
              <Ionicons name="location-outline" size={11} color={Colors.dark.textMuted} />
              <Text style={styles.locationText}>{displayPost.tag_location}</Text>
            </View>
          )}
        </View>

        {/* Caption */}
        <Text style={styles.caption}>{displayPost.caption}</Text>

        {/* Media */}
        {mediaUri && !isVideo && (
          <Image
            source={{ uri: mediaUri }}
            style={styles.media}
            resizeMode="cover"
          />
        )}
        {mediaUri && isVideo && (
          <View style={[styles.media, styles.videoPlaceholder]}>
            <Ionicons name="play-circle-outline" size={48} color={Colors.dark.text} />
            <Text style={styles.videoLabel}>Video</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <ActionBtn
            icon="chatbubble-outline"
            count={displayPost.comments_count}
            color={ICON_DEFAULT}
            activeColor={ICON_DEFAULT}
            active={false}
            onPress={() => router.push(`/post/${displayPost.id}`)}
          />
          {!isOwnPost && (
            <ActionBtn
              icon={reposted ? 'repeat' : 'repeat-outline'}
              count={reposts}
              color={ICON_DEFAULT}
              activeColor='#3FB950'
              active={reposted}
              onPress={handleRepost}
              loading={repostLoading}
            />
          )}
          <ActionBtn
            icon={liked ? 'heart' : 'heart-outline'}
            count={likes}
            color={ICON_DEFAULT}
            activeColor='#F85149'
            active={liked}
            onPress={handleLike}
            loading={likeLoading}
          />
          <ActionBtn
            icon="share-outline"
            color={ICON_DEFAULT}
            activeColor={ICON_DEFAULT}
            active={false}
            onPress={() => { }}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ActionBtn({
  icon,
  count,
  color,
  activeColor,
  active,
  onPress,
  loading,
}: {
  icon: string;
  count?: number;
  color: string;
  activeColor: string;
  active: boolean;
  onPress: () => void;
  loading?: boolean;
}) {
  const resolvedColor = loading ? '#333344' : active ? activeColor : color;
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={20} color={resolvedColor} />
      {count !== undefined && count > 0 && (
        <Text style={[styles.actionCount, { color: resolvedColor }]}>{count}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
    backgroundColor: Colors.dark.bg,
  },
  repostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.xs,
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.lg + 44 + Spacing.md,
  },
  repostBannerText: {
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  avatarCol: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    paddingBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flex: 1,
  },
  name: {
    fontSize: Typography.base,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
  },
  time: {
    fontSize: Typography.sm,
    color: Colors.dark.textMuted,
  },
  moreBtn: {
    padding: Spacing.xs,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: Typography.xs,
    fontWeight: FontWeight.medium,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  caption: {
    fontSize: Typography.base,
    color: Colors.dark.text,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  media: {
    width: '100%',
    height: 220,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.surface,
    marginBottom: Spacing.md,
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    color: Colors.dark.textSecondary,
    fontSize: Typography.sm,
    marginTop: Spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionCount: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.medium,
  },
});
