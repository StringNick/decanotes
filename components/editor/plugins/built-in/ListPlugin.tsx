import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

type ListType = 'ordered' | 'unordered';

// Global cursor position tracking for list blocks
const listCursorPositions: { [blockId: string]: number } = {};

// Export function to get cursor position for a block
export const getListCursorPosition = (blockId: string): number => {
  return listCursorPositions[blockId] || 0;
};

/**
 * List block component
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
  const listType = (block.meta?.listType as ListType) || 'unordered';
  const level = block.meta?.level || 0;
  const index = block.meta?.index || 1;

  const [cursorPosition, setCursorPosition] = useState(0);

  const handleTextChange = (text: string) => {
    // so we can use to convert to checklist
    const listType = block.meta?.listType || 'unordered';
    const level = block.meta?.level || 0;
    const indent = '  '.repeat(level);
    const marker = listType === 'ordered' ? '1.' : '-';
    const content = `${indent}${marker} ${text}`;

    onBlockChange({
      content: content,
    });
  };

  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    const position = selection.start;
    setCursorPosition(position);
    // Store cursor position globally so handleBackspace can access it
    listCursorPositions[block.id] = position;
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Backspace' && cursorPosition === 0) {
      // Convert list back to paragraph with markdown syntax when backspace at beginning
      const listType = block.meta?.listType || 'unordered';
      const level = block.meta?.level || 0;
      const indent = '  '.repeat(level);
      const marker = listType === 'ordered' ? '1.' : '-';
      const content = `${indent}${marker}${block.content}`;

      onBlockChange({
        type: 'paragraph' as EditorBlockType,
        content: content,
        meta: {}
      });

      event.preventDefault();
      return;
    }
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

        <TextInput
          style={styles.textInput}
          value={block.content}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
          placeholder="List item"
          placeholderTextColor="#999"
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  selected: {
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
  },
  editing: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 4,
  },
  bulletContainer: {
    width: 24,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  bullet: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    minWidth: 20,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 0,
    minHeight: 32,
  },
});

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
    // Handle Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      const currentLevel = block.meta?.level || 0;
      const newLevel = event.shiftKey
        ? Math.max(0, currentLevel - 1)
        : Math.min(5, currentLevel + 1);

      this.updateBlockLevel(block, newLevel);
      return true;
    }

    return false;
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // If content is empty, convert to paragraph
    if (block.content.trim() === '') {
      return {
        id: generateId(),
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }

    // Create new list item
    const listType = block.meta?.listType || 'unordered';
    const level = block.meta?.level || 0;
    const index = listType === 'ordered' ? (block.meta?.index || 1) + 1 : 1;

    return {
      id: generateId(),
      type: 'list',
      content: '',
      meta: {
        listType,
        level,
        index
      }
    };
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
    const actions: any[] = [];
    const listType = block.meta?.listType || 'unordered';
    const level = block.meta?.level || 0;

    // Add list-specific actions
    actions.unshift({
      id: 'toggle-list-type',
      label: listType === 'ordered' ? 'Convert to Bullet List' : 'Convert to Numbered List',
      icon: listType === 'ordered' ? 'list-ul' : 'list-ol',
      handler: (block: EditorBlock) => {
        console.log('Toggle list type:', block.id);
      }
    });

    if (level > 0) {
      actions.unshift({
        id: 'decrease-indent',
        label: 'Decrease Indent',
        icon: 'outdent',
        handler: (block: EditorBlock) => {
          console.log('Decrease indent:', block.id);
        }
      });
    }

    if (level < 5) {
      actions.unshift({
        id: 'increase-indent',
        label: 'Increase Indent',
        icon: 'indent',
        handler: (block: EditorBlock) => {
          console.log('Increase indent:', block.id);
        }
      });
    }

    return actions;
  }

  /**
   * Update list item level
   */
  private updateBlockLevel(block: EditorBlock, level: number) {
    console.log(`Update block ${block.id} to level ${level}`);
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