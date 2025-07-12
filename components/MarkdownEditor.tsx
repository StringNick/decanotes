import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
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
import MarkdownDisplay from 'react-native-markdown-display';

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
  displayValue: string;
  onRawTextChange: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyPress: (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => void;
  theme?: EditorTheme;
  placeholder?: string;
}

// Add new interface for floating menu
interface FloatingMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  menuType: MenuType;
  onInsertBlock: (type: BlockType) => void;
  onAction: (action: string) => void;
  onClose: () => void;
}

// Add state for menu type
type MenuType = 'actions' | 'blocks';

// Floating Menu Component
const FloatingMenu: React.FC<FloatingMenuProps> = ({ visible, position, menuType, onInsertBlock, onAction, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  const actionOptions = [
    { action: 'move', icon: '⋮⋮', label: 'Move Block', color: '#6b7280' },
    { action: 'add', icon: '+', label: 'Add Block', color: '#3b82f6' },
    { action: 'delete', icon: '×', label: 'Delete Block', color: '#ef4444' },
  ];

  const blockOptions = [
    { type: 'paragraph' as BlockType, icon: '¶', label: 'Text' },
    { type: 'heading' as BlockType, icon: 'H₁', label: 'Heading' },
    { type: 'code' as BlockType, icon: '</>', label: 'Code' },
    { type: 'quote' as BlockType, icon: '❝', label: 'Quote' },
    { type: 'list' as BlockType, icon: '•', label: 'List' },
    { type: 'checklist' as BlockType, icon: '☐', label: 'Checklist' },
    { type: 'divider' as BlockType, icon: '—', label: 'Divider' },
    { type: 'image' as BlockType, icon: '🖼', label: 'Image' },
  ];

  return (
    <View style={styles.floatingMenuOverlay}>
      {/* Background overlay to close menu when clicking outside */}
      <TouchableOpacity 
        style={styles.floatingMenuBackground}
        onPress={onClose}
        activeOpacity={1}
      />
      
      <Animated.View
        style={[
          styles.floatingMenu,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            left: position.x,
            top: position.y,
          },
        ]}
      >
        <View style={styles.floatingMenuContent}>
          {menuType === 'actions' ? (
            actionOptions.map((option, index) => (
              <TouchableOpacity
                key={option.action}
                style={[
                  styles.floatingMenuItem,
                  index === actionOptions.length - 1 && styles.floatingMenuItemLast,
                ]}
                onPress={() => {
                  onAction(option.action);
                  if (option.action !== 'add') {
                    onClose();
                  }
                }}
              >
                <Text style={[styles.floatingMenuIcon, { color: option.color }]}>
                  {option.icon}
                </Text>
                <Text style={styles.floatingMenuLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))
          ) : (
            blockOptions.map((option, index) => (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.floatingMenuItem,
                  index === blockOptions.length - 1 && styles.floatingMenuItemLast,
                ]}
                onPress={() => {
                  onInsertBlock(option.type);
                  onClose();
                }}
              >
                <Text style={styles.floatingMenuIcon}>{option.icon}</Text>
                <Text style={styles.floatingMenuLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// Floating Plus Button Component
const FloatingPlusButton: React.FC<{
  visible: boolean;
  position: { x: number; y: number };
  onPress: () => void;
}> = ({ visible, position, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.floatingPlusButton,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          left: position.x,
          top: position.y,
        },
      ]}
    >
      <TouchableOpacity style={styles.plusButtonTouchable} onPress={onPress}>
        <Text style={styles.plusButtonText}>+</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Mode Switcher Component
const ModeSwitcher: React.FC<{
  mode: 'live' | 'raw';
  onToggle: () => void;
}> = ({ mode, onToggle }) => {
  return (
    <TouchableOpacity style={styles.modeSwitcher} onPress={onToggle}>
      <View style={styles.modeSwitcherContent}>
        <Text style={styles.modeSwitcherText}>
          {mode === 'live' ? '◉' : '◦'} {mode === 'live' ? 'Live' : 'Raw'}
        </Text>
      </View>
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

const parseLineToBlock = (line: string): Block => {
  const trimmed = line.trim();
  
  // Heading
  const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
      return {
      id: generateId(),
        type: 'heading',
      content: headingMatch[2],
      meta: { level: headingMatch[1].length }
    };
  }

  // Image
  const imageMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)$/);
  if (imageMatch) {
      return {
      id: generateId(),
      type: 'image',
      content: imageMatch[1], // alt text
      meta: { 
        url: imageMatch[2], 
        alt: imageMatch[1],
        title: imageMatch[3] || ''
      }
    };
  }

  // Quote (can be nested) - require space after > markers
  const quoteMatch = trimmed.match(/^(>+)\s+(.*)$/);
  if (quoteMatch) {
    const [, markers, content] = quoteMatch;
    const quoteDepth = markers.length - 1; // 0 for >, 1 for >>, etc.
    return {
      id: generateId(),
      type: 'quote',
      content: content,
      meta: { depth: quoteDepth }
    };
  }

  // Handle empty quotes (just > markers)
  const emptyQuoteMatch = trimmed.match(/^(>+)\s*$/);
  if (emptyQuoteMatch) {
    const [, markers] = emptyQuoteMatch;
    const quoteDepth = markers.length - 1;
    return {
      id: generateId(),
      type: 'quote',
      content: '',
      meta: { depth: quoteDepth }
    };
  }

  // Checklist (must come before regular list)
  const checkMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
  if (checkMatch) {
    return {
      id: generateId(),
      type: 'checklist',
      content: checkMatch[2],
      meta: { checked: checkMatch[1].toLowerCase() === 'x' }
    };
  }

  // List item (ordered and unordered)
  const listMatch = trimmed.match(/^(\d+\.|\*|\-|\+)\s+(.*)$/);
  if (listMatch) {
    return {
      id: generateId(),
      type: 'list',
      content: listMatch[2],
      meta: { ordered: /^\d+\./.test(listMatch[1]) }
    };
  }

  // Divider
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    return {
      id: generateId(),
      type: 'divider',
      content: ''
    };
  }

  // Default paragraph
  return {
    id: generateId(),
    type: 'paragraph',
    content: trimmed
  };
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
  displayValue,
  onRawTextChange,
  onFocus, 
  onBlur, 
  onKeyPress,
  theme,
  placeholder 
}) => {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    }
  }, [isActive]);

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
            borderLeftColor: quoteDepth > 0 ? '#94a3b8' : '#d1d5db' // Different border color for nested quotes
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

  if (isActive) {
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
          styles.focusedInput,
          theme?.focusedInput,
        ]}
        value={displayValue}
        onChangeText={onRawTextChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyPress={onKeyPress}
        placeholder={placeholder || `Enter ${block.type}...`}
        placeholderTextColor={theme?.placeholder?.color || '#9CA3AF'}
        multiline
        autoFocus
        textAlignVertical="top"
        autoCapitalize={block.type === 'code' ? 'none' : 'sentences'}
        autoCorrect={block.type === 'code' ? false : true}
        spellCheck={block.type === 'code' ? false : true}
      />
    );

    if (containerStyle.length > 0) {
      return (
        <View style={containerStyle}>
          {input}
        </View>
      );
    }

    return input;
  }

  const blockStyle = getBlockStyle();
  const containerStyle = getBlockContainer();

  // Format the content if it exists, otherwise show placeholder
  const textContent = block.content || placeholder || `Enter ${block.type}...`;
  const formattedSegments = block.content ? processInlineFormatting(block.content) : [{ text: textContent, type: 'normal' as const }];

  const content = (
    <FormattedText
      segments={formattedSegments}
      style={StyleSheet.flatten([styles.paragraph, blockStyle, theme?.input])}
      theme={theme as Required<EditorTheme>}
    />
  );

  if (containerStyle.length > 0) {
    return (
      <TouchableOpacity onPress={onFocus} style={styles.blockTouchable}>
        <View style={containerStyle}>
          {content}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onFocus} style={styles.blockTouchable}>
      {content}
    </TouchableOpacity>
  );
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

// Default theme
const defaultTheme: Required<EditorTheme> = {
  container: {},
  block: {},
  focusedBlock: {},
  input: {},
  focusedInput: {},
  placeholder: { color: '#9CA3AF' },
  heading1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  heading2: { fontSize: 28, fontWeight: '600', lineHeight: 36 },
  heading3: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  heading4: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  heading5: { fontSize: 18, fontWeight: '600', lineHeight: 26 },
  heading6: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  code: { fontFamily: 'Courier', fontSize: 14, lineHeight: 20 },
  codeBlock: { backgroundColor: '#f6f8fa', borderRadius: 6, padding: 16 },
  quote: { fontStyle: 'italic', color: '#6b7280' },
  quoteBlock: { borderLeftWidth: 4, borderLeftColor: '#d1d5db', paddingLeft: 16 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  inlineCode: { fontFamily: 'Courier', fontSize: 14, backgroundColor: '#f1f5f9', paddingHorizontal: 4, borderRadius: 3 },
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
    const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
    const [mode, setMode] = useState<'live' | 'raw'>('live');
    const [rawMarkdown, setRawMarkdown] = useState<string>('');
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Floating menu state
    const [showFloatingMenu, setShowFloatingMenu] = useState(false);
    const [floatingMenuPosition, setFloatingMenuPosition] = useState({ x: 0, y: 0 });
    const [menuType, setMenuType] = useState<MenuType>('actions');

    const mergedTheme = { ...defaultTheme, ...theme };

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

    // Toggle between live and raw modes
    const toggleMode = useCallback(() => {
      if (mode === 'live') {
        // Switch to raw mode - store current markdown
        setRawMarkdown(blocksToMarkdown(blocks));
        setMode('raw');
      } else {
        // Switch to live mode - parse raw markdown back to blocks
        const newBlocks = parseMarkdownToBlocks(rawMarkdown);
        setBlocks(newBlocks);
        setMode('live');
      }
    }, [mode, blocks, rawMarkdown]);

    // Update raw markdown when typing in raw mode
    const handleRawMarkdownChange = useCallback((text: string) => {
      setRawMarkdown(text);
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => blocksToMarkdown(blocks),
      focus: () => {
        if (blocks.length > 0) {
          setActiveBlockId(blocks[0].id);
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
        
        setTimeout(() => setActiveBlockId(newBlock.id), 0);
      },
      deleteBlock: (id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
        setActiveBlockId(null);
      },
      toggleMode: () => {
        toggleMode();
      },
      getCurrentMode: () => {
        return mode;
      },
    }));

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
        
        // If current block is empty, don't create a new block
        if (!currentBlock.content.trim()) {
          return;
        }

        // Create new paragraph block
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

        // Focus new block
        setTimeout(() => setActiveBlockId(newBlock.id), 0);
      }

      if (key === 'Backspace') {
        const currentBlock = blocks[blockIndex];
        
        // Special handling for quote blocks
        if (currentBlock.type === 'quote') {
          // If content is empty or very short, convert to paragraph on backspace
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
          
          // If the content is just a single character or very short, also convert on backspace
          // This helps when user deletes content and wants to convert the quote
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
        
        // If block is empty and not the only block, delete it
        if (!currentBlock.content.trim() && blocks.length > 1) {
          e.preventDefault();
          
          setBlocks(prev => prev.filter(block => block.id !== blockId));
          
          // Focus previous block if it exists
          if (blockIndex > 0) {
            setTimeout(() => setActiveBlockId(blocks[blockIndex - 1].id), 0);
          }
        }
      }
    }, [blocks]);

    const renderBlock = (block: Block, index: number) => {
      const isActive = activeBlockId === block.id;
      const displayValue = getDisplayValue(block, isActive);
      
      const blockProps: BlockProps = {
        block,
        index,
        isActive,
        displayValue,
        onRawTextChange: (text: string) => handleRawTextChange(block.id, text),
        onFocus: () => {
          setActiveBlockId(block.id);
        },
        onBlur: () => {
          // Don't immediately hide on blur to allow menu interaction
          setTimeout(() => {
            if (!showFloatingMenu) {
              setActiveBlockId(null);
            }
          }, 100);
        },
        onKeyPress: (e) => handleKeyPress(e, block.id, index),
        theme: mergedTheme,
        placeholder
      };

      // Custom block component
      if (customBlocks[block.type]) {
        const CustomBlock = customBlocks[block.type];
        return <CustomBlock key={block.id} {...blockProps} />;
      }

      return (
        <View 
          key={block.id} 
          style={[
            styles.block,
            mergedTheme.block,
            isActive && styles.focusedBlock,
            isActive && mergedTheme.focusedBlock
          ]}
        >
          <View style={styles.blockContent}>
            <UniversalBlock {...blockProps} />
            
            {/* Block Handle - appears on focus */}
            {isActive && (
              <TouchableOpacity 
                style={styles.blockHandle}
                onPress={() => {
                  // Position the action menu near the handle and reset to actions
                  setFloatingMenuPosition({ x: 50, y: 50 });
                  setMenuType('actions');
                  setShowFloatingMenu(true);
                }}
              >
                <Text style={styles.blockHandleIcon}>⋮⋮</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    };

    if (readOnly) {
    return (
        <ScrollView style={[styles.container, mergedTheme.container]}>
          <MarkdownDisplay>
            {blocksToMarkdown(blocks)}
          </MarkdownDisplay>
        </ScrollView>
      );
    }



    const handleFloatingMenuClose = useCallback(() => {
      setShowFloatingMenu(false);
      setMenuType('actions'); // Reset to actions when closing
    }, []);

    const handleInsertBlock = useCallback((type: BlockType) => {
      if (activeBlockId) {
        const activeIndex = blocks.findIndex(b => b.id === activeBlockId);
        const newBlock: Block = {
          id: generateId(),
          type,
          content: '',
          meta: type === 'heading' ? { level: 1 } : undefined
        };
        
        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks.splice(activeIndex + 1, 0, newBlock);
          return newBlocks;
        });
        
        setTimeout(() => setActiveBlockId(newBlock.id), 0);
      }
    }, [activeBlockId, blocks]);

    const handleAction = useCallback((action: string) => {
      if (!activeBlockId) return;
      
      switch (action) {
        case 'move':
          // TODO: Implement block moving functionality
          console.log('Move block:', activeBlockId);
          break;
        case 'add':
          // Switch to block selection menu
          setMenuType('blocks');
          break;
        case 'delete':
          // TODO: Add confirmation dialog
          console.log('Delete block:', activeBlockId);
          if (blocks.length > 1) {
            setBlocks(prev => prev.filter(b => b.id !== activeBlockId));
            setActiveBlockId(null);
            setShowFloatingMenu(false);
          }
          break;
      }
    }, [activeBlockId, blocks]);

    // Close floating menu when switching modes or losing focus
    useEffect(() => {
      if (mode === 'raw' || !activeBlockId) {
        setShowFloatingMenu(false);
      }
    }, [activeBlockId, mode]);

    return (
      <View style={[styles.container, mergedTheme.container]}>
        {/* Content */}
        {mode === 'live' ? (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {blocks.map(renderBlock)}
          </ScrollView>
        ) : (
          <View style={styles.rawContainer}>
            <TextInput
              style={[styles.rawInput, mergedTheme.input]}
              value={rawMarkdown}
              onChangeText={handleRawMarkdownChange}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
            />
          </View>
        )}



        {/* Floating Menu */}
        <FloatingMenu
          visible={showFloatingMenu}
          position={floatingMenuPosition}
          menuType={menuType}
          onInsertBlock={handleInsertBlock}
          onAction={handleAction}
          onClose={handleFloatingMenuClose}
        />

        {/* Mode Switcher */}
        <ModeSwitcher mode={mode} onToggle={toggleMode} />
      </View>
    );
  }
);

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  block: {
    marginBottom: 4,
  },
  focusedBlock: {
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    borderRadius: 6,
    padding: 2,
  },
  blockContent: {
    flex: 1,
    position: 'relative',
  },
  blockHandle: {
    position: 'absolute',
    left: -35,
    top: 8,
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    opacity: 0.8,
    zIndex: 10,
  },
  blockHandleIcon: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 12,
  },
  blockTouchable: {
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    padding: 12,
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 44,
    fontFamily: 'System',
    color: '#1f2937',
  },
  focusedInput: {
    backgroundColor: '#ffffff',
    borderColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
  codeBlockContainer: {
    backgroundColor: '#f6f8fa',
    borderRadius: 6,
    padding: 16,
    marginVertical: 4,
  },
  codeInput: {
    fontFamily: 'Courier',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  quoteContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#d1d5db',
    paddingLeft: 16,
    marginVertical: 4,
  },
  quoteInput: {
    fontStyle: 'italic',
    color: '#6b7280',
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  listContainer: {
    paddingLeft: 8,
    marginVertical: 4,
  },
  checklistContainer: {
    paddingLeft: 8,
    marginVertical: 4,
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },

  scrollView: {
    flex: 1,
  },
  rawContainer: {
    flex: 1,
    padding: 16,
  },
  rawInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Courier',
    color: '#1f2937',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    padding: 16,
    textAlignVertical: 'top',
  },
  // Floating Menu Styles
  floatingMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  floatingMenuBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  floatingMenu: {
    position: 'absolute',
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingMenuContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 200,
    overflow: 'hidden',
  },
  floatingMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  floatingMenuItemLast: {
    borderBottomWidth: 0,
  },
  floatingMenuIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
    textAlign: 'center',
    color: '#6b7280',
  },
  floatingMenuLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  // Floating Plus Button Styles
  floatingPlusButton: {
    position: 'absolute',
    zIndex: 999,
  },
  plusButtonTouchable: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  plusButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    lineHeight: 18,
  },
  // Mode Switcher Styles
  modeSwitcher: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 998,
  },
  modeSwitcherContent: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeSwitcherText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
});

export default MarkdownEditor;
