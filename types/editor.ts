// Legacy types removed - use EditorBlockType and EditorBlock instead

// Version 2 Editor Types
export type EditorBlockType =
  | 'root'
  | 'paragraph'
  | 'heading'
  | 'code'
  | 'quote'
  | 'list'
  | 'checklist'
  | 'divider'
  | 'image'
  | 'video'
  | 'callout'
  | 'table'
  | 'footnote'
  | 'definition-list';

export interface EditorBlock {
  id: string;
  type: EditorBlockType;
  content: string;
  meta?: {
    // Heading specific
    level?: number; // 1-6
    headingId?: string; // custom ID for linking {#custom-id}

    // Code block specific
    language?: string;
    showLineNumbers?: boolean;
    theme?: string;

    // List specific
    ordered?: boolean;
    depth?: number;

    // Checklist specific
    checked?: boolean;

    // Media specific (image/video)
    url?: string;
    alt?: string;
    title?: string;
    caption?: string;

    // Video specific
    autoplay?: boolean;
    controls?: boolean;

    // Callout specific
    calloutType?: 'note' | 'tip' | 'warning' | 'danger' | 'info' | 'success';

    // Divider specific
    style?: 'solid' | 'dashed' | 'dotted';

    // Table specific
    headers?: string[];
    rows?: string[][];
    alignments?: ('left' | 'center' | 'right')[];

    // Footnote specific
    footnoteId?: string; // e.g., "1", "note1"
    footnoteLabel?: string; // display label like "[^1]"

    // Definition list specific
    term?: string; // for definition list term
    definition?: string; // for definition list definition
    definitions?: string[]; // multiple definitions for same term

    // General
    [key: string]: any; // Allow plugins to add custom meta
    quoteLineDepths?: number[];
  };
}

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
    | 'footnote-ref' // [^1] footnote references
    | 'link'; // auto-linked URLs
  meta?: {
    footnoteId?: string; // for footnote references
    url?: string; // for auto-linked URLs
  };
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
  quoteBlock?: Record<string, any>;
  bold?: Record<string, any>;
  italic?: Record<string, any>;
  inlineCode?: Record<string, any>;
}

export type EditorMode = 'edit' | 'raw' | 'preview';

export type MarkdownEditorRef = {
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  getBlocks: () => EditorBlock[];
  setBlocks: (blocks: EditorBlock[]) => void;
  focus: () => void;
  insertBlock: (
    type: EditorBlockType,
    index?: number,
    options?: { meta?: Record<string, any>; content?: string }
  ) => string | null | undefined;
  deleteBlock: (id: string) => void;
  moveBlockUp: (id: string) => boolean;
  moveBlockDown: (id: string) => boolean;
  toggleMode: () => void;
  getCurrentMode: () => EditorMode;
};

// Forward declared here to break circular deps. UI components can extend this.
export interface BlockProps {
  block: EditorBlock;
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
