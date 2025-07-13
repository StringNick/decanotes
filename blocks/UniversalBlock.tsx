import React, { useEffect, useRef, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, Text, TextInput, TextInputKeyPressEventData, TextStyle } from 'react-native';
import defaultTheme from '../themes/defaultTheme';
import { BlockProps } from '../types/editor';
import { calculatePreservedCursor } from '../utils/cursorPreservation';
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
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const lastText = useRef(displayValue);
  const lastDisplayValue = useRef(displayValue);
  const blurTimeout = useRef<number | null>(null);
  const mergedTheme = { ...defaultTheme, ...theme };

  // Focus only when we ENTER edit mode, not on every text change,
  // so the caret remains where the user placed it.
  useEffect(() => {
    if (isEditing) {
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isEditing]);

  // Apply cursor preservation after text updates
  useEffect(() => {
    if (selection && displayValue !== lastText.current) {
      const preservedPosition = calculatePreservedCursor(
        lastText.current,
        displayValue,
        selection,
        block.type
      );
      
      setTimeout(() => setSelection(preservedPosition), 0);
    }
    lastText.current = displayValue;
  }, [displayValue, block.type, selection]);

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
          ...(mergedTheme.quoteBlock as any),
          paddingLeft: 10, // Increase indentation for deeper levels
          marginLeft: depth * 16, // Additional margin for visual separation
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
        getBlockStyle(),
        theme?.input,
        isActive && theme?.focusedInput,
      ])}
      value={displayValue}
      selection={isEditing ? selection : undefined}
      onChangeText={onRawTextChange}
      onSelectionChange={(e) => {
        setSelection(e.nativeEvent.selection);
      }}
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
    const previewStyle = StyleSheet.flatten([getBlockStyle(), theme?.input]);
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



export default UniversalBlock; 