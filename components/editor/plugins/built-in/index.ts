// Export all built-in plugins
export { ParagraphPlugin } from './ParagraphPlugin';
export { HeadingPlugin } from './HeadingPlugin';
export { CodePlugin } from './CodePlugin';
export { QuotePlugin } from './QuotePlugin';
export { ListPlugin } from './ListPlugin';
export { ChecklistPlugin } from './ChecklistPlugin';
export { ImagePlugin } from './ImagePlugin';
export { VideoPlugin } from './VideoPlugin';
export { CalloutPlugin } from './CalloutPlugin';
export { DividerPlugin } from './DividerPlugin';

// Export plugin collections
export const BUILT_IN_BLOCK_PLUGINS = [
  'paragraph',
  'heading',
  'code',
  'quote',
  'list',
  'checklist',
  'image',
  'video',
  'callout',
  'divider'
] as const;

export const BUILT_IN_MARKDOWN_PLUGINS = [
  'video-markdown',
  'callout-markdown'
] as const;

export type BuiltInBlockPlugin = typeof BUILT_IN_BLOCK_PLUGINS[number];
export type BuiltInMarkdownPlugin = typeof BUILT_IN_MARKDOWN_PLUGINS[number];