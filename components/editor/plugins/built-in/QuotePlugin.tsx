import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { BlockPlugin } from '../../types/PluginTypes';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';

/**
 * Quote block component
 */
const QuoteComponent: React.FC<BlockComponentProps> = ({
  block,
  onUpdate,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
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
          <TextInput
            style={styles.textInput}
            value={block.content}
            onChangeText={handleTextChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder="Enter quote..."
            placeholderTextColor="#666"
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
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
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  quoteContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#6c757d',
    borderRadius: 4,
    padding: 16,
  },
  selected: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  editing: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
  quoteMark: {
    marginRight: 12,
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 32,
    color: '#6c757d',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#495057',
    fontStyle: 'italic',
    minHeight: 40,
  },
  attribution: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  author: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  source: {
    fontSize: 12,
    color: '#868e96',
    marginTop: 2,
  },
});

/**
 * Quote block plugin
 */
export class QuotePlugin implements BlockPlugin {
  readonly type = 'block';
  readonly id = 'quote';
  readonly name = 'Quote';
  readonly version = '1.0.0';
  readonly description = 'Quote blocks for highlighting important text';
  readonly blockType = 'quote';
  readonly component = QuoteComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    handleBackspace: this.handleBackspace.bind(this),
    getActions: this.getActions.bind(this)
  };

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