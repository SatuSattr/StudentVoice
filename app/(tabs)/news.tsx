import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';

interface NewsItem {
  title: string;
  description: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string };
}

// Fallback static news jika tidak ada API key
const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'Kemendikbud Luncurkan Program Merdeka Belajar Episode Terbaru',
    description: 'Program Merdeka Belajar terus berkembang dengan episode-episode baru yang bertujuan meningkatkan kualitas pendidikan di Indonesia.',
    url: 'https://kemdikbud.go.id',
    image: null,
    publishedAt: new Date().toISOString(),
    source: { name: 'Kemdikbud' },
  },
  {
    title: 'Tips Belajar Efektif untuk Siswa Menengah Atas',
    description: 'Para ahli pendidikan berbagi strategi belajar yang terbukti meningkatkan prestasi akademik siswa SMA.',
    url: 'https://kompas.com',
    image: null,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    source: { name: 'Kompas' },
  },
  {
    title: 'Olimpiade Sains Nasional 2025 Resmi Dibuka',
    description: 'Ribuan pelajar terbaik Indonesia berkompetisi dalam Olimpiade Sains Nasional untuk memperebutkan gelar juara nasional.',
    url: 'https://osn.kemdikbud.go.id',
    image: null,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
    source: { name: 'OSN' },
  },
  {
    title: 'Beasiswa LPDP 2025 Kini Dibuka untuk Seluruh Program Studi',
    description: 'LPDP membuka pendaftaran beasiswa untuk jenjang S1, S2, dan S3 dengan kuota yang lebih besar dari tahun sebelumnya.',
    url: 'https://lpdp.kemenkeu.go.id',
    image: null,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
    source: { name: 'LPDP' },
  },
  {
    title: 'Peran Teknologi AI dalam Dunia Pendidikan Modern',
    description: 'Kecerdasan buatan mulai banyak digunakan dalam proses pembelajaran, dari personalisasi kurikulum hingga penilaian otomatis.',
    url: 'https://edukasi.kompas.com',
    image: null,
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
    source: { name: 'Edukasi Kompas' },
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function NewsCard({ item }: { item: NewsItem }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => Linking.openURL(item.url)}
      activeOpacity={0.85}
    >
      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardSource}>
          <Ionicons name="newspaper-outline" size={12} color={Colors.dark.primary} />
          <Text style={styles.sourceName}>{item.source.name}</Text>
          <Text style={styles.cardDate}>{formatDate(item.publishedAt)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        {item.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.readMore}>Baca Selengkapnya</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.dark.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NewsScreen() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using GNews API (free tier). Replace YOUR_API_KEY below.
    // If no key, falls back to static data.
    const API_KEY = ''; // Ganti dengan API key GNews kamu
    const fetchNews = async () => {
      setLoading(true);
      if (!API_KEY) {
        setNews(FALLBACK_NEWS);
        setLoading(false);
        return;
      }
      try {
        const url = `https://gnews.io/api/v4/search?q=pendidikan+siswa&lang=id&country=id&max=10&apikey=${API_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.articles) {
          setNews(
            json.articles.map((a: any) => ({
              title: a.title,
              description: a.description,
              url: a.url,
              image: a.image,
              publishedAt: a.publishedAt,
              source: a.source,
            }))
          );
        }
      } catch {
        setNews(FALLBACK_NEWS);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Berita Pendidikan</Text>
        <Ionicons name="globe-outline" size={22} color={Colors.dark.textSecondary} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <FlatList
          data={news}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <NewsCard item={item} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  separator: { height: Spacing.md },
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  cardImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  cardBody: { padding: Spacing.md },
  cardSource: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sourceName: {
    fontSize: Typography.xs,
    color: Colors.dark.primary,
    fontWeight: FontWeight.semibold,
    flex: 1,
  },
  cardDate: {
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  cardTitle: {
    fontSize: Typography.md,
    fontWeight: FontWeight.bold,
    color: Colors.dark.text,
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  cardDesc: {
    fontSize: Typography.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  readMore: {
    fontSize: Typography.sm,
    color: Colors.dark.primary,
    fontWeight: FontWeight.medium,
  },
});
