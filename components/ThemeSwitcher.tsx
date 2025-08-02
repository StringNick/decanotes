import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getThemeColors } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ThemeSwitcher() {
  const { effectiveTheme, setTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(isDark);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background.secondary,
        borderColor: colors.neutral.gray200,
      }
    ]}>
      <IconSymbol
        name="paintbrush.pointed.fill"
        size={14}
        color={colors.text.tertiary}
      />
      <Text style={[styles.label, { color: colors.text.secondary }]}>
        Theme
      </Text>
      <TouchableOpacity
        style={[
          styles.switcher,
          { 
            backgroundColor: isDark ? DesignSystem.Colors.primary.teal : colors.neutral.gray300,
          }
        ]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <View style={[
          styles.thumb,
          {
            backgroundColor: colors.background.primary,
            transform: [{ translateX: isDark ? 20 : 2 }],
          }
        ]}>
          <IconSymbol
            name={isDark ? 'moon.fill' : 'sun.max.fill'}
            size={10}
            color={isDark ? DesignSystem.Colors.primary.teal : '#FF8C00'}
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.currentTheme, { color: colors.text.tertiary }]}>
        {isDark ? 'Dark' : 'Light'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.xl,
    gap: DesignSystem.Spacing.sm,
    alignSelf: 'flex-start',
    margin: DesignSystem.Spacing.base,
    borderWidth: 1,
    ...DesignSystem.Shadows.sm,
  },
  label: {
    ...DesignSystem.createTextStyle('xs', 'semibold'),
  },
  switcher: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 1,
    justifyContent: 'center',
    ...DesignSystem.Shadows.sm,
  },
  thumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignSystem.Shadows.sm,
  },
  currentTheme: {
    ...DesignSystem.createTextStyle('xs', 'medium'),
    minWidth: 32,
  },
});

export default ThemeSwitcher;