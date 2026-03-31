import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';

export const unstable_settings = {
  anchor: '(drawer)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useAuthStore((state) => state.hydrate);
  const [loaded] = useFonts({
    'Geist-Regular': require('@/assets/fonts/Geist-Regular.ttf'),
    'Geist-Medium': require('@/assets/fonts/Geist-Medium.ttf'),
    'Geist-SemiBold': require('@/assets/fonts/Geist-SemiBold.ttf'),
    'Geist-Bold': require('@/assets/fonts/Geist-Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      const textDefaults = (Text as typeof Text & { defaultProps?: { style?: unknown } })
        .defaultProps ?? { style: {} };
      const inputDefaults = (
        TextInput as typeof TextInput & { defaultProps?: { style?: unknown } }
      ).defaultProps ?? { style: {} };

      Text.defaultProps = {
        ...textDefaults,
        style: [{ fontFamily: 'Geist-Regular' }, textDefaults.style],
      };
      TextInput.defaultProps = {
        ...inputDefaults,
        style: [{ fontFamily: 'Geist-Regular' }, inputDefaults.style],
      };

      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(drawer)" options={{ headerShown: false }} />
        <Stack.Screen name="(stack)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
