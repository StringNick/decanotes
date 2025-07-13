export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'code'
  | 'quote'
  | 'list'
  | 'checklist'
  | 'divider'
  | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: {
    level?: number; // headings (1-6)
    language?: string; // code blocks
    ordered?: boolean; // lists
    checked?: boolean; // checklists
    url?: string; // images/links
    alt?: string; // images
    title?: string; // images/links
    depth?: number; // nested lists & quotes
  };
}

export interface FormattedTextSegment {
  text: string;
  type: 'normal' | 'bold' | 'italic' | 'code' | 'bold-italic';
}

// Theme definition used by blocks & editor UI components
export interface EditorTheme {
  container?: Record<string, any>;
  block?: Record<string, any>;
  focusedBlock?: Record<string, any>;
  input?: Record<string, any>;
  focusedInput?: Record<string, any>;
  placeholder?: Record<string, any>;
  heading1?: Record<string, any>;
  heading2?: Record<string, any>;
  heading3?: Record<string, any>;
  heading4?: Record<string, any>;
  heading5?: Record<string, any>;
  heading6?: Record<string, any>;
  code?: Record<string, any>;
  codeBlock?: Record<string, any>;
  quote?: Record<string, any>;
  quoteBlock?: Record<string, any>;
  bold?: Record<string, any>;
  italic?: Record<string, any>;
  inlineCode?: Record<string, any>;
}

export type EditorMode = 'edit' | 'raw' | 'preview';

export type MarkdownEditorRef = {
  getMarkdown: () => string;
  focus: () => void;
  insertBlock: (type: BlockType, index?: number) => void;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => boolean;
  moveBlockDown: (id: string) => boolean;
  toggleMode: () => void;
  getCurrentMode: () => EditorMode;
};

// Forward declared here to break circular deps. UI components can extend this.
export interface BlockProps {
  block: Block;
  index: number;
  isActive: boolean;
  isEditing: boolean;
  displayValue: string;
  onRawTextChange: (text: string) => void;
  onFocus: () => void;
  onEdit: () => void;
  onBlur: () => void;
  onKeyPress: (e: any) => void; // using any to avoid extra native imports here
  theme?: EditorTheme;
  placeholder?: string;
} 