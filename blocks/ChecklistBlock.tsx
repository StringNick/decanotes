import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import defaultTheme from '../themes/defaultTheme';
import { BlockProps } from '../types/editor';
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
  console.log('ChecklistBlock render');

  if (block.type !== 'checklist') return null;
  console.log('ChecklistBlock render');

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

  return (
    <TouchableOpacity style={styles.row} onPress={toggleChecked} activeOpacity={0.6}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? '#4F46E5' : '#9CA3AF'}
        style={styles.icon}
      />
      <Text style={styles.text}>{block.content}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: 'black',
    flexShrink: 1,
  },
});

export default ChecklistBlock; 