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
import { ListPlugin } from '../components/editor/plugins/built-in/ListPlugin';
import { getListSiblingIndices } from '../components/editor/utils/listHelpers';

// Utility to create ordered list block with index
const ordered = (index: number, content: string, level = 0): EditorBlock => ({
  id: `ordered-${index}`,
  type: 'list',
  content,
  meta: {
    listType: 'ordered',
    level,
    index,
  },
});

const bullet = (id: string, content: string, level = 0): EditorBlock => ({
  id,
  type: 'list',
  content,
  meta: {
    listType: 'unordered',
    level,
  },
});

describe('ListPlugin ordering logic', () => {
  const plugin = new ListPlugin();

  it('increments indices when inserting ordered item mid-list', () => {
    const blocks = [ordered(1, 'First'), ordered(2, 'Second'), ordered(3, 'Third')];

    const result = plugin.handleEnter(blocks[1], blocks, 1);
    expect(result && 'newBlocks' in result).toBe(true);

    const enhanced = result as any;
    const newItem = enhanced.newBlocks[1] as EditorBlock;
    expect(newItem.meta?.index).toBe(3);

    const updates = enhanced.updates as Array<{ blockId: string; updates: Partial<EditorBlock> }>;
    const thirdUpdate = updates.find(update => update.blockId === 'ordered-3');
    expect(thirdUpdate).toBeDefined();
    expect(thirdUpdate?.updates.meta).toEqual(expect.objectContaining({ index: 4 }));
  });

  it('reorderList renumbers top-level ordered items after deletion', () => {
    const blocks = [
      ordered(1, 'First'),
      ordered(2, 'Second'),
      ordered(3, 'Third'),
    ];

    const afterRemoval = plugin.reorderList([blocks[0], blocks[2]]);

    expect(afterRemoval[0].meta?.index).toBe(1);
    expect(afterRemoval[1].meta?.index).toBe(2);
    expect(blocks[2].meta?.index).toBe(3); // original remains unchanged
  });

  it('does not renumber nested ordered items when parent level changes', () => {
    const blocks = [
      ordered(1, 'First', 0),
      ordered(1, 'Nested child', 1),
      ordered(2, 'Second', 0),
    ];

    const after = plugin.reorderList(blocks);
    expect(after[0].meta?.index).toBe(1);
    expect(after[1].meta?.index).toBe(1); // level 1 remains untouched
    expect(after[2].meta?.index).toBe(2);
  });

  it('collects contiguous siblings at the same level', () => {
    const blocks: EditorBlock[] = [
      { ...ordered(1, 'Top 1'), id: 'a' },
      { ...ordered(2, 'Top 2'), id: 'b' },
      { ...ordered(1, 'Nested', 1), id: 'c' },
      { ...ordered(3, 'Top 3'), id: 'd' },
    ];

    const siblings = getListSiblingIndices(blocks, 1);
    expect(siblings).toEqual([0, 1]);

    const nestedSiblings = getListSiblingIndices(blocks, 2);
    expect(nestedSiblings).toEqual([2]);
  });

  it('handleEnter clones metadata for unordered list without adding index', () => {
    const block = bullet('bullet-1', 'Item');
    const all = [block];
    const result = plugin.handleEnter(block, all, 0);
    expect(Array.isArray(result)).toBe(true);
    const enhanced = result as EditorBlock[];
    const newItem = enhanced[1];
    expect(newItem.meta?.listType).toBe('unordered');
    expect(newItem.meta?.level).toBe(0);
    expect(newItem.meta?.index).toBeUndefined();
  });

  it('reorderList assigns indices when toggled to ordered', () => {
    const blocks = [
      bullet('a', 'First'),
      bullet('b', 'Second'),
      bullet('c', 'Third'),
    ].map((block) => ({
      ...block,
      meta: { ...block.meta, listType: 'ordered' },
    }));

    const reordered = plugin.reorderList(blocks);
    expect(reordered.map((b) => b.meta?.index)).toEqual([1, 2, 3]);
  });

  it('createBlock applies plugin defaults and overrides meta', () => {
    const bulletBlock = plugin.createBlock();
    expect(bulletBlock.meta?.listType).toBe('unordered');
    expect(bulletBlock.meta?.level).toBe(0);
    expect(bulletBlock.meta?.index).toBeUndefined();

    const orderedBlock = plugin.createBlock('', { listType: 'ordered', level: 2 });
    expect(orderedBlock.meta?.listType).toBe('ordered');
    expect(orderedBlock.meta?.level).toBe(2);
    expect(orderedBlock.meta?.index).toBe(1);
  });
});
