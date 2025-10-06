import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { useStorage } from '@/contexts/StorageContext';
import type { StorageBackendType } from '@/types/storage';

type AuthMethod = StorageBackendType;

export default function AuthScreen() {
  const { signIn, savedBackendType, needsCredentials } = useStorage();
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('local');
  
  // Renterd fields
  const [renterdHost, setRenterdHost] = useState('');
  const [renterdPassword, setRenterdPassword] = useState('');
  
  // IPFS fields (for future)
  const [ipfsNode, setIpfsNode] = useState('');
  const [ipfsApiKey, setIpfsApiKey] = useState('');
  
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
        password: renterdPassword 
      });
      router.replace('/');
    } catch (error) {
      console.error('Renterd auth failed:', error);
      Alert.alert('Error', 'Failed to connect to Renterd. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleIpfsAuth = async () => {
    // IPFS not yet implemented
    Alert.alert('Coming Soon', 'IPFS backend will be available soon!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
                <Text style={styles.infoText}>
                  Using {savedBackendType === 'renterd' ? 'Sia Renterd' : 'IPFS'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.authContainer}>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  activeMethod === 'local' && styles.activeMethodButton,
                ]}
                onPress={() => setActiveMethod('local')}
              >
                <IconSymbol
                  name="folder.fill"
                  size={18}
                  color={
                    activeMethod === 'local'
                      ? '#FFFFFF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.methodText,
                    activeMethod === 'local' && styles.activeMethodText,
                  ]}
                >
                  Local{"\n"}Storage
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  activeMethod === 'renterd' && styles.activeMethodButton,
                ]}
                onPress={() => setActiveMethod('renterd')}
              >
                <IconSymbol
                  name="network"
                  size={18}
                  color={
                    activeMethod === 'renterd'
                      ? '#FFFFFF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.methodText,
                    activeMethod === 'renterd' && styles.activeMethodText,
                  ]}
                >
                  Sia{"\n"}Renterd
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  styles.disabledMethodButton,
                  activeMethod === 'ipfs' && styles.activeMethodButton,
                ]}
                onPress={() => setActiveMethod('ipfs')}
              >
                <View style={styles.methodButtonContent}>
                  <IconSymbol
                    name="globe"
                    size={18}
                    color={
                      activeMethod === 'ipfs'
                        ? '#FFFFFF'
                        : '#6B7280'
                    }
                  />
                  <Text
                    style={[
                      styles.methodText,
                      activeMethod === 'ipfs' && styles.activeMethodText,
                    ]}
                  >
                    IPFS
                  </Text>
                </View>
                <View style={styles.soonBadge}>
                  <Text style={styles.soonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {activeMethod === 'local' ? (
                <>
                  <Text style={styles.helperText}>
                    Store your notes locally on this device. Your notes will be
                    saved securely on your device only.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleLocalStorageAuth}
                    disabled={isLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading ? 'Initializing...' : 'Use Local Storage'}
                    </Text>
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
                    Connect to your Sia Renterd instance to store notes
                    on the decentralized Sia network.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      (!renterdHost.trim() || !renterdPassword.trim() || isLoading) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleRenterdAuth}
                    disabled={!renterdHost.trim() || !renterdPassword.trim() || isLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading ? 'Connecting...' : 'Connect to Renterd'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.helperText}>
                    IPFS backend will be available soon! Connect to IPFS
                    for decentralized storage.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      styles.disabledButton,
                    ]}
                    disabled
                  >
                    <Text style={styles.authButtonText}>
                      Coming Soon
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Your keys, your notes. Fully decentralized.
            </Text>
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
    padding: DesignSystem.Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignSystem.Spacing['4xl'],
  },
  appTitle: {
    ...DesignSystem.createTextStyle('5xl', 'bold', '#FFFFFF'),
    marginBottom: DesignSystem.Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...DesignSystem.createTextStyle('lg', 'primary', '#FFFFFF'),
    opacity: 0.9,
    textAlign: 'center',
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: DesignSystem.BorderRadius['2xl'],
    padding: DesignSystem.Spacing.xl,
    ...DesignSystem.Shadows.xl,
  },
  methodSelector: {
    flexDirection: 'row',
    marginBottom: DesignSystem.Spacing.xl,
    backgroundColor: '#FAFAFA',
    borderRadius: DesignSystem.BorderRadius.lg,
    padding: DesignSystem.Spacing.xs,
    gap: DesignSystem.Spacing.xs,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing.md,
    paddingHorizontal: DesignSystem.Spacing.xs,
    borderRadius: DesignSystem.BorderRadius.md,
    position: 'relative',
    minHeight: 60,
  },
  methodButtonContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignSystem.Spacing.xs,
  },
  disabledMethodButton: {
    opacity: 0.6,
  },
  activeMethodButton: {
    backgroundColor: '#1A1A1A',
  },
  methodText: {
    ...DesignSystem.createTextStyle('xs', 'medium'),
    marginTop: DesignSystem.Spacing.xs,
    textAlign: 'center',
    flexShrink: 1,
    lineHeight: 14,
  },
  activeMethodText: {
    color: '#FFFFFF',
  },
  formContainer: {
    gap: DesignSystem.Spacing.lg,
  },
  inputContainer: {
    gap: DesignSystem.Spacing.sm,
  },
  inputLabel: {
    ...DesignSystem.createTextStyle('md', 'semibold'),
  },
  textInput: {
    ...DesignSystem.Components.input.default,
    minHeight: 48,
  },
  helperText: {
    ...DesignSystem.createTextStyle('sm', 'primary'),
    textAlign: 'center',
    lineHeight: DesignSystem.Typography.sizes.sm * DesignSystem.Typography.lineHeights.relaxed,
  },
  authButton: {
    ...DesignSystem.Components.button.primary,
    alignItems: 'center',
    marginTop: DesignSystem.Spacing.md,
  },
  disabledButton: {
    opacity: 0.5,
  },
  authButtonText: {
    ...DesignSystem.createTextStyle('md', 'semibold', '#FFFFFF'),
  },
  footer: {
    alignItems: 'center',
    marginTop: DesignSystem.Spacing.xl,
  },
  footerText: {
    ...DesignSystem.createTextStyle('sm', 'primary', '#FFFFFF'),
    opacity: 0.8,
    textAlign: 'center',
  },
  soonBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FCD34D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: DesignSystem.BorderRadius.sm,
  },
  soonText: {
    ...DesignSystem.createTextStyle('xs', 'semibold', '#92400E'),
  },
  infoBox: {
    marginTop: DesignSystem.Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.md,
  },
  infoText: {
    ...DesignSystem.createTextStyle('sm', 'medium', '#FFFFFF'),
    textAlign: 'center',
  },
});
