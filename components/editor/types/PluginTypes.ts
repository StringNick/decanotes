import { ComponentType } from 'react';
import { EditorBlock, EditorBlockType } from '../../../types/editor';

// Base plugin interface
export interface BasePlugin {
  id: string;
  name: string;
  version: string;
  description?: string;
}

// Block plugin interface for custom block types
export interface BlockPlugin extends BasePlugin {
  type: 'block';
  blockType: EditorBlockType | string; // Support custom block types
  component: ComponentType<BlockComponentProps>;
  controller: BlockController;
  markdownSyntax?: MarkdownSyntax;
  toolbar?: ToolbarConfig;
  settings?: BlockSettings;
  
  // Optional icon for the block type
  icon?: ComponentType<any> | string;
  
  // Plugin configuration
  config?: PluginConfig;
  
  // Lifecycle hooks
  onInstall?: () => void;
  onUninstall?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  
  // Block validation
  validate?: (block: any) => ValidationResult;
  
  // Block transformation
  transform?: {
    toMarkdown?: (block: any) => string;
    fromMarkdown?: (markdown: string) => any;
    toHTML?: (block: any) => string;
    fromHTML?: (html: string) => any;
  };
  
  // Plugin dependencies
  dependencies?: string[];
  
  // Plugin metadata
  metadata?: Record<string, any>;
  
  // Block actions
  getActions?: (block: any) => BlockAction[];
  
  // Error handling
  hasError?: boolean;
  error?: {
    message: string;
    details?: any;
  };
}

// Markdown plugin interface for custom syntax
export interface MarkdownPlugin extends BasePlugin {
  type: 'markdown';
  syntax: MarkdownSyntax;
  parser: MarkdownParser;
  serializer: MarkdownSerializer;
}

// Block component props
export interface BlockComponentProps {
  block: EditorBlock;
  isSelected: boolean;
  isFocused?: boolean;
  isEditing?: boolean;
  isDragging?: boolean;
  onBlockChange: (block: Partial<EditorBlock>) => void;
  onUpdate?: (block: EditorBlock) => void;
  onAction?: (actionId: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onKeyPress?: (event: any) => void;
  theme?: any;
  config?: any;
  readOnly?: boolean;
  style?: any;
}

// Enhanced result type for keyboard handlers that need to update multiple blocks
export interface EnhancedKeyboardResult {
  newBlocks?: EditorBlock[];
  updates?: Array<{ blockId: string; updates: Partial<EditorBlock> }>;
  focusBlockId?: string;
}

// Block controller for handling business logic
export interface BlockController {
  // Content validation and transformation
  validateContent?: (content: string) => boolean;
  transformContent?: (content: string) => string;
  
  // Keyboard event handling
  handleKeyPress?: (event: any, block: EditorBlock) => boolean | void;
  handleEnter?: (block: EditorBlock, allBlocks?: EditorBlock[], currentIndex?: number) => EditorBlock | EditorBlock[] | EnhancedKeyboardResult | null;
  handleBackspace?: (block: EditorBlock) => EditorBlock | null;
  handleTab?: (block: EditorBlock, event: any, actions: any) => boolean | void;
  
  // Block lifecycle
  onCreate?: (block: EditorBlock) => EditorBlock;
  onUpdate?: (oldBlock: EditorBlock, newBlock: EditorBlock) => EditorBlock;
  onDelete?: (block: EditorBlock) => void;
  
  // Custom actions
  getActions?: (block: EditorBlock) => BlockAction[];
  
  // Drag and drop
  canDrag?: (block: EditorBlock) => boolean;
  canDrop?: (block: EditorBlock, targetIndex: number, blocks: EditorBlock[]) => boolean;
  onDrop?: (sourceBlock: EditorBlock, targetBlock: EditorBlock) => void;
}

// Markdown syntax definition
export interface MarkdownSyntax {
  // Regex patterns for parsing
  patterns: {
    block?: RegExp;
    inline?: RegExp;
    start?: RegExp;
    end?: RegExp;
  };
  
  // Priority for parsing order
  priority: number;
  
  // Custom attributes
  attributes?: string[];
}

// Markdown parser interface
export interface MarkdownParser {
  parseInline: (text: string) => string | null;
  parseBlock: (text: string) => EditorBlock | null;
  canParse: (text: string) => boolean;
}

// Markdown serializer interface
export interface MarkdownSerializer {
  serializeInline: (content: any) => string | null;
  serializeBlock: (block: EditorBlock) => string | null;
  canSerialize: (content: any) => boolean;
}

// Toolbar configuration
export interface ToolbarConfig {
  icon?: string;
  label?: string;
  shortcut?: string;
  group?: string;
  position?: number;
  condition?: (context: EditorContext) => boolean;
  variants?: ToolbarVariant[];
}

export interface ToolbarVariant {
  label: string;
  shortcut?: string;
  meta?: Record<string, any>;
  icon?: string;
}

// Block settings
export interface BlockSettings {
  allowedParents?: EditorBlockType[];
  allowedChildren?: EditorBlockType[];
  maxInstances?: number;
  defaultMeta?: Record<string, any>;
  validation?: {
    required?: string[];
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
  };
}

// Block action context
export interface BlockActionHandlerContext {
  updateBlock: (updates: Partial<EditorBlock>) => void;
  deleteBlock: () => void;
  duplicateBlock: () => void;
  moveBlock: (direction: 'up' | 'down') => void;
}

// Block action
export interface BlockAction {
  id: string;
  label: string;
  icon?: string;
  style?: 'default' | 'destructive';
  handler: (block: EditorBlock, context: BlockActionHandlerContext) => void;
  condition?: (block: EditorBlock) => boolean;
}

// Editor context
export interface EditorContext {
  blocks: EditorBlock[];
  focusedBlockId: string | null;
  selectedBlocks: string[];
  mode: 'edit' | 'preview' | 'raw';
  theme: any;
  readOnly: boolean;
}

// Plugin registry interface
export interface PluginRegistryInterface {
  register(plugin: BlockPlugin | MarkdownPlugin): void;
  unregister(pluginId: string): void;
  getPlugin(pluginId: string): BlockPlugin | MarkdownPlugin | null;
  getBlockPlugin(blockType: string): BlockPlugin | null;
  getMarkdownPlugins(): MarkdownPlugin[];
  getAllPlugins(): (BlockPlugin | MarkdownPlugin)[];
}

// Plugin configuration interface
export interface PluginConfig {
  enabled?: boolean;
  settings?: Record<string, any>;
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  warnings?: string[];
}

// Custom plugin factory options
export interface CustomPluginOptions {
  blockType: string;
  displayName: string;
  component: ComponentType<BlockComponentProps>;
  markdownPattern?: RegExp;
  parser?: (text: string) => EditorBlock | null;
  serializer?: (block: EditorBlock) => string;
  controller?: Partial<BlockController>;
  toolbar?: Partial<ToolbarConfig>;
  settings?: Partial<BlockSettings>;
}