/**
 * Modern, minimalistic color system for light and dark themes
 * Designed for optimal readability and visual hierarchy
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#60a5fa';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    backgroundTertiary: '#f1f5f9',
    surface: '#ffffff',
    surfaceSecondary: '#f8fafc',
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderFocus: '#3b82f6',
    tint: tintColorLight,
    accent: '#3b82f6',
    accentLight: '#dbeafe',
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textMuted: '#94a3b8',
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    backgroundTertiary: '#334155',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    border: '#475569',
    borderLight: '#334155',
    borderFocus: '#60a5fa',
    tint: tintColorDark,
    accent: '#60a5fa',
    accentLight: '#1e3a8a',
    success: '#34d399',
    successLight: '#064e3b',
    warning: '#fbbf24',
    warningLight: '#451a03',
    error: '#f87171',
    errorLight: '#7f1d1d',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
