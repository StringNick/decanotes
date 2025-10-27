import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import { getThemeColors, Colors, Spacing, Typography } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { useStorage } from '@/contexts/StorageContext';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SettingItemProps {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  colors: ReturnType<typeof getThemeColors>;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
  colors,
}: SettingItemProps) {
  const isDark = colors.background.primary === '#000000';
  
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          borderBottomColor: isDark 
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(0, 0, 0, 0.05)',
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <IconSymbol
          name={icon}
          size={20}
          color={colors.text.tertiary}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.text.tertiary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && onPress && (
          <IconSymbol
            name="chevron.right"
            size={14}
            color={colors.text.tertiary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { effectiveTheme, setTheme } = useTheme();
  const { authState, signOut, sync } = useStorage();
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(isDark);

  // Sync and notification state (reserved for future features)
  // const [syncEnabled, setSyncEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };

  // System theme handler (reserved for future feature)
  // const handleSystemTheme = () => {
  //   setTheme('system');
  // };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out failed:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await sync();
      Alert.alert('Success', 'Notes synced successfully!');
    } catch (error) {
      console.error('Sync failed:', error);
      Alert.alert('Error', 'Failed to sync notes.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export functionality will be available soon.',
      [{ text: 'OK' }]
    );
  };

  const getBackendDisplayName = () => {
    switch (authState.backendType) {
      case 'local':
        return 'Local Storage';
      case 'renterd':
        return 'Sia Renterd';
      case 'ipfs':
        return 'IPFS';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>APPEARANCE</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="moon"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              colors={colors}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleThemeChange}
                  trackColor={{
                    false: isDark ? Colors.neutral.gray700 : Colors.neutral.gray300,
                    true: Colors.primary.purple,
                  }}
                  thumbColor={isDark ? Colors.neutral.white : Colors.neutral.white}
                  ios_backgroundColor={isDark ? Colors.neutral.gray700 : Colors.neutral.gray300}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>STORAGE BACKEND</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="server.rack"
              title="Current Backend"
              subtitle={getBackendDisplayName()}
              colors={colors}
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>SYNC & STORAGE</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="arrow.clockwise"
              title="Sync Now"
              subtitle={isSyncing ? "Syncing..." : "Manually sync your notes"}
              colors={colors}
              onPress={isSyncing ? undefined : handleSyncNow}
            />
            <SettingItem
              icon="square.and.arrow.up"
              title="Export Data"
              subtitle="Export all notes"
              colors={colors}
              onPress={handleExportData}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>NOTIFICATIONS</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="bell"
              title="Push Notifications"
              subtitle="Get notified about sync status"
              colors={colors}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: isDark ? Colors.neutral.gray700 : Colors.neutral.gray300,
                    true: Colors.primary.blue,
                  }}
                  thumbColor={isDark ? Colors.neutral.white : Colors.neutral.white}
                  ios_backgroundColor={isDark ? Colors.neutral.gray700 : Colors.neutral.gray300}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>ABOUT</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="info.circle"
              title="App Version"
              subtitle="1.0.0"
              colors={colors}
              showChevron={false}
            />
            <SettingItem
              icon="questionmark.circle"
              title="Help & Support"
              colors={colors}
              onPress={() => Alert.alert('Help', 'Visit our documentation for help.')}
            />
            <SettingItem
              icon="doc.text"
              title="Privacy Policy"
              colors={colors}
              onPress={() => Alert.alert('Privacy', 'Your data is stored locally and on IPFS.')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Text style={[styles.signOutText, { color: Colors.semantic.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.sizes['3xl'],
    fontFamily: Typography.fonts.bold,
    lineHeight: Typography.sizes['3xl'] * Typography.lineHeights.tight,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.sizes.xs,
    fontFamily: Typography.fonts.semibold,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    marginHorizontal: Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fonts.medium,
    lineHeight: Typography.sizes.base * Typography.lineHeights.tight,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Typography.sizes.sm,
    fontFamily: Typography.fonts.primary,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.base,
  },
  signOutText: {
    fontSize: Typography.sizes.base,
    fontFamily: Typography.fonts.medium,
  },
  bottomSpacing: {
    height: Spacing['4xl'],
  },
});