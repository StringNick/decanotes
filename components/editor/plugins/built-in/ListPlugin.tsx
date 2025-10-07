import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { BlockComponentProps, BlockPlugin, EnhancedKeyboardResult } from '../../types/PluginTypes';

type ListType = 'ordered' | 'unordered';

// Global cursor position tracking for list blocks
const listCursorPositions: { [blockId: string]: number } = {};

// Export function to get cursor position for a block
export const getListCursorPosition = (blockId: string): number => {
  return listCursorPositions[blockId] || 0;
};

/**
 * List block component with modern dark theme support
 */
const ListComponent: React.FC<BlockComponentProps> = ({
  block,
  onBlockChange,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const listType = (block.meta?.listType as ListType) || 'unordered';
  const level = block.meta?.level || 0;
  const index = block.meta?.index || 1;

  const [cursorPosition, setCursorPosition] = useState(0);

  // Get the plugin instance and controller (memoized to prevent recreation on every render)
  const controller = useMemo(() => {
    const pluginInstance = new ListPlugin();
    return pluginInstance.controller;
  }, []);

  const handleTextChange = (text: string) => {
    onBlockChange({ content: text });
  };

  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    const position = selection.start;
    setCursorPosition(position);
    // Store cursor position globally so handleBackspace can access it
    listCursorPositions[block.id] = position;
  };

  const toggleListType = () => {
    onBlockChange({
      meta: {
        ...block.meta,
        listType: listType === 'ordered' ? 'unordered' : 'ordered'
      }
    });
  };

  const renderBullet = () => {
    if (listType === 'ordered') {
      return (
        <Text style={styles.bullet}>
          {index}.
        </Text>
      );
    } else {
      const bullets = ['•', '◦', '▪'];
      const bulletIndex = Math.min(level, bullets.length - 1);
      return (
        <Text style={styles.bullet}>
          {bullets[bulletIndex]}
        </Text>
      );
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
          <View style={[
            styles.listItem,
            { marginLeft: level * 20 },
            isSelected && styles.selected,
            isEditing && styles.editing
          ]}>
            <TouchableOpacity
              style={styles.bulletContainer}
              onPress={toggleListType}
            >
              {renderBullet()}
            </TouchableOpacity>

            <FormattedTextInput
              value={block.content}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyPress={onKeyPress}
              placeholder="List item"
              placeholderTextColor={colors.textSecondary}
              isSelected={isSelected}
              isEditing={isEditing}
              multiline
              textAlignVertical="center"
              scrollEnabled={false}
              preventNewlines={preventNewlines}
              style={styles.textInput}
            />
          </View>
        </View>
      )}
    </KeyboardHandler>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      marginVertical: 0,
      paddingVertical: 2,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
    },
    selected: {
      // Minimal visual feedback for selection
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
      borderWidth: 1,
    },
    bulletContainer: {
      width: 28,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 0,
    },
    bullet: {
      fontSize: 16,
      color: colors.accent,
      fontWeight: '600',
      minWidth: 20,
      textAlign: 'center',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 0,
      minHeight: 24,
    },
  });
};

/**
 * List block plugin
 */
export class ListPlugin implements BlockPlugin {
  readonly type = 'block';
  readonly id = 'list';
  readonly name = 'List';
  readonly version = '1.0.0';
  readonly description = 'Ordered and unordered lists with nesting support';
  readonly blockType = 'list';
  readonly component = ListComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    handleKeyPress: this.handleKeyPress.bind(this),
    onCreate: this.onCreate.bind(this),
    getActions: this.getActions.bind(this)
  };

  readonly markdownSyntax = {
    patterns: {
      block: /^(\s*)([-*+]|\d+\.)\s+(.+)$/
    },
    priority: 80
  };

  readonly toolbar = {
    icon: 'list',
    label: 'List',
    shortcut: 'Ctrl+Shift+L',
    group: 'text',
    variants: [
      { label: 'Bullet List', shortcut: 'Ctrl+Shift+8', meta: { listType: 'unordered' } },
      { label: 'Numbered List', shortcut: 'Ctrl+Shift+7', meta: { listType: 'ordered' } },
    ]
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout', 'list'] as EditorBlockType[],
    validation: {},
    defaultMeta: {
      listType: 'unordered',
      level: 0,
      index: 1
    }
  };

  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Note: Tab indentation is not currently supported due to architectural limitations
    // handleKeyPress can only return boolean, not updated blocks
    // Tab functionality would need to be implemented at the component level
    return false;
  }

  protected handleEnter(block: EditorBlock, allBlocks?: EditorBlock[], currentIndex?: number): EditorBlock | EditorBlock[] | EnhancedKeyboardResult | null {
    // If content is empty, convert to paragraph
    if (block.content.trim() === '') {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }

    // Create new list item
    const listType = block.meta?.listType || 'unordered';
    const level = block.meta?.level || 0;
    const currentIndexValue = listType === 'ordered' ? (block.meta?.index || 1) : 1;

    const newListItem: EditorBlock = {
      id: generateId(),
      type: 'list',
      content: '',
      meta: {
        listType,
        level,
        index: currentIndexValue + 1
      }
    };

    // For ordered lists, we need to update the numbering of subsequent items
    if (listType === 'ordered' && allBlocks && currentIndex !== undefined) {
      const updates: { blockId: string; updates: Partial<EditorBlock> }[] = [];
      
      // Find all subsequent list items at the same level and update their indices
      for (let i = currentIndex + 2; i < allBlocks.length; i++) {
        const subsequentBlock = allBlocks[i];
        
        // Check if it's a list item at the same level
        if (subsequentBlock.type === 'list' && 
            subsequentBlock.meta?.listType === 'ordered' && 
            subsequentBlock.meta?.level === level) {
          
          // Update the index by incrementing it
          const newIndex = (subsequentBlock.meta?.index || 1) + 1;
          updates.push({
            blockId: subsequentBlock.id,
            updates: {
              meta: {
                ...subsequentBlock.meta,
                index: newIndex
              }
            }
          });
        } else if (subsequentBlock.type !== 'list' || 
                   subsequentBlock.meta?.level !== level) {
          // Stop when we encounter a different block type or level
          break;
        }
      }
      
      return {
        newBlocks: [block, newListItem],
        updates,
        focusBlockId: newListItem.id
      };
    }
    
    // For unordered lists, just return the blocks
    return [block, newListItem];
  }


  protected transformContent(content: string): string {
    // Remove markdown list syntax if present
    return content.replace(/^\s*([-*+]|\d+\.)\s+/, '').trim();
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = { ...block };

    // Parse markdown syntax if present
    const match = newBlock.content.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (match) {
      const indentation = match[1];
      const marker = match[2];
      const content = match[3];

      const level = Math.floor(indentation.length / 2); // 2 spaces per level
      const listType = /\d+\./.test(marker) ? 'ordered' : 'unordered';
      const index = listType === 'ordered' ? parseInt(marker) : 1;

      newBlock.content = content;
      newBlock.meta = {
        ...newBlock.meta,
        listType,
        level,
        index
      };
    }

    // Ensure list properties are set
    if (!newBlock.meta?.listType) {
      newBlock.meta = {
        ...newBlock.meta,
        listType: 'unordered',
        level: 0,
        index: 1
      };
    }

    return newBlock;
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    // Note: ListPlugin implements BlockPlugin but doesn't extend it
    const actions: any[] = [];
    
    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: (block: EditorBlock, context: any) => {
        context.duplicateBlock();
      }
    });
    
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      style: 'destructive',
      handler: (block: EditorBlock, context: any) => {
        context.deleteBlock();
      }
    });
    
    return actions;
  }

  /**
   * Create list item with specific properties
   */
  createListItem(
    content: string = '',
    listType: ListType = 'unordered',
    level: number = 0,
    index: number = 1
  ): EditorBlock {
    return {
      id: generateId(),
      type: 'list',
      content,
      meta: {
        listType,
        level: Math.max(0, Math.min(5, level)),
        index: Math.max(1, index)
      }
    };
  }

  /**
   * Parse markdown list syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;

    const indentation = match[1];
    const marker = match[2];
    const content = match[3];

    const level = Math.floor(indentation.length / 2);
    const listType = /\d+\./.test(marker) ? 'ordered' : 'unordered';
    const index = listType === 'ordered' ? parseInt(marker) : 1;

    return {
      id: generateId(),
      type: 'list',
      content,
      meta: {
        listType,
        level,
        index
      }
    };
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const listType = block.meta?.listType || 'unordered';
    const level = block.meta?.level || 0;
    const index = block.meta?.index || 1;

    const indentation = '  '.repeat(level);
    const marker = listType === 'ordered' ? `${index}.` : '-';

    return `${indentation}${marker} ${block.content}`;
  }

  /**
   * Reorder list indices
   */
  reorderList(blocks: EditorBlock[]): EditorBlock[] {
    const listBlocks = blocks.filter(block => block.type === 'list');
    let currentIndex = 1;

    return listBlocks.map(block => {
      if (block.meta?.listType === 'ordered') {
        const level = block.meta?.level || 0;
        if (level === 0) {
          block.meta.index = currentIndex++;
        }
      }
      return block;
    });
  }
}