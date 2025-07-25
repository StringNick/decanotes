import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlockPlugin } from '../BlockPlugin';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';

/**
 * Paragraph block component
 */
const ParagraphComponent: React.FC<BlockComponentProps> = memo(({
  block,
  onUpdate,
  onBlockChange,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const handleTextChange = (text: string) => {
    if (onBlockChange) {
      onBlockChange({ content: text });
    } else if (onUpdate) {
      onUpdate({
        ...block,
        content: text
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      <FormattedTextInput
        value={block.content}
        onChangeText={handleTextChange}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder="Type something..."
        placeholderTextColor="#999"
        isSelected={isSelected}
        isEditing={isEditing}
        multiline
        textAlignVertical="top"
        scrollEnabled={false}
        style={styles.textInput}
      />
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.style === nextProps.style
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    padding: 8,
    minHeight: 40,
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
});

/**
 * Paragraph block plugin
 */
export class ParagraphPlugin extends BlockPlugin {
  readonly type = 'block';
  readonly id = 'paragraph';
  readonly name = 'Paragraph';
  readonly version = '1.0.0';
  readonly description = 'Basic paragraph text block';
  readonly blockType = 'paragraph';
  readonly component = ParagraphComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    handleBackspace: this.handleBackspace.bind(this),
    getActions: this.getActions.bind(this)
  };

  readonly markdownSyntax = {
    patterns: {
      // Paragraphs are default - no specific pattern needed
    },
    priority: 10 // Lowest priority - fallback
  };

  readonly toolbar = {
    icon: 'text',
    label: 'Paragraph',
    shortcut: 'Ctrl+Alt+0',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'list', 'callout'] as EditorBlockType[],
    validation: {
      maxLength: 10000
    },
    defaultMeta: {
      textAlign: 'left'
    }
  };

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph on Enter
    if (block.content.trim() === '') {
      // If current paragraph is empty, don't create new one
      return null;
    }
    
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: { textAlign: block.meta?.textAlign || 'left' }
    };
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // If paragraph is empty and backspace is pressed, convert to previous block type
    if (block.content.trim() === '') {
      return null; // Let editor handle deletion
    }
    
    return block;
  }

  protected transformContent(content: string): string {
    // Clean up content - remove excessive whitespace
    return content.replace(/\s+/g, ' ').trim();
  }

  public getActions(block: EditorBlock) {
    const actions = super.getActions(block);
    
    // Add paragraph-specific actions
    actions.unshift({
      id: 'convert-heading',
      label: 'Convert to Heading',
      icon: 'heading',
      handler: (block) => {
        // This will be handled by the editor
        console.log('Convert to heading:', block.id);
      }
    });
    
    actions.unshift({
      id: 'convert-quote',
      label: 'Convert to Quote',
      icon: 'quote',
      handler: (block) => {
        console.log('Convert to quote:', block.id);
      }
    });
    
    return actions;
  }
}