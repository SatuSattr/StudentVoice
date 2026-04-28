import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Typography, FontWeight } from '@/constants/theme';
import { BASE_URL } from '@/services/api';

interface UserAvatarProps {
  name: string;
  profilePicture?: string | null;
  size?: number;
  onPress?: () => void;
}

export function UserAvatar({
  name,
  profilePicture,
  size = 40,
  onPress,
}: UserAvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Generate a consistent hue from name
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  const imageUri = profilePicture
    ? profilePicture.startsWith('http')
      ? profilePicture
      : `${BASE_URL}/storage/${profilePicture}`
    : null;

  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container onPress={onPress} activeOpacity={0.8}>
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.avatar,
            { width: size, height: size, borderRadius: size / 2 },
          ]}
        />
      ) : (
        <View
          style={[
            styles.initialsContainer,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: `hsl(${hue}, 55%, 35%)`,
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: size * 0.38, color: '#fff' },
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: Colors.dark.surface,
  },
  initialsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: FontWeight.bold,
  },
});
