/**
 * Wordsy design system color palette
 * Based on the provided design system with purple, teal, blue, and dark colors
 */

// Primary colors from design system
const purple = '#bd44ff';
const teal = '#0bcdb6';
const blue = '#67d4fc';
const dark = '#313131';

export const Colors = {
  light: {
    // Primary text colors
    text: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    
    // Backgrounds
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    surface: '#F8F9FA',
    
    // Borders
    border: '#E5E5E7',
    borderLight: '#F0F0F0',
    
    // Brand colors
    primary: purple,
    teal: teal,
    blue: blue,
    dark: dark,
    
    // Interactive elements
    tint: teal,
    accent: blue,
    
    // Semantic colors
    success: '#34C759',
    error: '#FF3B30',
    
    // Icon colors
    icon: '#666666',
    tabIconDefault: '#FFFFFF',
    tabIconSelected: teal,
    
    // Card backgrounds
    cardTodo: blue,
    cardContent: '#FFFFFF',
    cardLocked: '#F8F9FA',
    
    // Button backgrounds
    buttonPrimary: dark,
    buttonFloating: teal,
    
    // Gradients (for use in LinearGradient components)
    gradientOnboarding: [purple, blue],
    gradientCard: [teal, blue],
  },
  dark: {
    // For dark mode, we'll use inverted colors but maintain the brand identity
    text: '#FFFFFF',
    textSecondary: '#CCCCCC',
    textTertiary: '#999999',
    
    background: '#1A1A1A',
    backgroundSecondary: '#2A2A2A',
    surface: '#2A2A2A',
    
    border: '#3A3A3A',
    borderLight: '#2A2A2A',
    
    primary: purple,
    teal: teal,
    blue: blue,
    dark: '#4A4A4A',
    
    tint: teal,
    accent: blue,
    
    success: '#34C759',
    error: '#FF3B30',
    
    icon: '#CCCCCC',
    tabIconDefault: '#FFFFFF',
    tabIconSelected: teal,
    
    cardTodo: blue,
    cardContent: '#2A2A2A',
    cardLocked: '#2A2A2A',
    
    buttonPrimary: dark,
    buttonFloating: teal,
    
    gradientOnboarding: [purple, blue],
    gradientCard: [teal, blue],
  },
};
