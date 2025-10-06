/**
 * DecaNotes Color System
 * Simplified colors using the new design system
 */

import { Colors as DSColors } from './DesignSystem';

export const Colors = {
  light: {
    // Text colors
    text: DSColors.text.light.primary,
    textSecondary: DSColors.text.light.secondary,
    textTertiary: DSColors.text.light.tertiary,
    
    // Backgrounds
    background: DSColors.background.light.primary,
    backgroundSecondary: DSColors.background.light.secondary,
    backgroundTertiary: DSColors.background.light.tertiary,
    surface: DSColors.background.light.tertiary,
    
    // Borders
    border: DSColors.neutral.gray200,
    borderLight: DSColors.neutral.gray100,
    
    // Brand colors
    primary: DSColors.primary.purple,
    teal: DSColors.primary.teal,
    blue: DSColors.primary.blue,
    dark: DSColors.primary.dark,
    
    // Interactive elements
    tint: DSColors.primary.teal,
    accent: DSColors.primary.blue,
    
    // Semantic colors
    success: DSColors.semantic.success,
    error: DSColors.semantic.error,
    
    // Icon colors
    icon: DSColors.text.light.secondary,
    tabIconDefault: DSColors.text.light.inverse,
    tabIconSelected: DSColors.primary.teal,
    
    // Card backgrounds
    cardTodo: DSColors.notes.light.default,
    cardContent: DSColors.notes.light.default,
    cardLocked: DSColors.background.light.secondary,
    
    // Button backgrounds
    buttonPrimary: DSColors.primary.dark,
    buttonFloating: DSColors.primary.teal,
    
    // Additional editor colors
    textMuted: DSColors.text.light.muted,
    accentLight: 'rgba(139, 95, 191, 0.1)',
    accent2: DSColors.primary.blue,
    accent3: DSColors.primary.teal,
    errorLight: 'rgba(239, 68, 68, 0.1)',
    borderFocus: DSColors.primary.purple,
  },
  dark: {
    text: DSColors.text.dark.primary,
    textSecondary: DSColors.text.dark.secondary,
    textTertiary: DSColors.text.dark.tertiary,
    
    background: DSColors.background.dark.primary,
    backgroundSecondary: DSColors.background.dark.secondary,
    backgroundTertiary: DSColors.background.dark.tertiary,
    surface: DSColors.background.dark.tertiary,
    
    border: DSColors.neutral.gray700,
    borderLight: DSColors.neutral.gray800,
    
    primary: DSColors.primary.purple,
    teal: DSColors.primary.teal,
    blue: DSColors.primary.blue,
    dark: DSColors.neutral.gray700,
    
    tint: DSColors.primary.teal,
    accent: DSColors.primary.blue,
    
    success: DSColors.semantic.success,
    error: DSColors.semantic.error,
    
    icon: DSColors.text.dark.secondary,
    tabIconDefault: DSColors.text.dark.inverse,
    tabIconSelected: DSColors.primary.teal,
    
    cardTodo: DSColors.notes.dark.default,
    cardContent: DSColors.notes.dark.default,
    cardLocked: DSColors.background.dark.secondary,
    
    buttonPrimary: DSColors.primary.dark,
    buttonFloating: DSColors.primary.teal,
    
    // Additional editor colors
    textMuted: DSColors.text.dark.muted,
    accentLight: 'rgba(139, 95, 191, 0.2)',
    accent2: DSColors.primary.blue,
    accent3: DSColors.primary.teal,
    errorLight: 'rgba(239, 68, 68, 0.2)',
    borderFocus: DSColors.primary.purple,
  },
};

// Separate gradients object to avoid type conflicts with useThemeColor
export const Gradients = {
  light: {
    onboarding: [DSColors.primary.purple, DSColors.primary.blue],
    card: [DSColors.primary.teal, DSColors.primary.blue],
  },
  dark: {
    onboarding: [DSColors.primary.purple, DSColors.primary.blue],
    card: [DSColors.primary.teal, DSColors.primary.blue],
  },
};
