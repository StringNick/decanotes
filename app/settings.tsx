import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem } from '@/constants/DesignSystem';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = true,
}: SettingItemProps) {
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <IconSymbol
            name={icon}
            size={20}
            color={DesignSystem.Colors.primary.teal}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && onPress && (
          <IconSymbol
            name="chevron.right"
            size={16}
            color={DesignSystem.Colors.text.tertiary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <IconSymbol
            name="chevron.left"
            size={24}
            color={DesignSystem.Colors.text.primary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="moon.fill"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{
                    false: DesignSystem.Colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={DesignSystem.Colors.background.primary}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync & Storage</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="icloud.fill"
              title="Auto Sync"
              subtitle="Automatically sync notes to IPFS"
              rightElement={
                <Switch
                  value={syncEnabled}
                  onValueChange={setSyncEnabled}
                  trackColor={{
                    false: DesignSystem.Colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={DesignSystem.Colors.background.primary}
                />
              }
              showChevron={false}
            />
            <SettingItem
              icon="square.and.arrow.up"
              title="Export Data"
              subtitle="Export all notes to IPFS"
              onPress={handleExportData}
            />
            <SettingItem
              icon="shield.fill"
              title="Backup Notes"
              subtitle="Backup to connected wallet"
              onPress={handleBackup}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="bell.fill"
              title="Push Notifications"
              subtitle="Get notified about sync status"
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: DesignSystem.Colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={DesignSystem.Colors.background.primary}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="info.circle.fill"
              title="App Version"
              subtitle="1.0.0"
              showChevron={false}
            />
            <SettingItem
              icon="questionmark.circle.fill"
              title="Help & Support"
              onPress={() => Alert.alert('Help', 'Visit our documentation for help.')}
            />
            <SettingItem
              icon="doc.text.fill"
              title="Privacy Policy"
              onPress={() => Alert.alert('Privacy', 'Your data is stored locally and on IPFS.')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <IconSymbol
                name="power"
                size={20}
                color={DesignSystem.Colors.semantic.error}
              />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingTop: DesignSystem.Spacing.xl,
    paddingBottom: DesignSystem.Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.Colors.neutral.gray100,
  },
  backButton: {
    padding: DesignSystem.Spacing.sm,
  },
  headerTitle: {
    ...DesignSystem.createTextStyle('xl', 'semibold'),
  },
  placeholder: {
    width: 40, // Same as back button for centering
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: DesignSystem.Spacing.xl,
  },
  sectionTitle: {
    ...DesignSystem.createTextStyle('md', 'semibold', DesignSystem.Colors.text.secondary),
    paddingHorizontal: DesignSystem.Spacing.base,
    marginBottom: DesignSystem.Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: DesignSystem.Typography.letterSpacing.wide,
  },
  sectionContent: {
    backgroundColor: DesignSystem.Colors.background.primary,
    marginHorizontal: DesignSystem.Spacing.base,
    borderRadius: DesignSystem.BorderRadius.xl,
    ...DesignSystem.Shadows.sm,
    borderWidth: 1,
    borderColor: DesignSystem.Colors.neutral.gray100,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: DesignSystem.Colors.neutral.gray100,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: DesignSystem.BorderRadius.md,
    backgroundColor: DesignSystem.Colors.primary.teal + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    ...DesignSystem.createTextStyle('md', 'medium'),
  },
  settingSubtitle: {
    ...DesignSystem.createTextStyle('sm', 'primary', DesignSystem.Colors.text.secondary),
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing.base,
    gap: DesignSystem.Spacing.sm,
  },
  signOutText: {
    ...DesignSystem.createTextStyle('md', 'semibold', DesignSystem.Colors.semantic.error),
  },
  bottomSpacing: {
    height: DesignSystem.Spacing['6xl'],
  },
});