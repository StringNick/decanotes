/**
 * Tests for footnote edge cases and multi-line parsing
 */
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../components/editor/utils/MarkdownRegistry';

describe('Footnote Edge Cases', () => {
  describe('Footnote parsing with blank lines', () => {
    it('should parse footnote after blank line', () => {
      const markdown = `Paragraph with footnote[^1].

[^1]: Footnote definition.`;

      const blocks = parseMarkdownToBlocks(markdown);

      console.log('Blocks:', JSON.stringify(blocks, null, 2));

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(1);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[0].content).toBe('Footnote definition.');
    });

    it('should parse multiple footnotes separated by blank lines', () => {
      const markdown = `Text with footnotes[^1] and[^note].

[^1]: First footnote.

[^note]: Named footnote.`;

      const blocks = parseMarkdownToBlocks(markdown);

      console.log('Blocks:', JSON.stringify(blocks, null, 2));

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(2);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[1].meta?.footnoteId).toBe('note');
    });

    it('should parse footnotes in showcase format', () => {
      const markdown = `## Footnotes

Here is a simple footnote[^1] with a reference.

You can also use named footnotes[^note] for better organization.

Multiple references to the same footnote[^1] are supported.

Automatic URL linking works too: Visit https://github.com or check http://example.com for more info.

[^1]: This is the first footnote definition.

[^note]: Named footnotes are useful for longer documents.`;

      const blocks = parseMarkdownToBlocks(markdown);

      console.log('Total blocks:', blocks.length);
      console.log(
        'Block types:',
        blocks.map(b => b.type)
      );
      console.log(
        'Footnote blocks:',
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

    it('should round-trip footnotes with blank lines', () => {
      const markdown = `Text[^1].

[^1]: Footnote.

More text.`;

      const blocks = parseMarkdownToBlocks(markdown);
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);

      const footnoteBlocks = reparsed.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(1);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
    });
  });

  describe('Footnote parsing without blank lines', () => {
    it('should parse consecutive footnote definitions', () => {
      const markdown = `[^1]: First footnote.
[^2]: Second footnote.`;

      const blocks = parseMarkdownToBlocks(markdown);

      console.log('Consecutive footnotes:', JSON.stringify(blocks, null, 2));

      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(2);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[1].meta?.footnoteId).toBe('2');
    });
  });
});
