import React, { memo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';

// Global cursor position tracker for heading blocks
let headingCursorPositions: { [blockId: string]: number } = {};

/**
 * Heading block component with modern dark theme support
 */
const HeadingComponent: React.FC<BlockComponentProps> = memo(({
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
  const level = block.meta?.level || 1;
  const headingStyle = getHeadingStyle(level, colorScheme ?? 'light');
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleTextChange = (text: string) => {
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
        <View style={styles.levelIndicator}>
          <Text style={styles.levelText}>H{level}</Text>
        </View>
        {isFocused || !readOnly ? (
          <FormattedTextInput
            value={block.content}
            onChangeText={handleTextChange}
            onSelectionChange={handleSelectionChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={handleKeyPress}
            placeholder={`Heading ${level}`}
            placeholderTextColor={colors.textSecondary}
            isSelected={isSelected}
            isEditing={isFocused}
            multiline={false}
            style={[
              styles.textInput,
              headingStyle,
              isSelected && styles.selected,
              isFocused && styles.editing,
            ]}
          />
        ) : (
          <Text
            style={[
              headingStyle,
              styles.textDisplay,
              isSelected && styles.selected,
            ]}
            onPress={onFocus}
          >
            {block.content || `Heading ${level}`}
          </Text>
        )}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.meta?.level === nextProps.block.meta?.level &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFocused === nextProps.isFocused &&
    prevProps.readOnly === nextProps.readOnly
  );
});

// Export function to get cursor position for a block
export const getHeadingCursorPosition = (blockId: string): number => {
  return headingCursorPositions[blockId] || 0;
};

const getHeadingStyle = (level: number, colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  const baseStyle = {
    color: colors.text,
    fontFamily: 'AlbertSans_700Bold',
    marginVertical: 0,
    padding: 0,
  };

  switch (level) {
    case 1:
      return { ...baseStyle, fontSize: 28, lineHeight: 36, letterSpacing: -0.4 }; // appTitle
    case 2:
      return { ...baseStyle, fontSize: 20, lineHeight: 28, letterSpacing: -0.3, fontFamily: 'AlbertSans_600SemiBold' }; // sectionHeaders
    case 3:
      return { ...baseStyle, fontSize: 18, lineHeight: 26, letterSpacing: -0.2, fontFamily: 'AlbertSans_600SemiBold' };
    case 4:
      return { ...baseStyle, fontSize: 16, lineHeight: 24, fontFamily: 'AlbertSans_600SemiBold' }; // bodyText weight
    case 5:
      return { ...baseStyle, fontSize: 14, lineHeight: 20, fontFamily: 'AlbertSans_500Medium' }; // metadata
    case 6:
      return { ...baseStyle, fontSize: 12, lineHeight: 18, fontFamily: 'AlbertSans_500Medium' }; // labels
    default:
      return { ...baseStyle, fontSize: 28, lineHeight: 36 };
  }
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
    },
    headingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    levelIndicator: {
      backgroundColor: colors.dark,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 12,
      minWidth: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelText: {
      fontSize: 10,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.background,
      textAlign: 'center',
    },
    textInput: {
      flex: 1,
      // paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
    },
    textDisplay: {
      flex: 1,
      // paddingHorizontal: 16,
    },
    selected: {
      backgroundColor: colors.blue + '20',
      borderColor: colors.teal,
      borderWidth: 1,
      borderRadius: 8,
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
      borderWidth: 2,
      shadowColor: colors.teal,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
      borderRadius: 8,
    },
  });
};

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