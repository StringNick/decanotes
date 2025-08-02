import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getThemeColors } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: DesignSystem.Colors.primary.teal,
        tabBarInactiveTintColor: colors.text.tertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          position: 'absolute',
          bottom: DesignSystem.Spacing['2xl'],
          left: '20%',
          right: '20%',
          height: 60,
          paddingHorizontal: DesignSystem.Spacing.xs,
          paddingVertical: DesignSystem.Spacing.xs,
          borderTopWidth: 0,
          ...DesignSystem.Shadows.xl,
          borderRadius: DesignSystem.BorderRadius.full,
          overflow: 'hidden',
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {isDark ? (
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.95)', 'rgba(10, 10, 10, 0.95)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            ) : (
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(250, 250, 250, 0.95)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}
            <BlurView
              intensity={isDark ? 30 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[
              StyleSheet.absoluteFill, 
              { 
                borderRadius: DesignSystem.BorderRadius.full,
                borderWidth: isDark ? 1 : 0.5,
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            ]} />
          </View>
        ),
        tabBarLabelStyle: {
          fontFamily: DesignSystem.Typography.fonts.semibold,
          fontSize: DesignSystem.Typography.sizes.xs,
          marginTop: 4,
          letterSpacing: DesignSystem.Typography.letterSpacing.wide,
        },
        tabBarItemStyle: {
          paddingVertical: DesignSystem.Spacing.sm,
          borderRadius: DesignSystem.BorderRadius.full,
          marginHorizontal: DesignSystem.Spacing.xs,
          flex: 1,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && styles.activeIconContainer
            ]}>
              <IconSymbol 
                size={focused ? 22 : 20} 
                name={focused ? "doc.text.fill" : "doc.text"} 
                color={color} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && styles.activeIconContainer
            ]}>
              <IconSymbol 
                size={focused ? 22 : 20} 
                name={focused ? "sparkles" : "sparkles"} 
                color={color} 
              />
            </View>
          ),
        }}
      />
     </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing.xs,
    paddingHorizontal: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.full,
    minHeight: 40,
    minWidth: 40,
  },
  activeIconContainer: {
    backgroundColor: DesignSystem.Colors.primary.teal + '20',
    ...DesignSystem.Shadows.colored(DesignSystem.Colors.primary.teal, 0.3),
    transform: [{ scale: 1.1 }],
  },
});
