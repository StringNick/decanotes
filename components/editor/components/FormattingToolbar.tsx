import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';

interface FormattingAction {
  id: string;
  icon: string;
  label: string;
  isActive?: boolean;
}

interface FormattingToolbarProps {
  actions: FormattingAction[];
  onActionPress: (actionId: string) => void;
  style?: any;
}

/**
 * Text formatting toolbar component matching the Wordsy design system
 */
export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  actions,
  onActionPress,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  // Color palette for text formatting
  const colorPalette = [
    colors.background, // White
    colors.blue,       // Blue
    colors.primary,    // Purple
    colors.teal,       // Teal
    colors.text,       // Black/Dark
  ];

  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[colors.dark, colors.dark]}
        style={styles.toolbar}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {/* Text formatting buttons */}
          <View style={styles.buttonGroup}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.formatButton,
                  action.isActive && styles.formatButtonActive
                ]}
                onPress={() => onActionPress(action.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={action.icon as any}
                  size={18}
                  color={action.isActive ? colors.background : colors.background}
                  style={[
                    styles.formatIcon,
                    !action.isActive && styles.formatIconInactive
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Color palette */}
          <View style={styles.colorPalette}>
            {colorPalette.map((color, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.colorButton,
                  { backgroundColor: color },
                  color === colors.background && styles.whiteColorButton
                ]}
                onPress={() => onActionPress(`color-${index}`)}
                activeOpacity={0.8}
              >
                {index === colorPalette.length - 1 && (
                  // Rainbow gradient for the last color option
                  <LinearGradient
                    colors={['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#0080ff', '#8000ff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rainbowGradient}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      borderRadius: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
      marginVertical: 8,
    },
    toolbar: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    toolbarContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    buttonGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 16,
    },
    formatButton: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      backgroundColor: 'transparent',
    },
    formatButtonActive: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    formatIcon: {
      opacity: 1.0,
    },
    formatIconInactive: {
      opacity: 0.6,
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      marginRight: 16,
    },
    colorPalette: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    colorButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    whiteColorButton: {
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    rainbowGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 14,
    },
  });
};

export default FormattingToolbar;