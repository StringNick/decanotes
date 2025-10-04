import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = DesignSystem.getThemeColors(isDark);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#FFFFFF' : DesignSystem.Colors.primary.dark,
        tabBarInactiveTintColor: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 88,
          paddingHorizontal: DesignSystem.Spacing.lg,
          paddingTop: DesignSystem.Spacing.md,
          paddingBottom: DesignSystem.Spacing.xl,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.1)',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={isDark 
                ? ['rgba(0, 0, 0, 0.0)', 'rgba(0, 0, 0, 0.95)']
                : ['rgba(255, 255, 255, 0.0)', 'rgba(255, 255, 255, 0.95)']
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <BlurView
              intensity={isDark ? 60 : 80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[
              StyleSheet.absoluteFill, 
              { 
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: isDark 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.08)',
              }
            ]} />
          </View>
        ),
        tabBarItemStyle: {
          paddingVertical: DesignSystem.Spacing.sm,
          borderRadius: DesignSystem.BorderRadius.xl,
          marginHorizontal: DesignSystem.Spacing.xs,
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          height: 48,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { 
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.06)' 
              }]
            ]}>
              <IconSymbol 
                size={24} 
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
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && [styles.activeIconContainer, { 
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.06)' 
              }]
            ]}>
              <IconSymbol 
                size={24} 
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
    width: 44,
    height: 44,
    borderRadius: DesignSystem.BorderRadius.xl,
  },
  activeIconContainer: {
    transform: [{ scale: 1.02 }],
  },
});
