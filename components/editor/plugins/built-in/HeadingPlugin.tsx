import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Animated, NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';
import { ANIMATION_CONFIG, BLOCK_SPACING, getHeadingFocusColors } from '../../styles/blockStyles';

// Global cursor position tracker for heading blocks
let headingCursorPositions: { [blockId: string]: number } = {};

type FocusableHandle = { focus: () => void };

/**
 * Heading block component with modern minimalist design
 */
const HeadingComponent = forwardRef<FocusableHandle, BlockComponentProps>(
  (
    {
      block,
      isSelected,
      isFocused,
      isEditing,
      isDragging,
      onBlockChange,
      onFocus,
      onBlur,
      onKeyPress,
      theme,
      readOnly,
    },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const level = block.meta?.level || 1;
    const headingStyle = getHeadingStyle(level, colorScheme ?? 'light');
    const [cursorPosition, setCursorPosition] = useState(0);
    const animatedValue = useRef(new Animated.Value(0)).current;

    // Expose the TextInput methods through ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Determine if block should show focused state
    const shouldFocus = isFocused || isEditing;

    // Animate focus state changes
    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: shouldFocus ? 1 : 0,
        duration: ANIMATION_CONFIG.duration,
        useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
      }).start();
    }, [shouldFocus, animatedValue]);

    // Get animated border color
    const focusColors = getHeadingFocusColors(colorScheme ?? 'light', level, shouldFocus || false);
    const styles = getStyles(colorScheme ?? 'light', level);

    const handleTextChange = (text: string) => {
      onBlockChange({ content: text });
    };

    const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
      const key = event.nativeEvent.key;

      // Check if backspace is pressed at position 0
      if (key === 'Backspace' && cursorPosition === 0 && block.content.length > 0) {
        // Convert heading back to paragraph with markdown syntax
        const level = block.meta?.level || 1;
        const markdownPrefix = '#'.repeat(level);

        onBlockChange({
          type: 'paragraph' as EditorBlockType,
          content: `${markdownPrefix}${block.content}`,
          meta: {},
        });

        // Prevent default backspace behavior
        event.preventDefault();
        return;
      }

      // Call the original onKeyPress if provided
      if (onKeyPress) {
        onKeyPress(event);
      }
    };

    const handleSelectionChange = (event: any) => {
      const { selection } = event.nativeEvent;
      const position = selection.start;
      setCursorPosition(position);
      // Store cursor position globally so handleBackspace can access it
      headingCursorPositions[block.id] = position;
    };

    // Animated border color
    const animatedBorderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', focusColors.borderColor],
    });

    return (
      <Animated.View style={[styles.container, { borderLeftColor: animatedBorderColor }]}>
        <FormattedTextInput
          ref={inputRef}
          value={block.content}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
          placeholder={`Heading ${level}`}
          placeholderTextColor={colors.textSecondary}
          isSelected={isSelected}
          isEditing={isEditing}
          preventNewlines={true}
          style={[headingStyle, styles.textInput]}
        />
      </Animated.View>
    );
  }
);

HeadingComponent.displayName = 'HeadingComponent';

// Export function to get cursor position for a block
export const getHeadingCursorPosition = (blockId: string): number => {
  return headingCursorPositions[blockId] || 0;
};

const getHeadingStyle = (level: number, colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  const baseStyle = {
    color: colors.text,
    paddingVertical: 0,
  };

  switch (level) {
    case 1:
      return { ...baseStyle, fontSize: 32, lineHeight: 40, letterSpacing: -0.6, fontWeight: '700' };
    case 2:
      return { ...baseStyle, fontSize: 24, lineHeight: 32, letterSpacing: -0.4, fontWeight: '700' };
    case 3:
      return { ...baseStyle, fontSize: 20, lineHeight: 28, letterSpacing: -0.3, fontWeight: '600' };
    case 4:
      return { ...baseStyle, fontSize: 18, lineHeight: 26, letterSpacing: -0.2, fontWeight: '600' };
    case 5:
      return { ...baseStyle, fontSize: 16, lineHeight: 24, letterSpacing: -0.1, fontWeight: '600' };
    case 6:
      return { ...baseStyle, fontSize: 14, lineHeight: 22, fontWeight: '600' };
    default:
      return { ...baseStyle, fontSize: 32, lineHeight: 40, fontWeight: '700' };
  }
};

const getStyles = (colorScheme: 'light' | 'dark', level: number) => {
  return StyleSheet.create({
    container: {
      // Use consistent spacing for all heading levels to prevent layout jumps
      marginVertical: BLOCK_SPACING.marginVertical,
      paddingLeft: BLOCK_SPACING.paddingLeft,
      paddingRight: BLOCK_SPACING.paddingRight,
      paddingVertical: BLOCK_SPACING.paddingVertical,
      // Always have border, color will be animated
      borderLeftWidth: BLOCK_SPACING.borderWidth,
      borderLeftColor: 'rgba(0, 0, 0, 0)', // Will be overridden by animated value
    },
    textInput: {
      width: '100%',
      // NO padding on input - container handles all padding
      paddingHorizontal: 0,
      paddingVertical: 0,
      backgroundColor: 'transparent',
    },
  });
};

/**
 * Heading block plugin
 */
export class HeadingPlugin extends BlockPlugin {
  readonly id = 'heading';
  readonly name = 'Heading';
  readonly version = '1.0.0';
  readonly description = 'Heading text block with multiple levels';
  readonly blockType = 'heading';
  readonly component = HeadingComponent;

  readonly markdownSyntax = {
    patterns: {
      block: /^(#{1,6})\s+(.+)$/,
    },
    priority: 80,
  };

  readonly toolbar = {
    icon: 'heading',
    label: 'Heading',
    shortcut: 'Ctrl+Alt+1',
    group: 'text',
    variants: [
      { label: 'Heading 1', shortcut: 'Ctrl+Alt+1', meta: { level: 1 } },
      { label: 'Heading 2', shortcut: 'Ctrl+Alt+2', meta: { level: 2 } },
      { label: 'Heading 3', shortcut: 'Ctrl+Alt+3', meta: { level: 3 } },
      { label: 'Heading 4', shortcut: 'Ctrl+Alt+4', meta: { level: 4 } },
      { label: 'Heading 5', shortcut: 'Ctrl+Alt+5', meta: { level: 5 } },
      { label: 'Heading 6', shortcut: 'Ctrl+Alt+6', meta: { level: 6 } },
    ],
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout'] as EditorBlockType[],
    validation: {
      required: [],
      maxLength: 200,
    },
    defaultMeta: {
      level: 1,
    },
  };

  /**
   * Handle backspace key - convert heading back to paragraph with markdown syntax
   * when cursor is at the beginning of the heading
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Get the current cursor position for this block
    const cursorPosition = headingCursorPositions[block.id] || 0;

    // Only convert to paragraph with markdown syntax if cursor is at position 0
    if (cursorPosition === 0) {
      const level = block.meta?.level || 1;
      const markdownPrefix = '#'.repeat(level);

      // Convert heading back to paragraph with markdown syntax (no space to prevent auto-conversion)
      return {
        ...block,
        type: 'paragraph',
        content: `${markdownPrefix}${block.content}`,
        meta: {},
      };
    }

    // If cursor is not at position 0, let default backspace behavior handle it
    return null;
  }
}
