import React, { useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { BlockPlugin } from '../BlockPlugin';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';

// Global cursor position tracker for heading blocks
let headingCursorPositions: { [blockId: string]: number } = {};

/**
 * Heading block component
 */
const HeadingComponent: React.FC<BlockComponentProps> = ({
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
  const level = block.meta?.level || 1;
  const headingStyle = getHeadingStyle(level);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleTextChange = (text: string) => {
    console.log('HeadingPlugin handleTextChange:', {
      newText: text,
      oldContent: block.content,
      cursorPosition,
      textLengthDiff: text.length - block.content.length,
      isBackspace: text.length < block.content.length
    });
    
    // Check if this is a backspace at position 0 (content deletion at start)
    // Only trigger when cursor was at position 0 and content is being deleted
    if (text.length < block.content.length && cursorPosition === 0) {
      console.log('Converting heading to paragraph with markdown syntax');
      
      // Convert heading back to paragraph with markdown syntax
      const level = block.meta?.level || 1;
      const markdownPrefix = '#'.repeat(level);
      
      onBlockChange({ 
        type: 'paragraph',
        content: `${markdownPrefix}${block.content}`,
        meta: {}
      });
      return;
    }
    
    onBlockChange({ content: text });
  };

  const handleKeyPress = (event: any) => {
    console.log('HeadingPlugin handleKeyPress:', {
      key: event.nativeEvent.key,
      cursorPosition,
      content: block.content
    });
    
    // Check if backspace is pressed at position 0
    if (event.nativeEvent.key === 'Backspace' && cursorPosition === 0) {
      console.log('Backspace at position 0 detected, converting to paragraph');
      
      // Convert heading back to paragraph with markdown syntax
      const level = block.meta?.level || 1;
      const markdownPrefix = '#'.repeat(level);
      
      onBlockChange({ 
        type: 'paragraph',
        content: `${markdownPrefix}${block.content}`,
        meta: {}
      });
      
      // Prevent default backspace behavior
      event.preventDefault();
      return;
    }
    
    // Call the original onKeyPress if provided
    if (onKeyPress) {
      onKeyPress(event);
    }
  };

  const handleSelectionChange = (event: any) => {
    const { selection } = event.nativeEvent;
    const position = selection.start;
    setCursorPosition(position);
    // Store cursor position globally so handleBackspace can access it
    headingCursorPositions[block.id] = position;
  };

  return (
    <View style={styles.container}>
      <View style={styles.headingContainer}>
        <Text style={styles.levelIndicator}>H{level}</Text>
        <TextInput
          style={[
            styles.textInput,
            headingStyle,
            isSelected && styles.selected,
            isFocused && styles.editing
          ]}
          value={block.content}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyPress={handleKeyPress}
          placeholder={`Heading ${level}`}
          placeholderTextColor="#999"
          multiline={false}
          editable={!readOnly}
        />
      </View>
    </View>
  );
};

// Export function to get cursor position for a block
export const getHeadingCursorPosition = (blockId: string): number => {
  return headingCursorPositions[blockId] || 0;
};

const getHeadingStyle = (level: number) => {
  switch (level) {
    case 1:
      return styles.h1;
    case 2:
      return styles.h2;
    case 3:
      return styles.h3;
    case 4:
      return styles.h4;
    case 5:
      return styles.h5;
    case 6:
      return styles.h6;
    default:
      return styles.h1;
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  headingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    minWidth: 24,
    textAlign: 'center',
  },
  textInput: {
    flex: 1,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 0,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  selected: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
    borderWidth: 1,
  },
  editing: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
});

/**
 * Heading block plugin
 */
export class HeadingPlugin extends BlockPlugin {
  readonly id = 'heading';
  readonly name = 'Heading';
  readonly version = '1.0.0';
  readonly description = 'Heading text block with multiple levels';
  readonly blockType = 'heading';
  readonly component = HeadingComponent;

  readonly markdownSyntax = {
    patterns: {
      block: /^(#{1,6})\s+(.+)$/
    },
    priority: 80
  };

  readonly toolbar = {
    icon: 'heading',
    label: 'Heading',
    shortcut: 'Ctrl+Alt+1',
    group: 'text',
    variants: [
      { label: 'Heading 1', shortcut: 'Ctrl+Alt+1', meta: { level: 1 } },
      { label: 'Heading 2', shortcut: 'Ctrl+Alt+2', meta: { level: 2 } },
      { label: 'Heading 3', shortcut: 'Ctrl+Alt+3', meta: { level: 3 } },
      { label: 'Heading 4', shortcut: 'Ctrl+Alt+4', meta: { level: 4 } },
      { label: 'Heading 5', shortcut: 'Ctrl+Alt+5', meta: { level: 5 } },
      { label: 'Heading 6', shortcut: 'Ctrl+Alt+6', meta: { level: 6 } },
    ]
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout'] as EditorBlockType[],
    validation: {
      required: [],
      maxLength: 200
    },
    defaultMeta: {
      level: 1
    }
  };

  /**
   * Handle backspace key - convert heading back to paragraph with markdown syntax
   * when cursor is at the beginning of the heading
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Get the current cursor position for this block
    const cursorPosition = headingCursorPositions[block.id] || 0;
    
    // Only convert to paragraph with markdown syntax if cursor is at position 0
    if (cursorPosition === 0) {
      const level = block.meta?.level || 1;
      const markdownPrefix = '#'.repeat(level);
      
      // Convert heading back to paragraph with markdown syntax (no space to prevent auto-conversion)
       return {
         ...block,
         type: 'paragraph',
         content: `${markdownPrefix}${block.content}`,
         meta: {}
       };
    }
    
    // If cursor is not at position 0, let default backspace behavior handle it
    return null;
  }
};