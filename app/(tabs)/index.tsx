import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { postsService, type Post } from '@/services/posts.service';
import { PostCard } from '@/components/PostCard';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

const CATEGORIES = ['Semua', '#Belajar', '#Curhat', '#Prestasi', '#Ekskul', '#Sekolah'];

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    if (params.refreshStamp) {
      setActiveCategory('Semua');
      setSearch('');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      fetchPosts(1, true, '', 'Semua');
    }
  }, [params.refreshStamp]);

  const fetchPosts = useCallback(
    async (pg = 1, reset = false, searchQ = search, cat = activeCategory) => {
      try {
        const params: any = { page: pg };
        if (searchQ.trim()) params.search = searchQ.trim();
        if (cat !== 'Semua') params.tag_kategori = cat;
        const res = await postsService.getAll(params);
        const newPosts = res.data ?? [];
        if (reset) {
          setPosts(newPosts);
        } else {
          setPosts((prev) => [...prev, ...newPosts]);
        }
        if (res.meta) {
          setLastPage(res.meta.last_page);
        }
        setPage(pg);
      } catch (err) {
        console.error('Fetch posts error:', err);
      }
    },
    [search, activeCategory]
  );

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, true).finally(() => setLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setLoading(true);
      fetchPosts(1, true, search, activeCategory).finally(() => setLoading(false));
    }, 500);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [search]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts(1, true);
    setRefreshing(false);
  }, [fetchPosts]);

  const onLoadMore = useCallback(async () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    await fetchPosts(page + 1, false);
    setLoadingMore(false);
  }, [loadingMore, page, lastPage, fetchPosts]);

  const renderItem = useCallback(
    ({ item }: { item: Post }) => (
      <PostCard post={item} onRefresh={onRefresh} />
    ),
    [onRefresh]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── Fixed top area (header + search + category) ── */}
      <View style={styles.topArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/assets/images/logo-assets/logo-lowres-fullwhite.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Text style={styles.headerTitle}>StudentVoice</Text>
          </View>
          {user && (
            <View style={styles.headerRight}>
              <Ionicons name="notifications-outline" size={22} color={Colors.dark.textSecondary} />
            </View>
          )}
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.dark.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari postingan..."
            placeholderTextColor={Colors.dark.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.dark.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter — fixed, never moves */}
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          style={styles.categoryScroll}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryChip, activeCategory === item && styles.categoryChipActive]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.categoryText, activeCategory === item && styles.categoryTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* ── Scrollable posts area (fills remaining space) ── */}
      <View style={styles.postsArea}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.dark.primary} />
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="document-outline" size={48} color={Colors.dark.border} />
            <Text style={styles.emptyText}>Belum ada postingan</Text>
            <Text style={styles.emptySubtext}>Jadilah yang pertama berbagi!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={posts}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.dark.primary}
                colors={[Colors.dark.primary]}
              />
            }
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.listContent}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={Colors.dark.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  // Fixed top area — will never shrink regardless of posts list size
  topArea: {
    flexShrink: 0,
    backgroundColor: Colors.dark.bg,
    zIndex: 10,
  },
  // The posts area takes all remaining space below topArea
  postsArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  headerLogo: { width: 40, height: 40 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: FontWeight.medium,
    color: Colors.dark.text,
    letterSpacing: -0.5,
  },
  headerRight: { flexDirection: 'row', gap: Spacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: { marginRight: Spacing.sm },
  searchInput: { flex: 1, fontSize: Typography.sm, color: Colors.dark.text, height: '100%' },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: Spacing.sm,
  },
  categoryList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: Typography.sm,
    color: Colors.dark.textSecondary,
    fontWeight: FontWeight.medium,
  },
  categoryTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyText: { fontSize: Typography.md, color: Colors.dark.textSecondary, fontWeight: FontWeight.semibold },
  emptySubtext: { fontSize: Typography.sm, color: Colors.dark.textMuted },
  listContent: { paddingBottom: 120 },
  footer: { padding: Spacing.lg, alignItems: 'center' },
});
