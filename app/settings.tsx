import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
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
  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        {
          borderBottomColor: colors.neutral.gray200,
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: DesignSystem.Colors.primary.teal + '20' }
        ]}>
          <IconSymbol
            name={icon}
            size={20}
            color={DesignSystem.Colors.primary.teal}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{title}</Text>
          {subtitle && <Text style={[styles.settingSubtitle, { color: colors.text.secondary }]}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightElement}
        {showChevron && onPress && (
          <IconSymbol
            name="chevron.right"
            size={16}
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
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <View style={[
        styles.header,
        {
          borderBottomColor: colors.neutral.gray200,
        }
      ]}>
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
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Appearance</Text>
          <View style={[
            styles.sectionContent,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.neutral.gray200,
            }
          ]}>
            <SettingItem
              icon="moon.fill"
              title="Dark Mode"
              subtitle="Toggle dark theme"
              colors={colors}
              rightElement={
                <Switch
                  value={isDark}
                  onValueChange={handleThemeChange}
                  trackColor={{
                    false: colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={colors.background.primary}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Sync & Storage</Text>
          <View style={[
            styles.sectionContent,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.neutral.gray200,
            }
          ]}>
            <SettingItem
              icon="icloud.fill"
              title="Auto Sync"
              subtitle="Automatically sync notes to IPFS"
              colors={colors}
              rightElement={
                <Switch
                  value={syncEnabled}
                  onValueChange={setSyncEnabled}
                  trackColor={{
                    false: colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={colors.background.primary}
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
              icon="shield.fill"
              title="Backup Notes"
              subtitle="Backup to connected wallet"
              colors={colors}
              onPress={handleBackup}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>Notifications</Text>
          <View style={[
            styles.sectionContent,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.neutral.gray200,
            }
          ]}>
            <SettingItem
              icon="bell.fill"
              title="Push Notifications"
              subtitle="Get notified about sync status"
              colors={colors}
              rightElement={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: colors.neutral.gray300,
                    true: DesignSystem.Colors.primary.teal,
                  }}
                  thumbColor={colors.background.primary}
                />
              }
              showChevron={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>About</Text>
          <View style={[
            styles.sectionContent,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.neutral.gray200,
            }
          ]}>
            <SettingItem
              icon="info.circle.fill"
              title="App Version"
              subtitle="1.0.0"
              colors={colors}
              showChevron={false}
            />
            <SettingItem
              icon="questionmark.circle.fill"
              title="Help & Support"
              colors={colors}
              onPress={() => Alert.alert('Help', 'Visit our documentation for help.')}
            />
            <SettingItem
              icon="doc.text.fill"
              title="Privacy Policy"
              colors={colors}
              onPress={() => Alert.alert('Privacy', 'Your data is stored locally and on IPFS.')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={[
            styles.sectionContent,
            {
              backgroundColor: colors.background.primary,
              borderColor: colors.neutral.gray200,
            }
          ]}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <IconSymbol
                name="power"
                size={20}
                color={DesignSystem.Colors.semantic.error}
              />
              <Text style={[styles.signOutText, { color: DesignSystem.Colors.semantic.error }]}>Sign Out</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingTop: DesignSystem.Spacing.xl,
    paddingBottom: DesignSystem.Spacing.base,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: DesignSystem.Spacing.sm,
  },
  headerTitle: {
    fontSize: DesignSystem.Typography.sizes.xl,
    fontFamily: DesignSystem.Typography.fonts.semibold,
    lineHeight: DesignSystem.Typography.sizes.xl * DesignSystem.Typography.lineHeights.normal,
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
    fontSize: DesignSystem.Typography.sizes.md,
    fontFamily: DesignSystem.Typography.fonts.semibold,
    paddingHorizontal: DesignSystem.Spacing.base,
    marginBottom: DesignSystem.Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: DesignSystem.Typography.letterSpacing.wide,
  },
  sectionContent: {
    marginHorizontal: DesignSystem.Spacing.base,
    borderRadius: DesignSystem.BorderRadius.xl,
    ...DesignSystem.Shadows.sm,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: DesignSystem.Typography.sizes.md,
    fontFamily: DesignSystem.Typography.fonts.medium,
    lineHeight: DesignSystem.Typography.sizes.md * DesignSystem.Typography.lineHeights.normal,
  },
  settingSubtitle: {
    fontSize: DesignSystem.Typography.sizes.sm,
    fontFamily: DesignSystem.Typography.fonts.primary,
    lineHeight: DesignSystem.Typography.sizes.sm * DesignSystem.Typography.lineHeights.normal,
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
    fontSize: DesignSystem.Typography.sizes.md,
    fontFamily: DesignSystem.Typography.fonts.semibold,
  },
  bottomSpacing: {
    height: DesignSystem.Spacing['6xl'],
  },
});