import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';

/**
 * Quote block component with modern dark theme support
 */
const QuoteComponent = forwardRef<TextInput, BlockComponentProps>(({  
  block,
  onUpdate,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}, ref) => {
  const inputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  
  // Expose the TextInput methods through ref
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const handleTextChange = (text: string) => {
    onUpdate?.({
      ...block,
      content: text
    });
  };

  const author = block.meta?.author;
  const source = block.meta?.source;

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.quoteContainer,
        isSelected && styles.selected,
        isEditing && styles.editing
      ]}>
        <View style={styles.quoteMark}>
          <Text style={styles.quoteIcon}>"</Text>
        </View>
        
        <View style={styles.content}>
          <FormattedTextInput
            ref={inputRef}
            value={block.content}
            onChangeText={handleTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter quote..."
            placeholderTextColor={colors.textSecondary}
            isSelected={isSelected}
            isEditing={isEditing}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            style={styles.textInput}
          />
          
          {(author || source) && (
            <View style={styles.attribution}>
              {author && (
                <Text style={styles.author}>— {author}</Text>
              )}
              {source && (
                <Text style={styles.source}>{source}</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
});

QuoteComponent.displayName = 'QuoteComponent';

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    quoteContainer: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderLeftWidth: 2,
      borderLeftColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
      borderRadius: 8,
      padding: 16,
      borderWidth: 0,
    },
    selected: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    editing: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
    },
    quoteMark: {
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    quoteIcon: {
      fontSize: 24,
      color: colors.text,
      fontWeight: '300',
      opacity: 0.3,
    },
    content: {
      flex: 1,
    },
    textInput: {
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      lineHeight: 24,
      color: colors.text,
      fontStyle: 'italic',
      minHeight: 48,
      paddingVertical: 8,
    },
    attribution: {
      marginTop: 12,
      alignItems: 'flex-end',
    },
    author: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      fontStyle: 'normal',
    },
    source: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      fontStyle: 'normal',
    },
  });
};

/**
 * Quote block plugin
 */
export class QuotePlugin extends BlockPlugin {
  readonly id = 'quote';
  readonly name = 'Quote';
  readonly version = '1.0.0';
  readonly description = 'Quote blocks for highlighting important text';
  readonly blockType = 'quote';
  readonly component = QuoteComponent;

  readonly markdownSyntax = {
    patterns: {
      block: /^>\s+(.+)$/
    },
    priority: 75
  };

  readonly toolbar = {
    icon: 'quote-left',
    label: 'Quote',
    shortcut: 'Ctrl+Shift+.',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root', 'callout'] as EditorBlockType[],
    validation: {},
    defaultMeta: {}
  };

  constructor() {
    super();
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after quote
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Convert quote back to paragraph with markdown syntax when backspace at beginning
    return {
      ...block,
      type: 'paragraph',
      content: `> ${block.content}`,
      meta: {}
    };
  }

  protected transformContent(content: string): string {
    // Remove markdown quote syntax if present
    return content.replace(/^>\s+/, '').trim();
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    return super.getActions(block);
  }

  /**
   * Create quote block with author and source
   */
  createQuoteBlock(content: string = '', author?: string, source?: string): EditorBlock {
    const meta: Record<string, any> = {};
    if (author) meta.author = author;
    if (source) meta.source = source;
    
    return {
      id: generateId(),
      type: 'quote',
      content,
      meta
    };
  }

  /**
   * Parse markdown quote syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const content = match[1];
    return this.createQuoteBlock(content);
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const lines = block.content.split('\n').map((line: string) => `> ${line}`);
    return lines.join('\n');
  }
}