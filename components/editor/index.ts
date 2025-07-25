// Export core editor components
export { MarkdownEditor } from './MarkdownEditor';
export { default as EditorProvider } from './core/EditorProvider';
export { EditorCore } from './core/EditorCore';
export { BlockRenderer } from './core/BlockRenderer';

// Export hooks
export { useEditorState } from './core/EditorState';
export { useEditorKeyboard } from './EditorKeyboard';
export { useEditorDragDrop } from './core/EditorDragDrop';
export { useEditor, useEditorActions, useEditorPlugins } from './core/EditorContext';

// Export plugin system
export { BlockPlugin } from './plugins/BlockPlugin';
export { MarkdownPlugin } from './plugins/MarkdownPlugin';
export { PluginRegistry } from './plugins/PluginRegistry';

// Export built-in plugins
export {
  ParagraphPlugin,
  HeadingPlugin,
  CodePlugin,
  QuotePlugin,
  ListPlugin,
  ChecklistPlugin,
  ImagePlugin,
  VideoPlugin,
  CalloutPlugin,
  DividerPlugin
} from './plugins/built-in';

// Export types
export * from './types/EditorTypes';
export * from './types/PluginTypes';

// Export utilities
export { createCustomPlugin, createSimpleTextPlugin, createComponentPlugin } from './utils/PluginFactory';
export { 
  registerMarkdownSyntax, 
  parseMarkdownToBlocks, 
  serializeBlocksToMarkdown,
  getMarkdownRegistry,
  createSimpleMarkdownPlugin
} from './utils/MarkdownRegistry';
export { createKeyboardShortcut, getShortcutDescription } from './EditorKeyboard';

