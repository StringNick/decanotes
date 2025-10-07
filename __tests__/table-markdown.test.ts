/**
 * Comprehensive test suite for table markdown parsing and export
 * Tests:
 * 1. Parsing markdown tables to EditorBlocks
 * 2. Exporting EditorBlocks to markdown
 * 3. Round-trip consistency (import -> export -> import)
 */

import { parseMarkdownToBlocks, blocksToMarkdown } from '../utils/markdownParser';
import { EditorBlock } from '../types/editor';

describe('Table Markdown Parsing', () => {
  describe('Import: Markdown -> EditorBlock', () => {
    test('parses basic table with left alignment', () => {
      const markdown = `| Column 1 | Column 2 |
| --- | --- |
| data 1 | data 2 |
| data 3 | data 4 |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      expect(blocks[0].meta?.headers).toEqual(['Column 1', 'Column 2']);
      expect(blocks[0].meta?.alignments).toEqual(['left', 'left']);
      expect(blocks[0].meta?.rows).toEqual([
        ['data 1', 'data 2'],
        ['data 3', 'data 4']
      ]);
    });

    test('parses table with center alignment', () => {
      const markdown = `| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      expect(blocks[0].meta?.headers).toEqual(['Left columns', 'Right columns']);
      expect(blocks[0].meta?.alignments).toEqual(['left', 'center']);
      expect(blocks[0].meta?.rows).toEqual([
        ['left foo', 'right foo'],
        ['left bar', 'right bar'],
        ['left baz', 'right baz']
      ]);
    });

    test('parses table with right alignment', () => {
      const markdown = `| Left | Right |
| --- | ---: |
| A | 1 |
| B | 2 |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      expect(blocks[0].meta?.alignments).toEqual(['left', 'right']);
    });

    test('parses table with mixed alignments', () => {
      const markdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| A | B | C |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].meta?.alignments).toEqual(['left', 'center', 'right']);
    });

    test('parses table with empty cells', () => {
      const markdown = `| Col 1 | Col 2 |
| --- | --- |
| data |  |
|  | data |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].meta?.rows).toEqual([
        ['data', ''],
        ['', 'data']
      ]);
    });

    test('parses table with header only (no data rows)', () => {
      const markdown = `| Header 1 | Header 2 |
| --- | --- |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('table');
      expect(blocks[0].meta?.headers).toEqual(['Header 1', 'Header 2']);
      expect(blocks[0].meta?.rows).toEqual([]);
    });

    test('parses table with extra spaces', () => {
      const markdown = `|  Column 1  |  Column 2  |
|  -------  |  -------  |
|  data 1   |  data 2   |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].meta?.headers).toEqual(['Column 1', 'Column 2']);
      expect(blocks[0].meta?.rows).toEqual([['data 1', 'data 2']]);
    });

    test('does not parse invalid table (missing alignment row)', () => {
      const markdown = `| Column 1 | Column 2 |
| data 1 | data 2 |`;

      const blocks = parseMarkdownToBlocks(markdown);

      // Should not create a table block
      expect(blocks.every(b => b.type !== 'table')).toBe(true);
    });

    test('does not parse invalid alignment row', () => {
      const markdown = `| Column 1 | Column 2 |
| invalid | alignment |
| data 1 | data 2 |`;

      const blocks = parseMarkdownToBlocks(markdown);

      // Should not create a table block
      expect(blocks.every(b => b.type !== 'table')).toBe(true);
    });
  });

  describe('Export: EditorBlock -> Markdown', () => {
    test('exports basic table to markdown', () => {
      const block: EditorBlock = {
        id: 'test-1',
        type: 'table',
        content: '',
        meta: {
          headers: ['Column 1', 'Column 2'],
          rows: [
            ['data 1', 'data 2'],
            ['data 3', 'data 4']
          ],
          alignments: ['left', 'left']
        }
      };

      const markdown = blocksToMarkdown([block]);

      expect(markdown).toContain('| Column 1 | Column 2 |');
      expect(markdown).toContain('| --- | --- |');
      expect(markdown).toContain('| data 1 | data 2 |');
      expect(markdown).toContain('| data 3 | data 4 |');
    });

    test('exports table with center alignment', () => {
      const block: EditorBlock = {
        id: 'test-2',
        type: 'table',
        content: '',
        meta: {
          headers: ['Left', 'Center'],
          rows: [['A', 'B']],
          alignments: ['left', 'center']
        }
      };

      const markdown = blocksToMarkdown([block]);

      expect(markdown).toContain('| Left | Center |');
      expect(markdown).toContain('| --- | :---: |');
    });

    test('exports table with right alignment', () => {
      const block: EditorBlock = {
        id: 'test-3',
        type: 'table',
        content: '',
        meta: {
          headers: ['Left', 'Right'],
          rows: [['A', '1']],
          alignments: ['left', 'right']
        }
      };

      const markdown = blocksToMarkdown([block]);

      expect(markdown).toContain('| Left | Right |');
      expect(markdown).toContain('| --- | ---: |');
    });

    test('exports table with empty cells', () => {
      const block: EditorBlock = {
        id: 'test-4',
        type: 'table',
        content: '',
        meta: {
          headers: ['Col 1', 'Col 2'],
          rows: [
            ['data', ''],
            ['', 'data']
          ],
          alignments: ['left', 'left']
        }
      };

      const markdown = blocksToMarkdown([block]);

      expect(markdown).toContain('| data |  |');
      expect(markdown).toContain('|  | data |');
    });

    test('exports empty table as empty string', () => {
      const block: EditorBlock = {
        id: 'test-5',
        type: 'table',
        content: '',
        meta: {
          headers: [],
          rows: [],
          alignments: []
        }
      };

      const markdown = blocksToMarkdown([block]);

      // Empty table should produce empty or minimal output
      expect(markdown.trim()).toBe('');
    });
  });

  describe('Round-trip: Import -> Export -> Import', () => {
    test('maintains data integrity for basic table', () => {
      const originalMarkdown = `| Column 1 | Column 2 |
| --- | --- |
| data 1 | data 2 |
| data 3 | data 4 |`;

      // Parse to blocks
      const blocks1 = parseMarkdownToBlocks(originalMarkdown);

      // Export back to markdown
      const exportedMarkdown = blocksToMarkdown(blocks1);

      // Parse again
      const blocks2 = parseMarkdownToBlocks(exportedMarkdown);

      // Compare blocks
      expect(blocks2).toHaveLength(blocks1.length);
      expect(blocks2[0].type).toBe(blocks1[0].type);
      expect(blocks2[0].meta?.headers).toEqual(blocks1[0].meta?.headers);
      expect(blocks2[0].meta?.rows).toEqual(blocks1[0].meta?.rows);
      expect(blocks2[0].meta?.alignments).toEqual(blocks1[0].meta?.alignments);
    });

    test('maintains alignment information through round-trip', () => {
      const originalMarkdown = `| Left | Center | Right |
| :--- | :---: | ---: |
| A | B | C |
| D | E | F |`;

      const blocks1 = parseMarkdownToBlocks(originalMarkdown);
      const exportedMarkdown = blocksToMarkdown(blocks1);
      const blocks2 = parseMarkdownToBlocks(exportedMarkdown);

      expect(blocks2[0].meta?.alignments).toEqual(['left', 'center', 'right']);
    });

    test('handles complex table from user example', () => {
      const originalMarkdown = `| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |`;

      const blocks1 = parseMarkdownToBlocks(originalMarkdown);

      // Verify first parse
      expect(blocks1).toHaveLength(1);
      expect(blocks1[0].type).toBe('table');
      expect(blocks1[0].meta?.headers).toEqual(['Left columns', 'Right columns']);
      expect(blocks1[0].meta?.alignments).toEqual(['left', 'center']);

      // Export and re-import
      const exportedMarkdown = blocksToMarkdown(blocks1);
      const blocks2 = parseMarkdownToBlocks(exportedMarkdown);

      // Verify consistency
      expect(blocks2).toHaveLength(1);
      expect(blocks2[0].type).toBe('table');
      expect(blocks2[0].meta?.headers).toEqual(blocks1[0].meta?.headers);
      expect(blocks2[0].meta?.rows).toEqual(blocks1[0].meta?.rows);
      expect(blocks2[0].meta?.alignments).toEqual(blocks1[0].meta?.alignments);
    });

    test('preserves empty cells through round-trip', () => {
      const originalMarkdown = `| A | B |
| --- | --- |
| 1 |  |
|  | 2 |`;

      const blocks1 = parseMarkdownToBlocks(originalMarkdown);
      const exportedMarkdown = blocksToMarkdown(blocks1);
      const blocks2 = parseMarkdownToBlocks(exportedMarkdown);

      expect(blocks2[0].meta?.rows).toEqual([
        ['1', ''],
        ['', '2']
      ]);
    });
  });

  describe('Edge Cases', () => {
    test('handles table with single column', () => {
      const markdown = `| Single |
| --- |
| A |
| B |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].meta?.headers).toEqual(['Single']);
      expect(blocks[0].meta?.rows).toEqual([['A'], ['B']]);
    });

    test('handles table with many columns', () => {
      const markdown = `| A | B | C | D | E |
| --- | --- | --- | --- | --- |
| 1 | 2 | 3 | 4 | 5 |`;

      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].meta?.headers).toHaveLength(5);
    });

    test('handles table surrounded by other blocks', () => {
      const markdown = `# Heading

| Col 1 | Col 2 |
| --- | --- |
| A | B |

Paragraph after table`;

      const blocks = parseMarkdownToBlocks(markdown);

      const tableBlock = blocks.find(b => b.type === 'table');
      expect(tableBlock).toBeDefined();
      expect(tableBlock?.meta?.headers).toEqual(['Col 1', 'Col 2']);
    });
  });
});
