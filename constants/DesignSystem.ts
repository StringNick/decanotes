/**
 * DecaNotes Design System
 * A comprehensive design system for consistent styling across the app
 */

// === COLORS ===
export const Colors = {
  // Primary Brand Colors - Enhanced with modern vibrant palette
  primary: {
    purple: '#A78BFA',      // Vibrant purple (Tailwind violet-400)
    purpleDark: '#7C3AED',  // Deeper purple for accents
    teal: '#14B8A6',        // Modern teal (Tailwind teal-500)
    tealDark: '#0D9488',    // Deeper teal
    blue: '#60A5FA',        // Modern blue (Tailwind blue-400)
    blueDark: '#3B82F6',    // Deeper blue
    dark: '#0A0A0A',        // True dark for OLED screens
    accent: '#F472B6',      // Pink accent for highlights
  },

  // Neutral Palette - Refined for better contrast
  neutral: {
    white: '#FFFFFF',
    gray50: '#FAFAFA',
    gray100: '#F4F4F5',     // Zinc-100
    gray200: '#E4E4E7',     // Zinc-200
    gray300: '#D4D4D8',     // Zinc-300
    gray400: '#A1A1AA',     // Zinc-400
    gray500: '#71717A',     // Zinc-500
    gray600: '#52525B',     // Zinc-600
    gray700: '#3F3F46',     // Zinc-700
    gray800: '#27272A',     // Zinc-800
    gray850: '#1C1C1F',     // Between 800-900
    gray900: '#18181B',     // Zinc-900
    gray950: '#0F0F11',     // Deeper black
    black: '#000000',
  },

  // Semantic Colors - Modern palette
  semantic: {
    success: '#10B981',     // Emerald-500
    successLight: '#34D399', // Emerald-400
    warning: '#F59E0B',     // Amber-500
    warningLight: '#FBBF24', // Amber-400
    error: '#EF4444',       // Red-500
    errorLight: '#F87171',  // Red-400
    info: '#3B82F6',        // Blue-500
    infoLight: '#60A5FA',   // Blue-400
  },

  // Note Colors (Modern, vibrant yet subtle palette with glassmorphism support)
  notes: {
    light: {
      default: '#FFFFFF',
      cream: '#FEF3C7',       // Amber-100
      sage: '#D1FAE5',        // Emerald-100
      sky: '#DBEAFE',         // Blue-100
      lavender: '#E9D5FF',    // Purple-200
      peach: '#FED7AA',       // Orange-200
      mint: '#A7F3D0',        // Emerald-200
      rose: '#FECDD3',        // Rose-200
      indigo: '#C7D2FE',      // Indigo-200
    },
    dark: {
      default: '#18181B',     // Zinc-900
      cream: '#3F2410',       // Amber-900/80
      sage: '#14362B',        // Emerald-950
      sky: '#1E3A5F',         // Blue-950
      lavender: '#3B1E54',    // Purple-950
      peach: '#431407',       // Orange-950
      mint: '#0A2922',        // Emerald-950
      rose: '#4C0519',        // Rose-950
      indigo: '#1E1B4B',      // Indigo-950
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

  // Background Colors - Enhanced with glassmorphism
  background: {
    light: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F4F4F5',
      quaternary: '#E4E4E7',
      overlay: 'rgba(0, 0, 0, 0.4)',
      overlayLight: 'rgba(0, 0, 0, 0.2)',
      blur: 'rgba(255, 255, 255, 0.85)',
      glass: 'rgba(255, 255, 255, 0.7)',
      glassStrong: 'rgba(255, 255, 255, 0.9)',
    },
    dark: {
      primary: '#000000',
      secondary: '#0A0A0A',
      tertiary: '#18181B',
      quaternary: '#27272A',
      overlay: 'rgba(0, 0, 0, 0.6)',
      overlayLight: 'rgba(0, 0, 0, 0.3)',
      blur: 'rgba(0, 0, 0, 0.85)',
      glass: 'rgba(24, 24, 27, 0.7)',
      glassStrong: 'rgba(24, 24, 27, 0.9)',
    }
  },

  // Glassmorphism presets
  glass: {
    light: {
      soft: 'rgba(255, 255, 255, 0.6)',
      medium: 'rgba(255, 255, 255, 0.75)',
      strong: 'rgba(255, 255, 255, 0.9)',
    },
    dark: {
      soft: 'rgba(24, 24, 27, 0.6)',
      medium: 'rgba(24, 24, 27, 0.75)',
      strong: 'rgba(24, 24, 27, 0.9)',
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
// Enhanced with modern rounded values
export const BorderRadius = {
  none: 0,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  full: 9999,
};

// === SHADOWS ===
// Modern shadow system with colored and soft shadows
export const Shadows = {
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  '2xl': {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 12,
  },
  // Colored shadow presets for modern effects
  colored: (color: string, opacity: number = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: opacity,
    shadowRadius: 16,
    elevation: 6,
  }),
  glow: (color: string, intensity: 'soft' | 'medium' | 'strong' = 'medium') => {
    const opacityMap = { soft: 0.2, medium: 0.4, strong: 0.6 };
    const radiusMap = { soft: 12, medium: 20, strong: 32 };
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacityMap[intensity],
      shadowRadius: radiusMap[intensity],
      elevation: 4,
    };
  },
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
// Modern gradient presets for vibrant UI elements
export const Gradients = {
  brand: [Colors.primary.purple, Colors.primary.blue],
  brandVibrant: [Colors.primary.purpleDark, Colors.primary.teal],
  sunset: ['#F472B6', '#FB923C', '#FBBF24'], // Pink to Orange to Amber
  ocean: [Colors.primary.blue, Colors.primary.teal],
  purple: [Colors.primary.purple, Colors.primary.purpleDark],
  brandSubtle: ['rgba(167, 139, 250, 0.1)', 'rgba(96, 165, 250, 0.1)'],
  glass: {
    light: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.6)'],
    dark: ['rgba(24, 24, 27, 0.9)', 'rgba(24, 24, 27, 0.6)'],
  },
  overlay: {
    light: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.4)'],
    dark: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.7)'],
  },
  mesh: {
    light: ['#DBEAFE', '#E9D5FF', '#FECDD3'],
    dark: ['#1E3A5F', '#3B1E54', '#4C0519'],
  },
};

// === ANIMATIONS ===
// Modern animation timings and spring configurations
export const Animations = {
  timing: {
    instant: 100,
    fast: 150,
    normal: 250,
    slow: 400,
    slower: 600,
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  spring: {
    gentle: {
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    },
    bouncy: {
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    },
    stiff: {
      tension: 200,
      friction: 15,
      useNativeDriver: true,
    },
  },
  scale: {
    press: 0.96,
    active: 1.02,
    hover: 1.01,
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