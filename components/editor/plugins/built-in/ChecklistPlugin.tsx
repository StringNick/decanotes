import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { KeyboardHandler } from '../../core/KeyboardHandler';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';
import { ANIMATION_CONFIG, getFocusColors } from '../../styles/blockStyles';

// Global cursor position tracking for checklist blocks
const checklistCursorPositions: { [blockId: string]: number } = {};

// Export function to get cursor position for a block
export const getChecklistCursorPosition = (blockId: string): number => {
  return checklistCursorPositions[blockId] || 0;
};

const CHECKLIST_INDICATOR_WIDTH = 4;
const CHECKLIST_INDICATOR_SPACING = 6;
const CHECKLIST_BASE_PADDING = 12;

const CHECKLIST_INDICATOR_COLORS = {
  light: [
    'rgba(37, 99, 235, 0.2)',
    'rgba(14, 165, 233, 0.2)',
    'rgba(34, 197, 94, 0.2)',
    'rgba(249, 115, 22, 0.18)',
    'rgba(168, 85, 247, 0.18)',
  ],
  dark: [
    'rgba(148, 193, 255, 0.35)',
    'rgba(56, 189, 248, 0.35)',
    'rgba(16, 185, 129, 0.35)',
    'rgba(249, 115, 22, 0.3)',
    'rgba(241, 171, 255, 0.35)',
  ],
};

type FocusableHandle = { focus: () => void };

/**
 * Checklist block component with modern dark theme support
 */
const ChecklistComponent = forwardRef<FocusableHandle, BlockComponentProps>(
  ({ block, onBlockChange, onFocus, onBlur, isSelected, isFocused, isEditing, style }, ref) => {
    const colorScheme = useColorScheme();
    const colors = Colors[colorScheme ?? 'light'];
    const styles = getStyles(colorScheme ?? 'light');
    const isChecked = block.meta?.checked || false;
    const level = block.meta?.level || 0;
    const [cursorPosition, setCursorPosition] = useState(0);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<TextInput>(null);

    // Determine if block should show focused state
    const shouldFocus = isFocused || isEditing;

    // Animate focus state changes
    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: shouldFocus ? 1 : 0,
        duration: ANIMATION_CONFIG.duration,
        useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
      }).start();
    }, [shouldFocus, animatedValue]);

    // Get animated colors
    const focusColors = getFocusColors(colorScheme ?? 'light', shouldFocus || false);
    const indicatorPalette = CHECKLIST_INDICATOR_COLORS[colorScheme ?? 'light'];
    const indicatorWidth =
      level > 0 ? level * (CHECKLIST_INDICATOR_WIDTH + CHECKLIST_INDICATOR_SPACING) - CHECKLIST_INDICATOR_SPACING : 0;

    // Get the plugin instance and controller
    // Note: In a real implementation, this would be passed from BlockRenderer
    const pluginInstance = ChecklistPlugin.getInstance();
    const controller = pluginInstance.controller;

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleTextChange = (text: string) => {
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
          checked: !isChecked,
        },
      });
    };

    // Animated background color
    const animatedBackgroundColor = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', focusColors.backgroundColor],
    });

    return (
      <KeyboardHandler block={block} controller={controller} cursorPosition={cursorPosition}>
        {({ onKeyPress, preventNewlines }: { onKeyPress: (event: any) => void; preventNewlines?: boolean }) => (
          <View style={[styles.container, style]}>
            <Animated.View
              style={[
                styles.checklistItem,
                {
                  backgroundColor: animatedBackgroundColor,
                  paddingLeft: CHECKLIST_BASE_PADDING,
                },
              ]}
            >
              {level > 0 && (
                <View pointerEvents="none" style={[styles.indicatorContainer, { width: indicatorWidth }]}>
                  {Array.from({ length: level }).map((_, idx) => (
                    <View
                      key={`indicator-${idx}`}
                      style={[
                        styles.indicatorBar,
                        {
                          marginRight: idx === level - 1 ? 0 : CHECKLIST_INDICATOR_SPACING,
                          backgroundColor: indicatorPalette[idx % indicatorPalette.length],
                          opacity: shouldFocus ? 0.9 : 0.5,
                        },
                      ]}
                    />
                  ))}
                </View>
              )}
              <TouchableOpacity style={styles.checkboxContainer} onPress={toggleChecked}>
                <View style={[styles.checkbox, isChecked && styles.checkedBox]}>
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
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
                ref={inputRef}
                style={[styles.textInput, isChecked && styles.checkedText]}
              />
            </Animated.View>
          </View>
        )}
      </KeyboardHandler>
    );
  }
);

ChecklistComponent.displayName = 'ChecklistComponent';

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      marginVertical: 0,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 8,
      minHeight: 39,
      backgroundColor: 'transparent', // Will be overridden by animated value
    },
    checkboxContainer: {
      paddingVertical: 0,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 27,
      marginLeft: 4,
      marginRight: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
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
      fontSize: 14,
      fontWeight: '700',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      // NO padding - container/parent handles all spacing
      paddingVertical: 0,
      paddingHorizontal: 0,
      minHeight: 27,
      textAlignVertical: 'center',
    },
    checkedText: {
      textDecorationLine: 'line-through',
      color: colors.textSecondary,
      opacity: 0.7,
    },
    indicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginRight: 12,
      height: 24,
    },
    indicatorBar: {
      width: CHECKLIST_INDICATOR_WIDTH,
      height: 12,
      borderRadius: CHECKLIST_INDICATOR_WIDTH,
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
      block: /^(\s*)- \[([ x])\]\s+(.+)$/,
    },
    priority: 85,
  };

  readonly toolbar = {
    icon: 'check-square',
    label: 'Checklist',
    shortcut: 'Ctrl+Shift+C',
    group: 'text',
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout', 'checklist'] as EditorBlockType[],
    validation: {
      required: ['content'] as string[],
    },
    defaultMeta: {
      checked: false,
      level: 0,
    },
  };

  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Note: Tab indentation and Ctrl+Enter toggle are not currently supported
    // due to architectural limitations. handleKeyPress can only return boolean,
    // not updated blocks. These features would need to be implemented at the component level.
    return false;
  }

  /**
   * Handle Enter key
   */
  protected handleEnter(
    block: EditorBlock,
    allBlocks?: EditorBlock[],
    currentIndex?: number
  ): EditorBlock | EditorBlock[] | null {
    // If content is empty, convert to paragraph
    if (block.content.trim() === '') {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {},
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
        level: level,
      },
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
        meta: {},
      };
    }

    // If checklist item is empty and indented, decrease indentation
    if (block.content.trim() === '' && (block.meta?.level || 0) > 0) {
      const newLevel = Math.max(0, (block.meta?.level || 0) - 1);
      return {
        ...block,
        meta: {
          ...block.meta,
          level: newLevel,
        },
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
        meta: {},
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
        level,
      };
    }

    // Ensure checklist properties are set
    if (newBlock.meta?.checked === undefined) {
      newBlock.meta = {
        ...newBlock.meta,
        checked: false,
        level: newBlock.meta?.level || 0,
      };
    }

    return newBlock;
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    // Note: ChecklistPlugin implements BlockPlugin but doesn't extend it
    const actions: any[] = [];

    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: (block: EditorBlock, context: any) => {
        context.duplicateBlock();
      },
    });

    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      style: 'destructive',
      handler: (block: EditorBlock, context: any) => {
        context.deleteBlock();
      },
    });

    return actions;
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
      getActions: this.getActions.bind(this),
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
      blockType: this.blockType,
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
      meta,
    };
  }

  /**
   * Create checklist item with specific properties
   */
  createChecklistItem(content: string = '', checked: boolean = false, level: number = 0): EditorBlock {
    return this.createBlock(content, {
      checked,
      level: Math.max(0, Math.min(5, level)),
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
            checked: true,
          },
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
            checked: false,
          },
        };
      }
      return block;
    });
  }
}
