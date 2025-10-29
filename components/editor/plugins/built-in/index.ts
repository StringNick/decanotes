// Export all built-in plugins
export { CalloutPlugin } from './CalloutPlugin';
export { ChecklistPlugin } from './ChecklistPlugin';
export { CodePlugin } from './CodePlugin';
export { DefinitionListPlugin } from './DefinitionListPlugin';
export { DividerPlugin } from './DividerPlugin';
export { FootnotePlugin } from './FootnotePlugin';
export { HeadingPlugin } from './HeadingPlugin';
export { ImagePlugin } from './ImagePlugin';
export { ListPlugin } from './ListPlugin';
export { ParagraphPlugin } from './ParagraphPlugin';
export { QuotePlugin } from './QuotePlugin';
export { TablePlugin } from './TablePlugin';
export { VideoPlugin } from './VideoPlugin';

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
  'divider',
  'table',
  'footnote',
  'definition-list',
] as const;

export const BUILT_IN_MARKDOWN_PLUGINS = ['video-markdown', 'callout-markdown'] as const;

export type BuiltInBlockPlugin = (typeof BUILT_IN_BLOCK_PLUGINS)[number];
export type BuiltInMarkdownPlugin = (typeof BUILT_IN_MARKDOWN_PLUGINS)[number];
