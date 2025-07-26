import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { FormattedText } from './FormattedText';

interface FormattedTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSelectionChange?: (event: any) => void;
  onKeyPress?: (event: any) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: any;
  isSelected?: boolean;
  isEditing?: boolean;
  multiline?: boolean;
  textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  scrollEnabled?: boolean;
}

/**
 * A text input component that shows formatted text when not editing
 * and raw markdown when editing
 */
export const FormattedTextInput: React.FC<FormattedTextInputProps> = ({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSelectionChange,
  onKeyPress,
  placeholder,
  placeholderTextColor,
  style,
  isSelected = false,
  isEditing = false,
  multiline = true,
  textAlignVertical = 'top',
  scrollEnabled = false
}) => {
  const [internalEditing, setInternalEditing] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  
  // Use isEditing prop if provided, otherwise use internal state
  const showEditor = isEditing || internalEditing;
  
  // Use theme-aware placeholder color if not provided
  const effectivePlaceholderTextColor = placeholderTextColor || colors.textMuted;

  const handleFocus = () => {
    setInternalEditing(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setInternalEditing(false);
    onBlur?.();
  };

  const handleFormattedTextPress = () => {
    setInternalEditing(true);
    onFocus?.();
  };

  if (showEditor) {
    return (
      <TextInput
        style={[
          styles.textInput,
          isSelected && styles.selected,
          showEditor && styles.editing,
          style
        ]}
        value={value}
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={onSelectionChange}
        onKeyPress={onKeyPress}
        placeholder={placeholder}
        placeholderTextColor={effectivePlaceholderTextColor}
        multiline={multiline}
        textAlignVertical={textAlignVertical}
        scrollEnabled={scrollEnabled}
        autoFocus={showEditor}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.formattedContainer,
        isSelected && styles.selected,
        style
      ]}
      onPress={handleFormattedTextPress}
      activeOpacity={0.7}
    >
      {value ? (
        <FormattedText 
          text={value} 
          style={[styles.formattedText, style]}
          isEditing={false}
        />
      ) : (
        <FormattedText 
          text={placeholder || ''} 
          style={[styles.formattedText, styles.placeholder, style]}
          isEditing={false}
        />
      )}
    </TouchableOpacity>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    textInput: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      // padding: 8,
      minHeight: 40,
      borderRadius: 4,
      backgroundColor: 'transparent',
    },
    formattedContainer: {
      paddingHorizontal: 0,
      paddingVertical: 8,
      minHeight: 40,
      borderRadius: 4,
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
    formattedText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    placeholder: {
      color: colors.textMuted,
    },
    selected: {
      backgroundColor: colors.accentLight,
      borderColor: colors.accent,
      borderWidth: 1,
    },
    editing: {
      backgroundColor: colors.background,
      borderColor: colors.accent,
      borderWidth: 2,
    },
  });
};