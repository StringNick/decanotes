import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { processInlineFormatting } from '../../../utils/markdownParser';

export interface FormattedTextSegment {
  text: string;
  type: 'normal' | 'bold' | 'italic' | 'code' | 'bold-italic';
}

interface FormattedTextProps {
  text: string;
  style?: any;
  isEditing?: boolean;
}

/**
 * Component that renders text with inline markdown formatting
 * When editing, shows raw markdown. When not editing, shows formatted text.
 */
export const FormattedText: React.FC<FormattedTextProps> = ({ 
  text, 
  style, 
  isEditing = false 
}) => {
  // If editing, show raw text
  if (isEditing) {
    return (
      <Text style={[styles.text, style]}>
        {text}
      </Text>
    );
  }

  // If not editing, process and render formatted text
  const segments = processInlineFormatting(text);

  return (
    <Text style={[styles.text, style]}>
      {segments.map((segment, index) => {
        const segmentStyle = getSegmentStyle(segment.type);
        return (
          <Text key={index} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

const getSegmentStyle = (type: FormattedTextSegment['type']) => {
  switch (type) {
    case 'bold':
      return styles.bold;
    case 'italic':
      return styles.italic;
    case 'bold-italic':
      return styles.boldItalic;
    case 'code':
      return styles.code;
    default:
      return styles.normal;
  }
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  normal: {
    fontWeight: 'normal',
    fontStyle: 'normal',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
  boldItalic: {
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'Courier New',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 14,
  },
});