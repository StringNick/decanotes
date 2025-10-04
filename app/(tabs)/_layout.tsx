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
          bottom: DesignSystem.Spacing['3xl'],
          left: '25%',
          right: '25%',
          height: 64,
          paddingHorizontal: DesignSystem.Spacing.sm,
          paddingVertical: DesignSystem.Spacing.sm,
          borderTopWidth: 0,
          borderRadius: DesignSystem.BorderRadius['2xl'],
          overflow: 'hidden',
          backgroundColor: 'transparent',
          shadowColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.15)',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 1,
          shadowRadius: 24,
          elevation: 12,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={isDark 
                ? ['rgba(20, 20, 20, 0.95)', 'rgba(10, 10, 10, 0.98)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.98)']
              }
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <BlurView
              intensity={isDark ? 40 : 100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
            <View style={[
              StyleSheet.absoluteFill, 
              { 
                borderRadius: DesignSystem.BorderRadius['2xl'],
                borderWidth: isDark ? 0.5 : 0.5,
                borderColor: isDark 
                  ? 'rgba(255, 255, 255, 0.08)' 
                  : 'rgba(0, 0, 0, 0.06)',
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
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.iconContainer,
              focused && styles.activeIconContainer
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
    width: 48,
    height: 48,
    borderRadius: DesignSystem.BorderRadius.xl,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(26, 26, 26, 0.08)',
    transform: [{ scale: 1.05 }],
  },
});
