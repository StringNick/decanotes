import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getThemeColors } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface NoteCardProps {
  id: string;
  title: string;
  preview: string;
  lastModified: Date;
  color?: keyof typeof DesignSystem.Colors.notes.light;
  onPress: () => void;
  onOptionsPress?: () => void;
}

export function NoteCard({
  id,
  title,
  preview,
  lastModified,
  color = 'default',
  onPress,
  onOptionsPress,
}: NoteCardProps) {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = getThemeColors(isDark);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Minimal background - just slightly different from main bg
  const getCardBackgroundColor = () => {
    if (color === 'default') {
      return isDark 
        ? 'rgba(255, 255, 255, 0.03)' 
        : 'rgba(0, 0, 0, 0.02)';
    }
    return isDark 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.03)';
  };
  
  // Animation handlers
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: DesignSystem.Animations.scale.press,
        ...DesignSystem.Animations.spring.gentle,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.9,
        duration: DesignSystem.Animations.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...DesignSystem.Animations.spring.bouncy,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: DesignSystem.Animations.timing.fast,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View 
      style={[
        styles.animatedContainer,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: getCardBackgroundColor(),
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text 
                style={[styles.title, { color: colors.text.primary }]} 
                numberOfLines={1}
              >
                {title || 'Untitled Note'}
              </Text>
              <Text style={[styles.date, { color: colors.text.tertiary }]}>
                {formatDate(lastModified)}
              </Text>
            </View>
            {onOptionsPress && (
              <TouchableOpacity
                onPress={onOptionsPress}
                style={styles.optionsButton}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <IconSymbol
                  name="ellipsis"
                  size={16}
                  color={colors.text.tertiary}
                />
              </TouchableOpacity>
            )}
          </View>
          
          <Text 
            style={[styles.preview, { color: colors.text.secondary }]} 
            numberOfLines={3}
          >
            {preview || 'Start writing...'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedContainer: {
    marginBottom: DesignSystem.Spacing.md,
  },
  pressable: {
    borderRadius: DesignSystem.BorderRadius.xl,
  },
  container: {
    borderRadius: DesignSystem.BorderRadius.xl,
    padding: DesignSystem.Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.Spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: DesignSystem.Spacing.md,
  },
  title: {
    fontSize: DesignSystem.Typography.sizes.lg,
    fontFamily: DesignSystem.Typography.fonts.semibold,
    lineHeight: DesignSystem.Typography.sizes.lg * DesignSystem.Typography.lineHeights.tight,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: DesignSystem.Typography.sizes.xs,
    fontFamily: DesignSystem.Typography.fonts.medium,
    lineHeight: DesignSystem.Typography.sizes.xs * DesignSystem.Typography.lineHeights.normal,
  },
  preview: {
    fontSize: DesignSystem.Typography.sizes.base,
    fontFamily: DesignSystem.Typography.fonts.primary,
    lineHeight: DesignSystem.Typography.sizes.base * DesignSystem.Typography.lineHeights.relaxed,
    opacity: 0.7,
  },
  optionsButton: {
    padding: 4,
  },
});

export default NoteCard;