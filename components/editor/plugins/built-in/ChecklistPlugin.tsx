import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

// Global cursor position tracking for checklist blocks
const checklistCursorPositions: { [blockId: string]: number } = {};

// Export function to get cursor position for a block
export const getChecklistCursorPosition = (blockId: string): number => {
  return checklistCursorPositions[blockId] || 0;
};

/**
 * Checklist block component with modern dark theme support
 */
const ChecklistComponent: React.FC<BlockComponentProps> = ({
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
  const isChecked = block.meta?.checked || false;
  const level = block.meta?.level || 0;
  const [cursorPosition, setCursorPosition] = useState(0);

  // Get the plugin instance and controller
  // Note: In a real implementation, this would be passed from BlockRenderer
  const pluginInstance = ChecklistPlugin.getInstance();
  const controller = pluginInstance.controller;

  const handleTextChange = (text: string) => {
    // Check if this is a backspace at position 0 (content deletion at start)
    // Only trigger when cursor was at position 0 and content is being deleted
    if (text.length < block.content.length && cursorPosition === 0) {
      // Convert checklist back to paragraph with markdown syntax
      const checkedSymbol = isChecked ? 'x' : ' ';
      const level = block.meta?.level || 0;
      const indent = '  '.repeat(level);

      onBlockChange({
        type: 'paragraph' as EditorBlockType,
        content: `${indent}- [${checkedSymbol}] ${block.content}`,
        meta: {}
      });
      return;
    }

    onBlockChange({ content: text });
  };

  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    const position = selection.start;
    setCursorPosition(position);
    // Store cursor position globally so handleBackspace can access it
    checklistCursorPositions[block.id] = position;
  };

  const toggleChecked = () => {
    onBlockChange({
      ...block,
      meta: {
        ...block.meta,
        checked: !isChecked
      }
    });
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
            styles.checklistItem,
            { marginLeft: level * 20 },
            isSelected && styles.selected,
            isEditing && styles.editing
          ]}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={toggleChecked}
            >
              <View style={[
                styles.checkbox,
                isChecked && styles.checkedBox
              ]}>
                {isChecked && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
            </TouchableOpacity>

            <FormattedTextInput
              value={block.content}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyPress={onKeyPress}
                          placeholder="Checklist item"
            placeholderTextColor={colors.textSecondary}
              isSelected={isSelected}
              isEditing={isEditing}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              preventNewlines={preventNewlines}
              style={[
                styles.textInput,
                isChecked && styles.checkedText
              ]}
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
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      minHeight: 39,
    },
    selected: {
      // backgroundColor: colors.blue + '20',
      // borderWidth: 1,
      // borderColor: colors.teal,
      // borderRadius: 8,
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
      borderWidth: 2,
      // shadowColor: colors.teal,
      // shadowOffset: { width: 0, height: 2 },
      // shadowOpacity: 0.2,
      // shadowRadius: 8,
      // elevation: 3,
      borderRadius: 8,
    },
    checkboxContainer: {
      paddingRight: 12,
      paddingVertical: 0,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 27,
    },
    checkbox: {
      width: 15,
      height: 15,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    checkedBox: {
      backgroundColor: colors.teal,
      borderColor: colors.teal,
    },
    checkmark: {
      color: colors.background,
      fontSize: 12,
      fontFamily: 'AlbertSans_700Bold',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      lineHeight: 24,
      color: colors.text,
      paddingVertical: 0,
      paddingHorizontal: 8,
      minHeight: 27,
      textAlignVertical: 'center',
    },
    checkedText: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
      opacity: 0.7,
    },
  });
};

/**
 * Checklist block plugin
 */
export class ChecklistPlugin implements BlockPlugin {
  readonly id = 'checklist';
  readonly name = 'Checklist';
  readonly version = '1.0.0';
  readonly type = 'block' as const;
  readonly description = 'Interactive checklist with checkboxes';
  readonly blockType = 'checklist';
  readonly component = ChecklistComponent;
  readonly controller: any;

  private static instance: ChecklistPlugin;

  constructor() {
    this.controller = this.createController();
  }

  static getInstance(): ChecklistPlugin {
    if (!ChecklistPlugin.instance) {
      ChecklistPlugin.instance = new ChecklistPlugin();
    }
    return ChecklistPlugin.instance;
  }

  readonly markdownSyntax = {
    patterns: {
      block: /^(\s*)- \[([ x])\]\s+(.+)$/
    },
    priority: 85
  };

  readonly toolbar = {
    icon: 'check-square',
    label: 'Checklist',
    shortcut: 'Ctrl+Shift+C',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout', 'checklist'] as EditorBlockType[],
    validation: {
      required: ['content'] as string[]
    },
    defaultMeta: {
      checked: false,
      level: 0
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

    // Handle Ctrl+Enter to toggle checked state
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.toggleChecked(block);
      return true;
    }

    return false;
  }

  /**
   * Handle Enter key
   */
  protected handleEnter(block: EditorBlock, allBlocks?: EditorBlock[], currentIndex?: number): EditorBlock | EditorBlock[] | null {
    // If content is empty, convert to paragraph
    if (block.content.trim() === '') {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }
    
    // Create a new checklist item with the same indentation level
    const level = block.meta?.level || 0;
    
    const newItem: EditorBlock = {
      id: this.generateId(),
      type: 'checklist',
      content: '',
      meta: {
        checked: false,
        level: level
      }
    };

    // Return both blocks - the current one stays, and we add a new one after it
    return [block, newItem];
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Get the current cursor position for this block
    const cursorPosition = checklistCursorPositions[block.id] || 0;

    // If checklist item is empty and at level 0, convert to paragraph
    if (block.content.trim() === '' && (block.meta?.level || 0) === 0) {
      return {
        ...block,
        type: 'paragraph',
        meta: {}
      };
    }

    // If checklist item is empty and indented, decrease indentation
    if (block.content.trim() === '' && (block.meta?.level || 0) > 0) {
      const newLevel = Math.max(0, (block.meta?.level || 0) - 1);
      return {
        ...block,
        meta: {
          ...block.meta,
          level: newLevel
        }
      };
    }

    // Convert checklist back to paragraph with markdown syntax when backspace at beginning
    if (cursorPosition === 0) {
      const checked = block.meta?.checked || false;
      const level = block.meta?.level || 0;
      const indent = '  '.repeat(level);
      const checkState = checked ? 'x' : ' ';

      return {
        ...block,
        type: 'paragraph',
        content: `${indent}- [${checkState}] ${block.content}`,
        meta: {}
      };
    }

    // For normal backspace operations (not at beginning), let default behavior handle it
    return null;
  }



  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = { ...block };

    // Parse markdown syntax if present
    const match = newBlock.content.match(/^(\s*)- \[([ x])\]\s+(.+)$/);
    if (match) {
      const indentation = match[1];
      const checkState = match[2];
      const content = match[3];

      const level = Math.floor(indentation.length / 2); // 2 spaces per level
      const checked = checkState === 'x';

      newBlock.content = content;
      newBlock.meta = {
        ...newBlock.meta,
        checked,
        level
      };
    }

    // Ensure checklist properties are set
    if (newBlock.meta?.checked === undefined) {
      newBlock.meta = {
        ...newBlock.meta,
        checked: false,
        level: newBlock.meta?.level || 0
      };
    }

    return newBlock;
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    const isChecked = block.meta?.checked || false;
    const level = block.meta?.level || 0;

    // Add checklist-specific actions
    actions.unshift({
      id: 'toggle-checked',
      label: isChecked ? 'Uncheck Item' : 'Check Item',
      icon: isChecked ? 'square' : 'check-square',
      handler: (block: EditorBlock) => {
      }
    });

    if (level > 0) {
      actions.unshift({
        id: 'decrease-indent',
        label: 'Decrease Indent',
        icon: 'outdent',
        handler: (block: EditorBlock) => {
        }
      });
    }

    if (level < 5) {
      actions.unshift({
        id: 'increase-indent',
        label: 'Increase Indent',
        icon: 'indent',
        handler: (block: EditorBlock) => {
        }
      });
    }

    actions.unshift({
      id: 'convert-to-list',
      label: 'Convert to List',
      icon: 'list',
      handler: (block: EditorBlock) => {
      }
    });

    return actions;
  }

  /**
   * Update checklist item level
   */
  private updateBlockLevel(block: EditorBlock, level: number) {
  }

  /**
   * Toggle checked state
   */
  private toggleChecked(block: EditorBlock) {
  }

  /**
   * Generate a unique ID for blocks
   */
  generateId(): string {
    return generateId();
  }

  /**
   * Create the block controller
   */
  protected createController(): any {
    return {
      validateContent: this.validateContent.bind(this),
      transformContent: this.transformContent.bind(this),
      handleKeyPress: this.handleKeyPress.bind(this),
      handleEnter: this.handleEnter.bind(this),
      handleBackspace: this.handleBackspace.bind(this),
      onCreate: this.onCreate.bind(this),
      onUpdate: this.onUpdate.bind(this),
      onDelete: this.onDelete.bind(this),
      getActions: this.getActions.bind(this)
    };
  }

  /**
   * Validate content
   */
  protected validateContent(content: string): boolean {
    return true;
  }

  /**
   * Transform content
   */
  protected transformContent(content: string): string {
    // Remove markdown checklist syntax if present
    return content.replace(/^\s*- \[([ x])\]\s+/, '').trim();
  }

  /**
   * Handle update
   */
  protected onUpdate(oldBlock: EditorBlock, newBlock: EditorBlock): EditorBlock {
    return newBlock;
  }

  /**
   * Handle delete
   */
  protected onDelete(block: EditorBlock): void {
    // Default implementation
  }

  /**
   * Check if plugin can handle block type
   */
  canHandle(blockType: string): boolean {
    return blockType === this.blockType;
  }

  /**
   * Get plugin metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      description: this.description,
      blockType: this.blockType
    };
  }

  /**
   * Create a new block
   */
  createBlock(content: string = '', meta: any = {}): EditorBlock {
    return {
      id: this.generateId(),
      type: 'checklist' as EditorBlockType,
      content,
      meta
    };
  }

  /**
   * Create checklist item with specific properties
   */
  createChecklistItem(
    content: string = '',
    checked: boolean = false,
    level: number = 0
  ): EditorBlock {
    return this.createBlock(content, {
      checked,
      level: Math.max(0, Math.min(5, level))
    });
  }

  /**
   * Parse markdown checklist syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;

    const indentation = match[1];
    const checkState = match[2];
    const content = match[3];

    const level = Math.floor(indentation.length / 2);
    const checked = checkState === 'x';

    return this.createChecklistItem(content, checked, level);
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const checked = block.meta?.checked || false;
    const level = block.meta?.level || 0;

    const indentation = '  '.repeat(level);
    const checkState = checked ? 'x' : ' ';

    return `${indentation}- [${checkState}] ${block.content}`;
  }

  /**
   * Get checklist statistics
   */
  getChecklistStats(blocks: EditorBlock[]): { total: number; checked: number; percentage: number } {
    const checklistBlocks = blocks.filter(block => block.type === 'checklist');
    const total = checklistBlocks.length;
    const checked = checklistBlocks.filter(block => block.meta?.checked).length;
    const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

    return { total, checked, percentage };
  }

  /**
   * Check all items in a checklist
   */
  checkAllItems(blocks: EditorBlock[]): EditorBlock[] {
    return blocks.map(block => {
      if (block.type === 'checklist') {
        return {
          ...block,
          meta: {
            ...block.meta,
            checked: true
          }
        };
      }
      return block;
    });
  }

  /**
   * Uncheck all items in a checklist
   */
  uncheckAllItems(blocks: EditorBlock[]): EditorBlock[] {
    return blocks.map(block => {
      if (block.type === 'checklist') {
        return {
          ...block,
          meta: {
            ...block.meta,
            checked: false
          }
        };
      }
      return block;
    });
  }
}