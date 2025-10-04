/**
 * DecaNotes Design System
 * A comprehensive design system for consistent styling across the app
 */

// === COLORS ===
export const Colors = {
  // Primary Brand Colors
  primary: {
    purple: '#8B5FBF',      // Softer purple for better readability
    teal: '#00A693',        // Adjusted teal for better contrast
    blue: '#4FC3E7',        // Softer blue
    dark: '#1A1A1A',        // True dark for better contrast
  },

  // Neutral Palette
  neutral: {
    white: '#FFFFFF',
    gray50: '#FAFAFA',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
    black: '#000000',
  },

  // Semantic Colors
  semantic: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // Note Colors (Soft, minimalistic palette)
  notes: {
    light: {
      default: '#FFFFFF',
      cream: '#FEF7ED',
      sage: '#F0F9F4',
      sky: '#F0F9FF',
      lavender: '#F8F7FF',
      peach: '#FFF7ED',
      mint: '#ECFDF5',
    },
    dark: {
      default: '#1A1A1A',
      cream: '#2A1F1A',
      sage: '#1A2A1F',
      sky: '#1A1F2A',
      lavender: '#1F1A2A',
      peach: '#2A1F1A',
      mint: '#1A2A1F',
    },
  },

  // Text Colors
  text: {
    light: {
      primary: '#1A1A1A',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
      muted: '#D1D5DB',
    },
    dark: {
      primary: '#FFFFFF',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      inverse: '#000000',
      muted: '#6B7280',
    }
  },

  // Background Colors
  background: {
    light: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F5F5F5',
      overlay: 'rgba(0, 0, 0, 0.5)',
      blur: 'rgba(255, 255, 255, 0.9)',
    },
    dark: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#1A1A1A',
      overlay: 'rgba(255, 255, 255, 0.1)',
      blur: 'rgba(0, 0, 0, 0.9)',
    }
  },
};

// === TYPOGRAPHY ===
export const Typography = {
  // Font Families
  fonts: {
    primary: 'AlbertSans_400Regular',
    medium: 'AlbertSans_500Medium',
    semibold: 'AlbertSans_600SemiBold',
    bold: 'AlbertSans_700Bold',
    mono: 'SpaceMono-Regular',
  },

  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
  },

  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// === SPACING ===
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
};

// === BORDER RADIUS ===
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
};

// === SHADOWS ===
export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  colored: (color: string, opacity: number = 0.2) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: opacity,
    shadowRadius: 12,
    elevation: 6,
  }),
};

// === HELPER FUNCTIONS ===
export const getThemeColors = (isDark: boolean) => ({
  text: isDark ? Colors.text.dark : Colors.text.light,
  background: isDark ? Colors.background.dark : Colors.background.light,
  neutral: Colors.neutral,
  primary: Colors.primary,
  semantic: Colors.semantic,
  notes: isDark ? Colors.notes.dark : Colors.notes.light,
});

// === COMPONENT STYLES ===
// Theme-aware component factory functions
export const createComponents = (isDark: boolean) => {
  const themeColors = getThemeColors(isDark);
  
  return {
    // Button Variants
    button: {
      primary: {
        backgroundColor: Colors.primary.dark,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        ...Shadows.md,
      },
      secondary: {
        backgroundColor: themeColors.background.secondary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.neutral.gray200,
      },
      ghost: {
        backgroundColor: 'transparent',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.xl,
      },
    },

    // Card Variants
    card: {
      default: {
        backgroundColor: themeColors.background.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.base,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.neutral.gray100,
      },
      elevated: {
        backgroundColor: themeColors.background.primary,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.lg,
      },
      note: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        ...Shadows.sm,
        borderWidth: 1,
        borderColor: Colors.neutral.gray100,
      },
    },

    // Input Variants
    input: {
      default: {
        backgroundColor: themeColors.background.secondary,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.neutral.gray200,
        fontSize: Typography.sizes.md,
        fontFamily: Typography.fonts.primary,
        color: themeColors.text.primary,
      },
    },

    // Editor-specific components
    editor: {
      container: {
        backgroundColor: themeColors.background.primary,
        flex: 1,
      },
      block: {
        backgroundColor: 'transparent',
        marginVertical: Spacing.xs,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
      },
      focusedBlock: {
        backgroundColor: isDark 
          ? 'rgba(139, 95, 191, 0.1)' 
          : 'rgba(139, 95, 191, 0.05)',
        borderWidth: 1,
        borderColor: isDark 
          ? 'rgba(139, 95, 191, 0.3)' 
          : 'rgba(139, 95, 191, 0.2)',
      },
      input: {
        fontSize: Typography.sizes.md,
        lineHeight: Typography.sizes.md * Typography.lineHeights.normal,
        color: themeColors.text.primary,
        fontFamily: Typography.fonts.primary,
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        margin: 0,
      },
      placeholder: {
        color: themeColors.text.tertiary,
        fontStyle: 'italic',
      },
      toolbar: {
        backgroundColor: themeColors.background.secondary,
        borderTopWidth: 1,
        borderTopColor: isDark ? Colors.neutral.gray700 : Colors.neutral.gray200,
        paddingHorizontal: Spacing.base,
        paddingVertical: Spacing.sm,
      },
      toolbarButton: {
        backgroundColor: Colors.primary.dark,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginHorizontal: Spacing.xs,
      },
    },
  };
};

// Legacy static components (for backward compatibility)
export const Components = createComponents(false);

// === GRADIENTS ===
export const Gradients = {
  brand: [Colors.primary.purple, Colors.primary.blue],
  brandSubtle: ['rgba(139, 95, 191, 0.1)', 'rgba(79, 195, 231, 0.1)'],
  glass: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.7)'],
  overlay: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.3)'],
};

// === ANIMATIONS ===
export const Animations = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 400,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const createTextStyle = (
  size: keyof typeof Typography.sizes,
  weight: keyof typeof Typography.fonts = 'primary',
  color?: string,
  isDark?: boolean
) => {
  const themeColors = isDark !== undefined ? getThemeColors(isDark) : null;
  const defaultColor = themeColors ? themeColors.text.primary : Colors.text.light.primary;
  
  return {
    fontSize: Typography.sizes[size],
    fontFamily: Typography.fonts[weight],
    color: color || defaultColor,
    lineHeight: Typography.sizes[size] * Typography.lineHeights.normal,
  };
};

export const createSpacingStyle = (
  horizontal: keyof typeof Spacing,
  vertical?: keyof typeof Spacing
) => ({
  paddingHorizontal: Spacing[horizontal],
  paddingVertical: Spacing[vertical || horizontal],
});

// Editor-specific helper functions
export const createEditorTheme = (isDark: boolean) => {
  const themeColors = getThemeColors(isDark);
  const components = createComponents(isDark);
  
  return {
    // Core editor styles
    container: components.editor.container,
    block: components.editor.block,
    focusedBlock: components.editor.focusedBlock,
    input: components.editor.input,
    placeholder: components.editor.placeholder,
    
    // Typography styles
    heading1: createTextStyle('4xl', 'bold', themeColors.text.primary, isDark),
    heading2: createTextStyle('3xl', 'semibold', themeColors.text.primary, isDark),
    heading3: createTextStyle('2xl', 'semibold', themeColors.text.primary, isDark),
    heading4: createTextStyle('xl', 'semibold', themeColors.text.primary, isDark),
    heading5: createTextStyle('lg', 'semibold', themeColors.text.primary, isDark),
    heading6: createTextStyle('md', 'semibold', themeColors.text.primary, isDark),
    
    // Code styles
    code: {
      ...createTextStyle('sm', 'mono', themeColors.text.primary, isDark),
      backgroundColor: isDark ? Colors.neutral.gray800 : Colors.neutral.gray100,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
    },
    codeBlock: {
      backgroundColor: isDark ? Colors.neutral.gray800 : Colors.neutral.gray100,
      borderRadius: BorderRadius.lg,
      padding: Spacing.base,
      borderWidth: 1,
      borderColor: isDark ? Colors.neutral.gray700 : Colors.neutral.gray200,
    },
    
    // Quote styles
    quoteBlock: {
      backgroundColor: isDark ? 'rgba(139, 95, 191, 0.1)' : 'rgba(139, 95, 191, 0.05)',
      borderLeftWidth: 4,
      borderLeftColor: Colors.primary.purple,
      paddingLeft: Spacing.base,
      paddingVertical: Spacing.sm,
      marginVertical: Spacing.sm,
    },
    
    // Text formatting
    bold: {
      fontFamily: Typography.fonts.bold,
      color: themeColors.text.primary,
    },
    italic: {
      fontFamily: Typography.fonts.medium,
      fontStyle: 'italic',
      color: themeColors.text.primary,
    },
    inlineCode: {
      fontFamily: Typography.fonts.mono,
      fontSize: Typography.sizes.sm,
      backgroundColor: isDark ? Colors.neutral.gray800 : Colors.neutral.gray100,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      color: themeColors.text.primary,
    },
    
    // Toolbar styles
    toolbar: components.editor.toolbar,
    toolbarButton: components.editor.toolbarButton,
    
    // Colors for easy access
    colors: themeColors,
  };
};

// Create shadow styles with theme awareness
export const createShadowStyle = (
  size: keyof typeof Shadows,
  isDark: boolean = false
) => {
  const shadow = Shadows[size];
  if (typeof shadow === 'function') {
    return shadow;
  }
  
  return {
    ...shadow,
    shadowOpacity: isDark ? shadow.shadowOpacity * 0.5 : shadow.shadowOpacity,
  };
};

// Create responsive spacing
export const createResponsiveSpacing = (
  base: keyof typeof Spacing,
  multiplier: number = 1
) => ({
  padding: Spacing[base] * multiplier,
  margin: Spacing[base] * multiplier * 0.5,
});

// Export default design system object
export const DesignSystem = {
  // Core design tokens
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Gradients,
  Animations,
  
  // Component factories
  Components,
  createComponents,
  
  // Theme helpers
  createEditorTheme,
  
  // Style helpers
  getThemeColors,
  createTextStyle,
  createSpacingStyle,
  createShadowStyle,
  createResponsiveSpacing,
};

// Convenience exports for editor integration
export const EditorThemes = {
  light: createEditorTheme(false),
  dark: createEditorTheme(true),
};

// Theme-aware component sets
export const ThemeComponents = {
  light: createComponents(false),
  dark: createComponents(true),
};

export default DesignSystem;