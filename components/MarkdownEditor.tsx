import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

// Types for formatted text
export interface FormattedTextSegment {
  text: string;
  type: 'normal' | 'bold' | 'italic' | 'code' | 'bold-italic';
}

// Types
export type MarkdownEditorRef = {
  getMarkdown: () => string;
  focus: () => void;
  insertBlock: (type: BlockType, index?: number) => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => boolean;
  moveBlockDown: (id: string) => boolean;
  toggleMode: () => void;
  getCurrentMode: () => 'live' | 'raw';
};

export type BlockType = 'paragraph' | 'heading' | 'code' | 'quote' | 'list' | 'checklist' | 'divider' | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    level?: number;        // For headings (1-6)
    language?: string;     // For code blocks
    ordered?: boolean;     // For lists
    checked?: boolean;     // For checklists
    url?: string;          // For images/links
    alt?: string;          // For images
    title?: string;        // For images/links
    depth?: number;        // For nested lists and quotes
  };
}

export interface MarkdownEditorProps {
  initialMarkdown?: string;
  onMarkdownChange?: (markdown: string) => void;
  onBlockChange?: (blocks: Block[]) => void;
  readOnly?: boolean;
  placeholder?: string;
  theme?: EditorTheme;
  customBlocks?: Record<string, React.ComponentType<BlockProps>>;
}

export interface EditorTheme {
  container?: ViewStyle;
  block?: ViewStyle;
  focusedBlock?: ViewStyle;
  input?: TextStyle;
  focusedInput?: TextStyle;
  placeholder?: TextStyle;
  heading1?: TextStyle;
  heading2?: TextStyle;
  heading3?: TextStyle;
  heading4?: TextStyle;
  heading5?: TextStyle;
  heading6?: TextStyle;
  code?: TextStyle;
  codeBlock?: ViewStyle;
  quote?: TextStyle;
  quoteBlock?: ViewStyle;
  bold?: TextStyle;
  italic?: TextStyle;
  inlineCode?: TextStyle;
}

export interface BlockProps {
  block: Block;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  displayValue: string;
  onRawTextChange: (text: string) => void;
  onFocus: () => void;
  onEdit: () => void;
  onBlur: () => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  theme?: EditorTheme;
  placeholder?: string;
}

// Mode Switcher Component - Updated with modern design
const ModeSwitcher: React.FC<{
  mode: 'live' | 'raw';
  onToggle: () => void;
}> = ({ mode, onToggle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(mode === 'live' ? 0 : 28)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: mode === 'live' ? 0 : 28,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [mode, translateX]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress}>
      <Animated.View style={[
        styles.modeSwitcher,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <View style={styles.modeSwitcherTrack}>
          <Animated.View 
            style={[
              styles.modeSwitcherThumb,
              {
                transform: [{ translateX }]
              }
            ]}
          />
          <View style={styles.modeSwitcherLabels}>
            <Text style={[
              styles.modeSwitcherLabel,
              mode === 'live' && styles.modeSwitcherLabelActive
            ]}>
              Live
            </Text>
            <Text style={[
              styles.modeSwitcherLabel,
              mode === 'raw' && styles.modeSwitcherLabelActive
            ]}>
              Raw
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

// Utility functions
const parseMarkdownToBlocks = (markdown: string): Block[] => {
  if (!markdown.trim()) {
    return [{ id: generateId(), type: 'paragraph', content: '' }];
  }

  const blocks: Block[] = [];
  const lines = markdown.split('\n');
  let currentBlock: Block | null = null;
  let codeBlockContent: string[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines unless we're in a code block
    if (!trimmedLine && !inCodeBlock) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (currentBlock) {
          currentBlock.content = codeBlockContent.join('\n');
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = trimmedLine.substring(3).trim();
        currentBlock = {
          id: generateId(),
          type: 'code',
          content: '',
          meta: { language: codeBlockLanguage || 'plaintext' }
        };
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings (must be at the start of a line)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'heading',
        content: headingMatch[2].trim(),
        meta: { level: Math.min(headingMatch[1].length, 6) }
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    // Handle quotes (can be nested) - require space after > markers
    const quoteMatch = trimmedLine.match(/^(>+)\s+(.*)$/);
    if (quoteMatch) {
      const [, markers, content] = quoteMatch;
      const quoteDepth = markers.length - 1; // 0 for >, 1 for >>, etc.
      
      // Always create a new quote block for each quote line
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'quote',
        content: content,
        meta: { depth: quoteDepth }
      };
      continue;
    }

    // Handle empty quote lines (just > markers)
    const emptyQuoteMatch = trimmedLine.match(/^(>+)\s*$/);
    if (emptyQuoteMatch) {
      const [, markers] = emptyQuoteMatch;
      const quoteDepth = markers.length - 1;
      
      // Always create a new quote block for each quote line
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'quote',
        content: '',
        meta: { depth: quoteDepth }
      };
      continue;
    }

    // Handle lists (can be nested)
    const listMatch = trimmedLine.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const [, indent, marker, content] = listMatch;
      const isOrdered = /\d+\./.test(marker);
      const depth = Math.floor(indent.length / 2); // 2 spaces per level
      
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'list',
          content: content,
          meta: { 
            ordered: isOrdered,
            depth: depth
          }
        };
      } else {
        // Continue existing list
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // Handle checklists
    const checklistMatch = trimmedLine.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checklistMatch) {
      const [, checked, content] = checklistMatch;
      if (!currentBlock || currentBlock.type !== 'checklist' || 
          (currentBlock.meta?.checked !== (checked.toLowerCase() === 'x'))) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'checklist',
          content: content,
          meta: { checked: checked.toLowerCase() === 'x' }
        };
      } else {
        // Continue existing checklist with same checked state
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // Handle regular text
    if (!currentBlock) {
      currentBlock = {
        id: generateId(),
        type: 'paragraph',
        content: line
      };
    } else if (currentBlock.type === 'paragraph') {
      currentBlock.content += '\n' + line;
    } else {
      // Different block type, start a new paragraph
      blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'paragraph',
        content: line
      };
    }
  }

  // Add the last block if it exists
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks.length > 0 ? blocks : [{ id: generateId(), type: 'paragraph', content: '' }];
};

const blocksToMarkdown = (blocks: Block[]): string => {
  const result: string[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];
    
    let blockMarkdown = '';
    
    switch (block.type) {
      case 'heading':
        blockMarkdown = `${'#'.repeat(block.meta?.level || 1)} ${block.content}`;
        break;
      case 'code':
        blockMarkdown = `\`\`\`${block.meta?.language || ''}\n${block.content}\n\`\`\``;
        break;
      case 'quote':
        const quoteDepth = block.meta?.depth || 0;
        const quotePrefix = '>'.repeat(quoteDepth + 1);
        if (block.content.trim()) {
          blockMarkdown = block.content
            .split('\n')
            .map(line => `${quotePrefix} ${line}`)
            .join('\n');
        } else {
          blockMarkdown = `${quotePrefix} `;
        }
        break;
      case 'list':
        const items = block.content.split('\n');
        const depth = block.meta?.depth || 0;
        const indent = '  '.repeat(depth);
        
        if (block.meta?.ordered) {
          blockMarkdown = items.map((item, index) => 
            `${indent}${index + 1}. ${item}`
          ).join('\n');
        } else {
          blockMarkdown = items.map(item => 
            `${indent}- ${item}`
          ).join('\n');
        }
        break;
      case 'checklist':
        const checked = block.meta?.checked ? 'x' : ' ';
        const checkDepth = block.meta?.depth || 0;
        const checkIndent = '  '.repeat(checkDepth);
        const checkItems = block.content.split('\n');
        blockMarkdown = checkItems.map(item => 
          `${checkIndent}- [${checked}] ${item}`
        ).join('\n');
        break;
      case 'divider':
        blockMarkdown = '---';
        break;
      case 'image':
        const title = block.meta?.title ? ` "${block.meta.title}"` : '';
        blockMarkdown = `![${block.content}](${block.meta?.url || ''}${title})`;
        break;
      default:
        blockMarkdown = block.content;
    }
    
    result.push(blockMarkdown);
    
    // Add appropriate spacing between blocks
    if (nextBlock) {
      // Add single newline between consecutive quotes of same depth
      if (block.type === 'quote' && nextBlock.type === 'quote' && 
          block.meta?.depth === nextBlock.meta?.depth) {
        result.push('\n');
      }
      // Add single newline between consecutive list items
      else if (block.type === 'list' && nextBlock.type === 'list' && 
               block.meta?.ordered === nextBlock.meta?.ordered &&
               block.meta?.depth === nextBlock.meta?.depth) {
        result.push('\n');
      }
      // Add single newline between consecutive checklists
      else if (block.type === 'checklist' && nextBlock.type === 'checklist') {
        result.push('\n');
      }
      // Add double newline between different block types
      else {
        result.push('\n\n');
      }
    }
  }
  
  return result.join('');
};

const generateId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getDisplayValue = (block: Block, isActive: boolean): string => {
  if (!isActive) return block.content;
  
  const getIndent = (depth = 0) => '  '.repeat(depth);
  
  switch (block.type) {
    case 'heading':
      return `${'#'.repeat(block.meta?.level || 1)} ${block.content}`;
      
    case 'code':
      const language = block.meta?.language ? ` ${block.meta.language}` : '';
      return `\`\`\`${language}${block.content ? '\n' + block.content : ''}`;
      
    case 'quote':
      const quoteDepth = block.meta?.depth || 0;
      const quotePrefix = '>'.repeat(quoteDepth + 1); // > for depth 0, >> for depth 1, etc.
      
      // Handle empty quote
      if (!block.content.trim()) {
        return `${quotePrefix} `;
      }
      
      return block.content
        .split('\n')
        .map(line => `${quotePrefix} ${line}`)
        .join('\n');
        
    case 'list':
      const listDepth = block.meta?.depth || 0;
      const isOrdered = block.meta?.ordered;
      const items = block.content.split('\n');
      
      return items.map((item, index) => {
        const prefix = isOrdered 
          ? `${index + 1}. ` 
          : `${getIndent(listDepth)}- `;
        return `${prefix}${item}`;
      }).join('\n');
      
    case 'checklist':
      const checkDepth = block.meta?.depth || 0;
      const checklistItems = block.content.split('\n');
      
      return checklistItems.map((item, index) => {
        const checked = block.meta?.checked ? 'x' : ' ';
        return `${getIndent(checkDepth)}- [${checked}] ${item}`;
      }).join('\n');
      
    case 'divider':
      return '---';
      
    case 'image':
      const title = block.meta?.title ? ` "${block.meta.title}"` : '';
      return `![${block.content}](${block.meta?.url || ''}${title})`;
      
    default:
      return block.content;
  }
};

const parseRawText = (text: string, currentBlock: Block): { type: BlockType; content: string; meta?: Block['meta'] } => {
  // Handle empty text - preserve current block type if it makes sense
  if (!text.trim()) {
    if (currentBlock.type === 'quote' || currentBlock.type === 'list' || currentBlock.type === 'checklist') {
      return {
        type: currentBlock.type,
        content: '',
        meta: currentBlock.meta
      };
    }
  }

  // Handle heading patterns
  const headingMatch = text.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      content: headingMatch[2],
      meta: { level: headingMatch[1].length }
    };
  }

  // Handle code blocks - only convert when user presses Enter after ```
  if (text.startsWith('```')) {
    const firstLineEnd = text.indexOf('\n');
    // Only convert to code block if there's a newline (user pressed Enter)
    if (firstLineEnd > 0) {
      const language = text.substring(3, firstLineEnd).trim();
      const content = text.substring(firstLineEnd + 1).replace(/\n?```$/, ''); // Remove any trailing ```
      return {
        type: 'code',
        content: content,
        meta: { language: language || 'plaintext' }
      };
    } else {
      // Still typing the first line - keep as paragraph until they press Enter
      return {
        type: 'paragraph',
        content: text
      };
    }
  }

  // If we're already in a code block, keep it as code block
  if (currentBlock.type === 'code') {
    if (text.startsWith('```')) {
      const firstLineEnd = text.indexOf('\n');
      if (firstLineEnd > 0) {
        const language = text.substring(3, firstLineEnd).trim();
        const content = text.substring(firstLineEnd + 1).replace(/\n?```$/, ''); // Remove any trailing ```
        return {
          type: 'code',
          content: content,
          meta: { language: language || 'plaintext' }
        };
      }
    }
    
    // If user removes the ``` syntax, convert back to paragraph
    if (!text.startsWith('```')) {
      return {
        type: 'paragraph',
        content: text
      };
    }
  }

  // Handle images
  const imageMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)$/);
  if (imageMatch) {
    return {
      type: 'image',
      content: imageMatch[1],
      meta: { 
        url: imageMatch[2], 
        alt: imageMatch[1],
        title: imageMatch[3] || ''
      }
    };
  }

  // Handle quotes (can be nested) - require space after > markers for proper quotes
  const quoteMatch = text.match(/^(>+)\s+(.*)$/);
  if (quoteMatch) {
    const [, markers, content] = quoteMatch;
    const quoteDepth = markers.length - 1; // 0 for >, 1 for >>, etc.
    return {
      type: 'quote',
      content: content,
      meta: { depth: quoteDepth }
    };
  }

  // Handle quote markers without space - could be user deleting or typing
  const quoteMarkersOnly = text.match(/^(>+)\s*$/);
  if (quoteMarkersOnly && currentBlock.type === 'quote') {
    const [, markers] = quoteMarkersOnly;
    const quoteDepth = markers.length - 1;
    return {
      type: 'quote',
      content: '',
      meta: { depth: quoteDepth }
    };
  }

  // Handle malformed quotes (> without proper space) - convert to paragraph if we're in a quote
  const malformedQuote = text.match(/^>+\S/); // > followed directly by non-space
  if (malformedQuote && currentBlock.type === 'quote') {
    return {
      type: 'paragraph',
      content: text
    };
  }

  // If we're in a quote block but the text doesn't start with >, convert to paragraph
  if (currentBlock.type === 'quote' && !text.startsWith('>')) {
    return {
      type: 'paragraph',
      content: text
    };
  }

  // Special case: if we have just quote markers with no content, and user is trying to type normal text
  // Convert to paragraph if the text doesn't look like a quote pattern
  if (currentBlock.type === 'quote' && text.trim() && !text.match(/^>+/)) {
    return {
      type: 'paragraph',
      content: text
    };
  }

  // Handle checklists (must come before regular lists)
  const checkMatch = text.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
  if (checkMatch) {
    return {
      type: 'checklist',
      content: checkMatch[2],
      meta: { checked: checkMatch[1].toLowerCase() === 'x' }
    };
  }

  // Handle lists
  if (text.match(/^(\*|\-|\+)\s+/)) {
    return {
      type: 'list',
      content: text.substring(2),
      meta: { ordered: false }
    };
  }

  if (text.match(/^\d+\.\s+/)) {
    return {
      type: 'list',
      content: text.replace(/^\d+\.\s+/, ''),
      meta: { ordered: true }
    };
  }

  // Handle dividers
  if (text === '---' || text === '***' || text === '___') {
    return {
      type: 'divider',
      content: ''
    };
  }

  // Default to paragraph
  return {
    type: 'paragraph',
    content: text
  };
};

// Block Components
const UniversalBlock: React.FC<BlockProps> = ({ 
  block, 
  isActive, 
  isEditing,
  displayValue,
  onRawTextChange,
  onFocus, 
  onEdit,
  onBlur, 
  onKeyPress,
  theme,
  placeholder 
}) => {
  const inputRef = useRef<TextInput>(null);
  const blurTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (isEditing) {
      // guarantee focus even after re-renders
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isEditing, displayValue]);

  const getBlockStyle = (): TextStyle => {
    switch (block.type) {
      case 'heading':
        const level = block.meta?.level || 1;
        const headingStyles = {
          1: theme?.heading1 || defaultTheme.heading1,
          2: theme?.heading2 || defaultTheme.heading2,
          3: theme?.heading3 || defaultTheme.heading3,
          4: theme?.heading4 || defaultTheme.heading4,
          5: theme?.heading5 || defaultTheme.heading5,
          6: theme?.heading6 || defaultTheme.heading6,
        };
        return headingStyles[level as keyof typeof headingStyles];
      case 'code':
        return theme?.code || defaultTheme.code;
      case 'quote':
        const quoteDepth = block.meta?.depth || 0;
        return { 
          ...(theme?.quote || defaultTheme.quote),
          paddingLeft: 16 + (quoteDepth * 16) // Additional indentation for nested quotes
        };
      case 'list':
        return { paddingLeft: 8 };
      case 'checklist':
        return { paddingLeft: 8 };
      case 'divider':
        return { textAlign: 'center', color: '#9ca3af', fontSize: 24 };
      case 'image':
        return { fontStyle: 'italic', color: '#6b7280' };
      default:
        return {};
    }
  };

  const getBlockContainer = () => {
    switch (block.type) {
      case 'code':
        return [styles.codeBlockContainer, theme?.codeBlock];
      case 'quote':
        const quoteDepth = block.meta?.depth || 0;
        return [
          styles.quoteContainer, 
          theme?.quoteBlock,
          { 
            marginLeft: quoteDepth * 16, // Visual indentation for nesting
            borderLeftColor: quoteDepth > 0 ? '#94a3b8' : '#3b82f6' // Different border color for nested quotes
          }
        ];
      case 'list':
        return [styles.listContainer];
      case 'checklist':
        return [styles.checklistContainer];
      case 'divider':
        return [styles.dividerContainer];
      case 'image':
        return [styles.imageContainer];
      default:
        return [];
    }
  };

  const getInputStyle = () => {
    switch (block.type) {
      case 'code':
        return styles.codeInput;
      case 'quote':
        return styles.quoteInput;
      default:
        return {};
    }
  };

  // Always show editable input
  const containerStyle = getBlockContainer();
  const blockStyle = getBlockStyle();
  const inputStyle = getInputStyle();

  const input = (
    <TextInput
      ref={inputRef}
      style={[
        styles.input,
        blockStyle,
        inputStyle,
        theme?.input,
        isActive && styles.focusedInput,
        isActive && theme?.focusedInput,
      ]}
      value={displayValue}
      onChangeText={onRawTextChange}
      onFocus={() => {
        if (blurTimeout.current) {
          clearTimeout(blurTimeout.current);
          blurTimeout.current = null;
        }
        onFocus();
      }}
      onBlur={() => {
        // wait a moment – if we refocus quickly (because component re-mounted) do not drop focus state
        blurTimeout.current = setTimeout(() => {
          onBlur();
        }, 100);
      }}
      onKeyPress={onKeyPress}
      placeholder={placeholder || `Type something...`}
      placeholderTextColor={theme?.placeholder?.color || '#a8a8a8'}
      multiline
      textAlignVertical="top"
      autoCapitalize={block.type === 'code' ? 'none' : 'sentences'}
      autoCorrect={block.type === 'code' ? false : true}
      spellCheck={block.type === 'code' ? false : true}
      selectionColor="#3b82f6"
    />
  );

  // PREVIEW MODE (not active) – render formatted, non-editable text so gestures bubble up
  if (!isActive) {
    const previewSegments = processInlineFormatting(block.content);
    const previewStyle = StyleSheet.flatten([styles.input, getBlockStyle(), theme?.input]);
    const preview = (
      <FormattedText
        segments={previewSegments}
        style={previewStyle}
        theme={{ ...defaultTheme, ...theme }}
      />
    );
    if (containerStyle.length > 0) {
      return <View style={containerStyle}>{preview}</View>;
    }
    return preview;
  }

  // EDIT MODE – show TextInput
  if (containerStyle.length > 0) {
    return (
      <View style={containerStyle}>
        {input}
      </View>
    );
  }

  return input;
};

// Helper function to process inline markdown formatting
const processInlineFormatting = (text: string): FormattedTextSegment[] => {
  const segments: FormattedTextSegment[] = [];
  let i = 0;
  
  while (i < text.length) {
    let handled = false;
    
    // Look for code first - it has highest priority
    if (text[i] === '`') {
      const codeEnd = text.indexOf('`', i + 1);
      if (codeEnd !== -1) {
        const codeContent = text.slice(i + 1, codeEnd);
        segments.push({ text: codeContent, type: 'code' });
        i = codeEnd + 1;
        handled = true;
      }
    }
    
    // Look for bold patterns
    if (!handled && (text.slice(i).startsWith('**') || text.slice(i).startsWith('__'))) {
      const boldMarker = text.slice(i).startsWith('**') ? '**' : '__';
      const boldEnd = text.indexOf(boldMarker, i + boldMarker.length);
      if (boldEnd !== -1) {
        const boldContent = text.slice(i + boldMarker.length, boldEnd);
        const boldSegments = processInlineFormatting(boldContent);
        
        // Convert all segments to bold or bold-italic
        for (const segment of boldSegments) {
          if (segment.type === 'italic') {
            segments.push({ text: segment.text, type: 'bold-italic' });
          } else if (segment.type === 'normal') {
            segments.push({ text: segment.text, type: 'bold' });
          } else {
            segments.push(segment); // code stays as code
          }
        }
        i = boldEnd + boldMarker.length;
        handled = true;
      }
    }
    
    // Look for italic patterns
    if (!handled && ((text[i] === '*' && text[i + 1] !== '*') || 
                     (text[i] === '_' && text[i + 1] !== '_'))) {
      const italicMarker = text[i];
      const italicEnd = text.indexOf(italicMarker, i + 1);
      if (italicEnd !== -1) {
        const italicContent = text.slice(i + 1, italicEnd);
        const italicSegments = processInlineFormatting(italicContent);
        
        // Convert all segments to italic or bold-italic
        for (const segment of italicSegments) {
          if (segment.type === 'bold') {
            segments.push({ text: segment.text, type: 'bold-italic' });
          } else if (segment.type === 'normal') {
            segments.push({ text: segment.text, type: 'italic' });
          } else {
            segments.push(segment); // code stays as code
          }
        }
        i = italicEnd + 1;
        handled = true;
      }
    }
    
    // If no formatting was handled, collect normal text
    if (!handled) {
      let normalText = '';
      while (i < text.length && 
             text[i] !== '`' && 
             !text.slice(i).startsWith('**') && 
             !text.slice(i).startsWith('__') &&
             !(text[i] === '*' && text[i + 1] !== '*') &&
             !(text[i] === '_' && text[i + 1] !== '_')) {
        normalText += text[i];
        i++;
      }
      
      // If we didn't collect any normal text, just advance by 1 to avoid infinite loop
      if (!normalText) {
        normalText = text[i];
        i++;
      }
      
      segments.push({ text: normalText, type: 'normal' });
    }
  }
  
  return segments.length > 0 ? segments : [{ text, type: 'normal' }];
};

// Component to render formatted text
const FormattedText: React.FC<{ 
  segments: FormattedTextSegment[]; 
  style?: TextStyle; 
  theme: Required<EditorTheme>;
}> = ({ segments, style, theme }) => {
  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        let segmentStyle: TextStyle = {};
        
        switch (segment.type) {
          case 'bold':
            segmentStyle = theme.bold;
            break;
          case 'italic':
            segmentStyle = theme.italic;
            break;
          case 'bold-italic':
            segmentStyle = { ...theme.bold, ...theme.italic };
            break;
          case 'code':
            segmentStyle = theme.inlineCode;
            break;
          default:
            segmentStyle = {};
        }
      
        return (
          <Text key={index} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

// Default theme - Modern and minimalistic
const defaultTheme: Required<EditorTheme> = {
  container: {
    backgroundColor: '#fafafa',
  },
  block: {
    backgroundColor: 'transparent',
  },
  focusedBlock: {
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
  },
  input: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1a1a1a',
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
  },
  focusedInput: {
    color: '#1a1a1a',
  },
  placeholder: { 
    color: '#a8a8a8',
    fontWeight: '300',
  },
  heading1: { 
    fontSize: 32, 
    fontWeight: '700', 
    lineHeight: 40, 
    color: '#1a1a1a',
    letterSpacing: -0.5,
  },
  heading2: { 
    fontSize: 28, 
    fontWeight: '600', 
    lineHeight: 36, 
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  heading3: { 
    fontSize: 24, 
    fontWeight: '600', 
    lineHeight: 32, 
    color: '#1a1a1a',
    letterSpacing: -0.2,
  },
  heading4: { 
    fontSize: 20, 
    fontWeight: '600', 
    lineHeight: 28, 
    color: '#1a1a1a' 
  },
  heading5: { 
    fontSize: 18, 
    fontWeight: '600', 
    lineHeight: 26, 
    color: '#1a1a1a' 
  },
  heading6: { 
    fontSize: 16, 
    fontWeight: '600', 
    lineHeight: 24, 
    color: '#1a1a1a' 
  },
  code: { 
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    fontSize: 14,
    lineHeight: 22,
    color: '#2d3748',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBlock: { 
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  quote: { 
    fontStyle: 'italic',
    color: '#4a5568',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '300',
  },
  quoteBlock: { 
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    paddingLeft: 20,
    marginLeft: 0,
  },
  bold: { 
    fontWeight: '600',
    color: '#1a1a1a',
  },
  italic: { 
    fontStyle: 'italic',
    color: '#2d3748',
  },
  inlineCode: { 
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    color: '#2d3748',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
};

// Main Editor Component
const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ 
    initialMarkdown = '', 
    onMarkdownChange, 
    onBlockChange,
    readOnly = false,
    placeholder = 'Start typing...',
    theme = {},
    customBlocks = {}
  }, ref) => {
    const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(initialMarkdown));
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [mode, setMode] = useState<'live' | 'raw'>('live');
    const [rawMarkdown, setRawMarkdown] = useState<string>('');
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Merge themes
    const mergedTheme = {
      ...defaultTheme,
      ...theme,
    };
    
    // Drag and drop state - simplified with long press
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [isDragReady, setIsDragReady] = useState<string | null>(null);
    const [originalDragIndex, setOriginalDragIndex] = useState<number | null>(null);
    
    // Visual animation values
    const dragScale = useRef(new Animated.Value(1)).current;
    const dragOpacity = useRef(new Animated.Value(1)).current;
    const dragY = useRef(new Animated.Value(0)).current;
    const dragShadow = 0; // placeholder kept for compatibility, no longer animated
    const pulseAnim = new Animated.Value(1); // kept but not animated (pulse disabled)
    
    // Auto-scroll state
    const [scrollViewLayout, setScrollViewLayout] = useState<{ height: number; y: number } | null>(null);
    const [currentScrollY, setCurrentScrollY] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const autoScrollTimer = useRef<number | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const dragReadyTimer = useRef<number | null>(null);
    const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

    // Toggle between live and raw modes
    const toggleMode = useCallback(() => {
      if (mode === 'live') {
        setRawMarkdown(blocksToMarkdown(blocks));
        setMode('raw');
      } else {
        const newBlocks = parseMarkdownToBlocks(rawMarkdown);
        setBlocks(newBlocks);
        setMode('live');
      }
    }, [mode, blocks, rawMarkdown]);

    // Move block up in the list
    const moveBlockUp = useCallback((blockId: string) => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex <= 0) return false;
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(currentIndex, 1);
        newBlocks.splice(currentIndex - 1, 0, movedBlock);
        return newBlocks;
      });
      
      return true;
    }, [blocks]);

    // Move block down in the list
    const moveBlockDown = useCallback((blockId: string) => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex >= blocks.length - 1) return false;
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(currentIndex, 1);
        newBlocks.splice(currentIndex + 1, 0, movedBlock);
        return newBlocks;
      });
      
      return true;
    }, [blocks]);

    // Enhanced auto-scroll function with proper content boundary detection
    const handleAutoScroll = useCallback((gestureY: number) => {
      if (!scrollViewRef.current || !scrollViewLayout || !draggingBlockId) return;
      
      const edgeThreshold = 50;
      const scrollSpeed = 8;
      
      // Clear existing timer
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      
      const relativeY = gestureY - scrollViewLayout.y;
      
      // Only auto-scroll if we're dragging within the ScrollView bounds
      if (relativeY < 0 || relativeY > scrollViewLayout.height) return;
      
      const maxScrollY = Math.max(0, contentHeight - scrollViewLayout.height);
      
      // Check if dragging near top edge and can scroll up
      if (relativeY < edgeThreshold && currentScrollY > 0) {
        autoScrollTimer.current = setInterval(() => {
          const newScrollY = Math.max(0, currentScrollY - scrollSpeed);
          scrollViewRef.current?.scrollTo({ 
            y: newScrollY, 
            animated: false 
          });
          setCurrentScrollY(newScrollY);
        }, 16) as unknown as number;
      } 
      // Check if dragging near bottom edge and can scroll down
      else if (relativeY > (scrollViewLayout.height - edgeThreshold) && currentScrollY < maxScrollY) {
        autoScrollTimer.current = setInterval(() => {
          const newScrollY = Math.min(maxScrollY, currentScrollY + scrollSpeed);
          scrollViewRef.current?.scrollTo({ 
            y: newScrollY, 
            animated: false 
          });
          setCurrentScrollY(newScrollY);
        }, 16) as unknown as number;
      }
    }, [scrollViewLayout, currentScrollY, contentHeight, draggingBlockId]);

    // Enhanced drag functions with better feedback
    const prepareDrag = useCallback((blockId: string) => {
      if (draggingBlockId || isDragReady) {
        return;
      }
      
      setIsDragReady(blockId);
      
      // Medium haptic feedback to indicate drag is ready
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Visual feedback - simple scale up
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1.02,
          useNativeDriver: true,
          tension: 400,
          friction: 20,
        }),
      ]).start();
    }, [draggingBlockId, isDragReady, dragScale]);

    const startDrag = useCallback((blockId: string) => {
      if (draggingBlockId || isDragReady !== blockId) {
        return;
      }
      
      // Stop pulse animation
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
        pulseAnimation.current = null;
      }
      
      // Store original position for reference
      const originalIndex = blocks.findIndex(b => b.id === blockId);
      setOriginalDragIndex(originalIndex);
      
      dragY.setValue(0);
      setDraggingBlockId(blockId);
      setIsDragReady(null);
      
      // Strong haptic feedback for drag start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Enhanced drag animation with shadow
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.timing(dragOpacity, {
          toValue: 0.85,
          useNativeDriver: true,
          duration: 200,
        }),
      ]).start();
    }, [draggingBlockId, isDragReady, dragScale, dragOpacity, blocks]);

    const updateDrag = useCallback((gestureY: number, blockId: string) => {
      if (!draggingBlockId || draggingBlockId !== blockId) {
        return;
      }
      
      // Handle auto-scroll first
      handleAutoScroll(gestureY);
      
      // Calculate current position in the (potentially reordered) blocks array
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId);
      if (currentBlockIndex === -1) return;
      
      // More accurate block height calculation
      const blockHeight = 64; // minHeight 56 + marginBottom 4 + paddingVertical 4
      const contentPaddingTop = 24; // from contentContainer style
      const scrollViewY = scrollViewLayout?.y || 0;
      
      // Calculate gesture position relative to content area
      const absoluteGestureY = gestureY - scrollViewY + currentScrollY - contentPaddingTop;
      
      // Calculate target position based on block positions
      let targetIndex = Math.round(absoluteGestureY / blockHeight);
      
      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(blocks.length - 1, targetIndex));
      
      // Add debug logging temporarily
      console.log('Drag debug:', { 
        gestureY, 
        scrollViewY, 
        currentScrollY, 
        contentPaddingTop,
        absoluteGestureY, 
        targetIndex, 
        currentBlockIndex,
        blockHeight,
        calculatedPosition: absoluteGestureY / blockHeight
      });
      
      // Only reorder if we're moving to a different position and the difference is significant
      // This helps reduce jittery behavior
      if (Math.abs(targetIndex - currentBlockIndex) >= 1) {
        setBlocks(prev => {
          const newBlocks = [...prev];
          const [movedBlock] = newBlocks.splice(currentBlockIndex, 1);
          newBlocks.splice(targetIndex, 0, movedBlock);
          return newBlocks;
        });
        
        // Haptic feedback for position changes
        Haptics.selectionAsync();
      }
    }, [draggingBlockId, blocks, handleAutoScroll, scrollViewLayout, currentScrollY]);

    const endDrag = useCallback(() => {
      // Clear timers
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (dragReadyTimer.current) {
        clearTimeout(dragReadyTimer.current);
        dragReadyTimer.current = null;
      }
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
        pulseAnimation.current = null;
      }
      
      if (!draggingBlockId && !isDragReady) return;

      // Success haptic feedback when drag ends
      if (draggingBlockId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset all states
      setDraggingBlockId(null);
      setIsDragReady(null);
      setOriginalDragIndex(null);
      
      // Smooth return animation
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(dragOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        // shadow & pulse reset animations removed
      ]).start();
    }, [draggingBlockId, isDragReady, blocks, dragScale, dragOpacity]);

    // Create PanResponder for drag gestures
    const createDragResponder = useCallback((blockId: string) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => {
          return isDragReady === blockId;
        },
        onMoveShouldSetPanResponder: () => {
          return draggingBlockId === blockId;
        },
        onPanResponderGrant: (evt, gestureState) => {
          if (isDragReady === blockId) {
            startDrag(blockId);
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          if (draggingBlockId === blockId) {
            // Update drag position immediately for smooth animation
            dragY.setValue(gestureState.dy);
            // Throttle the updateDrag calls to reduce lag
            updateDrag(evt.nativeEvent.pageY, blockId);
          }
        },
        onPanResponderRelease: () => {
          endDrag();
        },
        onPanResponderTerminate: () => {
          endDrag();
        },
      });
    }, [isDragReady, draggingBlockId, startDrag, updateDrag, endDrag]);

    const handleBlockBlur = useCallback(() => {
      // Use timeout to prevent immediate blur when switching between blocks
      setTimeout(() => {
        setFocusedBlockId(null);
        
        // Stop pulse animation if running
        if (pulseAnimation.current) {
          pulseAnimation.current.stop();
          pulseAnimation.current = null;
        }
        
        // Reset animations
        Animated.parallel([
          Animated.spring(dragScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          Animated.spring(dragOpacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          // shadow & pulse reset animations removed
        ]).start();
      }, 100);
    }, [dragScale, dragOpacity]);

    const handleContainerPress = useCallback(() => {
      // Click outside to blur focused block
      if (focusedBlockId) {
        setFocusedBlockId(null);
      }
    }, [focusedBlockId]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => blocksToMarkdown(blocks),
      focus: () => {
        if (blocks.length > 0) {
          setFocusedBlockId(blocks[0].id);
        }
      },
      insertBlock: (type: BlockType, index?: number) => {
        const newBlock: Block = {
          id: generateId(),
          type,
          content: '',
          meta: type === 'heading' ? { level: 1 } : undefined
        };
        
        const insertIndex = index ?? blocks.length;
        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks.splice(insertIndex, 0, newBlock);
          return newBlocks;
        });
        
        setTimeout(() => {
          setFocusedBlockId(newBlock.id);
        }, 0);
      },
      deleteBlock: (id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
        setFocusedBlockId(null);
      },
      moveBlockUp: (id: string) => moveBlockUp(id),
      moveBlockDown: (id: string) => moveBlockDown(id),
      toggleMode: () => {
        toggleMode();
      },
      getCurrentMode: () => {
        return mode;
      },
    }), [blocks, mode, toggleMode, moveBlockUp, moveBlockDown]);

    // Update blocks when initialMarkdown changes
    useEffect(() => {
      if (initialMarkdown !== blocksToMarkdown(blocks)) {
        setBlocks(parseMarkdownToBlocks(initialMarkdown));
      }
    }, [initialMarkdown]);

    // Notify parent of changes
    useEffect(() => {
      const markdown = blocksToMarkdown(blocks);
      onMarkdownChange?.(markdown);
      onBlockChange?.(blocks);
    }, [blocks, onMarkdownChange, onBlockChange]);

    // Update raw markdown when typing in raw mode
    const handleRawMarkdownChange = useCallback((text: string) => {
      setRawMarkdown(text);
    }, []);

    const handleRawTextChange = useCallback((blockId: string, text: string) => {
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return;

      const currentBlock = blocks[blockIndex];
      const parsed = parseRawText(text, currentBlock);

      setBlocks(prev => 
        prev.map(block => 
          block.id === blockId 
            ? { ...block, type: parsed.type, content: parsed.content, meta: parsed.meta }
            : block
        )
      );
    }, [blocks]);

    const handleKeyPress = useCallback((
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
      blockId: string,
      blockIndex: number
    ) => {
      const { key } = e.nativeEvent;

      if (key === 'Enter') {
        const currentBlock = blocks[blockIndex];
        
        if (!currentBlock.content.trim()) {
          return;
        }

        const newBlock: Block = {
          id: generateId(),
          type: 'paragraph',
          content: ''
        };

        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          return newBlocks;
        });

        setTimeout(() => {
          setFocusedBlockId(newBlock.id);
        }, 0);
      }

      if (key === 'Backspace') {
        const currentBlock = blocks[blockIndex];
        
        if (currentBlock.type === 'quote') {
          if (!currentBlock.content.trim()) {
            e.preventDefault();
            setBlocks(prev => 
              prev.map(block => 
                block.id === blockId 
                  ? { ...block, type: 'paragraph', content: '', meta: undefined }
                  : block
              )
            );
            return;
          }
          
          if (currentBlock.content.trim().length <= 1) {
            e.preventDefault();
            setBlocks(prev => 
              prev.map(block => 
                block.id === blockId 
                  ? { ...block, type: 'paragraph', content: currentBlock.content.trim(), meta: undefined }
                  : block
              )
            );
            return;
          }
        }
        
        if (!currentBlock.content.trim() && blocks.length > 1) {
          e.preventDefault();
          
          setBlocks(prev => prev.filter(block => block.id !== blockId));
          
          if (blockIndex > 0) {
            setTimeout(() => {
              setFocusedBlockId(blocks[blockIndex - 1].id);
            }, 0);
          }
        }
      }
    }, [blocks]);

    const renderBlock = (block: Block, index: number) => {
      const isFocused = focusedBlockId === block.id;
      const displayValue = getDisplayValue(block, isFocused);
      
      const blockProps: BlockProps = {
        block,
        index,
        isActive: isFocused,
        isEditing: isFocused,
        displayValue,
        onRawTextChange: (text: string) => handleRawTextChange(block.id, text),
        onFocus: () => setFocusedBlockId(block.id),
        onEdit: () => setFocusedBlockId(block.id),
        onBlur: handleBlockBlur,
        onKeyPress: (e) => handleKeyPress(e, block.id, index),
        theme: mergedTheme,
        placeholder
      };

      if (customBlocks[block.type]) {
        const CustomBlock = customBlocks[block.type];
        return <CustomBlock key={block.id} {...blockProps} />;
      }

      const actionButtons = isFocused ? (
        <View style={styles.blockActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (index > 0) {
                moveBlockUp(block.id);
                Haptics.selectionAsync();
              }
            }}
            disabled={index === 0}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={index === 0 ? '#cbd5e1' : '#4b5563'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (index < blocks.length - 1) {
                moveBlockDown(block.id);
                Haptics.selectionAsync();
              }
            }}
            disabled={index === blocks.length - 1}
          >
            <Ionicons
              name="arrow-down"
              size={16}
              color={index === blocks.length - 1 ? '#cbd5e1' : '#4b5563'}
            />
          </TouchableOpacity>
        </View>
      ) : null;

      const blockContent = (
        <View style={styles.blockContent} pointerEvents="box-none">
          <UniversalBlock {...blockProps} />
        </View>
      );

      const blockAnimatedStyle = [
        styles.block,
        mergedTheme.block,
        isFocused && styles.focusedBlock,
        isFocused && mergedTheme.focusedBlock,
      ];

      return (
        <View key={block.id}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (!readOnly) {
                setFocusedBlockId(block.id);
              }
            }}
            disabled={readOnly}
            style={styles.blockTouchWrapper}
          >
            <Animated.View style={blockAnimatedStyle}>
              {blockContent}
              {actionButtons}
            </Animated.View>
          </TouchableOpacity>
        </View>
      );
    };

    if (readOnly) {
      return (
        <ScrollView style={[styles.container, mergedTheme.container]}>
          <View style={styles.contentContainer}>
            {blocks.map((block, index) => {
              const displayValue = getDisplayValue(block, false);
              return (
                <View key={block.id} style={[styles.block, mergedTheme.block]}>
                  <UniversalBlock
                    block={block}
                    index={index}
                    isActive={false}
                    isEditing={false}
                    displayValue={displayValue}
                    onRawTextChange={() => {}}
                    onFocus={() => {}}
                    onEdit={() => {}}
                    onBlur={() => {}}
                    onKeyPress={() => {}}
                    theme={mergedTheme}
                    placeholder={placeholder}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={[styles.container, mergedTheme.container]}>
        {mode === 'live' ? (
          <TouchableOpacity 
            style={styles.scrollViewContainer}
            activeOpacity={1}
            onPress={handleContainerPress}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => {
                setScrollViewLayout({
                  height: event.nativeEvent.layout.height,
                  y: event.nativeEvent.layout.y,
                });
              }}
              onScroll={(event) => {
                setCurrentScrollY(event.nativeEvent.contentOffset.y);
              }}
              onContentSizeChange={(width, height) => {
                setContentHeight(height);
              }}
              scrollEventThrottle={16}
            >
              {blocks.map(renderBlock)}
            </ScrollView>
          </TouchableOpacity>
        ) : (
          <View style={styles.rawContainer}>
            <TextInput
              style={[styles.rawInput, mergedTheme.input]}
              value={rawMarkdown}
              onChangeText={handleRawMarkdownChange}
              placeholder={placeholder}
              placeholderTextColor="#a1a1aa"
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              selectionColor="#3b82f6"
            />
          </View>
        )}

        <ModeSwitcher mode={mode} onToggle={toggleMode} />
      </View>
    );
  }
);

// Styles - Modern and minimalistic
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollViewContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  block: {
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56, // Increased minimum height for better touch target
  },
  focusedBlock: {
    borderColor: 'rgba(59, 130, 246, 0.15)',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },
  blockContent: {
    minHeight: 48,
  },
  blockTouchWrapper: {
    // Empty style, TouchableOpacity will handle the touch area
  },
  blockActions: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButton: {
    padding: 4,
  },
  input: {
    fontSize: 16,
    lineHeight: 26,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
    color: '#1a1a1a',
  },
  focusedInput: {
    backgroundColor: 'transparent',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1a1a1a',
    paddingVertical: 10,
    minHeight: 48,
  },
  placeholderText: {
    color: '#a8a8a8',
    fontWeight: '300',
  },
  codeBlockContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  codeInput: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'transparent',
    color: '#2d3748',
  },
  quoteContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    paddingLeft: 20,
    marginVertical: 8,
  },
  quoteInput: {
    fontStyle: 'italic',
    color: '#4a5568',
    backgroundColor: 'transparent',
    fontWeight: '300',
  },
  listContainer: {
    marginVertical: 4,
  },
  checklistContainer: {
    marginVertical: 4,
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dropZoneIndicator: {
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 1.5,
    marginVertical: 8,
    marginHorizontal: 20,
    opacity: 0.8, // More visible
  },
  finalDropZone: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  rawContainer: {
    flex: 1,
    padding: 24,
  },
  rawInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    color: '#2d3748',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Mode Switcher Styles
  modeSwitcher: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeSwitcherTrack: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeSwitcherThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    left: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  modeSwitcherLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  modeSwitcherLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  modeSwitcherLabelActive: {
    color: '#ffffff',
  },
});

export default MarkdownEditor;
