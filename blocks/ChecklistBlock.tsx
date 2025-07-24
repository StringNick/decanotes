import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View } from 'react-native';
import defaultTheme from '../themes/defaultTheme';
import { BlockProps } from '../types/editor';
import { processInlineFormatting } from '../utils/markdownParser';
import UniversalBlock from './UniversalBlock';

// A checkbox list item that can be toggled when not in edit mode.
// When the user taps the checkbox, we emit onRawTextChange with the updated
// markdown representation so that the editor updates its state via the normal
// parser pipeline.
const ChecklistBlock: React.FC<BlockProps> = (props) => {
  const {
    block,
    isEditing,
    onRawTextChange,
    displayValue,
    theme,
    placeholder,
  } = props;
  
  if (block.type !== 'checklist') return null;

  const mergedTheme = { ...defaultTheme, ...theme };
  const checked = !!block.meta?.checked;

  const toggleChecked = useCallback(() => {
    const prefix = `- [${checked ? ' ' : 'x'}] `;
    onRawTextChange(prefix + block.content);
  }, [checked, block.content, onRawTextChange]);

  // If the block is being edited, fall back to the universal text-input UI.
  if (isEditing) {
    return (
      <UniversalBlock {...props} />
    );
  }

  // Process inline formatting for bold, italic, and code spans
  const formattedSegments = processInlineFormatting(block.content || '');

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={toggleChecked} activeOpacity={0.6} style={styles.iconWrapper}>
        <Ionicons
          name={checked ? 'checkbox' : 'square-outline'}
          size={20}
          color={checked ? '#4F46E5' : '#9CA3AF'}
          style={styles.icon}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.textWrapper} onPress={props.onEdit} activeOpacity={0.8}>
        <Text style={styles.text}>
          {formattedSegments.length > 0 ? (
            formattedSegments.map((segment, idx) => {
              let segmentStyle: TextStyle = {};
              switch (segment.type) {
                case 'bold':
                  segmentStyle = mergedTheme.bold;
                  break;
                case 'italic':
                  segmentStyle = mergedTheme.italic;
                  break;
                case 'bold-italic':
                  segmentStyle = { ...(mergedTheme.bold as any), ...(mergedTheme.italic as any) };
                  break;
                case 'code':
                  segmentStyle = mergedTheme.inlineCode;
                  break;
                default:
                  segmentStyle = {};
              }
              return (
                <Text key={idx} style={segmentStyle}>
                  {segment.text}
                </Text>
              );
            })
          ) : (
            placeholder || 'Type something...'
          )}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  iconWrapper: {
    padding: 4,
  },
  textWrapper: {
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1a1a1a', // Use consistent color
    flexShrink: 1,
  },
});

export default React.memo(ChecklistBlock, (prev, next) => {
  return (
    prev.block.content === next.block.content &&
    prev.block.meta?.checked === next.block.meta?.checked &&
    prev.isEditing === next.isEditing &&
    prev.theme === next.theme
  );
}); 