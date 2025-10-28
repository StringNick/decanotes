import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { EditorTheme } from '@/types/editor';

interface EditorThemeContextType {
  colorScheme: 'light' | 'dark';
  theme: EditorTheme;
  colors: {
    background: string;
    text: string;
    border: string;
    primary: string;
    secondary: string;
    placeholder: string;
    surface: string;
  };
}

const EditorThemeContext = createContext<EditorThemeContextType | undefined>(undefined);

interface EditorThemeProviderProps {
  children: React.ReactNode;
  theme?: EditorTheme;
}

export function EditorThemeProvider({ children, theme: propTheme }: EditorThemeProviderProps) {
  const colorScheme = useColorScheme(); // Now respects ThemeContext

  const contextValue = useMemo<EditorThemeContextType>(() => {
    // Use provided theme or create default based on colorScheme
    const theme = propTheme || createDefaultTheme(colorScheme);

    // Extract colors from theme for easy access
    const colors = {
      background: theme.container?.backgroundColor || (colorScheme === 'dark' ? '#000' : '#fff'),
      text: theme.input?.color || (colorScheme === 'dark' ? '#fff' : '#000'),
      border: theme.focusedBlock?.backgroundColor || (colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
      primary: theme.input?.color || (colorScheme === 'dark' ? '#14b8a6' : '#0891b2'),
      secondary: theme.placeholder?.color || (colorScheme === 'dark' ? '#666' : '#999'),
      placeholder: theme.placeholder?.color || (colorScheme === 'dark' ? '#666' : '#999'),
      surface: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    };

    return {
      colorScheme,
      theme,
      colors,
    };
  }, [colorScheme, propTheme]);

  return (
    <EditorThemeContext.Provider value={contextValue}>
      {children}
    </EditorThemeContext.Provider>
  );
}

/**
 * Hook to access editor theme context
 * This hook respects the user's theme choice from ThemeContext
 */
export function useEditorTheme() {
  const context = useContext(EditorThemeContext);

  if (!context) {
    throw new Error('useEditorTheme must be used within EditorThemeProvider');
  }

  return context;
}

/**
 * Optional hook that returns undefined if not within provider
 */
export function useOptionalEditorTheme() {
  return useContext(EditorThemeContext);
}

/**
 * Create default theme based on color scheme
 */
function createDefaultTheme(colorScheme: 'light' | 'dark'): EditorTheme {
  const isDark = colorScheme === 'dark';

  return {
    container: {
      backgroundColor: isDark ? '#000' : '#fff',
    },
    input: {
      color: isDark ? '#fff' : '#000',
      fontSize: 16,
      lineHeight: 24,
    },
    placeholder: {
      color: isDark ? '#666' : '#999',
    },
    focusedBlock: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
  };
}

export default EditorThemeContext;
