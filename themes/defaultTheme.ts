import { EditorTheme } from '../types/editor';

// Modern, minimalistic themes for light and dark modes
const lightTheme: Required<EditorTheme> = {
  container: {
    backgroundColor: '#ffffff',
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
    color: '#11181C',
  },
  focusedInput: {
    color: '#11181C',
  },
  placeholder: {
    color: '#9ca3af',
    fontWeight: '300',
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: '#11181C',
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    color: '#11181C',
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: '#11181C',
    letterSpacing: -0.2,
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: '#11181C',
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: '#11181C',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#11181C',
  },
  code: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#11181C',
  },
  italic: {
    fontStyle: 'italic',
    color: '#11181C',
  },
  inlineCode: {
    fontSize: 14,
    backgroundColor: '#f1f5f9',
    color: '#374151',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
};

const darkTheme: Required<EditorTheme> = {
  container: {
    backgroundColor: '#0f172a',
  },
  block: {
    backgroundColor: 'transparent',
  },
  focusedBlock: {
    backgroundColor: 'rgba(96, 165, 250, 0.08)',
  },
  input: {
    fontSize: 16,
    lineHeight: 26,
    color: '#f8fafc',
  },
  focusedInput: {
    color: '#f8fafc',
  },
  placeholder: {
    color: '#64748b',
    fontWeight: '300',
  },
  heading1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  heading2: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 36,
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  heading3: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  heading4: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: '#f8fafc',
  },
  heading5: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: '#f8fafc',
  },
  heading6: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: '#f8fafc',
  },
  code: {
    fontSize: 14,
    lineHeight: 22,
    color: '#e2e8f0',
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  codeBlock: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#60a5fa',
    marginLeft: 0,
  },
  bold: {
    fontWeight: '600',
    color: '#f8fafc',
  },
  italic: {
    fontStyle: 'italic',
    color: '#f8fafc',
  },
  inlineCode: {
    fontSize: 14,
    backgroundColor: '#334155',
    color: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
};

// Function to get theme based on color scheme
export const getEditorTheme = (colorScheme: 'light' | 'dark'): Required<EditorTheme> => {
  return colorScheme === 'dark' ? darkTheme : lightTheme;
};

// Export light theme as default for backward compatibility
export default lightTheme;