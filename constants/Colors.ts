/**
 * DecaNotes Color System
 * Simplified colors using the new design system
 */

import { Colors as DSColors } from './DesignSystem';

export const Colors = {
  light: {
    // Text colors
    text: DSColors.text.primary,
    textSecondary: DSColors.text.secondary,
    textTertiary: DSColors.text.tertiary,
    
    // Backgrounds
    background: DSColors.background.primary,
    backgroundSecondary: DSColors.background.secondary,
    surface: DSColors.background.tertiary,
    
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
    icon: DSColors.text.secondary,
    tabIconDefault: DSColors.text.inverse,
    tabIconSelected: DSColors.primary.teal,
    
    // Card backgrounds
    cardTodo: DSColors.notes.default,
    cardContent: DSColors.notes.default,
    cardLocked: DSColors.background.secondary,
    
    // Button backgrounds
    buttonPrimary: DSColors.primary.dark,
    buttonFloating: DSColors.primary.teal,
    
    // Gradients
    gradientOnboarding: [DSColors.primary.purple, DSColors.primary.blue],
    gradientCard: [DSColors.primary.teal, DSColors.primary.blue],
  },
  dark: {
    text: DSColors.text.inverse,
    textSecondary: DSColors.neutral.gray400,
    textTertiary: DSColors.neutral.gray500,
    
    background: DSColors.neutral.gray900,
    backgroundSecondary: DSColors.neutral.gray800,
    surface: DSColors.neutral.gray800,
    
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
    
    icon: DSColors.neutral.gray400,
    tabIconDefault: DSColors.text.inverse,
    tabIconSelected: DSColors.primary.teal,
    
    cardTodo: DSColors.neutral.gray800,
    cardContent: DSColors.neutral.gray800,
    cardLocked: DSColors.neutral.gray800,
    
    buttonPrimary: DSColors.primary.dark,
    buttonFloating: DSColors.primary.teal,
    
    gradientOnboarding: [DSColors.primary.purple, DSColors.primary.blue],
    gradientCard: [DSColors.primary.teal, DSColors.primary.blue],
  },
};
