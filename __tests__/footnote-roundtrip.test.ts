/**
 * Tests for footnote round-trip serialization/deserialization
 */
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../components/editor/utils/MarkdownRegistry';

describe('Footnote Round-Trip Tests', () => {
  describe('Footnote serialization and deserialization', () => {
    it('should correctly round-trip single footnote', () => {
      const markdown = `Here is a simple footnote[^1] reference.

[^1]: This is the footnote content.`;

      // Parse markdown to blocks
      const blocks = parseMarkdownToBlocks(markdown);

      // Find footnote block
      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
      expect(footnoteBlocks).toHaveLength(1);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[0].content).toBe('This is the footnote content.');

      // Serialize back to markdown
      const serialized = serializeBlocksToMarkdown(blocks);

      // Parse again
      const reparsed = parseMarkdownToBlocks(serialized);
      const reparsedFootnotes = reparsed.filter(b => b.type === 'footnote');

      expect(reparsedFootnotes).toHaveLength(1);
      expect(reparsedFootnotes[0].meta?.footnoteId).toBe('1');
      expect(reparsedFootnotes[0].content).toBe('This is the footnote content.');
    });

    it('should correctly round-trip multiple footnotes', () => {
      const markdown = `Text with first footnote[^1] and second[^note].

[^1]: First footnote.

[^note]: Named footnote.`;

      const blocks = parseMarkdownToBlocks(markdown);
      const footnoteBlocks = blocks.filter(b => b.type === 'footnote');

      expect(footnoteBlocks).toHaveLength(2);
      expect(footnoteBlocks[0].meta?.footnoteId).toBe('1');
      expect(footnoteBlocks[1].meta?.footnoteId).toBe('note');

      // Round-trip
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);
      const reparsedFootnotes = reparsed.filter(b => b.type === 'footnote');

      expect(reparsedFootnotes).toHaveLength(2);
      expect(reparsedFootnotes[0].meta?.footnoteId).toBe('1');
      expect(reparsedFootnotes[1].meta?.footnoteId).toBe('note');
    });

    it('should preserve footnote content with special characters', () => {
      const markdown = `Text[^complex].

[^complex]: This has **bold**, *italic*, and \`code\`.`;

      const blocks = parseMarkdownToBlocks(markdown);
      const footnote = blocks.find(b => b.type === 'footnote');

      expect(footnote).toBeDefined();
      expect(footnote?.content).toContain('**bold**');
      expect(footnote?.content).toContain('*italic*');
      expect(footnote?.content).toContain('`code`');

      // Round-trip
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);
      const reparsedFootnote = reparsed.find(b => b.type === 'footnote');

      expect(reparsedFootnote?.content).toContain('**bold**');
      expect(reparsedFootnote?.content).toContain('*italic*');
      expect(reparsedFootnote?.content).toContain('`code`');
    });
  });

  describe('Definition list serialization and deserialization', () => {
    it('should correctly round-trip definition list', () => {
      const markdown = `Markdown
: A lightweight markup language`;

      const blocks = parseMarkdownToBlocks(markdown);
      const defList = blocks.find(b => b.type === 'definition-list');

      expect(defList).toBeDefined();
      expect(defList?.meta?.term).toBe('Markdown');
      expect(defList?.meta?.definition).toBe('A lightweight markup language');

      // Round-trip
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);
      const reparsedDef = reparsed.find(b => b.type === 'definition-list');

      expect(reparsedDef).toBeDefined();
      expect(reparsedDef?.meta?.term).toBe('Markdown');
      expect(reparsedDef?.meta?.definition).toBe('A lightweight markup language');
    });

    it('should correctly round-trip multiple definition lists', () => {
      const markdown = `Term 1
: Definition 1

Term 2
: Definition 2`;

      const blocks = parseMarkdownToBlocks(markdown);
      const defLists = blocks.filter(b => b.type === 'definition-list');

      expect(defLists).toHaveLength(2);
      expect(defLists[0].meta?.term).toBe('Term 1');
      expect(defLists[1].meta?.term).toBe('Term 2');

      // Round-trip
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);
      const reparsedDefs = reparsed.filter(b => b.type === 'definition-list');

      expect(reparsedDefs).toHaveLength(2);
      expect(reparsedDefs[0].meta?.term).toBe('Term 1');
      expect(reparsedDefs[1].meta?.term).toBe('Term 2');
    });
  });

  describe('Mixed content round-trip', () => {
    it('should correctly round-trip paragraphs with footnotes', () => {
      const markdown = `Paragraph with footnote[^1].

[^1]: Footnote text.

Another paragraph.`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(3);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[1].type).toBe('footnote');
      expect(blocks[2].type).toBe('paragraph');

      // Round-trip
      const serialized = serializeBlocksToMarkdown(blocks);
      const reparsed = parseMarkdownToBlocks(serialized);

      expect(reparsed).toHaveLength(3);
      expect(reparsed[0].type).toBe('paragraph');
      expect(reparsed[1].type).toBe('footnote');
      expect(reparsed[2].type).toBe('paragraph');
    });
  });
});
