import { EditorTheme } from '../types/editor';

// Ultra-minimalistic themes matching our design system
const lightTheme: Required<EditorTheme> = {
  container: {
    backgroundColor: '#FFFFFF',
  },
  block: {
    backgroundColor: 'transparent',
  },
  focusedBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
  },
  focusedInput: {
    color: '#000000',
  },
  placeholder: {
    color: 'rgba(0, 0, 0, 0.3)',
    fontWeight: '400',
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    color: '#000000',
    letterSpacing: -1,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: '#000000',
    letterSpacing: -0.8,
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    color: '#000000',
    letterSpacing: -0.5,
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: '#000000',
    letterSpacing: -0.3,
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#000000',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#000000',
  },
  code: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(0, 0, 0, 0.8)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(0, 0, 0, 0.2)',
    marginLeft: 0,
    paddingLeft: 16,
  },
  bold: {
    fontWeight: '600',
    color: '#000000',
  },
  italic: {
    fontStyle: 'italic',
    color: 'rgba(0, 0, 0, 0.9)',
  },
  inlineCode: {
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
};

const darkTheme: Required<EditorTheme> = {
  container: {
    backgroundColor: '#000000',
  },
  block: {
    backgroundColor: 'transparent',
  },
  focusedBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  input: {
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  focusedInput: {
    color: '#FFFFFF',
  },
  placeholder: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '400',
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 30,
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#FFFFFF',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#FFFFFF',
  },
  code: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  codeBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0,
    borderColor: 'transparent',
  },
  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    marginLeft: 0,
    paddingLeft: 16,
  },
  bold: {
    fontWeight: '600',
    color: '#FFFFFF',
  },
  italic: {
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inlineCode: {
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
};

// Function to get theme based on color scheme
export const getEditorTheme = (colorScheme: 'light' | 'dark'): Required<EditorTheme> => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Export light theme as default for backward compatibility
export default lightTheme;