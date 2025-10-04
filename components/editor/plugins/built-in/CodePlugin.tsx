import React, { useState, memo, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, ScrollView, NativeSyntheticEvent, TextInputContentSizeChangeEventData } from 'react-native';
import { BlockPlugin } from '../../types/PluginTypes';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

/**
 * Code block component with modern dark theme support
 */
const CodeComponent: React.FC<BlockComponentProps> = memo(({
  block,
  isSelected,
  isFocused,
  isDragging,
  onBlockChange,
  onFocus,
  onBlur,
  onKeyPress,
  theme,
  readOnly
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const [isLanguageEditing, setIsLanguageEditing] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const language = block.meta?.language || 'text';
  const showLineNumbers = block.meta?.showLineNumbers !== false;

  const handleCodeChange = (text: string) => {
    onBlockChange({ content: text });
  };

  const handleLanguageChange = (newLanguage: string) => {
    onBlockChange({
      ...block,
      meta: {
        ...block.meta,
        language: newLanguage
      }
    });
    setIsLanguageEditing(false);
  };

  const toggleLineNumbers = () => {
    onBlockChange({
      ...block,
      meta: {
        ...block.meta,
        showLineNumbers: !showLineNumbers
      }
    });
  };

  const handleContentSizeChange = useCallback((e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
    setContentHeight(e.nativeEvent.contentSize.height);
  }, []);

  const getLineNumbers = () => {
    if (!showLineNumbers) return null;
    
    // Count lines in content
    const lines = block.content ? block.content.split('\n') : [''];
    const lineCount = lines.length;
    
    // Render each line number separately to match TextInput line rendering
    return Array.from({ length: lineCount }, (_, index) => (
      <Text key={index} style={styles.lineNumber}>
        {index + 1}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setIsLanguageEditing(true)}
          disabled={readOnly}
        >
          <Text style={styles.languageText}>{language}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.lineNumbersButton}
          onPress={toggleLineNumbers}
          disabled={readOnly}
        >
          <Text style={styles.buttonText}>
            {showLineNumbers ? '🔢' : '📝'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Language selector */}
      {isLanguageEditing && !readOnly && (
        <View style={styles.languageSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {COMMON_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  language === lang && styles.selectedLanguage
                ]}
                onPress={() => handleLanguageChange(lang)}
              >
                <Text style={styles.languageOptionText}>{lang}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Code editor */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={true}
        style={[
          styles.codeContainer,
          isSelected && styles.selected,
          isFocused && styles.editing
        ]}
      >
        <View style={styles.codeWrapper}>
          {showLineNumbers && (
            <View style={styles.lineNumbersContainer} pointerEvents="none">
              {getLineNumbers()}
            </View>
          )}
          
          <TextInput
            style={[
              styles.codeInput,
              showLineNumbers && styles.codeInputWithNumbers
            ]}
            value={block.content}
            onChangeText={handleCodeChange}
            onContentSizeChange={handleContentSizeChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
            placeholder="Enter your code..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            scrollEnabled={false}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            editable={!readOnly}
          />
        </View>
      </ScrollView>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.meta?.language === nextProps.block.meta?.language &&
    prevProps.block.meta?.showLineNumbers === nextProps.block.meta?.showLineNumbers &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.readOnly === nextProps.readOnly
  );
});

const COMMON_LANGUAGES = [
  'text', 'javascript', 'typescript', 'python', 'java', 'cpp', 'c',
  'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
  'html', 'css', 'scss', 'json', 'xml', 'yaml', 'markdown',
  'sql', 'bash', 'shell', 'powershell'
];

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: 'transparent',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    },
    languageButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: 'transparent',
      borderRadius: 4,
    },
    languageText: {
      color: colors.text,
      fontSize: 10,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      opacity: 0.6,
    },
    languageInput: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderFocus,
    },
    lineNumbersButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.surface,
    },
    buttonText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    languageSelector: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.backgroundTertiary,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    languageOption: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      backgroundColor: colors.surface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedLanguage: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    languageOptionText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    codeContainer: {
      minHeight: 100,
      backgroundColor: 'transparent',
    },
    selected: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    editing: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    codeWrapper: {
      position: 'relative',
      flexDirection: 'row',
      minWidth: '100%',
    },
    lineNumbersContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 12,
      paddingRight: 12,
      backgroundColor: 'transparent',
      zIndex: 1,
    },
    lineNumber: {
      fontSize: 14,
      color: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)',
      fontFamily: 'SpaceMono-Regular',
      lineHeight: 21,
      height: 21,
      textAlign: 'right',
      minWidth: 32,
      includeFontPadding: false,
    },
    codeInput: {
      fontSize: 14,
      fontFamily: 'SpaceMono-Regular',
      lineHeight: 21,
      color: colors.text,
      paddingTop: 16,
      paddingBottom: 16,
      paddingHorizontal: 16,
      backgroundColor: 'transparent',
      includeFontPadding: false,
      minWidth: 500,
    },
    codeInputWithNumbers: {
      paddingLeft: 60,
    },
  });
};

/**
 * Code block plugin
 */
export class CodePlugin implements BlockPlugin {
  readonly type = 'block' as const;
  readonly id = 'code';
  readonly name = 'Code Block';
  readonly version = '1.0.0';
  readonly description = 'Code block with syntax highlighting and line numbers';
  readonly blockType: EditorBlockType = 'code';
  readonly component = CodeComponent;
  readonly controller: any;

  constructor() {
    this.controller = this.createController();
  }

  readonly markdownSyntax = {
    patterns: {
      block: /^```([a-zA-Z0-9]*)?\n([\s\S]*?)\n```$/
    },
    priority: 90
  };

  readonly toolbar = {
    icon: 'code',
    label: 'Code Block',
    shortcut: 'Ctrl+Alt+C',
    group: 'code'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout'] as EditorBlockType[],
    validation: {
      required: ['content'] as string[]
    },
    defaultMeta: {
      language: 'text',
      showLineNumbers: true,
      theme: 'default'
    }
  };

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
      type: 'code' as EditorBlockType,
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
   * Handle backspace
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    return null;
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

  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Handle Tab for indentation
    if (event.key === 'Tab') {
      event.preventDefault();
      const { selectionStart, selectionEnd } = event.target;
      const content = block.content;
      const newContent = 
        content.substring(0, selectionStart) +
        '  ' + // 2 spaces
        content.substring(selectionEnd);
      
      // Update content and cursor position
      this.updateBlockContent(block, newContent, selectionStart + 2);
      return true;
    }
    
    return false;
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after code block
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  protected transformContent(content: string): string {
    // Remove markdown code block syntax if present
    const match = content.match(/^```([a-zA-Z0-9]*)?\n([\s\S]*?)\n```$/);
    if (match) {
      return match[2]; // Return just the code content
    }
    return content;
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = block;
    
    // Parse markdown syntax if present
    const match = newBlock.content.match(/^```([a-zA-Z0-9]*)?\n([\s\S]*?)\n```$/);
    if (match) {
      newBlock.content = match[2] || '';
      newBlock.meta = {
        ...newBlock.meta,
        language: match[1] || 'text'
      };
    }
    
    // Ensure language is set
    if (!newBlock.meta?.language) {
      newBlock.meta = {
        ...newBlock.meta,
        language: 'text'
      };
    }
    
    return newBlock;
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    
    // Add code-specific actions
    actions.unshift({
      id: 'change-language',
      label: 'Change Language',
      icon: 'language',
      handler: (block: EditorBlock) => {
        console.log('Change code language:', block.id);
      }
    });
    
    actions.unshift({
      id: 'toggle-line-numbers',
      label: (block.meta as any)?.showLineNumbers ? 'Hide Line Numbers' : 'Show Line Numbers',
      icon: 'list-ol',
      handler: (block: EditorBlock) => {
        console.log('Toggle line numbers:', block.id);
      }
    });
    
    actions.unshift({
      id: 'copy-code',
      label: 'Copy Code',
      icon: 'copy',
      handler: (block: EditorBlock) => {
        console.log('Copy code:', block.content);
      }
    });
    
    return actions;
  }

  /**
   * Update block content and cursor position
   */
  private updateBlockContent(block: EditorBlock, content: string, cursorPosition?: number) {
    // This would be handled by the editor context
    // No-op in this implementation
  }

  /**
   * Create code block with language
   */
  createCodeBlock(content: string = '', language: string = 'text'): EditorBlock {
    return {
      id: generateId(),
      type: 'code',
      content,
      meta: {
        language,
        showLineNumbers: true,
        theme: 'default'
      }
    };
  }

  /**
   * Parse markdown code block syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const language = match[1] || 'text';
    const content = match[2] || '';
    
    return this.createCodeBlock(content, language);
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const language = block.meta?.language || 'text';
    const content = block.content;
    
    return `\`\`\`${language}\n${content}\n\`\`\``;
  }

  /**
   * Format code with proper indentation
   */
  formatCode(content: string, language: string): string {
    // Basic formatting - can be extended with proper formatters
    switch (language) {
      case 'json':
        try {
          return JSON.stringify(JSON.parse(content), null, 2);
        } catch {
          return content;
        }
      default:
        return content;
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return COMMON_LANGUAGES;
  }
}