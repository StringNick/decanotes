jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => null),
    clear: jest.fn(async () => null),
  },
}));

jest.mock('../hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('../constants/Colors', () => ({
  Colors: {
    light: {
      background: '#ffffff',
      text: '#111111',
      textMuted: '#888888',
      surface: '#f5f5f5',
      accent: '#007AFF',
      accentLight: '#E5F1FF',
      border: '#e0e0e0',
      error: '#ff3b30',
      success: '#34c759',
      warning: '#ffcc00',
    },
    dark: {
      background: '#000000',
      text: '#ffffff',
      textMuted: '#bbbbbb',
      surface: '#1c1c1e',
      accent: '#0A84FF',
      accentLight: '#1E3A5F',
      border: '#333333',
      error: '#ff453a',
      success: '#30d158',
      warning: '#ffd60a',
    },
  },
}));

import { EditorBlock } from '../types/editor';
import {
  parseMarkdownToBlocks,
  serializeBlocksToMarkdown,
} from '../components/editor/utils/MarkdownRegistry';
import { ListPlugin } from '../components/editor/plugins/built-in/ListPlugin';
import { ChecklistPlugin } from '../components/editor/plugins/built-in/ChecklistPlugin';
import { CalloutPlugin } from '../components/editor/plugins/built-in/CalloutPlugin';
import { CodePlugin } from '../components/editor/plugins/built-in/CodePlugin';
import { ImagePlugin } from '../components/editor/plugins/built-in/ImagePlugin';
import {
  VideoPlugin,
  toMarkdown as videoToMarkdown,
  parseMarkdown as parseVideoMarkdown,
  createVideoBlock,
} from '../components/editor/plugins/built-in/VideoPlugin';
import { DividerPlugin } from '../components/editor/plugins/built-in/DividerPlugin';
import { TablePlugin } from '../components/editor/plugins/built-in/TablePlugin';

const stripIds = (blocks: EditorBlock[]) =>
  blocks.map(({ type, content, meta }) => ({
    type,
    content,
    meta: meta ?? undefined,
  }));

const normalizeMarkdown = (markdown: string): string =>
  markdown.replace(/\r\n/g, '\n').trim();

describe('Markdown serialization round-trips', () => {
const cases: Array<{
    name: string;
    markdown: string;
    expected: Array<Partial<EditorBlock>>;
  }> = [
    {
      name: 'heading and paragraph',
      markdown: '# Welcome\n\nHello world.',
      expected: [
        { type: 'heading', content: 'Welcome', meta: { level: 1 } },
        { type: 'paragraph', content: 'Hello world.' },
      ],
    },
    {
      name: 'blockquote',
      markdown: '> Quoted thought',
      expected: [{ type: 'quote', content: 'Quoted thought' }],
    },
    {
      name: 'unordered list',
      markdown: '- First\n- Second',
      expected: [
        { type: 'list', content: 'First', meta: { ordered: false, depth: 0 } },
        { type: 'list', content: 'Second', meta: { ordered: false, depth: 0 } },
      ],
    },
    {
      name: 'ordered list with nesting',
      markdown: '1. Alpha\n2. Bravo\n  - Nested bullet',
      expected: [
        { type: 'list', content: 'Alpha', meta: { ordered: true, depth: 0 } },
        { type: 'list', content: 'Bravo', meta: { ordered: true, depth: 0 } },
        { type: 'list', content: 'Nested bullet', meta: { ordered: false, depth: 1 } },
      ],
    },
    {
      name: 'checklist',
      markdown: '- [x] Done\n- [ ] Pending',
      expected: [
        { type: 'checklist', content: 'Done', meta: { checked: true, level: 0 } },
        { type: 'checklist', content: 'Pending', meta: { checked: false, level: 0 } },
      ],
    },
    {
      name: 'code block',
      markdown: '```ts\nconst a = 1;\n```',
      expected: [
        { type: 'code', content: 'const a = 1;', meta: { language: 'ts' } },
      ],
    },
    {
      name: 'divider',
      markdown: '---',
      expected: [{ type: 'divider', content: '' }],
    },
    {
      name: 'image with caption',
      markdown: '![Logo](https://example.com/logo.png "Company Logo")',
      expected: [
        {
          type: 'image',
          content: 'https://example.com/logo.png',
          meta: {
            alt: 'Logo',
            url: 'https://example.com/logo.png',
            caption: 'Company Logo',
          },
        },
      ],
    },
    {
      name: 'video with caption',
      markdown: '!video[Demo](https://example.com/demo.mp4)',
      expected: [
        {
          type: 'video',
          content: 'https://example.com/demo.mp4',
          meta: {
            url: 'https://example.com/demo.mp4',
            caption: 'Demo',
          },
        },
      ],
    },
  ];

  const canonicalizeLine = (line: string): string =>
    line.replace(/^(\s*)\d+\.(\s+)/, '$11.$2');

  const splitMeaningfulLines = (markdown: string): string[] =>
    markdown
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(line => line.replace(/\r/g, ''))
      .filter(line => line.trim().length > 0)
      .map(canonicalizeLine);

  cases.forEach(({ name, markdown, expected }) => {
    it(`parses and serializes ${name}`, () => {
      const parsed = parseMarkdownToBlocks(markdown);
      expect(stripIds(parsed)).toEqual(expected);

      const serialized = serializeBlocksToMarkdown(parsed);
      const serializedLines = splitMeaningfulLines(serialized);
      const originalLines = splitMeaningfulLines(markdown);

      originalLines.forEach(line => {
        expect(serializedLines).toContain(line);
      });
    });
  });

  it('round-trips a mixed document', () => {
    const markdown = [
      '# Title',
      '',
      '1. Ordered',
      '2. List',
      '  - Nested bullet',
      '',
      '- [x] Task',
      '',
      '```js',
      'console.log("hello");',
      '```',
      '',
      '![Alt text](https://cdn.example.com/image.png)',
      '',
      '---',
      '',
      '> Quote line',
    ].join('\n');

    const parsed = parseMarkdownToBlocks(markdown);
    const serialized = serializeBlocksToMarkdown(parsed);
    const serializedLines = splitMeaningfulLines(serialized);
    const originalLines = splitMeaningfulLines(markdown);

    originalLines.forEach(line => {
      expect(serializedLines).toContain(line);
    });
  });
});

describe('Plugin markdown helpers', () => {
  it('ListPlugin parses and serializes ordered and unordered items', () => {
    const plugin = new ListPlugin();

    const unordered = plugin.parseMarkdown('- Bullet text');
    expect(unordered).toMatchObject({
      type: 'list',
      content: 'Bullet text',
      meta: { listType: 'unordered', level: 0, index: 1 },
    });
    expect(plugin.toMarkdown(unordered!)).toBe('- Bullet text');

    const ordered = plugin.parseMarkdown('3. Third point');
    expect(ordered).toMatchObject({
      type: 'list',
      content: 'Third point',
      meta: { listType: 'ordered', level: 0, index: 3 },
    });
    expect(plugin.toMarkdown(ordered!)).toBe('3. Third point');
  });

  it('ChecklistPlugin parses and serializes checked/unchecked items', () => {
    const plugin = ChecklistPlugin.getInstance();

    const checked = plugin.parseMarkdown('- [x] Completed task');
    expect(checked).toMatchObject({
      type: 'checklist',
      content: 'Completed task',
      meta: { checked: true, level: 0 },
    });
    expect(plugin.toMarkdown(checked!)).toBe('- [x] Completed task');

    const unchecked = plugin.parseMarkdown('  - [ ] Pending task');
    expect(unchecked).toMatchObject({
      type: 'checklist',
      content: 'Pending task',
      meta: { checked: false, level: 1 },
    });
    expect(plugin.toMarkdown(unchecked!)).toBe('  - [ ] Pending task');
  });

  it('CalloutPlugin parses and serializes multi-line tips', () => {
    const plugin = new CalloutPlugin();
    const markdown = ['> [!TIP] Tip', '> Stay hydrated'].join('\n');

    const block = plugin.parseMarkdown(markdown);
    expect(block).toMatchObject({
      type: 'callout',
      content: 'Stay hydrated',
      meta: { calloutType: 'tip', title: 'Tip', showTitle: true },
    });
    expect(plugin.toMarkdown(block!)).toBe(markdown);
  });

  it('CodePlugin parses and serializes fenced blocks', () => {
    const plugin = new CodePlugin();
    const markdown = '```ts\nconst answer = 42;\n```';

    const block = plugin.parseMarkdown(markdown);
    expect(block).toMatchObject({
      type: 'code',
      content: 'const answer = 42;',
      meta: { language: 'ts' },
    });
    expect(plugin.toMarkdown(block!)).toBe(markdown);
  });

  it('ImagePlugin parses and serializes images with captions', () => {
    const plugin = new ImagePlugin();
    const markdown = '![Diagram](https://example.com/diagram.svg "System diagram")';

    const block = plugin.parseMarkdown(markdown);
    expect(block).toMatchObject({
      type: 'image',
      content: 'https://example.com/diagram.svg',
      meta: {
        url: 'https://example.com/diagram.svg',
        alt: 'Diagram',
        caption: 'System diagram',
      },
    });
    expect(plugin.toMarkdown(block!)).toBe(markdown);
  });

  it('VideoPlugin parses and serializes embedded videos', () => {
    const markdown = '![video](https://example.com/trailer.mp4 "Launch Trailer")';

    const block = createVideoBlock('https://example.com/trailer.mp4', 'Launch Trailer');
    expect(videoToMarkdown(block)).toBe(markdown);

    const parsed = parseVideoMarkdown('![video](https://example.com/trailer.mp4)');
    expect(parsed).toMatchObject({
      type: 'video',
      content: 'https://example.com/trailer.mp4',
      meta: {
        url: 'https://example.com/trailer.mp4',
        title: 'Video',
      },
    });
  });

  it('DividerPlugin parses and serializes horizontal rules', () => {
    const plugin = new DividerPlugin();

    const block = plugin.parseMarkdown('---');
    expect(block).toMatchObject({ type: 'divider', content: '' });
    expect(plugin.toMarkdown(block!)).toBe('---');
  });

  it('TablePlugin parses and serializes tables', () => {
    const plugin = new TablePlugin();
    const markdown = [
      '| Name | Role |',
      '| --- | --- |',
      '| Alice | Engineer |',
      '| Bob | Designer |',
    ].join('\n');

    const block = plugin.parseMarkdown(markdown);
    expect(block).toMatchObject({
      type: 'table',
      meta: {
        headers: ['Name', 'Role'],
        rows: [
          ['Alice', 'Engineer'],
          ['Bob', 'Designer'],
        ],
      },
    });
    expect(plugin.toMarkdown(block!)).toBe(markdown);
  });

  it('TablePlugin markdown reflects cell edits', () => {
    const plugin = new TablePlugin();
    const markdown = [
      '| Name | Score |',
      '| --- | --- |',
      '| Alice | 10 |',
      '| Bob | 8 |',
    ].join('\n');

    const block = plugin.parseMarkdown(markdown);
    expect(block).toBeTruthy();

    const editable = block!;
    const rows = editable.meta?.rows ?? [];
    rows[1][1] = '9';

    const updatedMarkdown = plugin.toMarkdown({
      ...editable,
      meta: {
        ...editable.meta,
        rows,
      },
    });

    expect(updatedMarkdown).toContain('| Bob | 9 |');
  });
});
