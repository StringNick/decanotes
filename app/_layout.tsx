import { StorageProvider } from '@/contexts/StorageContext';
import { ThemeProvider as CustomThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
} from '@expo-google-fonts/albert-sans';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { NativeModules } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const hasKeyboardController = !!NativeModules.KeyboardControllerModule;

let KeyboardProviderComponent: React.ComponentType<{ children: React.ReactNode }>;
if (hasKeyboardController) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    KeyboardProviderComponent = require('react-native-keyboard-controller').KeyboardProvider;
  } catch {
    const FallbackProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    FallbackProvider.displayName = 'FallbackKeyboardProvider';
    KeyboardProviderComponent = FallbackProvider;
  }
} else {
  const NoOpProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
  NoOpProvider.displayName = 'NoOpKeyboardProvider';
  KeyboardProviderComponent = NoOpProvider;
}

const KeyboardProvider = KeyboardProviderComponent;

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    AlbertSans_400Regular,
    AlbertSans_500Medium,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <KeyboardProvider>
      <SafeAreaProvider>
        <StorageProvider>
          <CustomThemeProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="editor" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </CustomThemeProvider>
        </StorageProvider>
      </SafeAreaProvider>
    </KeyboardProvider>
  );
}
