import { Ionicons } from '@expo/vector-icons';
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
 * Minimalistic text formatting toolbar
 */
export const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  actions,
  onActionPress,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.container, 
      style,
      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
    ]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolbarContent}
      >
        {/* Text formatting buttons */}
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.formatButton,
              action.isActive && {
                backgroundColor: isDark 
                  ? 'rgba(255, 255, 255, 0.15)' 
                  : 'rgba(0, 0, 0, 0.08)'
              }
            ]}
            onPress={() => onActionPress(action.id)}
            activeOpacity={0.6}
          >
            <Ionicons
              name={action.icon as any}
              size={20}
              color={isDark ? '#FFFFFF' : '#000000'}
              style={{ opacity: action.isActive ? 1 : 0.5 }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  return StyleSheet.create({
    container: {
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    toolbarContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    formatButton: {
      width: 40,
      height: 40,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
  });
};

export default FormattingToolbar;