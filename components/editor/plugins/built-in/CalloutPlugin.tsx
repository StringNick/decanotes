import React, { memo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

type CalloutType = 'note' | 'tip' | 'warning' | 'danger' | 'info' | 'success';

interface CalloutConfig {
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  label: string;
}

const getCalloutConfigs = (colorScheme: 'light' | 'dark'): Record<CalloutType, CalloutConfig> => {
  const isDark = colorScheme === 'dark';
  
  if (isDark) {
    return {
      note: {
        icon: '📝',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Note'
      },
      tip: {
        icon: '💡',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Tip'
      },
      warning: {
        icon: '⚠️',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Warning'
      },
      danger: {
        icon: '🚨',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Danger'
      },
      info: {
        icon: 'ℹ️',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Info'
      },
      success: {
        icon: '✅',
        color: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        label: 'Success'
      }
    };
  }
  
  return {
    note: {
      icon: '📝',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      label: 'Note'
    },
    tip: {
      icon: '💡',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      label: 'Tip'
    },
    warning: {
      icon: '⚠️',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      label: 'Warning'
    },
    danger: {
      icon: '🚨',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      label: 'Danger'
    },
    info: {
      icon: 'ℹ️',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
      label: 'Info'
    },
    success: {
      icon: '✅',
      color: 'rgba(0, 0, 0, 0.8)',
      backgroundColor: 'rgba(0, 0, 0, 0.03)',
      borderColor: 'rgba(0, 0, 0, 0.15)',
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
                <Text style={[styles.typeLabel, { color: typeConfig.color, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }]}>
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
                                        <Text style={[styles.typeText, { color: config.color, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 1 }]}>
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
          placeholderTextColor={colors.textSecondary}
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
  const isDark = colorScheme === 'dark';
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    typeSelector: {
      marginBottom: 8,
      paddingVertical: 8,
      paddingHorizontal: 0,
      backgroundColor: 'transparent',
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginRight: 6,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    },
    typeIcon: {
      fontSize: 14,
      marginRight: 6,
    },
    typeLabel: {
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    calloutContainer: {
      borderLeftWidth: 2,
      borderRadius: 8,
      padding: 16,
      borderWidth: 0,
    },
    selected: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    editing: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    typeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 6,
      backgroundColor: 'transparent',
    },
    icon: {
      fontSize: 16,
      marginRight: 6,
    },
    typeText: {
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    titleToggle: {
      padding: 4,
      borderRadius: 4,
    },
    toggleText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    titleContainer: {
      marginBottom: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
    },
    titleInput: {
      fontSize: 14,
      fontWeight: '600',
      paddingVertical: 4,
      paddingHorizontal: 0,
    },
    contentInput: {
      fontSize: 15,
      lineHeight: 22,
      minHeight: 44,
      textAlignVertical: 'top',
      color: colors.text,
      paddingVertical: 0,
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
    // Return only the default actions (duplicate and delete)
    // Note: CalloutPlugin doesn't extend BlockPlugin, so we need to provide default actions
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