import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { usersService, type User } from '@/services/users.service';
import { postsService, type Post } from '@/services/posts.service';
import { UserAvatar } from '@/components/UserAvatar';
import { PostCard } from '@/components/PostCard';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [newAvatar, setNewAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      const res = await usersService.getById(user.id);
      setProfile(res.data);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadProfile().finally(() => setLoading(false));
  }, [loadProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const startEdit = () => {
    setEditName(profile?.name ?? user?.name ?? '');
    setNewAvatar(null);
    setEditMode(true);
  };

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setNewAvatar(result.assets[0]);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (editName.trim() && editName.trim() !== profile?.name) {
        payload.name = editName.trim();
      }
      if (newAvatar) {
        const filename = newAvatar.uri.split('/').pop() ?? 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        payload.profile_picture = {
          uri: newAvatar.uri,
          type: match ? `image/${match[1]}` : 'image/jpeg',
          name: filename,
        };
      }
      await usersService.updateProfile(payload);
      await refreshUser();
      await loadProfile();
      setEditMode(false);
    } catch {
      Alert.alert('Error', 'Gagal menyimpan profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Yakin ingin keluar?')) {
        logout();
      }
    } else {
      Alert.alert('Keluar', 'Yakin ingin keluar?', [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: logout },
      ]);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={64} color={Colors.dark.border} />
          <Text style={styles.emptyText}>Belum login</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>Masuk Sekarang</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currentProfile = profile ?? user;
  const avatarUri = newAvatar?.uri ?? undefined;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={Colors.dark.like} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.primary} />}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <TouchableOpacity onPress={editMode ? pickAvatar : undefined} style={styles.avatarWrap} activeOpacity={editMode ? 0.8 : 1}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.bigAvatar} />
            ) : (
              <UserAvatar
                name={currentProfile.name}
                profilePicture={currentProfile.profile_picture}
                size={90}
              />
            )}
            {editMode && (
              <View style={styles.avatarEditBadge}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          {editMode ? (
            <TextInput
              style={styles.editNameInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={Colors.dark.textMuted}
            />
          ) : (
            <Text style={styles.name}>{currentProfile.name}</Text>
          )}

          <Text style={styles.email}>{currentProfile.email}</Text>

          {/* Stats */}
          <View style={styles.stats}>
            <Stat label="Postingan" value={profile?.posts_count ?? 0} />
            <View style={styles.statDivider} />
            <Stat label="Mengikuti" value={profile?.following_count ?? 0} />
            <View style={styles.statDivider} />
            <Stat label="Pengikut" value={profile?.followers_count ?? 0} />
          </View>

          {/* Actions */}
          <View style={styles.actionRow}>
            {editMode ? (
              <>
                <TouchableOpacity
                  style={[styles.editBtn, styles.saveBtn]}
                  onPress={saveProfile}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>Simpan</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditMode(false)}>
                  <Text style={styles.editBtnText}>Batal</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
                <Ionicons name="pencil-outline" size={16} color={Colors.dark.text} />
                <Text style={styles.editBtnText}>Edit Profil</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Postinganku</Text>
        </View>

        {profile?.posts && profile.posts.length > 0 ? (
          profile.posts.map((post: Post) => (
            <PostCard
              key={post.id}
              post={{
                ...post,
                user: {
                  id: currentProfile.id,
                  name: currentProfile.name,
                  profile_picture: currentProfile.profile_picture
                }
              }}
              onRefresh={onRefresh}
            />
          ))
        ) : (
          <View style={styles.emptyPosts}>
            <Ionicons name="create-outline" size={40} color={Colors.dark.border} />
            <Text style={styles.emptyPostsText}>Belum ada postingan</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyText: { fontSize: Typography.md, color: Colors.dark.textSecondary },
  loginBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.primary,
    borderRadius: Radius.full,
  },
  loginBtnText: { color: '#fff', fontWeight: FontWeight.semibold },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  headerTitle: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: Colors.dark.text },
  logoutBtn: { padding: Spacing.xs },
  scrollContent: { paddingBottom: 100 },
  profileCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.border,
  },
  avatarWrap: { position: 'relative', marginBottom: Spacing.md },
  bigAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: Colors.dark.primary },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.bg,
  },
  name: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.xs },
  editNameInput: {
    fontSize: Typography.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    borderBottomWidth: 2,
    borderBottomColor: Colors.dark.primary,
    paddingHorizontal: Spacing.sm,
    paddingBottom: 4,
    marginBottom: Spacing.xs,
    minWidth: 160,
    textAlign: 'center',
  },
  email: { fontSize: Typography.sm, color: Colors.dark.textMuted, marginBottom: Spacing.xl },
  stats: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl },
  statItem: { alignItems: 'center', paddingHorizontal: Spacing.xl },
  statValue: { fontSize: Typography.xl, fontWeight: FontWeight.bold, color: Colors.dark.text },
  statLabel: { fontSize: Typography.xs, color: Colors.dark.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.dark.border },
  actionRow: { flexDirection: 'row', gap: Spacing.md },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  editBtnText: { fontSize: Typography.sm, fontWeight: FontWeight.medium, color: Colors.dark.text },
  saveBtn: { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary },
  saveBtnText: { fontSize: Typography.sm, fontWeight: FontWeight.semibold, color: '#fff' },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  sectionTitle: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.dark.text },
  emptyPosts: { alignItems: 'center', padding: Spacing.xxxl, gap: Spacing.md },
  emptyPostsText: { fontSize: Typography.sm, color: Colors.dark.textMuted },
});
