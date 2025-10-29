// Export core editor components
export { BlockRenderer } from './core/BlockRenderer';
export { EditorCore } from './core/EditorCore';
export { default as EditorProvider } from './core/EditorProvider';
export { MarkdownEditor } from './MarkdownEditor';

// Export hooks
export { useEditor, useEditorActions, useEditorPlugins } from './core/EditorContext';
export { useEditorDragDrop } from './core/EditorDragDrop';
export { useEditorState } from './core/EditorState';
export { useEditorKeyboard } from './EditorKeyboard';

// Export plugin system
export { BlockPlugin as BlockPluginBase } from './plugins/BlockPlugin';
export { MarkdownPlugin as MarkdownPluginBase } from './plugins/MarkdownPlugin';
export { PluginRegistry } from './plugins/PluginRegistry';

// Export built-in plugins
export {
  CalloutPlugin,
  ChecklistPlugin,
  CodePlugin,
  DividerPlugin,
  HeadingPlugin,
  ImagePlugin,
  ListPlugin,
  ParagraphPlugin,
  QuotePlugin,
  VideoPlugin,
} from './plugins/built-in';

// Export types
export * from './types/EditorTypes';
export type {
  BasePlugin,
  BlockAction,
  BlockActionHandlerContext,
  BlockComponentProps,
  BlockController,
  BlockPlugin as BlockPluginDefinition,
  BlockSettings,
  CustomPluginOptions,
  EditorContext,
  EnhancedKeyboardResult,
  MarkdownParser,
  MarkdownPlugin as MarkdownPluginDefinition,
  MarkdownSerializer,
  MarkdownSyntax,
  PluginConfig,
  PluginRegistryInterface,
  ToolbarConfig,
  ToolbarVariant,
  ValidationResult,
} from './types/PluginTypes';

// Export utilities
export { createKeyboardShortcut, getShortcutDescription } from './EditorKeyboard';
export {
  createSimpleMarkdownPlugin,
  getMarkdownRegistry,
  parseMarkdownToBlocks,
  registerMarkdownSyntax,
  serializeBlocksToMarkdown,
} from './utils/MarkdownRegistry';
export { createComponentPlugin, createCustomPlugin, createSimpleTextPlugin } from './utils/PluginFactory';
