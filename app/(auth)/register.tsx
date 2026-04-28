import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight, Radius } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk memilih foto profil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0]);
    }
  };

  const handleRegister = async () => {
    setErrors({});
    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirm,
      };
      if (avatar) {
        const filename = avatar.uri.split('/').pop() ?? 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const mimeType = match ? `image/${match[1]}` : 'image/jpeg';
        payload.profile_picture = { uri: avatar.uri, type: mimeType, name: filename };
      }
      await register(payload);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.errors) {
        setErrors(data.errors);
      } else if (data?.message) {
        Alert.alert('Registrasi Gagal', data.message);
      } else {
        Alert.alert('Error', 'Tidak dapat terhubung ke server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Buat Akun</Text>
        <Text style={styles.subtitle}>Bergabung dengan StudentVoice</Text>

        {/* Avatar Picker */}
        <TouchableOpacity style={styles.avatarPickerWrap} onPress={pickAvatar} activeOpacity={0.8}>
          {avatar ? (
            <Image source={{ uri: avatar.uri }} style={styles.avatarPreview} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="camera-outline" size={28} color={Colors.dark.textMuted} />
              <Text style={styles.avatarPlaceholderText}>Foto Profil</Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="pencil" size={12} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Name */}
        <Field label="Nama Lengkap" error={errors.name?.[0]}>
          <FieldInput
            icon="person-outline"
            placeholder="Nama kamu"
            value={name}
            onChangeText={setName}
            hasError={!!errors.name}
          />
        </Field>

        {/* Email */}
        <Field label="Email" error={errors.email?.[0]}>
          <FieldInput
            icon="mail-outline"
            placeholder="email@contoh.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            hasError={!!errors.email}
          />
        </Field>

        {/* Password */}
        <Field label="Password" error={errors.password?.[0]}>
          <View style={[styles.inputWrap, errors.password ? styles.inputError : null]}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.dark.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Min. 8 karakter"
              placeholderTextColor={Colors.dark.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
            />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Ionicons
                name={showPw ? 'eye-outline' : 'eye-off-outline'}
                size={18}
                color={Colors.dark.textMuted}
              />
            </TouchableOpacity>
          </View>
        </Field>

        {/* Password Confirm */}
        <Field label="Konfirmasi Password" error={errors.password_confirmation?.[0]}>
          <FieldInput
            icon="lock-closed-outline"
            placeholder="Ulangi password"
            value={passwordConfirm}
            onChangeText={setPasswordConfirm}
            secureTextEntry={!showPw}
            hasError={!!errors.password_confirmation}
          />
        </Field>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.btnText}>Daftar Sekarang</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
          <Text style={styles.loginLinkText}>
            Sudah punya akun? <Text style={{ color: Colors.dark.primary }}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function FieldInput({
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  secureTextEntry,
  hasError,
}: any) {
  return (
    <View style={[styles.inputWrap, hasError ? styles.inputError : null]}>
      <Ionicons name={icon} size={18} color={Colors.dark.textMuted} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.dark.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.dark.bg },
  container: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingTop: 56, paddingBottom: 40 },
  backBtn: { marginBottom: Spacing.xl, alignSelf: 'flex-start' },
  title: { fontSize: Typography.xxl, fontWeight: FontWeight.bold, color: Colors.dark.text, marginBottom: Spacing.xs, textAlign: 'center' },
  subtitle: { fontSize: Typography.base, color: Colors.dark.textSecondary, marginBottom: Spacing.xl, textAlign: 'center' },
  avatarPickerWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  avatarPreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  avatarPlaceholderText: {
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldWrap: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.sm, fontWeight: FontWeight.medium, color: Colors.dark.textSecondary, marginBottom: Spacing.xs },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputError: { borderColor: Colors.dark.like },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: Typography.base, color: Colors.dark.text, height: '100%' },
  eyeBtn: { padding: Spacing.xs },
  errorText: { fontSize: Typography.xs, color: Colors.dark.like, marginTop: Spacing.xs },
  btn: {
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { fontSize: Typography.md, fontWeight: FontWeight.semibold, color: '#fff' },
  loginLink: { alignItems: 'center' },
  loginLinkText: { fontSize: Typography.sm, color: Colors.dark.textSecondary },
});
