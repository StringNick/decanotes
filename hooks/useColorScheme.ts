import { useColorScheme as useSystemColorScheme } from 'react-native';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';

/**
 * Hook that returns the effective color scheme, prioritizing user's theme choice
 * from ThemeContext over system theme
 */
export function useColorScheme(): 'light' | 'dark' {
  // Try to get theme from context
  const themeContext = useContext(ThemeContext);

  // If ThemeContext is available, use effectiveTheme
  if (themeContext) {
    return themeContext.effectiveTheme;
  }

  // Fallback to system theme if context not available (before provider)
  const systemTheme = useSystemColorScheme();
  return systemTheme ?? 'light';
}
