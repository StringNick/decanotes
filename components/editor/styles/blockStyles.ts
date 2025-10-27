/**
 * BLOCK STYLING ARCHITECTURE
 *
 * This file defines the core styling system for all editor blocks.
 * The architecture ensures zero layout shifts and smooth animations.
 *
 * STRUCTURE:
 * All blocks follow this pattern:
 *
 * <Animated.View style={containerStyle}>  ← Handles: padding, margin, border
 *   <TextInput style={inputStyle} />       ← Handles: font, color, lineHeight ONLY
 * </Animated.View>
 *
 * CRITICAL RULES:
 * 1. Container handles ALL spacing: marginVertical, paddingLeft/Right/Vertical, borderLeft
 * 2. Input handles ONLY content styling: fontSize, lineHeight, color, fontWeight
 * 3. Input must have paddingHorizontal: 0 and paddingVertical: 0
 * 4. All containers use BLOCK_SPACING constants (never hardcode)
 * 5. Animated.View is used for smooth focus transitions (200ms)
 * 6. NEVER change padding/margin based on focus state (causes layout jumps)
 *
 * WHY THIS MATTERS:
 * - Prevents content from jumping when focusing/unfocusing blocks
 * - Ensures consistent spacing across all block types
 * - Makes animations smooth and predictable
 * - Simplifies debugging and maintenance
 *
 * USAGE EXAMPLE:
 * ```typescript
 * const styles = StyleSheet.create({
 *   container: {
 *     ...getBlockContainerStyle(),
 *     // Add any block-specific container styles
 *   },
 *   textInput: {
 *     ...getBlockInputStyle(colorScheme),
 *     fontSize: 32,        // Block-specific font size
 *     lineHeight: 40,      // Block-specific line height
 *     fontWeight: '700',   // Block-specific font weight
 *   }
 * });
 * ```
 */

import { Animated } from 'react-native';
import { Colors } from '../../../constants/Colors';

/**
 * Standard spacing constants for all blocks
 * These values are used consistently across all block types
 * NEVER modify these per-block unless you have a very good reason
 */
export const BLOCK_SPACING = {
  marginVertical: 6,     // Space between blocks
  paddingLeft: 8,        // Left padding (accounts for border)
  paddingRight: 4,       // Right padding
  paddingVertical: 2,    // Top/bottom padding within block
  borderWidth: 2,        // Left border width (for focus indicator)
} as const;

/**
 * Animation timing constants
 */
export const ANIMATION_CONFIG = {
  duration: 200,
  useNativeDriver: false, // Must be false for backgroundColor and borderColor
} as const;

/**
 * Get animated focus styles for a block
 * These styles change opacity/color but NEVER change layout (size, padding, margins)
 */
export const getAnimatedFocusStyles = (
  colorScheme: 'light' | 'dark',
  animatedValue: Animated.Value
) => {
  const isDark = colorScheme === 'dark';

  // Border color interpolation (transparent -> subtle color)
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(0, 0, 0, 0)', // Fully transparent when not focused
      isDark ? 'rgba(100, 181, 246, 0.3)' : 'rgba(33, 150, 243, 0.3)', // Subtle blue when focused
    ],
  });

  // Background color interpolation (transparent -> very subtle)
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      'rgba(0, 0, 0, 0)', // Fully transparent when not focused
      isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)', // Very subtle background when focused
    ],
  });

  return {
    borderColor,
    backgroundColor,
  };
};

/**
 * Get static focus colors (for non-animated components)
 */
export const getFocusColors = (
  colorScheme: 'light' | 'dark',
  isFocused: boolean
) => {
  const isDark = colorScheme === 'dark';

  return {
    borderColor: isFocused
      ? isDark
        ? 'rgba(100, 181, 246, 0.3)'
        : 'rgba(33, 150, 243, 0.3)'
      : 'rgba(0, 0, 0, 0)',
    backgroundColor: isFocused
      ? isDark
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(0, 0, 0, 0.01)'
      : 'rgba(0, 0, 0, 0)',
  };
};

/**
 * Get heading-specific focus colors with more emphasis
 */
export const getHeadingFocusColors = (
  colorScheme: 'light' | 'dark',
  level: number,
  isFocused: boolean
) => {
  const isDark = colorScheme === 'dark';

  // Heading levels 1-2 get more emphasis
  const isEmphasis = level <= 2;
  const opacity = isFocused ? (isEmphasis ? 0.4 : 0.3) : 0;

  return {
    borderColor: isDark
      ? `rgba(100, 181, 246, ${opacity})`
      : `rgba(33, 150, 243, ${opacity})`,
  };
};

/**
 * Get code block focus colors
 */
export const getCodeFocusColors = (
  colorScheme: 'light' | 'dark',
  isFocused: boolean
) => {
  const isDark = colorScheme === 'dark';

  return {
    backgroundColor: isFocused
      ? isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.05)'
      : isDark
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.03)',
  };
};

/**
 * Get quote block focus colors
 */
export const getQuoteFocusColors = (
  colorScheme: 'light' | 'dark',
  isFocused: boolean
) => {
  const isDark = colorScheme === 'dark';

  // Quote bar gets more visible when focused
  const barOpacity = isFocused ? 0.25 : 0.15;

  return {
    barColor: isDark
      ? `rgba(255, 255, 255, ${barOpacity})`
      : `rgba(0, 0, 0, ${barOpacity})`,
    backgroundColor: isFocused
      ? isDark
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(0, 0, 0, 0.01)'
      : 'rgba(0, 0, 0, 0)',
  };
};

/**
 * Base block container style that all blocks should use
 * This ensures consistent spacing and prevents layout shifts
 *
 * @deprecated Use getBlockContainerStyle() instead for clearer naming
 */
export const getBaseBlockStyle = (colorScheme: 'light' | 'dark') => {
  return {
    marginVertical: BLOCK_SPACING.marginVertical,
    paddingLeft: BLOCK_SPACING.paddingLeft,
    paddingRight: BLOCK_SPACING.paddingRight,
    paddingVertical: BLOCK_SPACING.paddingVertical,
    // Always have a border, just change its color
    borderLeftWidth: BLOCK_SPACING.borderWidth,
    borderLeftColor: 'rgba(0, 0, 0, 0)', // Transparent by default
  };
};

/**
 * RECOMMENDED: Get standard container style for any block type
 * Apply this to your Animated.View wrapper
 *
 * This style handles ALL spacing and layout concerns:
 * - marginVertical: Space between blocks
 * - paddingLeft/Right/Vertical: Internal spacing
 * - borderLeft: Focus indicator border
 *
 * @returns Standard container style object
 *
 * @example
 * ```typescript
 * const styles = StyleSheet.create({
 *   container: {
 *     ...getBlockContainerStyle(),
 *     // Add any additional container styles if needed
 *   }
 * });
 * ```
 */
export const getBlockContainerStyle = () => {
  return {
    marginVertical: BLOCK_SPACING.marginVertical,
    paddingLeft: BLOCK_SPACING.paddingLeft,
    paddingRight: BLOCK_SPACING.paddingRight,
    paddingVertical: BLOCK_SPACING.paddingVertical,
    borderLeftWidth: BLOCK_SPACING.borderWidth,
    borderLeftColor: 'rgba(0, 0, 0, 0)', // Transparent - will be animated
  };
};

/**
 * RECOMMENDED: Get standard input style for any block type
 * Apply this to your TextInput component
 *
 * This style handles ONLY content styling:
 * - NO padding (container handles this)
 * - NO margin (container handles this)
 * - Text color based on theme
 * - Transparent background
 *
 * You should add block-specific styles on top:
 * - fontSize (e.g., 32 for H1, 16 for paragraph)
 * - lineHeight (should match fontSize + spacing)
 * - fontWeight (e.g., '700' for headings)
 * - letterSpacing (optional, for headings)
 *
 * @param colorScheme - Current color scheme ('light' | 'dark')
 * @returns Standard input style object
 *
 * @example
 * ```typescript
 * const styles = StyleSheet.create({
 *   textInput: {
 *     ...getBlockInputStyle(colorScheme),
 *     fontSize: 32,
 *     lineHeight: 40,
 *     fontWeight: '700',
 *   }
 * });
 * ```
 */
export const getBlockInputStyle = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  return {
    width: '100%',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,  // NO padding - container handles this
    paddingVertical: 0,    // NO padding - container handles this
    color: colors.text,
  };
};
