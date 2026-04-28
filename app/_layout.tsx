import { DarkTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthProvider, useAuth } from '@/hooks/use-auth';

/** Override DarkTheme so React Navigation's own background matches our app. */
const AppTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0D0D0D',
    card: '#0D0D0D',
    border: '#30363D',
    primary: '#4F8EF7',
  },
};

function RootLayoutInner() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  // Show a loading splash while hydrating token from AsyncStorage
  if (isLoading) {
    return (
      <View style={loadStyles.container}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  const inAuthGroup = segments[0] === '(auth)';

  // Redirect logic using the <Redirect> component (recommended by expo-router)
  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }
  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ThemeProvider value={AppTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0D0D0D' },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="post/create"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="post/[id]" />
        <Stack.Screen name="user/[id]" />
      </Stack>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
    </ThemeProvider>
  );
}

const loadStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutInner />
    </AuthProvider>
  );
}
