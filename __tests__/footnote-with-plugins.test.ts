/**
 * Tests for footnote parsing with plugins (simulating setMarkdown flow)
 */
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../components/editor/utils/MarkdownRegistry';

// Mock plugins array (similar to what MarkdownEditor uses)
const mockPlugins: any[] = [];

describe('Footnote Parsing with Plugins', () => {
  describe('parseMarkdownToBlocks with plugins parameter', () => {
    it('should parse footnotes when plugins array is provided', () => {
      const markdown = `Text with footnote[^1].

[^1]: Footnote definition.`;

      // This simulates how app/editor.tsx calls parseMarkdownToBlocks
      const blocks = parseMarkdownToBlocks(markdown, mockPlugins);

      console.log('Blocks with plugins:', JSON.stringify(blocks, null, 2));

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(1);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[0].content).toBe('Footnote definition.');
    });

    it('should parse showcase footnotes with plugins', () => {
      const markdown = `## Footnotes

Here is a simple footnote[^1] with a reference.

You can also use named footnotes[^note] for better organization.

Multiple references to the same footnote[^1] are supported.

Automatic URL linking works too: Visit https://github.com or check http://example.com for more info.

[^1]: This is the first footnote definition.

[^note]: Named footnotes are useful for longer documents.`;

      const blocks = parseMarkdownToBlocks(markdown, mockPlugins);

      console.log('Showcase blocks with plugins:');
      console.log('Total:', blocks.length);
      console.log(
        'Types:',
        blocks.map(b => b.type)
      );
      console.log(
        'Footnotes:',
        JSON.stringify(
          blocks.filter(b => b.type === 'footnote'),
          null,
          2
        )
      );

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(2);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[0].content).toBe('This is the first footnote definition.');
      expect(footnoteBlocks[1].meta?.footnoteId).toBe('note');
      expect(footnoteBlocks[1].content).toBe('Named footnotes are useful for longer documents.');
    });

    it('should round-trip footnotes with plugins', () => {
      const markdown = `Paragraph[^1].

[^1]: Footnote text.

Another paragraph.`;

      const blocks = parseMarkdownToBlocks(markdown, mockPlugins);
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized, mockPlugins);

      const footnoteBlocks = reparsed.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(1);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[0].content).toBe('Footnote text.');
    });

    it('should parse consecutive footnotes with plugins', () => {
      const markdown = `[^1]: First.
[^2]: Second.`;

      const blocks = parseMarkdownToBlocks(markdown, mockPlugins);

      console.log('Consecutive with plugins:', JSON.stringify(blocks, null, 2));

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(2);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[1].meta?.footnoteId).toBe('2');
    });
  });

  describe('Comparison: with and without plugins', () => {
    it('should produce identical results with or without plugins for footnotes', () => {
      const markdown = `Text[^1].

[^1]: Footnote.`;

      const withoutPlugins = parseMarkdownToBlocks(markdown);
      const withPlugins = parseMarkdownToBlocks(markdown, mockPlugins);

      expect(withoutPlugins.length).toBe(withPlugins.length);

      const footnotes1 = withoutPlugins.filter(b => b.type === 'footnote');
      const footnotes2 = withPlugins.filter(b => b.type === 'footnote');

      expect(footnotes1.length).toBe(1);
      expect(footnotes2.length).toBe(1);
      expect(footnotes1[0].meta?.footnoteId).toBe(footnotes2[0].meta?.footnoteId);
      expect(footnotes1[0].content).toBe(footnotes2[0].content);
    });
  });
});
