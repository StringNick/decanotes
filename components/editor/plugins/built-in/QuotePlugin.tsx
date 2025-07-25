import React, { memo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BlockPlugin } from '../BlockPlugin';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

/**
 * Quote block component with modern dark theme support
 */
const QuoteComponent: React.FC<BlockComponentProps> = memo(({
  block,
  onUpdate,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

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
            value={block.content}
            onChangeText={handleTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter quote..."
            placeholderTextColor={colors.textMuted}
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.meta?.author === nextProps.block.meta?.author &&
    prevProps.block.meta?.source === nextProps.block.meta?.source &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.style === nextProps.style
  );
});

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    quoteContainer: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundSecondary,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
      borderRadius: 12,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selected: {
      backgroundColor: colors.accentLight,
      borderColor: colors.borderFocus,
      borderWidth: 2,
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 2,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    quoteMark: {
      marginRight: 16,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 4,
    },
    quoteIcon: {
      fontSize: 28,
      color: colors.accent,
      fontWeight: '300',
      opacity: 0.7,
    },
    content: {
      flex: 1,
    },
    textInput: {
      fontSize: 16,
      lineHeight: 26,
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
    const actions: any[] = [];
    
    // Add quote-specific actions
    actions.unshift({
      id: 'add-author',
      label: 'Add Author',
      icon: 'user',
      handler: (block: EditorBlock) => {
        console.log('Add author to quote:', block.id);
      }
    });
    
    actions.unshift({
      id: 'add-source',
      label: 'Add Source',
      icon: 'link',
      handler: (block: EditorBlock) => {
        console.log('Add source to quote:', block.id);
      }
    });
    
    return actions;
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