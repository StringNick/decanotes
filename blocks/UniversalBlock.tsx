import React, { useEffect, useRef } from 'react';
import { NativeSyntheticEvent, Platform, StyleSheet, Text, TextInput, TextInputKeyPressEventData, TextStyle } from 'react-native';
import defaultTheme from '../themes/defaultTheme';
import { BlockProps } from '../types/editor';
import { processInlineFormatting } from '../utils/markdownParser';

// UniversalBlock replicates the per-block rendering / editing logic that used to be in MarkdownEditor.
// NOTE: This component intentionally keeps a local StyleSheet so it can be reused outside the editor.

const UniversalBlock: React.FC<BlockProps> = ({
  block,
  isActive,
  isEditing,
  displayValue,
  onRawTextChange,
  onFocus,
  onEdit,
  onBlur,
  onKeyPress,
  theme,
  placeholder,
}) => {
  const inputRef = useRef<TextInput>(null);
  const blurTimeout = useRef<number | null>(null);
  const mergedTheme = { ...defaultTheme, ...theme };

  // Ensure focus for controlled TextInput
  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isEditing, displayValue]);

  const getBlockStyle = (): TextStyle => {
    switch (block.type) {
      case 'heading': {
        const level = block.meta?.level || 1;
        const headingStyles: any = {
          1: mergedTheme.heading1,
          2: mergedTheme.heading2,
          3: mergedTheme.heading3,
          4: mergedTheme.heading4,
          5: mergedTheme.heading5,
          6: mergedTheme.heading6,
        };
        return headingStyles[level] as TextStyle;
      }
      case 'code':
        return mergedTheme.code;
      case 'quote': {
        const depth = block.meta?.depth || 0;
        return {
          ...(mergedTheme.quote as any),
          paddingLeft: 16 + depth * 16,
        };
      }
      case 'list':
      case 'checklist':
        return { paddingLeft: 8 };
      case 'divider':
        return { textAlign: 'center', color: '#9ca3af', fontSize: 24 };
      case 'image':
        return { fontStyle: 'italic', color: '#6b7280' };
      default:
        return {};
    }
  };

  const input = (
    <TextInput
      ref={inputRef}
      style={StyleSheet.flatten([
        styles.input,
        getBlockStyle(),
        theme?.input,
        isActive && styles.focusedInput,
        isActive && theme?.focusedInput,
      ])}
      value={displayValue}
      onChangeText={onRawTextChange}
      onFocus={() => {
        if (blurTimeout.current) {
          clearTimeout(blurTimeout.current);
          blurTimeout.current = null;
        }
        onFocus();
      }}
      onBlur={() => {
        blurTimeout.current = setTimeout(() => {
          onBlur();
        }, 100);
      }}
      onKeyPress={onKeyPress as (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void}
      placeholder={placeholder || 'Type something...'}
      placeholderTextColor={mergedTheme.placeholder?.color || '#a8a8a8'}
      multiline
      textAlignVertical="top"
      autoCapitalize={block.type === 'code' ? 'none' : 'sentences'}
      autoCorrect={block.type === 'code' ? false : true}
      spellCheck={block.type === 'code' ? false : true}
      selectionColor="#3b82f6"
    />
  );

  if (!isActive) {
    const previewSegments = processInlineFormatting(block.content);
    const previewStyle = StyleSheet.flatten([styles.input, getBlockStyle(), theme?.input]);
    return (
      <Text style={previewStyle}>
        {previewSegments.map((seg, idx) => {
          let segStyle: TextStyle = {};
          switch (seg.type) {
            case 'bold':
              segStyle = mergedTheme.bold;
              break;
            case 'italic':
              segStyle = mergedTheme.italic;
              break;
            case 'bold-italic':
              segStyle = { ...(mergedTheme.bold as any), ...(mergedTheme.italic as any) };
              break;
            case 'code':
              segStyle = mergedTheme.inlineCode;
              break;
            default:
              segStyle = {};
          }
          return (
            <Text key={idx} style={segStyle}>
              {seg.text}
            </Text>
          );
        })}
      </Text>
    );
  }

  return input;
};

const styles = StyleSheet.create({
  input: {
    fontSize: 16,
    lineHeight: 26,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
    color: '#1a1a1a',
  },
  focusedInput: {
    backgroundColor: 'transparent',
  },
});

export default UniversalBlock; 