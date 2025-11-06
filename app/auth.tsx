import { IconSymbol } from '@/components/ui/IconSymbol';
import { BorderRadius, Components, createTextStyle, Shadows, Spacing, Typography } from '@/constants/DesignSystem';
import { useStorage } from '@/contexts/StorageContext';
import type { StorageBackendType } from '@/types/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AuthMethod = StorageBackendType;

export default function AuthScreen() {
  const { signIn, savedBackendType, needsCredentials } = useStorage();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('local');

  // Renterd fields
  const [renterdHost, setRenterdHost] = useState('');
  const [renterdPassword, setRenterdPassword] = useState('');

  // IPFS fields (for future) - commented out until implemented
  // const [ipfsNode, setIpfsNode] = useState('');
  // const [ipfsApiKey, setIpfsApiKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  // Set active method based on saved backend type
  React.useEffect(() => {
    if (savedBackendType) {
      setActiveMethod(savedBackendType);
    }
  }, [savedBackendType]);

  // Load saved host for Renterd if exists
  React.useEffect(() => {
    const loadSavedConfig = async () => {
      if (needsCredentials && savedBackendType === 'renterd') {
        const configJson = await AsyncStorage.getItem('@decanotes:backend_config');
        if (configJson) {
          try {
            const config = JSON.parse(configJson);
            if (config.host) {
              setRenterdHost(config.host);
            }
          } catch (e) {
            console.error('Failed to load saved config:', e);
          }
        }
      }
    };
    loadSavedConfig();
  }, [needsCredentials, savedBackendType]);

  const handleLocalStorageAuth = async () => {
    setIsLoading(true);
    try {
      await signIn('local', { type: 'local' });
      router.replace('/');
    } catch (error) {
      console.error('Local storage auth failed:', error);
      Alert.alert('Error', 'Failed to initialize local storage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenterdAuth = async () => {
    if (!renterdHost.trim() || !renterdPassword.trim()) {
      Alert.alert('Error', 'Please enter both host and password');
      return;
    }

    setIsLoading(true);
    try {
      await signIn('renterd', {
        type: 'renterd',
        host: renterdHost,
        password: renterdPassword,
      });
      router.replace('/');
    } catch (error) {
      console.error('Renterd auth failed:', error);
      Alert.alert('Error', 'Failed to connect to Renterd. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // IPFS handler - commented out until implemented
  // const handleIpfsAuth = async () => {
  //   Alert.alert('Coming Soon', 'IPFS backend will be available soon!');
  // };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={['#8B5FBF', '#4FC3E7']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.appTitle}>DecaNotes</Text>
            <Text style={styles.subtitle}>
              {needsCredentials ? 'Enter your credentials' : 'Secure, decentralized note-taking'}
            </Text>
            {needsCredentials && savedBackendType && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>Using {savedBackendType === 'renterd' ? 'Sia Renterd' : 'Local Storage'}</Text>
              </View>
            )}
          </View>

          <View style={styles.authContainer}>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[styles.methodButton, activeMethod === 'local' && styles.activeMethodButton]}
                onPress={() => setActiveMethod('local')}
              >
                <IconSymbol
                  name={'folder.fill' as any}
                  size={18}
                  color={activeMethod === 'local' ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[styles.methodText, activeMethod === 'local' && styles.activeMethodText]}>
                  Local{'\n'}Storage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.methodButton, activeMethod === 'renterd' && styles.activeMethodButton]}
                onPress={() => setActiveMethod('renterd')}
              >
                <IconSymbol
                  name={'network' as any}
                  size={18}
                  color={activeMethod === 'renterd' ? '#FFFFFF' : '#6B7280'}
                />
                <Text style={[styles.methodText, activeMethod === 'renterd' && styles.activeMethodText]}>
                  Sia{'\n'}Renterd
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {activeMethod === 'local' ? (
                <>
                  <Text style={styles.helperText}>
                    Store your notes locally on this device. Your notes will be saved securely on your device only.
                  </Text>

                  <TouchableOpacity
                    style={[styles.authButton, isLoading && styles.disabledButton]}
                    onPress={handleLocalStorageAuth}
                    disabled={isLoading}
                  >
                    <Text style={styles.authButtonText}>{isLoading ? 'Initializing...' : 'Use Local Storage'}</Text>
                  </TouchableOpacity>
                </>
              ) : activeMethod === 'renterd' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Renterd Host</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="https://renterd.example.com"
                      placeholderTextColor="#9CA3AF"
                      value={renterdHost}
                      onChangeText={setRenterdHost}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Your Renterd password"
                      placeholderTextColor="#9CA3AF"
                      value={renterdPassword}
                      onChangeText={setRenterdPassword}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.helperText}>
                    Connect to your Sia Renterd instance to store notes on the decentralized Sia network.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      (!renterdHost.trim() || !renterdPassword.trim() || isLoading) && styles.disabledButton,
                    ]}
                    onPress={handleRenterdAuth}
                    disabled={!renterdHost.trim() || !renterdPassword.trim() || isLoading}
                  >
                    <Text style={styles.authButtonText}>{isLoading ? 'Connecting...' : 'Connect to Renterd'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.helperText}>
                    IPFS backend will be available soon! Connect to IPFS for decentralized storage.
                  </Text>

                  <TouchableOpacity style={[styles.authButton, styles.disabledButton]} disabled>
                    <Text style={styles.authButtonText}>Coming Soon</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Your keys, your notes. Fully decentralized.</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  appTitle: {
    ...createTextStyle('5xl', 'bold', '#FFFFFF'),
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...createTextStyle('lg', 'primary', '#FFFFFF'),
    opacity: 0.9,
    textAlign: 'center',
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    ...Shadows.xl,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
    backgroundColor: '#FAFAFA',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    gap: Spacing.xs,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    position: 'relative',
    minHeight: 60,
  },
  methodButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  disabledMethodButton: {
    opacity: 0.6,
  },
  activeMethodButton: {
    backgroundColor: '#1A1A1A',
  },
  methodText: {
    ...createTextStyle('xs', 'medium'),
    marginTop: Spacing.xs,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 14,
  },
  activeMethodText: {
    color: '#FFFFFF',
  },
  formContainer: {
    gap: Spacing.lg,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  inputLabel: {
    ...createTextStyle('md', 'semibold'),
  },
  textInput: {
    ...Components.input.default,
    minHeight: 48,
  },
  helperText: {
    ...createTextStyle('sm', 'primary'),
    textAlign: 'center',
    lineHeight: Typography.sizes.sm * Typography.lineHeights.relaxed,
  },
  authButton: {
    ...Components.button.primary,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  authButtonText: {
    ...createTextStyle('md', 'semibold', '#FFFFFF'),
  },
  footer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    ...createTextStyle('sm', 'primary', '#FFFFFF'),
    opacity: 0.8,
    textAlign: 'center',
  },
  infoBox: {
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    ...createTextStyle('sm', 'medium', '#FFFFFF'),
    textAlign: 'center',
  },
});
