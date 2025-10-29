import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, StyleSheet, TextInput } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { ANIMATION_CONFIG, BLOCK_SPACING, getFocusColors } from '../../styles/blockStyles';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';

type FocusableHandle = { focus: () => void };

/**
 * Footnote block component
 * Renders footnote definitions like [^1]: Footnote text
 */
const FootnoteComponent = forwardRef<FocusableHandle, BlockComponentProps>(
  (
    { block, onUpdate, onBlockChange, onFocus, onBlur, onFootnotePress, isSelected, isFocused, isEditing, style },
    ref
  ) => {
    const inputRef = useRef<TextInput>(null);
    const [cursorPosition, setCursorPosition] = useState(0);
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const animatedValue = useRef(new Animated.Value(0)).current;

    const shouldShowEditor = Boolean(isFocused || isEditing);
    const styles = getStyles(colorScheme ?? 'light');

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: shouldShowEditor ? 1 : 0,
        duration: ANIMATION_CONFIG.duration,
        useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
      }).start();
    }, [shouldShowEditor, animatedValue]);

    const focusColors = getFocusColors(colorScheme ?? 'light', shouldShowEditor || false);

    const pluginInstance = new FootnotePlugin();
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
          content: text,
        });
      }
    };

    const animatedBorderColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', focusColors.borderColor],
    });

    const animatedBackgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', focusColors.backgroundColor],
    });

    // Get footnote label for display
    const footnoteLabel = block.meta?.footnoteLabel || block.meta?.footnoteId || '?';

    return (
      <KeyboardHandler block={block} controller={controller} cursorPosition={cursorPosition}>
        {({ onKeyPress, preventNewlines }: { onKeyPress: (event: any) => void; preventNewlines?: boolean }) => (
          <Animated.View
            style={[
              styles.container,
              style,
              {
                borderLeftColor: animatedBorderColor,
                backgroundColor: animatedBackgroundColor,
              },
            ]}
          >
            <Animated.Text style={styles.label}>[^{footnoteLabel}]:</Animated.Text>
            <FormattedTextInput
              ref={inputRef}
              value={block.content}
              onChangeText={handleTextChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onSelectionChange={handleSelectionChange}
              onKeyPress={onKeyPress}
              onFootnotePress={onFootnotePress}
              placeholder="Footnote text..."
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
  }
);

FootnoteComponent.displayName = 'FootnoteComponent';

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginVertical: BLOCK_SPACING.marginVertical,
      paddingLeft: BLOCK_SPACING.paddingLeft,
      paddingRight: BLOCK_SPACING.paddingRight,
      paddingVertical: BLOCK_SPACING.paddingVertical,
      borderLeftWidth: BLOCK_SPACING.borderWidth,
      borderLeftColor: 'rgba(0, 0, 0, 0)',
      backgroundColor: 'transparent',
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginRight: 8,
      fontWeight: '600',
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      backgroundColor: 'transparent',
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
  });
};

/**
 * Footnote block plugin
 */
export class FootnotePlugin extends BlockPlugin {
  readonly type = 'block';
  readonly id = 'footnote';
  readonly name = 'Footnote';
  readonly version = '1.0.0';
  readonly description = 'Footnote definition block';
  readonly blockType = 'footnote';
  readonly component = FootnoteComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    handleBackspace: this.handleBackspace.bind(this),
    getActions: this.getActions.bind(this),
  };

  readonly markdownSyntax = {
    patterns: {
      // Matches: [^id]: Footnote text
      block: /^\[\^([^\]]+)\]:\s+(.+)$/,
    },
    priority: 50, // Higher than paragraph
  };

  readonly toolbar = {
    icon: 'number',
    label: 'Footnote',
    shortcut: 'Ctrl+Alt+F',
    group: 'text',
  };

  readonly settings = {
    allowedParents: ['root'] as EditorBlockType[],
    validation: {
      maxLength: 1000,
    },
    defaultMeta: {},
  };

  protected handleEnter(
    block: EditorBlock,
    allBlocks?: EditorBlock[],
    currentIndex?: number
  ): EditorBlock | EditorBlock[] | null {
    // Convert to paragraph on Enter
    const newParagraph: EditorBlock = {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {},
    };
    return [block, newParagraph];
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    if (block.content.trim() === '') {
      return null; // Let KeyboardHandler handle block deletion
    }
    return null;
  }

  protected transformContent(content: string): string {
    return content.trim();
  }

  public getActions(block: EditorBlock) {
    return super.getActions(block);
  }
}
