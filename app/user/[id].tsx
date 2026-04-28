import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usersService, type User } from '@/services/users.service';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const res = await usersService.getById(Number(id));
      setProfile(res.data);
    } catch {
      Alert.alert('Error', 'Profil tidak ditemukan');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleFollow = async () => {
    if (!me) { router.push('/(auth)/login'); return; }
    if (!profile) return;
    setFollowLoading(true);
    const wasFollowing = profile.is_following;
    // Optimistic update
    setProfile((p) =>
      p
        ? {
          ...p,
          is_following: !wasFollowing,
          followers_count: wasFollowing ? p.followers_count - 1 : p.followers_count + 1,
        }
        : p
    );
    try {
      await usersService.follow(profile.id);
    } catch {
      // Revert on error
      setProfile((p) =>
        p
          ? {
            ...p,
            is_following: wasFollowing,
            followers_count: wasFollowing ? p.followers_count + 1 : p.followers_count - 1,
          }
          : p
      );
    } finally {
      setFollowLoading(false);
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

  if (!profile) return null;

  const isMe = me?.id === profile.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile header */}
        <View style={styles.profileSection}>
          <UserAvatar name={profile.name} profilePicture={profile.profile_picture} size={80} />

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile.name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>

            {/* Stats */}
            <View style={styles.stats}>
              <StatItem label="Post" value={profile.posts_count} />
              <StatItem label="Mengikuti" value={profile.following_count} />
              <StatItem label="Pengikut" value={profile.followers_count} />
            </View>
          </View>
        </View>

        {/* Follow button */}
        {!isMe && me && (
          <View style={styles.followWrap}>
            <TouchableOpacity
              style={[
                styles.followBtn,
                profile.is_following && styles.followingBtn,
              ]}
              onPress={handleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {followLoading ? (
                <ActivityIndicator size="small" color={profile.is_following ? Colors.dark.text : '#fff'} />
              ) : (
                <>
                  <Ionicons
                    name={profile.is_following ? 'checkmark' : 'person-add-outline'}
                    size={16}
                    color={profile.is_following ? Colors.dark.text : '#fff'}
                  />
                  <Text style={[styles.followBtnText, profile.is_following && styles.followingBtnText]}>
                    {profile.is_following ? 'Mengikuti' : 'Ikuti'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Posts */}
        <View style={styles.postsSection}>
          <Text style={styles.postsHeader}>Postingan</Text>
          {profile.posts && profile.posts.length > 0 ? (
            profile.posts.map((post: any) => (
              <PostCard key={post.id} post={post} onRefresh={loadProfile} />
            ))
          ) : (
            <View style={styles.emptyPosts}>
              <Ionicons name="create-outline" size={40} color={Colors.dark.border} />
              <Text style={styles.emptyText}>Belum ada postingan</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  scrollContent: { paddingBottom: 100 },
  profileSection: {
    flexDirection: 'row',
    gap: Spacing.lg,
    padding: Spacing.lg,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: 2 },
  profileEmail: { fontSize: Typography.sm, color: Colors.dark.textMuted, marginBottom: Spacing.md },
  stats: { flexDirection: 'row', gap: Spacing.xl },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.dark.text },
  statLabel: { fontSize: Typography.xs, color: Colors.dark.textMuted },
  followWrap: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.dark.primary,
  },
  followingBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.dark.border,
  },
  followBtnText: { fontSize: Typography.base, fontWeight: FontWeight.semibold, color: '#fff' },
  followingBtnText: { color: Colors.dark.text },
  postsSection: { paddingTop: Spacing.sm },
  postsHeader: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  emptyPosts: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  emptyText: { fontSize: Typography.sm, color: Colors.dark.textMuted },
});
