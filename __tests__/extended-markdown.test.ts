/**
 * Tests for extended markdown features:
 * - Inline formatting (strikethrough, highlight, subscript, superscript)
 * - Emoji shortcodes
 * - Footnotes
 * - Definition lists
 */

import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../components/editor/utils/MarkdownRegistry';
import { replaceEmojiShortcodes } from '../utils/emojiMap';
import { processInlineFormatting } from '../utils/markdownParser';

describe('Extended inline formatting', () => {
  it('processes strikethrough text', () => {
    const segments = processInlineFormatting('This is ~~deleted~~ text');
    expect(segments).toEqual([
      { text: 'This is ', type: 'normal' },
      { text: 'deleted', type: 'strikethrough' },
      { text: ' text', type: 'normal' },
    ]);
  });

  it('processes highlighted text', () => {
    const segments = processInlineFormatting('This is ==highlighted== text');
    expect(segments).toEqual([
      { text: 'This is ', type: 'normal' },
      { text: 'highlighted', type: 'highlight' },
      { text: ' text', type: 'normal' },
    ]);
  });

  it('processes subscript text', () => {
    const segments = processInlineFormatting('H~2~O is water');
    expect(segments).toEqual([
      { text: 'H', type: 'normal' },
      { text: '2', type: 'subscript' },
      { text: 'O is water', type: 'normal' },
    ]);
  });

  it('processes superscript text', () => {
    const segments = processInlineFormatting('E=mc^2^ is famous');
    expect(segments).toEqual([
      { text: 'E=mc', type: 'normal' },
      { text: '2', type: 'superscript' },
      { text: ' is famous', type: 'normal' },
    ]);
  });

  it('processes mixed extended formatting', () => {
    const segments = processInlineFormatting('Mix ~~strike~~ and ==highlight== and X^2^');
    expect(segments).toEqual([
      { text: 'Mix ', type: 'normal' },
      { text: 'strike', type: 'strikethrough' },
      { text: ' and ', type: 'normal' },
      { text: 'highlight', type: 'highlight' },
      { text: ' and X', type: 'normal' },
      { text: '2', type: 'superscript' },
    ]);
  });

  it('preserves existing formatting (bold, italic, code)', () => {
    const segments = processInlineFormatting('**bold** and *italic* and `code`');
    expect(segments).toEqual([
      { text: 'bold', type: 'bold' },
      { text: ' and ', type: 'normal' },
      { text: 'italic', type: 'italic' },
      { text: ' and ', type: 'normal' },
      { text: 'code', type: 'code' },
    ]);
  });
});

describe('Emoji shortcodes', () => {
  it('replaces simple emoji shortcodes', () => {
    expect(replaceEmojiShortcodes(':smile:')).toBe('😄');
    expect(replaceEmojiShortcodes(':heart:')).toBe('❤️');
    expect(replaceEmojiShortcodes(':rocket:')).toBe('🚀');
  });

  it('replaces multiple emoji shortcodes in text', () => {
    const result = replaceEmojiShortcodes('Hello :wave: I :heart: this :rocket:');
    expect(result).toBe('Hello 👋 I ❤️ this 🚀');
  });

  it('preserves unknown emoji shortcodes', () => {
    expect(replaceEmojiShortcodes(':unknown_emoji:')).toBe(':unknown_emoji:');
  });

  it('processes emoji in inline formatting', () => {
    const segments = processInlineFormatting('I :heart: **bold :fire:**');
    expect(segments[0].text).toContain('❤️');
    expect(segments[1].text).toContain('🔥');
    expect(segments[1].type).toBe('bold');
  });
});

describe('Footnotes', () => {
  it('parses footnote definition', () => {
    const markdown = '[^1]: This is a footnote definition.';
    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('footnote');
    expect(blocks[0].content).toBe('This is a footnote definition.');
    expect(blocks[0].meta?.footnoteId).toBe('1');
    expect(blocks[0].meta?.footnoteLabel).toBe('[^1]');
  });

  it('parses named footnote', () => {
    const markdown = '[^note1]: Named footnote content.';
    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('footnote');
    expect(blocks[0].meta?.footnoteId).toBe('note1');
    expect(blocks[0].meta?.footnoteLabel).toBe('[^note1]');
  });

  it('serializes footnote back to markdown', () => {
    const markdown = '[^1]: Footnote text here.';
    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized.trim()).toBe(markdown);
  });

  it('round-trips multiple footnotes', () => {
    const markdown = `Paragraph with footnote reference.

[^1]: First footnote.

[^2]: Second footnote.`;

    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized.trim()).toBe(markdown.trim());
  });
});

describe('Definition lists', () => {
  it('parses simple definition list', () => {
    const markdown = `Term
: Definition of the term`;

    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('definition-list');
    expect(blocks[0].meta?.term).toBe('Term');
    expect(blocks[0].meta?.definition).toBe('Definition of the term');
  });

  it('serializes definition list back to markdown', () => {
    const markdown = `Markdown
: A lightweight markup language`;

    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized.trim()).toBe(markdown);
  });

  it('round-trips multiple definitions', () => {
    const markdown = `HTML
: HyperText Markup Language

CSS
: Cascading Style Sheets`;

    const blocks = parseMarkdownToBlocks(markdown);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe('definition-list');
    expect(blocks[1].type).toBe('definition-list');

    const serialized = serializeBlocksToMarkdown(blocks);
    expect(serialized.trim()).toBe(markdown.trim());
  });
});

describe('Complex markdown with extended features', () => {
  it('handles document with all extended features', () => {
    const markdown = `# Extended Markdown :rocket:

This paragraph has **bold**, *italic*, ~~strikethrough~~, ==highlight==, and H~2~O.

Definition lists:

Term
: Definition

Footnote reference[^1]

[^1]: The footnote content.`;

    const blocks = parseMarkdownToBlocks(markdown);

    // Check that all block types are recognized
    expect(blocks.some(b => b.type === 'heading')).toBe(true);
    expect(blocks.some(b => b.type === 'paragraph')).toBe(true);
    expect(blocks.some(b => b.type === 'definition-list')).toBe(true);
    expect(blocks.some(b => b.type === 'footnote')).toBe(true);

    // Check emoji in heading
    const heading = blocks.find(b => b.type === 'heading');
    expect(heading?.content).toContain('🚀');
  });
});

describe('Footnote references in text', () => {
  it('processes footnote references', () => {
    const segments = processInlineFormatting('Here is a footnote[^1] in text.');
    expect(segments).toEqual([
      { text: 'Here is a footnote', type: 'normal' },
      { text: '[^1]', type: 'footnote-ref', meta: { footnoteId: '1' } },
      { text: ' in text.', type: 'normal' },
    ]);
  });

  it('processes named footnote references', () => {
    const segments = processInlineFormatting('Reference[^note] here.');
    expect(segments).toEqual([
      { text: 'Reference', type: 'normal' },
      { text: '[^note]', type: 'footnote-ref', meta: { footnoteId: 'note' } },
      { text: ' here.', type: 'normal' },
    ]);
  });

  it('processes multiple footnote references', () => {
    const segments = processInlineFormatting('First[^1] and second[^2].');
    expect(segments).toEqual([
      { text: 'First', type: 'normal' },
      { text: '[^1]', type: 'footnote-ref', meta: { footnoteId: '1' } },
      { text: ' and second', type: 'normal' },
      { text: '[^2]', type: 'footnote-ref', meta: { footnoteId: '2' } },
      { text: '.', type: 'normal' },
    ]);
  });
});

describe('Automatic URL linking', () => {
  it('auto-links http URLs', () => {
    const segments = processInlineFormatting('Visit http://example.com for info.');
    expect(segments).toEqual([
      { text: 'Visit ', type: 'normal' },
      { text: 'http://example.com', type: 'link', meta: { url: 'http://example.com' } },
      { text: ' for info.', type: 'normal' },
    ]);
  });

  it('auto-links https URLs', () => {
    const segments = processInlineFormatting('Check https://github.com/user/repo here.');
    expect(segments).toEqual([
      { text: 'Check ', type: 'normal' },
      { text: 'https://github.com/user/repo', type: 'link', meta: { url: 'https://github.com/user/repo' } },
      { text: ' here.', type: 'normal' },
    ]);
  });

  it('handles multiple URLs', () => {
    const segments = processInlineFormatting('See http://a.com and https://b.com');
    expect(segments).toEqual([
      { text: 'See ', type: 'normal' },
      { text: 'http://a.com', type: 'link', meta: { url: 'http://a.com' } },
      { text: ' and ', type: 'normal' },
      { text: 'https://b.com', type: 'link', meta: { url: 'https://b.com' } },
    ]);
  });
});

describe('Heading IDs', () => {
  it('parses heading with custom ID', () => {
    const markdown = '### My Great Heading {#custom-id}';
    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].content).toBe('My Great Heading');
    expect(blocks[0].meta?.level).toBe(3);
    expect(blocks[0].meta?.headingId).toBe('custom-id');
  });

  it('parses heading without custom ID', () => {
    const markdown = '## Regular Heading';
    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('heading');
    expect(blocks[0].content).toBe('Regular Heading');
    expect(blocks[0].meta?.headingId).toBeUndefined();
  });

  it('handles heading with emoji and custom ID', () => {
    const markdown = '# Welcome :rocket: {#welcome}';
    const blocks = parseMarkdownToBlocks(markdown);

    expect(blocks[0].content).toBe('Welcome 🚀');
    expect(blocks[0].meta?.headingId).toBe('welcome');
  });

  it('serializes heading with custom ID back to markdown', () => {
    const markdown = '## Section {#sec-1}';
    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);

    expect(serialized.trim()).toBe('## Section {#sec-1}');
  });

  it('round-trips heading with custom ID', () => {
    const markdown = '### Advanced Topics {#advanced}';
    const blocks = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(blocks);
    const reparsed = parseMarkdownToBlocks(serialized);

    expect(reparsed[0].content).toBe('Advanced Topics');
    expect(reparsed[0].meta?.headingId).toBe('advanced');
  });
});

describe('Multiple definitions for same term', () => {
  it('parses term with multiple definitions', () => {
    const markdown = `Term
: First definition
: Second definition`;

    const blocks = parseMarkdownToBlocks(markdown);

    // Should create separate definition-list blocks for each definition
    expect(blocks.filter(b => b.type === 'definition-list').length).toBeGreaterThan(0);
  });
});
