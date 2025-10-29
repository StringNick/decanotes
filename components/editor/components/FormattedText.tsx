import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { processInlineFormatting } from '../../../utils/markdownParser';

export interface FormattedTextSegment {
  text: string;
  type:
    | 'normal'
    | 'bold'
    | 'italic'
    | 'code'
    | 'bold-italic'
    | 'strikethrough'
    | 'highlight'
    | 'subscript'
    | 'superscript'
    | 'footnote-ref'
    | 'link';
  meta?: {
    footnoteId?: string;
    url?: string;
  };
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
export const FormattedText: React.FC<FormattedTextProps> = ({ text, style, isEditing = false }) => {
  const colorScheme = useColorScheme();
  // const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  // If editing, show raw text
  if (isEditing) {
    return <Text style={[styles.text, style]}>{text}</Text>;
  }

  // If not editing, process and render formatted text
  const segments = processInlineFormatting(text);

  return (
    <Text style={[styles.text, style]}>
      {segments.map((segment, index) => {
        const segmentStyle = getSegmentStyle(segment.type, styles);
        return (
          <Text key={index} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

const getSegmentStyle = (type: FormattedTextSegment['type'], styles: any) => {
  switch (type) {
    case 'bold':
      return styles.bold;
    case 'italic':
      return styles.italic;
    case 'bold-italic':
      return styles.boldItalic;
    case 'code':
      return styles.code;
    case 'strikethrough':
      return styles.strikethrough;
    case 'highlight':
      return styles.highlight;
    case 'subscript':
      return styles.subscript;
    case 'superscript':
      return styles.superscript;
    case 'footnote-ref':
      return styles.footnoteRef;
    case 'link':
      return styles.link;
    default:
      return styles.normal;
  }
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    text: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.text,
      // Use system font for formatted text to ensure bold/italic work properly
    },
    normal: {
      fontWeight: '400',
    },
    bold: {
      fontWeight: '700',
    },
    italic: {
      fontStyle: 'italic',
      fontWeight: '400',
    },
    boldItalic: {
      fontWeight: '700',
      fontStyle: 'italic',
    },
    code: {
      fontFamily: 'Courier New',
      backgroundColor: colorScheme === 'dark' ? colors.backgroundTertiary : colors.backgroundSecondary,
      color: colors.text,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 3,
      fontSize: 14,
      fontWeight: '400',
    },
    strikethrough: {
      textDecorationLine: 'line-through',
      fontWeight: '400',
    },
    highlight: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 235, 59, 0.3)' : 'rgba(255, 235, 59, 0.5)',
      fontWeight: '400',
    },
    subscript: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
    },
    superscript: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
    },
    footnoteRef: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#60A5FA' : '#2563EB', // blue
    },
    link: {
      color: colorScheme === 'dark' ? '#60A5FA' : '#2563EB', // blue
      textDecorationLine: 'underline',
      fontWeight: '400',
    },
  });
};
