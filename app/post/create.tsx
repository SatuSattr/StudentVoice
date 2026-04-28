import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { postsService } from '@/services/posts.service';
import { useAuth } from '@/hooks/use-auth';

const TAGLINES = ['Senang', 'Sedih', 'Marah', 'Kecewa', 'Bersemangat', 'Takut', 'Bangga'];
const CATEGORIES = ['#Belajar', '#Curhat', '#Prestasi', '#Ekskul', '#Sekolah'];

const TAGLINE_COLORS: Record<string, string> = {
  Senang: '#3FB950', Sedih: '#4F8EF7', Marah: '#F85149',
  Kecewa: '#D29922', Bersemangat: '#BC8CFF', Takut: '#8B949E', Bangga: '#FF9F1C',
};

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [caption, setCaption] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMedia(result.assets[0]);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!caption.trim()) e.caption = 'Caption wajib diisi';
    if (caption.length > 280) e.caption = 'Maksimal 280 karakter';
    if (!tagline) e.tagline = 'Pilih perasaanmu';
    if (!category) e.category = 'Pilih kategori';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload: any = {
        caption: caption.trim(),
        tagline,
        tag_kategori: category,
      };
      if (location.trim()) payload.tag_location = location.trim();
      if (media) {
        const filename = media.uri.split('/').pop() ?? 'media.jpg';
        const ext = filename.split('.').pop() ?? 'jpg';
        const isVideo = media.type === 'video';
        payload.photo_video = {
          uri: media.uri,
          type: isVideo ? `video/${ext}` : `image/${ext}`,
          name: filename,
        };
      }
      await postsService.create(payload);
      router.replace({ pathname: '/(tabs)/', params: { refreshStamp: Date.now().toString() } });
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        const mapped: Record<string, string> = {};
        Object.entries(data.errors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      } else {
        Alert.alert('Error', data?.message ?? 'Gagal membuat postingan');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Batal</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Postingan Baru</Text>
        <TouchableOpacity
          style={[styles.postBtn, (!caption.trim() || !tagline || !category || loading) && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={!caption.trim() || !tagline || !category || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Author row */}
          <View style={styles.authorRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase() ?? 'U'}
              </Text>
            </View>
            <Text style={styles.authorName}>{user?.name}</Text>
          </View>

          {/* Caption */}
          <View style={styles.captionWrap}>
            <TextInput
              style={styles.captionInput}
              placeholder="Apa yang kamu pikirkan hari ini?"
              placeholderTextColor={Colors.dark.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={280}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, caption.length > 260 && styles.charCountWarn]}>
              {caption.length}/280
            </Text>
          </View>
          {errors.caption && <Text style={styles.errorText}>{errors.caption}</Text>}

          {/* Media Preview */}
          {media && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: media.uri }} style={styles.mediaImage} resizeMode="cover" />
              <TouchableOpacity style={styles.removeMedia} onPress={() => setMedia(null)}>
                <Ionicons name="close-circle" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Tagline */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Perasaan <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chips}>
              {TAGLINES.map((t) => {
                const color = TAGLINE_COLORS[t];
                const selected = tagline === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      selected
                        ? { backgroundColor: color, borderColor: color }
                        : { borderColor: `${color}66` },
                    ]}
                    onPress={() => setTagline(t)}
                  >
                    <Text style={[styles.chipText, selected ? { color: '#fff' } : { color }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.tagline && <Text style={styles.errorText}>{errors.tagline}</Text>}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Kategori <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const selected = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.chip,
                      selected
                        ? { backgroundColor: Colors.dark.primary, borderColor: Colors.dark.primary }
                        : { borderColor: Colors.dark.border },
                    ]}
                    onPress={() => setCategory(c)}
                  >
                    <Text style={[styles.chipText, selected ? { color: '#fff' } : { color: Colors.dark.textSecondary }]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Lokasi (opsional)</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={18} color={Colors.dark.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Tambah lokasi"
                placeholderTextColor={Colors.dark.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>

          {/* Media button */}
          <View style={styles.toolbarWrap}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={pickMedia}>
              <Ionicons name="image-outline" size={22} color={Colors.dark.primary} />
              <Text style={styles.toolbarBtnText}>Tambah Foto/Video</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  cancelBtn: { padding: Spacing.xs },
  cancelText: { fontSize: Typography.base, color: Colors.dark.textSecondary },
  headerTitle: { fontSize: Typography.md, fontWeight: FontWeight.bold, color: Colors.dark.text },
  postBtn: {
    // paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    // backgroundColor: Colors.dark.primary,
    borderRadius: Radius.full,
    alignItems: "flex-end"
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText: { fontSize: Typography.base, fontWeight: FontWeight.bold, color: Colors.dark.primary },
  scrollContent: { padding: Spacing.lg, paddingBottom: 40 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: Typography.lg, fontWeight: FontWeight.bold, color: '#fff' },
  authorName: { fontSize: Typography.md, fontWeight: FontWeight.semibold, color: Colors.dark.text },
  captionWrap: { position: 'relative', marginBottom: Spacing.sm },
  captionInput: {
    fontSize: Typography.md,
    color: Colors.dark.text,
    lineHeight: 24,
    minHeight: 120,
    paddingRight: 50,
  },
  charCount: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  charCountWarn: { color: Colors.dark.like },
  errorText: { fontSize: Typography.xs, color: Colors.dark.like, marginBottom: Spacing.sm },
  mediaPreview: {
    position: 'relative',
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  mediaImage: { width: '100%', height: 200, backgroundColor: Colors.dark.surface },
  removeMedia: { position: 'absolute', top: 8, right: 8 },
  section: { marginBottom: Spacing.xl },
  sectionLabel: { fontSize: Typography.sm, fontWeight: FontWeight.semibold, color: Colors.dark.textSecondary, marginBottom: Spacing.sm },
  required: { color: Colors.dark.like },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  chipText: { fontSize: Typography.sm, fontWeight: FontWeight.medium },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    height: 48,
  },
  inputIcon: { marginRight: Spacing.sm },
  textInput: { flex: 1, fontSize: Typography.base, color: Colors.dark.text },
  toolbarWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.dark.borderLight,
    paddingTop: Spacing.md,
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  toolbarBtnText: { fontSize: Typography.sm, color: Colors.dark.primary, fontWeight: FontWeight.medium },
});
