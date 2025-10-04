import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
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
  colors: ReturnType<typeof DesignSystem.getThemeColors>;
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
  const { theme, effectiveTheme, setTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = DesignSystem.getThemeColors(isDark);

  const [syncEnabled, setSyncEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleThemeChange = (value: boolean) => {
    setTheme(value ? 'dark' : 'light');
  };
  
  const handleSystemTheme = () => {
    setTheme('system');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You\'ll need your credentials to sign back in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => router.replace('/auth'),
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your notes will be exported to IPFS and you\'ll receive a shareable hash.',
      [{ text: 'OK' }]
    );
  };

  const handleBackup = () => {
    Alert.alert(
      'Backup Notes',
      'Your notes will be securely backed up to your connected wallet.',
      [{ text: 'OK' }]
    );
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
                    false: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                    true: colors.text.primary,
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>SYNC & STORAGE</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="icloud"
              title="Auto Sync"
              subtitle="Automatically sync notes to IPFS"
              colors={colors}
              rightElement={
                <Switch
                  value={syncEnabled}
                  onValueChange={setSyncEnabled}
                  trackColor={{
                    false: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                    true: colors.text.primary,
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon="square.and.arrow.up"
              title="Export Data"
              subtitle="Export all notes to IPFS"
              colors={colors}
              onPress={handleExportData}
            />
            <SettingItem
              icon="shield"
              title="Backup Notes"
              subtitle="Backup to connected wallet"
              colors={colors}
              onPress={handleBackup}
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
                    false: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                    true: colors.text.primary,
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'}
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
              <Text style={[styles.signOutText, { color: DesignSystem.Colors.semantic.error }]}>Sign Out</Text>
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
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingTop: DesignSystem.Spacing.lg,
    paddingBottom: DesignSystem.Spacing.xl,
  },
  backButton: {
    padding: DesignSystem.Spacing.xs,
  },
  headerTitle: {
    fontSize: DesignSystem.Typography.sizes['3xl'],
    fontFamily: DesignSystem.Typography.fonts.bold,
    lineHeight: DesignSystem.Typography.sizes['3xl'] * DesignSystem.Typography.lineHeights.tight,
    letterSpacing: -0.5,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: DesignSystem.Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: DesignSystem.Typography.sizes.xs,
    fontFamily: DesignSystem.Typography.fonts.semibold,
    paddingHorizontal: DesignSystem.Spacing.xl,
    marginBottom: DesignSystem.Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    marginHorizontal: DesignSystem.Spacing.xl,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: DesignSystem.Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: DesignSystem.Spacing.base,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: DesignSystem.Typography.sizes.base,
    fontFamily: DesignSystem.Typography.fonts.medium,
    lineHeight: DesignSystem.Typography.sizes.base * DesignSystem.Typography.lineHeights.tight,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: DesignSystem.Typography.sizes.sm,
    fontFamily: DesignSystem.Typography.fonts.primary,
    lineHeight: DesignSystem.Typography.sizes.sm * DesignSystem.Typography.lineHeights.normal,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.md,
  },
  signOutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing.base,
  },
  signOutText: {
    fontSize: DesignSystem.Typography.sizes.base,
    fontFamily: DesignSystem.Typography.fonts.medium,
  },
  bottomSpacing: {
    height: DesignSystem.Spacing['4xl'],
  },
});