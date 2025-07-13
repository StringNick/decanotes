import { Platform } from 'react-native';
import { EditorTheme } from '../types/editor';

// Modern, minimalistic default theme used by editor & blocks
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
    color: '#1a1a1a',
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: '#1a1a1a',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#1a1a1a',
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
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
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

export default defaultTheme; 