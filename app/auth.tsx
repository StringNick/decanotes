import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
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

type AuthMethod = 'seed' | 'ipfs';

export default function AuthScreen() {
  const [activeMethod, setActiveMethod] = useState<AuthMethod>('seed');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [address, setAddress] = useState('');
  const [ipfsHash, setIpfsHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSeedAuth = async () => {
    if (!seedPhrase.trim() || !address.trim()) {
      Alert.alert('Error', 'Please enter both seed phrase and address');
      return;
    }

    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 1500);
  };

  const handleIpfsAuth = async () => {
    if (!ipfsHash.trim()) {
      Alert.alert('Error', 'Please enter IPFS hash');
      return;
    }

    setIsLoading(true);
    // Simulate IPFS authentication
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 1500);
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
              Secure, decentralized note-taking
            </Text>
          </View>

          <View style={styles.authContainer}>
            <View style={styles.methodSelector}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  activeMethod === 'seed' && styles.activeMethodButton,
                ]}
                onPress={() => setActiveMethod('seed')}
              >
                <IconSymbol
                  name="key.fill"
                  size={20}
                  color={
                    activeMethod === 'seed'
                      ? '#FFFFFF'
                      : '#6B7280'
                  }
                />
                <Text
                  style={[
                    styles.methodText,
                    activeMethod === 'seed' && styles.activeMethodText,
                  ]}
                >
                  Seed Phrase
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.methodButton,
                  activeMethod === 'ipfs' && styles.activeMethodButton,
                ]}
                onPress={() => setActiveMethod('ipfs')}
              >
                <IconSymbol
                  name="globe"
                  size={20}
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
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              {activeMethod === 'seed' ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Seed Phrase</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your 12-24 word seed phrase"
                      placeholderTextColor="#9CA3AF"
                      value={seedPhrase}
                      onChangeText={setSeedPhrase}
                      multiline
                      textAlignVertical="top"
                      numberOfLines={3}
                      secureTextEntry
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Wallet Address</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="0x..."
                      placeholderTextColor="#9CA3AF"
                      value={address}
                      onChangeText={setAddress}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      (!seedPhrase.trim() || !address.trim() || isLoading) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleSeedAuth}
                    disabled={!seedPhrase.trim() || !address.trim() || isLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading ? 'Authenticating...' : 'Connect Wallet'}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>IPFS Hash</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="QmXoYpizjW3WknFiJnKLwHCnL..."
                      placeholderTextColor="#9CA3AF"
                      value={ipfsHash}
                      onChangeText={setIpfsHash}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <Text style={styles.helperText}>
                    Connect using your IPFS identity hash to access your
                    decentralized notes.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.authButton,
                      (!ipfsHash.trim() || isLoading) && styles.disabledButton,
                    ]}
                    onPress={handleIpfsAuth}
                    disabled={!ipfsHash.trim() || isLoading}
                  >
                    <Text style={styles.authButtonText}>
                      {isLoading ? 'Connecting...' : 'Connect IPFS'}
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
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.md,
  },
  activeMethodButton: {
    backgroundColor: '#1A1A1A',
  },
  methodText: {
    ...DesignSystem.createTextStyle('md', 'medium'),
    marginLeft: DesignSystem.Spacing.sm,
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
});