import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';

/**
 * Quote block component with multi-line and depth support
 */
const QuoteComponent = forwardRef<TextInput, BlockComponentProps>(({
  block,
  onBlockChange,
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
  const isDark = colorScheme === 'dark';
  const [cursorPosition, setCursorPosition] = useState(0);

  // Expose the TextInput methods through ref
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = event.nativeEvent.key;

    // Handle backspace at start of text to decrease depth
    if (key === 'Backspace' && cursorPosition === 0 && block.content.length > 0) {
      event.preventDefault();

      const currentDepth = block.meta?.depth || 1;

      if (currentDepth === 1) {
        // Convert to paragraph when at depth 1
        if (onBlockChange) {
          onBlockChange({
            type: 'paragraph' as EditorBlockType,
            meta: {}
          });
        } else if (onUpdate) {
          onUpdate({
            ...block,
            type: 'paragraph',
            meta: {}
          });
        }
      } else {
        // Decrease depth
        if (onBlockChange) {
          onBlockChange({
            meta: { ...block.meta, depth: currentDepth - 1 }
          });
        } else if (onUpdate) {
          onUpdate({
            ...block,
            meta: { ...block.meta, depth: currentDepth - 1 }
          });
        }
      }
    }
  };

  const handleTextChange = (text: string) => {
    // Check if user is trying to adjust depth with > at start
    const depthMatch = text.match(/^(>+)\s*(.*)$/);

    if (depthMatch) {
      // User typed > at the start - adjust depth
      const newDepth = Math.min(depthMatch[1].length + depth, 5);
      const cleanContent = depthMatch[2];

      if (onBlockChange) {
        onBlockChange({
          content: cleanContent,
          meta: { ...block.meta, depth: newDepth }
        });
      } else if (onUpdate) {
        onUpdate({
          ...block,
          content: cleanContent,
          meta: { ...block.meta, depth: newDepth }
        });
      }
      return;
    }

    // Check if user is trying to decrease depth with < at start
    const decreaseMatch = text.match(/^<+\s*(.*)$/);
    if (decreaseMatch) {
      const decreaseAmount = text.match(/^<+/)?.[0].length || 1;
      const newDepth = Math.max(depth - decreaseAmount, 1);
      const cleanContent = decreaseMatch[1];

      if (onBlockChange) {
        onBlockChange({
          content: cleanContent,
          meta: { ...block.meta, depth: newDepth }
        });
      } else if (onUpdate) {
        onUpdate({
          ...block,
          content: cleanContent,
          meta: { ...block.meta, depth: newDepth }
        });
      }
      return;
    }

    // Normal text update
    if (onBlockChange) {
      onBlockChange({ content: text });
    } else if (onUpdate) {
      onUpdate({
        ...block,
        content: text
      });
    }
  };

  // Get depth level (default to 1)
  const depth = Math.min(Math.max(block.meta?.depth || 1, 1), 5); // Max depth of 5
  const author = block.meta?.author;
  const source = block.meta?.source;
  
  // Memoize styles based on depth and theme
  const styles = useMemo(() => getStyles(colorScheme ?? 'light', depth), [colorScheme, depth]);
  
  // Calculate depth bar color - same for all depths
  const barColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';

  return (
    <View style={[styles.container, style]}>
      <View style={[
        styles.quoteContainer,
        isSelected && styles.selected,
        isEditing && styles.editing
      ]}>
        {/* Minimal vertical bar for all depths */}
        <View style={styles.quoteMarkMinimal}>
          <View style={[styles.quoteBarMinimal, { backgroundColor: barColor }]} />
        </View>
        
        <View style={styles.content}>
          <FormattedTextInput
            ref={inputRef}
            value={block.content}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            onKeyPress={handleKeyPress}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={`Quote... (depth ${depth}, backspace at start to decrease depth)`}
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

const getStyles = (colorScheme: 'light' | 'dark', depth: number = 1) => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  // Calculate indentation based on depth
  const indentation = (depth - 1) * 12;

  return StyleSheet.create({
    container: {
      marginVertical: 4,
      marginLeft: indentation,
    },
    quoteContainer: {
      flexDirection: 'row',
      backgroundColor: 'transparent',
      paddingVertical: 2,
      paddingLeft: 8,
      paddingRight: 4,
    },
    selected: {
      backgroundColor: 'transparent',
    },
    editing: {
      backgroundColor: 'transparent',
    },
    quoteMarkMinimal: {
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      width: 2,
    },
    quoteBarMinimal: {
      width: 2,
      height: '100%',
      minHeight: 24,
    },
    content: {
      flex: 1,
    },
    textInput: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      fontStyle: 'normal',
      minHeight: 24,
      paddingVertical: 0,
      opacity: 0.9,
    },
    attribution: {
      marginTop: 12,
      alignItems: 'flex-end',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
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
      block: /^(>+)\s*(.*)$/  // Match one or more '>' followed by optional content
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
    validation: {
      maxLength: 10000
    },
    defaultMeta: {
      depth: 1
    }
  };

  constructor() {
    super();
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    const depth = block.meta?.depth || 1;
    
    // If the current quote is empty, exit quote mode and create paragraph
    if (block.content.trim() === '') {
      return {
        id: generateId(),
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }
    
    // Create new quote block with same depth
    return [
      block, // Keep current block
      {
        id: generateId(),
        type: 'quote',
        content: '',
        meta: { depth }
      }
    ];
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    const depth = block.meta?.depth || 1;
    
    // Only convert to paragraph at depth 1 with empty content
    if (depth === 1 && block.content.trim() === '') {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }
    
    return block;
  }

  protected transformContent(content: string): string {
    // Remove markdown quote syntax if present (handles multiple levels)
    return content.replace(/^>+\s*/, '').trim();
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    return super.getActions(block);
  }

  /**
   * Create quote block with author, source, and depth
   */
  createQuoteBlock(content: string = '', depth: number = 1, author?: string, source?: string): EditorBlock {
    const meta: Record<string, any> = {
      depth: Math.min(Math.max(depth, 1), 5) // Clamp between 1 and 5
    };
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
   * Parse markdown quote syntax with depth support
   * Examples:
   * > depth 1
   * >> depth 2
   * >>> depth 3
   * 
   * Multi-line quotes with same depth are combined:
   * > line 1
   * > line 2
   * becomes one block with content "line 1\nline 2"
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const quoteMarkers = match[1]; // The '>' characters
    const content = match[2]; // The actual content
    const depth = quoteMarkers.length; // Count the number of '>'
    
    return this.createQuoteBlock(content, depth);
  }

  /**
   * Convert block to markdown with depth support
   * Handles multi-line content properly
   */
  toMarkdown(block: EditorBlock): string {
    const depth = block.meta?.depth || 1;
    const quotePrefix = '>'.repeat(depth);
    const lines = block.content.split('\n').map((line: string) => {
      // Handle empty lines
      if (line.trim() === '') {
        return quotePrefix;
      }
      return `${quotePrefix} ${line}`;
    });
    return lines.join('\n');
  }

  /**
   * Increase quote depth
   */
  increaseDepth(block: EditorBlock): EditorBlock {
    const currentDepth = block.meta?.depth || 1;
    return {
      ...block,
      meta: {
        ...block.meta,
        depth: Math.min(currentDepth + 1, 5)
      }
    };
  }

  /**
   * Decrease quote depth
   */
  decreaseDepth(block: EditorBlock): EditorBlock {
    const currentDepth = block.meta?.depth || 1;
    if (currentDepth <= 1) {
      // Convert to paragraph when depth reaches 1
      return {
        ...block,
        type: 'paragraph',
        meta: {}
      };
    }
    return {
      ...block,
      meta: {
        ...block.meta,
        depth: currentDepth - 1
      }
    };
  }
}