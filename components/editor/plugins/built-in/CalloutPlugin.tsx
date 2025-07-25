import React, { useState, memo } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ScrollView } from 'react-native';
import { BlockPlugin } from '../../types/PluginTypes';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info' | 'success';

interface CalloutConfig {
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
}

const getCalloutConfigs = (colorScheme: 'light' | 'dark'): Record<CalloutType, CalloutConfig> => {
  const colors = Colors[colorScheme];
  
  if (colorScheme === 'dark') {
    return {
      note: {
        icon: '📝',
        color: '#60a5fa',
        backgroundColor: colors.accentLight,
        borderColor: '#60a5fa',
        label: 'Note'
      },
      tip: {
        icon: '💡',
        color: colors.success,
        backgroundColor: colors.successLight,
        borderColor: colors.success,
        label: 'Tip'
      },
      warning: {
        icon: '⚠️',
        color: colors.warning,
        backgroundColor: colors.warningLight,
        borderColor: colors.warning,
        label: 'Warning'
      },
      danger: {
        icon: '🚨',
        color: colors.error,
        backgroundColor: colors.errorLight,
        borderColor: colors.error,
        label: 'Danger'
      },
      info: {
        icon: 'ℹ️',
        color: '#60a5fa',
        backgroundColor: colors.backgroundSecondary,
        borderColor: colors.border,
        label: 'Info'
      },
      success: {
        icon: '✅',
        color: colors.success,
        backgroundColor: colors.successLight,
        borderColor: colors.success,
        label: 'Success'
      }
    };
  }
  
  return {
    note: {
      icon: '📝',
      color: '#0969da',
      backgroundColor: '#ddf4ff',
      borderColor: '#54aeff',
      label: 'Note'
    },
    tip: {
      icon: '💡',
      color: '#1a7f37',
      backgroundColor: '#dcffe4',
      borderColor: '#4ac26b',
      label: 'Tip'
    },
    warning: {
      icon: '⚠️',
      color: '#9a6700',
      backgroundColor: '#fff8c5',
      borderColor: '#ffdf5d',
      label: 'Warning'
    },
    danger: {
      icon: '🚨',
      color: '#cf222e',
      backgroundColor: '#ffebe9',
      borderColor: '#ff818a',
      label: 'Danger'
    },
    info: {
      icon: 'ℹ️',
      color: '#0969da',
      backgroundColor: '#f6f8fa',
      borderColor: '#d1d9e0',
      label: 'Info'
    },
    success: {
      icon: '✅',
      color: '#1a7f37',
      backgroundColor: '#dcffe4',
      borderColor: '#4ac26b',
      label: 'Success'
    }
  };
};

/**
 * Callout block component with modern dark theme support
 */
const CalloutComponent: React.FC<BlockComponentProps> = memo(({
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
  const CALLOUT_CONFIGS = getCalloutConfigs(colorScheme ?? 'light');
  const [isTypeEditing, setIsTypeEditing] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  
  const calloutType = (block.meta?.calloutType as CalloutType) || 'note';
  const config = CALLOUT_CONFIGS[calloutType];
  const title = block.meta?.title || config.label;
  const showTitle = block.meta?.showTitle !== false;

  const handleContentChange = (text: string) => {
    onUpdate?.({
      ...block,
      content: text
    });
  };

  const handleTypeChange = (newType: CalloutType) => {
    const newConfig = CALLOUT_CONFIGS[newType];
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        calloutType: newType,
        title: block.meta?.title || newConfig.label
      }
    });
    setIsTypeEditing(false);
  };

  const handleTitleChange = (newTitle: string) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        title: newTitle
      }
    });
  };

  const toggleTitle = () => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        showTitle: !showTitle
      }
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Type selector */}
      {isTypeEditing && (
        <View style={styles.typeSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {Object.entries(CALLOUT_CONFIGS).map(([type, typeConfig]) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeOption,
                  { borderColor: typeConfig.borderColor },
                  calloutType === type && { backgroundColor: typeConfig.backgroundColor }
                ]}
                onPress={() => handleTypeChange(type as CalloutType)}
              >
                <Text style={styles.typeIcon}>{typeConfig.icon}</Text>
                <Text style={[styles.typeLabel, { color: typeConfig.color }]}>
                  {typeConfig.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Callout content */}
      <View style={[
        styles.calloutContainer,
        {
          backgroundColor: config.backgroundColor,
          borderLeftColor: config.borderColor
        },
        isSelected && styles.selected,
        isEditing && styles.editing
      ]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.typeButton}
            onPress={() => setIsTypeEditing(!isTypeEditing)}
          >
            <Text style={styles.icon}>{config.icon}</Text>
            <Text style={[styles.typeText, { color: config.color }]}>
              {config.label}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.titleToggle}
            onPress={toggleTitle}
          >
            <Text style={styles.toggleText}>
              {showTitle ? '👁️' : '👁️‍🗨️'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        {showTitle && (
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={() => setIsTitleEditing(true)}
          >
            {isTitleEditing ? (
              <TextInput
                style={[styles.titleInput, { color: config.color }]}
                value={title}
                onChangeText={handleTitleChange}
                onBlur={() => setIsTitleEditing(false)}
                onSubmitEditing={() => setIsTitleEditing(false)}
                autoFocus
                placeholder="Enter title..."
                placeholderTextColor={config.color + '80'}
              />
            ) : (
              <Text style={[styles.title, { color: config.color }]}>
                {title}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Content */}
        <TextInput
          style={[
            styles.contentInput,
            { color: config.color }
          ]}
          value={block.content}
          onChangeText={handleContentChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Enter your message..."
          placeholderTextColor={colors.textMuted}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.meta?.type === nextProps.block.meta?.type &&
    prevProps.block.meta?.title === nextProps.block.meta?.title &&
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
    typeSelector: {
      marginBottom: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      borderRadius: 8,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    typeIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    typeLabel: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    calloutContainer: {
      borderLeftWidth: 4,
      borderRadius: 12,
      borderTopLeftRadius: 4,
      borderBottomLeftRadius: 4,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selected: {
      borderWidth: 2,
      borderColor: colors.borderFocus,
      backgroundColor: colors.accentLight,
    },
    editing: {
      borderWidth: 2,
      borderColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
    },
    icon: {
      fontSize: 18,
      marginRight: 8,
    },
    typeText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    titleToggle: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.backgroundSecondary,
    },
    toggleText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    titleContainer: {
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    titleInput: {
      fontSize: 16,
      fontWeight: '600',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      backgroundColor: colors.surface,
    },
    contentInput: {
      fontSize: 15,
      lineHeight: 24,
      minHeight: 48,
      textAlignVertical: 'top',
      color: colors.text,
      paddingVertical: 8,
    },
  });
};

/**
 * Callout block plugin
 */
export class CalloutPlugin implements BlockPlugin {
  readonly id = 'callout';
  readonly name = 'Callout';
  readonly version = '1.0.0';
  readonly type = 'block' as const;
  readonly description = 'Highlighted callout blocks for notes, tips, warnings, etc.';
  readonly blockType: EditorBlockType = 'callout';
  readonly component = CalloutComponent;
  readonly controller: any;

  constructor() {
    this.controller = this.createController();
  }

  readonly markdownSyntax = {
    patterns: {
      block: /^>\s*\[!(NOTE|TIP|WARNING|DANGER|INFO|SUCCESS)\]\s*(.*)$/m
    },
    priority: 85
  };

  readonly toolbar = {
    icon: 'info-circle',
    label: 'Callout',
    shortcut: 'Ctrl+Alt+I',
    group: 'content',
    variants: [
      { label: 'Note', meta: { calloutType: 'note' } },
      { label: 'Tip', meta: { calloutType: 'tip' } },
      { label: 'Warning', meta: { calloutType: 'warning' } },
      { label: 'Danger', meta: { calloutType: 'danger' } },
      { label: 'Info', meta: { calloutType: 'info' } },
      { label: 'Success', meta: { calloutType: 'success' } },
    ]
  };

  readonly settings = {
    allowedParents: ['root', 'quote'] as EditorBlockType[],
    validation: {
      required: ['content'] as string[]
    },
    defaultMeta: {
      calloutType: 'note',
      showTitle: true
    }
  };

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after callout
    return {
      id: this.generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  protected transformContent(content: string): string {
    // Remove markdown callout syntax if present
    const lines = content.split('\n');
    const contentLines = lines.filter(line => !line.match(/^>\s*\[!(NOTE|TIP|WARNING|DANGER|INFO|SUCCESS)\]/));
    return contentLines.map(line => line.replace(/^>\s*/, '')).join('\n').trim();
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = { ...block };
    
    // Parse markdown syntax if present
    const match = newBlock.content.match(/^>\s*\[!(NOTE|TIP|WARNING|DANGER|INFO|SUCCESS)\]\s*(.*)$/m);
    if (match) {
      const calloutType = match[1].toLowerCase() as CalloutType;
      const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for creation
      const title = match[2] || calloutConfigs[calloutType].label;
      
      // Extract content after the callout header
      const lines = newBlock.content.split('\n');
      const contentLines = lines.slice(1).map(line => line.replace(/^>\s*/, ''));
      
      newBlock.content = contentLines.join('\n').trim();
      newBlock.meta = {
        ...newBlock.meta,
        calloutType,
        title,
        showTitle: true
      };
    }
    
    // Ensure callout type is set
    if (!newBlock.meta?.calloutType) {
      const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for creation
      newBlock.meta = {
        ...newBlock.meta,
        calloutType: 'note',
        title: calloutConfigs.note.label,
        showTitle: true
      };
    }
    
    return newBlock;
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    const currentType = block.meta?.calloutType || 'note';
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for actions
    
    // Add callout type change actions
    Object.entries(calloutConfigs).forEach(([type, config]) => {
      if (type !== currentType) {
        actions.unshift({
          id: `callout-${type}`,
          label: `Change to ${config.label}`,
          icon: 'info-circle',
          handler: (block: EditorBlock) => {
            console.log(`Change callout to ${type}:`, block.id);
          }
        });
      }
    });
    
    // Add title toggle action
    actions.unshift({
      id: 'toggle-title',
      label: block.meta?.showTitle ? 'Hide Title' : 'Show Title',
      icon: 'eye',
      handler: (block: EditorBlock) => {
        console.log('Toggle callout title:', block.id);
      }
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
   * Create a new block
   */
  createBlock(content: string = '', meta: any = {}): EditorBlock {
    return {
      id: this.generateId(),
      type: 'callout' as EditorBlockType,
      content,
      meta
    };
  }

  /**
   * Create the block controller
   */
  protected createController(): any {
    return {
      validate: this.validateContent.bind(this),
      transform: this.transformContent.bind(this),
      keyPress: this.handleKeyPress.bind(this),
      enter: this.handleEnter.bind(this),
      backspace: this.handleBackspace.bind(this),
      create: this.onCreate.bind(this),
      update: this.onUpdate.bind(this),
      delete: this.onDelete.bind(this),
      actions: this.getActions.bind(this)
    };
  }

  /**
   * Validate content
   */
  protected validateContent(content: string): boolean {
    return true;
  }

  /**
   * Handle key press
   */
  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Default implementation
  }

  /**
   * Handle backspace
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Convert callout back to paragraph with markdown syntax when backspace at beginning
    const calloutType = (block.meta?.calloutType || 'note').toUpperCase();
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for backspace
    const title = block.meta?.title || calloutConfigs[block.meta?.calloutType || 'note'].label;
    
    return {
      ...block,
      type: 'paragraph',
      content: `> [!${calloutType}] ${title}\n> ${block.content}`,
      meta: {}
    };
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
   * Create callout block with specific properties
   */
  createCalloutBlock(
    content: string = '',
    calloutType: CalloutType = 'note',
    title?: string
  ): EditorBlock {
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for creation
    const config = calloutConfigs[calloutType];
    return this.createBlock(content, {
      calloutType,
      title: title || config.label,
      showTitle: true
    });
  }

  /**
   * Parse markdown callout syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const calloutType = match[1].toLowerCase() as CalloutType;
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for parsing
    const title = match[2] || calloutConfigs[calloutType].label;
    
    // Extract content after the callout header
    const lines = text.split('\n');
    const contentLines = lines.slice(1).map(line => line.replace(/^>\s*/, ''));
    const content = contentLines.join('\n').trim();
    
    return this.createCalloutBlock(content, calloutType, title);
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const calloutType = (block.meta?.calloutType as CalloutType) || 'note';
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme for markdown
    const title = block.meta?.title || calloutConfigs[calloutType].label;
    const content = block.content;
    
    const lines = [`> [!${calloutType.toUpperCase()}] ${title}`];
    
    if (content) {
      const contentLines = content.split('\n').map(line => `> ${line}`);
      lines.push(...contentLines);
    }
    
    return lines.join('\n');
  }

  /**
   * Get available callout types
   */
  getCalloutTypes(): CalloutType[] {
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme
    return Object.keys(calloutConfigs) as CalloutType[];
  }

  /**
   * Get callout configuration
   */
  getCalloutConfig(type: CalloutType): CalloutConfig {
    const calloutConfigs = getCalloutConfigs('light'); // Default to light theme
    return calloutConfigs[type];
  }
}