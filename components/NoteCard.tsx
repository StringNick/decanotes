import { IconSymbol } from '@/components/ui/IconSymbol';
import { DesignSystem, getThemeColors } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import React from 'react';
import {
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

  // Get note background color based on theme
  const getNoteBackgroundColor = () => {
    return (colors.notes as any)[color] || colors.notes.default;
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: getNoteBackgroundColor(),
          borderColor: isDark ? colors.neutral.gray700 : colors.neutral.gray200,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={1}>
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
      
      <Text style={[styles.preview, { color: colors.text.secondary }]} numberOfLines={3}>
        {preview || 'Start writing...'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignSystem.BorderRadius['2xl'],
    padding: DesignSystem.Spacing.xl,
    marginBottom: DesignSystem.Spacing.lg,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
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
    letterSpacing: -0.2,
  },
  date: {
    fontSize: DesignSystem.Typography.sizes.xs,
    fontFamily: DesignSystem.Typography.fonts.medium,
    lineHeight: DesignSystem.Typography.sizes.xs * DesignSystem.Typography.lineHeights.normal,
    opacity: 0.7,
  },
  preview: {
    fontSize: DesignSystem.Typography.sizes.md,
    fontFamily: DesignSystem.Typography.fonts.primary,
    lineHeight: DesignSystem.Typography.sizes.md * DesignSystem.Typography.lineHeights.relaxed,
    opacity: 0.8,
  },
  optionsButton: {
    padding: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.lg,
    marginTop: -4,
  },
});

export default NoteCard;