import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';

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

  // Explicitly determine if we should show editor or formatted view
  const shouldShowEditor = Boolean(isFocused || isEditing);
  const styles = getStyles(colorScheme ?? 'light', shouldShowEditor);

  // Expose the TextInput methods through ref
  useImperativeHandle(ref, () => inputRef.current as TextInput);

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

  return (
    <KeyboardHandler
      block={block}
      controller={controller}
      cursorPosition={cursorPosition}
    >
      {({ onKeyPress, preventNewlines }: { onKeyPress: (event: any) => void; preventNewlines?: boolean }) => (
        <View style={[styles.container, style]}>
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
        </View>
      )}
    </KeyboardHandler>
  );
});

ParagraphComponent.displayName = 'ParagraphComponent';

const getStyles = (colorScheme: 'light' | 'dark', isEditing: boolean) => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Subtle border color that's only visible when editing
  const borderOpacity = isEditing ? 0.2 : 0;
  const borderColor = isDark
    ? `rgba(100, 181, 246, ${borderOpacity})`
    : `rgba(33, 150, 243, ${borderOpacity})`;

  return StyleSheet.create({
    container: {
      marginVertical: 2,
      paddingLeft: 8,
      paddingRight: 4,
      paddingVertical: 2,
      borderLeftWidth: 2,
      borderLeftColor: borderColor,
      backgroundColor: 'transparent',
    },
    textInput: {
      width: '100%',
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      backgroundColor: 'transparent',
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