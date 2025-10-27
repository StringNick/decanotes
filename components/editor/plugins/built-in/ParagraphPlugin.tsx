import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Animated, StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';
import { ANIMATION_CONFIG, BLOCK_SPACING, getFocusColors } from '../../styles/blockStyles';

/**
 * Paragraph block component with minimalist design
 */
const ParagraphComponent = forwardRef<TextInput, BlockComponentProps>(({
  block,
  onUpdate,
  onBlockChange,
  onFocus,
  onBlur,
  isSelected,
  isFocused,
  isEditing,
  style
}, ref) => {
  const inputRef = useRef<TextInput>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Explicitly determine if we should show editor or formatted view
  const shouldShowEditor = Boolean(isFocused || isEditing);
  const styles = getStyles(colorScheme ?? 'light');

  // Expose the TextInput methods through ref
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  // Animate focus state changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: shouldShowEditor ? 1 : 0,
      duration: ANIMATION_CONFIG.duration,
      useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
    }).start();
  }, [shouldShowEditor, animatedValue]);

  // Get animated colors
  const focusColors = getFocusColors(colorScheme ?? 'light', shouldShowEditor || false);

  // Get the plugin instance and controller
  const pluginInstance = new ParagraphPlugin();
  const controller = pluginInstance.controller;

  const handleSelectionChange = (event: any) => {
    const selection = event.nativeEvent.selection;
    if (selection) {
      setCursorPosition(selection.start);
    }
  };

  const handleTextChange = (text: string) => {
    if (onBlockChange) {
      onBlockChange({ content: text });
    } else if (onUpdate) {
      onUpdate({
        ...block,
        content: text
      });
    }
  };

  // Animated colors
  const animatedBorderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', focusColors.borderColor],
  });

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', focusColors.backgroundColor],
  });

  return (
    <KeyboardHandler
      block={block}
      controller={controller}
      cursorPosition={cursorPosition}
    >
      {({ onKeyPress, preventNewlines }: { onKeyPress: (event: any) => void; preventNewlines?: boolean }) => (
        <Animated.View
          style={[
            styles.container,
            style,
            {
              borderLeftColor: animatedBorderColor,
              backgroundColor: animatedBackgroundColor
            }
          ]}
        >
          <FormattedTextInput
            ref={inputRef}
            value={block.content}
            onChangeText={handleTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onSelectionChange={handleSelectionChange}
            onKeyPress={onKeyPress}
            placeholder="Type something..."
            placeholderTextColor={colors.textSecondary}
            isSelected={isSelected}
            isEditing={shouldShowEditor}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            preventNewlines={preventNewlines}
            style={styles.textInput}
          />
        </Animated.View>
      )}
    </KeyboardHandler>
  );
});

ParagraphComponent.displayName = 'ParagraphComponent';

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      // Standard container spacing - handles ALL padding/margin
      marginVertical: BLOCK_SPACING.marginVertical,
      paddingLeft: BLOCK_SPACING.paddingLeft,
      paddingRight: BLOCK_SPACING.paddingRight,
      paddingVertical: BLOCK_SPACING.paddingVertical,
      // Always have border, color will be animated
      borderLeftWidth: BLOCK_SPACING.borderWidth,
      borderLeftColor: 'rgba(0, 0, 0, 0)', // Will be overridden by animated value
      backgroundColor: 'transparent', // Will be overridden by animated value
    },
    textInput: {
      width: '100%',
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      backgroundColor: 'transparent',
      // NO padding - container handles all spacing
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
  });
};

/**
 * Paragraph block plugin
 */
export class ParagraphPlugin extends BlockPlugin {
  readonly type = 'block';
  readonly id = 'paragraph';
  readonly name = 'Paragraph';
  readonly version = '1.0.0';
  readonly description = 'Basic paragraph text block';
  readonly blockType = 'paragraph';
  readonly component = ParagraphComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    handleBackspace: this.handleBackspace.bind(this),
    getActions: this.getActions.bind(this)
  };

  readonly markdownSyntax = {
    patterns: {
      // Paragraphs are default - no specific pattern needed
    },
    priority: 10 // Lowest priority - fallback
  };

  readonly toolbar = {
    icon: 'text',
    label: 'Paragraph',
    shortcut: 'Ctrl+Alt+0',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'list', 'callout'] as EditorBlockType[],
    validation: {
      maxLength: 10000
    },
    defaultMeta: {
      textAlign: 'left'
    }
  };

  /**
   * Handle Enter key press
   */
  protected handleEnter(block: EditorBlock, allBlocks?: EditorBlock[], currentIndex?: number): EditorBlock | EditorBlock[] | null {
    // Create new paragraph on Enter
    if (block.content.trim() === '') {
      // If current paragraph is empty, don't create new one
      return null; // Or convert to previous block type, depending on desired behavior
    }
    const newParagraph: EditorBlock = {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: { textAlign: block.meta?.textAlign || 'left' }
    };
    // Return both blocks - the current one stays, and we add a new one after it
    return [block, newParagraph];
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // If paragraph is empty and backspace is pressed, delete the block
    // We return null to let the KeyboardHandler handle block deletion
    if (block.content.trim() === '') {
      return null; // Let KeyboardHandler handle block deletion
    }

    // Return null to let default behavior handle non-empty paragraphs
    return null;
  }

  protected transformContent(content: string): string {
    // Clean up content - remove excessive whitespace
    return content.replace(/\s+/g, ' ').trim();
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    return super.getActions(block);
  }
}