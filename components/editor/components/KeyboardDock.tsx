import React, { ReactNode, useMemo } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

type KeyboardDockSection = ReactNode | null;

interface KeyboardDockProps {
  keyboardHeight: number;
  visible: boolean;
  blockSection?: KeyboardDockSection;
  formattingSection?: KeyboardDockSection;
  actionSection?: KeyboardDockSection;
}

/**
 * Unified bottom dock aligned with the system keyboard.
 * Provides slots for block shortcuts, formatting tools, and primary actions.
 */
export const KeyboardDock: React.FC<KeyboardDockProps> = ({
  keyboardHeight,
  visible,
  blockSection,
  formattingSection,
  actionSection,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const styles = useMemo(() => getStyles(colorScheme ?? 'light', colors), [colorScheme, colors]);

  const translateY = visible
    ? 0
    : 120;

  const basePadding = Platform.OS === 'ios'
    ? insets.bottom
    : insets.bottom + 6;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          bottom: keyboardHeight > 0 ? keyboardHeight : 0,
          paddingBottom: keyboardHeight > 0 ? 0 : basePadding,
        },
      ]}
    >
      <View style={styles.surface}>
        {blockSection && (
          <View style={styles.blockRow}>
            {blockSection}
          </View>
        )}

        {formattingSection && (
          <View style={styles.divider} />
        )}

        {formattingSection && (
          <View style={styles.formattingRow}>
            {formattingSection}
          </View>
        )}

        {actionSection && (
          <>
            <View style={styles.divider} />
            <View style={styles.actionRow}>
              {actionSection}
            </View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const getStyles = (theme: 'light' | 'dark', colors: typeof Colors.light) => {
  const isDark = theme === 'dark';
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 50,
      // Removed paddingHorizontal to match keyboard width
    },
    surface: {
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.98)' : 'rgba(209, 213, 219, 0.95)',
      borderRadius: 0,
      paddingTop: 0,  // No top padding - seamless with toolbar
      paddingBottom: 8,
      paddingHorizontal: 8,
      // Subtle shadow like native keyboard
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: isDark ? 0.3 : 0.15,
      shadowRadius: 4,
      elevation: 8,
      borderTopWidth: 0,  // No top border - toolbar has it
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      // gap removed - using paddingTop/Bottom on sections instead
    },
    blockRow: {
      width: '100%',
      paddingHorizontal: 4,
      paddingTop: 0,  // No padding - seamless with toolbar
      paddingBottom: 4,  // Small bottom padding for separation from next section
    },
    formattingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 4,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      marginVertical: 2,
    },
  });
};

export default KeyboardDock;
