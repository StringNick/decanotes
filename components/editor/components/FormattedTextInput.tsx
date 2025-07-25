import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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
  placeholderTextColor = '#999',
  style,
  isSelected = false,
  isEditing = false,
  multiline = true,
  textAlignVertical = 'top',
  scrollEnabled = false
}) => {
  const [internalEditing, setInternalEditing] = useState(false);
  
  // Use isEditing prop if provided, otherwise use internal state
  const showEditor = isEditing || internalEditing;

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
        placeholderTextColor={placeholderTextColor}
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
          style={styles.formattedText}
          isEditing={false}
        />
      ) : (
        <FormattedText 
          text={placeholder || ''} 
          style={[styles.formattedText, styles.placeholder]}
          isEditing={false}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    padding: 8,
    minHeight: 40,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  formattedContainer: {
    padding: 8,
    minHeight: 40,
    borderRadius: 4,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  formattedText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  selected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  editing: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
});