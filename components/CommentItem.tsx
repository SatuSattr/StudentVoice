import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, FontWeight } from '@/constants/theme';
import { UserAvatar } from './UserAvatar';
import { commentsService } from '@/services/comments.service';
import { useAuth } from '@/hooks/use-auth';

export interface CommentItemProps {
  comment: {
    id: number;
    message: string;
    user: { id: number; name: string; profile_picture: string | null };
    created_at: string;
  };
  onDeleted?: () => void;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return 'baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export function CommentItem({ comment, onDeleted }: CommentItemProps) {
  const { user } = useAuth();
  const commentUser = comment.user || {
    id: 0,
    name: 'Pengguna Dihapus',
    profile_picture: null,
  };
  const isOwner = user?.id === commentUser.id;

  const handleDelete = () => {
    Alert.alert('Hapus Komentar', 'Yakin ingin menghapus komentar ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await commentsService.delete(comment.id);
            onDeleted?.();
          } catch {
            Alert.alert('Error', 'Gagal menghapus komentar');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <UserAvatar
        name={commentUser.name}
        profilePicture={commentUser.profile_picture}
        size={36}
      />
      <View style={styles.bubble}>
        <View style={styles.header}>
          <Text style={styles.name}>{commentUser.name}</Text>
          <Text style={styles.time}>{formatTime(comment.created_at)}</Text>
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={14} color={Colors.dark.like} />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.message}>{comment.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.dark.borderLight,
  },
  bubble: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: Typography.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.dark.text,
    flex: 1,
  },
  time: {
    fontSize: Typography.xs,
    color: Colors.dark.textMuted,
  },
  deleteBtn: {
    padding: 2,
  },
  message: {
    fontSize: Typography.sm,
    color: Colors.dark.text,
    lineHeight: 20,
  },
});
