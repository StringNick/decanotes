import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
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
  preventNewlines?: boolean; // New prop to prevent newline characters
}

/**
 * A text input component that shows formatted text when not editing
 * and raw markdown when editing
 */
export const FormattedTextInput = forwardRef<TextInput, FormattedTextInputProps>(({
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
  scrollEnabled = false,
  preventNewlines = false
}, ref) => {
  const [internalEditing, setInternalEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  
  // Expose the TextInput methods through ref
  useImperativeHandle(ref, () => inputRef.current as TextInput);
  
  // Use isEditing prop if provided, otherwise use internal state
  const showEditor = isEditing || internalEditing;
  
  // Use theme-aware placeholder color if not provided
  const effectivePlaceholderTextColor = placeholderTextColor || colors.textSecondary;

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

  const handleTextChange = (text: string) => {
    // If preventNewlines is true, filter out newline characters
    if (preventNewlines) {
      const filteredText = text.replace(/\n/g, '');
      onChangeText(filteredText);
    } else {
      onChangeText(text);
    }
  };

  if (showEditor) {
    return (
      <TextInput
        ref={inputRef}
        style={[
          styles.textInput,
          isSelected && styles.selected,
          showEditor && styles.editing,
          style
        ]}
        value={value}
        onChangeText={handleTextChange}
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
});

FormattedTextInput.displayName = 'FormattedTextInput';

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    textInput: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      minHeight: 40,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    formattedContainer: {
      paddingHorizontal: 0,
      paddingVertical: 0,
      minHeight: 40,
      backgroundColor: 'transparent',
      justifyContent: 'center',
    },
    formattedText: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
    },
    placeholder: {
      color: colors.textSecondary,
    },
    selected: {
      backgroundColor: 'transparent',
    },
    editing: {
      backgroundColor: 'transparent',
    },
  });
};