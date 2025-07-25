import { renderHook, act } from '@testing-library/react-native';
import { useEditorState } from '../components/editor/core/EditorState';
import { EditorBlock } from '../types/editor';
import { EditorConfig } from '../components/editor/types/EditorTypes';
import { MarkdownPlugin } from '../components/editor/types/PluginTypes';

// Mock markdown plugin for testing
const mockMarkdownPlugin: MarkdownPlugin = {
  id: 'test-bold',
  name: 'Test Bold',
  version: '1.0.0',
  type: 'markdown',
  description: 'Test bold plugin',
  syntax: {
    patterns: {
      inline: /\*\*(.*?)\*\*/g
    },
    priority: 100
  },
  parser: {
    canParse: (line: string) => line.includes('**'),
    parseBlock: (line: string) => ({
      id: 'test-block-id',
      type: 'paragraph',
      content: line.replace(/\*\*(.*?)\*\*/g, '$1'),
      meta: { bold: true }
    }),
    parseInline: (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1')
  },
  serializer: {
    canSerialize: (block: EditorBlock) => block.meta?.bold === true,
    serializeBlock: (block: EditorBlock) => `**${block.content}**`,
    serializeInline: (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1')
  }
};

const defaultConfig: EditorConfig = {
  theme: {
    colors: {
      primary: '#007AFF',
      primaryLight: '#E3F2FD',
      secondary: '#666',
      background: '#fff',
      text: '#000',
      border: '#E5E5E7'
    },
    spacing: {
      small: 4,
      medium: 8,
      large: 16
    },
    typography: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'System'
    }
  },
  toolbar: {
    enabled: true,
    position: 'top'
  },
  dragAndDrop: {
    enabled: true
  },
  keyboard: {
    shortcuts: {}
  },
  historyDebounceMs: 0, // Disable debouncing for tests
  maxHistorySize: 50,
  debug: false
};

describe('useEditorState', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with empty blocks', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      expect(result.current.blocks).toEqual([]);
      expect(result.current.selectedBlockId).toBeNull();
      expect(result.current.editingBlockId).toBeNull();
    });

    it('should initialize with provided blocks', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      expect(result.current.blocks).toEqual(initialBlocks);
      expect(result.current.blocks).toHaveLength(2);
    });

    it('should call onBlocksChange when blocks change', () => {
      const onBlocksChange = jest.fn();
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          onBlocksChange,
          config: defaultConfig
        })
      );

      const newBlock: EditorBlock = {
        id: 'test-block',
        type: 'paragraph',
        content: 'Test content'
      };

      act(() => {
        result.current.actions.addBlock(newBlock);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(onBlocksChange).toHaveBeenCalled();
    });
  });

  describe('Block Operations', () => {
    it('should add a block', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      const newBlock: EditorBlock = {
        id: 'test-block',
        type: 'paragraph',
        content: 'Test content'
      };

      act(() => {
        result.current.actions.addBlock(newBlock);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0]).toEqual(newBlock);
      expect(result.current.selectedBlockId).toBe('test-block');
      expect(result.current.editingBlockId).toBe('test-block');
    });

    it('should add a block at specific index', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      const newBlock: EditorBlock = {
        id: 'new-block',
        type: 'paragraph',
        content: 'New block'
      };

      act(() => {
        result.current.actions.addBlock(newBlock, 1);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(3);
      expect(result.current.blocks[1].id).toBe('new-block');
    });

    it('should generate ID for block without ID', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      const newBlock = {
        type: 'paragraph' as const,
        content: 'Test content'
      };

      act(() => {
        result.current.actions.addBlock(newBlock as EditorBlock);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0].id).toBeDefined();
      expect(result.current.blocks[0].id).toMatch(/^block_/);
    });

    it('should update a block', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original content' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.updateBlock('1', { content: 'Updated content' });
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks[0].content).toBe('Updated content');
    });

    it('should delete a block', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.deleteBlock('1');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(1);
      expect(result.current.blocks[0].id).toBe('2');
    });

    it('should update selection when deleting selected block', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.selectBlock('1');
      });

      act(() => {
        result.current.actions.deleteBlock('1');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.selectedBlockId).toBe('2');
    });

    it('should move a block', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' },
        { id: '3', type: 'paragraph', content: 'Block 3' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.moveBlock('1', 2);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks[0].id).toBe('2');
      expect(result.current.blocks[1].id).toBe('3');
      expect(result.current.blocks[2].id).toBe('1');
    });

    it('should duplicate a block', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original block', meta: { test: true } }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.duplicateBlock('1');
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(2);
      expect(result.current.blocks[1].content).toBe('Original block');
      expect(result.current.blocks[1].meta).toEqual({ test: true });
      expect(result.current.blocks[1].id).not.toBe('1');
    });
  });

  describe('Selection Operations', () => {
    it('should select a block', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.selectBlock('test-id');
      });

      expect(result.current.selectedBlockId).toBe('test-id');
    });

    it('should clear selection', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.selectBlock('test-id');
      });

      act(() => {
        result.current.actions.clearSelection();
      });

      expect(result.current.selectedBlockId).toBeNull();
    });
  });

  describe('Editing Operations', () => {
    it('should start editing a block', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.startEditing('test-id');
      });

      expect(result.current.editingBlockId).toBe('test-id');
      expect(result.current.selectedBlockId).toBe('test-id');
    });

    it('should stop editing', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.startEditing('test-id');
      });

      act(() => {
        result.current.actions.stopEditing();
      });

      expect(result.current.editingBlockId).toBeNull();
    });
  });

  describe('Content Operations', () => {
    it('should export to markdown', () => {
      const blocks: EditorBlock[] = [
        { id: '1', type: 'heading', content: 'Title', meta: { level: 1 } },
        { id: '2', type: 'paragraph', content: 'Regular text' },
        { id: '3', type: 'quote', content: 'Quote text' },
        { id: '4', type: 'code', content: 'console.log("hello");', meta: { language: 'javascript' } }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: blocks,
          config: defaultConfig
        })
      );

      const markdown = result.current.actions.exportToMarkdown([]);
      
      expect(markdown).toContain('# Title');
      expect(markdown).toContain('Regular text');
      expect(markdown).toContain('> Quote text');
      expect(markdown).toContain('```javascript\nconsole.log("hello");\n```');
    });

    it('should export to plain text', () => {
      const blocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'First paragraph' },
        { id: '2', type: 'paragraph', content: 'Second paragraph' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: blocks,
          config: defaultConfig
        })
      );

      const plainText = result.current.actions.exportToPlainText();
      expect(plainText).toBe('First paragraph\n\nSecond paragraph');
    });

    it('should import from markdown', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      const markdown = '# Heading\n\nParagraph text\n\n> Quote\n\n```js\ncode\n```';

      act(() => {
        result.current.actions.importFromMarkdown(markdown, []);
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks).toHaveLength(4);
      expect(result.current.blocks[0].type).toBe('heading');
      expect(result.current.blocks[0].content).toBe('Heading');
      expect(result.current.blocks[1].type).toBe('paragraph');
      expect(result.current.blocks[1].content).toBe('Paragraph text');
      expect(result.current.blocks[2].type).toBe('quote');
      expect(result.current.blocks[2].content).toBe('Quote');
      expect(result.current.blocks[3].type).toBe('code');
      expect(result.current.blocks[3].content).toBe('code');
    });
  });

  describe('History Operations', () => {
    it('should support undo', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.updateBlock('1', { content: 'Updated' });
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.blocks[0].content).toBe('Updated');
      expect(result.current.editorState.history.canUndo).toBe(true);

      act(() => {
        result.current.actions.undo();
      });

      expect(result.current.blocks[0].content).toBe('Original');
    });

    it('should support redo', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      act(() => {
        result.current.actions.updateBlock('1', { content: 'Updated' });
      });

      act(() => {
        jest.runAllTimers();
      });

      act(() => {
        result.current.actions.undo();
      });

      expect(result.current.editorState.history.canRedo).toBe(true);

      act(() => {
        result.current.actions.redo();
      });

      expect(result.current.blocks[0].content).toBe('Updated');
    });

    it('should not undo when no history available', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      expect(result.current.editorState.history.canUndo).toBe(false);

      act(() => {
        result.current.actions.undo();
      });

      // Should not change anything
      expect(result.current.blocks).toEqual([]);
    });

    it('should not redo when no future history available', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      expect(result.current.editorState.history.canRedo).toBe(false);

      act(() => {
        result.current.actions.redo();
      });

      // Should not change anything
      expect(result.current.blocks).toEqual([]);
    });
  });

  describe('Utility Functions', () => {
    it('should generate unique block IDs', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      const id1 = result.current.actions.generateBlockId();
      const id2 = result.current.actions.generateBlockId();

      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^block_/);
      expect(id2).toMatch(/^block_/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid block operations gracefully', () => {
      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks: [],
          config: defaultConfig
        })
      );

      // Try to update non-existent block
      act(() => {
        result.current.actions.updateBlock('non-existent', { content: 'test' });
      });

      // Try to delete non-existent block
      act(() => {
        result.current.actions.deleteBlock('non-existent');
      });

      // Try to move non-existent block
      act(() => {
        result.current.actions.moveBlock('non-existent', 0);
      });

      // Try to duplicate non-existent block
      act(() => {
        result.current.actions.duplicateBlock('non-existent');
      });

      // Should not crash
      expect(result.current.blocks).toEqual([]);
    });

    it('should handle invalid move operations', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' }
      ];

      const { result } = renderHook(() => 
        useEditorState({
          initialBlocks,
          config: defaultConfig
        })
      );

      // Try to move to invalid index
      act(() => {
        result.current.actions.moveBlock('1', -1);
      });

      act(() => {
        result.current.actions.moveBlock('1', 10);
      });

      // Should not change anything
      expect(result.current.blocks).toEqual(initialBlocks);
    });
  });
});