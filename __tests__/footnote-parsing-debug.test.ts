/**
 * Debug test for footnote parsing
 */

import { parseMarkdownToBlocks } from '../components/editor/utils/MarkdownRegistry';

describe('Footnote parsing debug', () => {
  it('parses footnote definition', () => {
    const markdown = '[^note]: Named footnotes are useful for longer documents.';
    const blocks = parseMarkdownToBlocks(markdown, []);

    console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));

    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe('footnote');
    expect(blocks[0].meta?.footnoteId).toBe('note');
  });

  it('parses full footnote example from showcase', () => {
    const markdown = `Here is a simple footnote[^1] with a reference.

You can also use named footnotes[^note] for better organization.

[^1]: This is the first footnote definition.

[^note]: Named footnotes are useful for longer documents.`;

    const blocks = parseMarkdownToBlocks(markdown, []);

    console.log('Total blocks:', blocks.length);
    console.log(
      'Footnote blocks:',
      blocks.filter(b => b.type === 'footnote').map(b => ({ type: b.type, meta: b.meta }))
    );

    const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
    expect(footnoteBlocks.length).toBeGreaterThan(0);
  });
});
