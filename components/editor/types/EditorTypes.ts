import { ComponentType } from 'react';
import { EditorBlock, EditorBlockType, EditorMode, EditorTheme, MarkdownEditorRef } from '../../../types/editor';
import { BlockPlugin, MarkdownPlugin } from './PluginTypes';

// Extended editor props with plugin support
export interface ExtendedMarkdownEditorProps {
  // Core props (same as original)
  value?: string;
  defaultValue?: string;
  initialMarkdown?: string;
  initialBlocks?: EditorBlock[];
  onMarkdownChange?: (markdown: string) => void;
  onBlockChange?: (blocks: EditorBlock[]) => void;
  mode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;
  readOnly?: boolean;
  placeholder?: string;
  theme?: EditorTheme;
  shortcuts?: any[];
  onSelectionChange?: (selection: any) => void;
  onContentChange?: (blocks: EditorBlock[]) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  style?: any;
  autoFocus?: boolean;
  
  // Plugin system props
  plugins?: (BlockPlugin | MarkdownPlugin)[];
  customBlocks?: Record<string, ComponentType<any>>; // Legacy support
  
  // Advanced configuration
  config?: EditorConfig;
  
  // Event handlers
  onPluginEvent?: (event: PluginEvent) => void;
  onError?: (error: EditorError) => void;
  onBlocksChange?: (blocks: EditorBlock[]) => void;
  onEditingChange?: (isEditing: boolean) => void;
  
  // Plugin arrays
  blockPlugins?: BlockPlugin[];
  markdownPlugins?: MarkdownPlugin[];
}

// Editor configuration
export interface EditorConfig {
  // Feature toggles
  features?: {
    dragAndDrop?: boolean;
    toolbar?: boolean;
    shortcuts?: boolean;
    autoSave?: boolean;
    collaboration?: boolean;
  };
  
  // Toolbar configuration
  toolbar?: {
    enabled?: boolean;
    position?: 'top' | 'bottom';
    items?: string[];
  };
  
  // Drag and drop settings
  dragAndDrop?: {
    enabled?: boolean;
    allowFileUpload?: boolean;
    allowBlockReordering?: boolean;
  };
  
  // Behavior settings
  behavior?: {
    autoFocus?: boolean;
    selectOnFocus?: boolean;
    exitOnEscape?: boolean;
    createBlockOnEnter?: boolean;
    mergeBlocksOnBackspace?: boolean;
  };
  
  // UI settings
  ui?: {
    showLineNumbers?: boolean;
    showBlockTypes?: boolean;
    compactMode?: boolean;
    animationsEnabled?: boolean;
  };
  
  // Performance settings
  performance?: {
    virtualScrolling?: boolean;
    debounceMs?: number;
    maxBlocks?: number;
  };
  
  // History settings
  historyDebounceMs?: number;
  maxHistorySize?: number;
  
  // Debug settings
  debug?: boolean;
  
  // Theme settings
  theme?: {
    colors?: {
      primary?: string;
      secondary?: string;
      background?: string;
      text?: string;
      border?: string;
      primaryLight?: string;
    };
    spacing?: {
      small?: number;
      medium?: number;
      large?: number;
    };
    typography?: {
      fontSize?: number;
      lineHeight?: number;
      fontFamily?: string;
    };
  };
  
  // Keyboard settings
  keyboard?: {
    enabled?: boolean;
    height?: number;
    shortcuts?: Record<string, string>;
  };
}

// Plugin event system
export interface PluginEvent {
  type: 'block-created' | 'block-updated' | 'block-deleted' | 'mode-changed' | 'custom';
  data: any;
  source: string; // plugin id
  timestamp: number;
}

// Editor error types
export interface EditorError {
  type: 'plugin-error' | 'validation-error' | 'parse-error' | 'render-error';
  message: string;
  source?: string;
  details?: any;
}

// Extended block type with plugin metadata
export interface ExtendedBlock extends EditorBlock {
  pluginId?: string;
  pluginData?: Record<string, any>;
  validation?: {
    isValid: boolean;
    errors: string[];
  };
}

// Editor state interface
export interface EditorState {
  blocks: ExtendedBlock[];
  focusedBlockId: string | null;
  selectedBlocks: string[];
  mode: EditorMode;
  isDirty: boolean;
  isLoading: boolean;
  errors: EditorError[];
  history: {
    past: ExtendedBlock[][];
    present: ExtendedBlock[];
    future: ExtendedBlock[][];
    canUndo: boolean;
    canRedo: boolean;
  };
}

// Editor actions
export type EditorAction = 
  | { type: 'SET_BLOCKS'; blocks: ExtendedBlock[] }
  | { type: 'ADD_BLOCK'; block: ExtendedBlock; index?: number }
  | { type: 'UPDATE_BLOCK'; id: string; changes: Partial<ExtendedBlock> }
  | { type: 'DELETE_BLOCK'; id: string }
  | { type: 'MOVE_BLOCK'; id: string; newIndex: number }
  | { type: 'SET_FOCUS'; blockId: string | null }
  | { type: 'SET_SELECTION'; blockIds: string[] }
  | { type: 'SET_MODE'; mode: EditorMode }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'ADD_ERROR'; error: EditorError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'INDENT_BLOCK'; id?: string }
  | { type: 'OUTDENT_BLOCK'; id?: string }
  | { type: 'COPY_BLOCKS'; blockIds: string[] }
  | { type: 'CUT_BLOCKS'; blockIds: string[] }
  | { type: 'PASTE_BLOCKS'; blocks?: ExtendedBlock[]; index?: number }
  | { type: 'EXTEND_SELECTION_UP' }
  | { type: 'EXTEND_SELECTION_DOWN' }
  | { type: 'MOVE_CURSOR_UP' }
  | { type: 'MOVE_CURSOR_DOWN' }
  | { type: 'MOVE_CURSOR_LEFT' }
  | { type: 'MOVE_CURSOR_RIGHT' }
  | { type: 'SELECT_ALL' }
  | { type: 'DELETE_FORWARD'; id?: string }
  | { type: 'INSERT_LINE_BREAK'; id?: string }
  | { type: 'DELETE_BACKWARD'; id?: string }
  | { type: 'FORMAT_TEXT'; id: string; format: string; value?: any };

// Editor context interface
export interface EditorContextInterface {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  
  // Block operations
  createBlock: (type: EditorBlockType | string, content?: string, index?: number) => void;
  updateBlock: (id: string, changes: Partial<ExtendedBlock>) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (id: string, newIndex: number) => void;
  duplicateBlock: (id: string) => void;
  
  // Selection operations
  selectBlock: (id: string) => void;
  selectBlocks: (ids: string[]) => void;
  clearSelection: () => void;
  
  // Focus operations
  focusBlock: (id: string) => void;
  focusNext: () => void;
  focusPrevious: () => void;
  
  // Mode operations
  setMode: (mode: EditorMode) => void;
  toggleMode: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Plugin operations
  getPlugin: (id: string) => BlockPlugin | MarkdownPlugin | null;
  executePluginAction: (pluginId: string, actionId: string, data?: any) => void;
  
  // Utility operations
  getMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  validate: () => EditorError[];
  reset: () => void;
}

// Extended markdown editor ref
export interface ExtendedMarkdownEditorRef extends MarkdownEditorRef {
  // Plugin methods
  registerPlugin: (plugin: BlockPlugin | MarkdownPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  getRegisteredPlugins: () => (BlockPlugin | MarkdownPlugin)[];
  
  // Advanced operations
  selectBlocks: (ids: string[]) => void;
  duplicateBlock: (id: string) => void;
  validateContent: () => EditorError[];
  
  // History operations
  undo: () => void;
  redo: () => void;
  
  // Export/Import
  exportToFormat: (format: 'markdown' | 'html' | 'json') => string;
  importFromFormat: (content: string, format: 'markdown' | 'html' | 'json') => void;
}