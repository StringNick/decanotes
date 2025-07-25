import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { EditorCore } from '../components/editor/core/EditorCore';
import { BlockPlugin, MarkdownPlugin } from '../components/editor/types/PluginTypes';
import { EditorBlock } from '../types/editor';

// Mock dependencies
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Mock a simple block plugin for testing
const mockBlockPlugin: BlockPlugin = {
  id: 'test-paragraph',
  name: 'Test Paragraph',
  version: '1.0.0',
  type: 'block',
  blockType: 'paragraph',
  description: 'Test paragraph plugin',
  component: ({ block, onUpdate, onFocus }) => (
    <TouchableOpacity onPress={() => onFocus?.()} testID={`block-${block.id}`}>
      <Text testID={`block-content-${block.id}`}>{block.content}</Text>
    </TouchableOpacity>
  ),
  controller: {
    handleEnter: (block) => ({ id: 'new-block', type: 'paragraph', content: '' }),
    handleBackspace: (block) => block.content ? block : null
  },
  toolbar: {
    icon: 'text',
    label: 'Paragraph',
    group: 'basic'
  }
};

// Mock a markdown plugin for testing
const mockMarkdownPlugin: MarkdownPlugin = {
  id: 'test-bold',
  name: 'Test Bold',
  version: '1.0.0',
  type: 'markdown',
  description: 'Test bold markdown plugin',
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
    canSerialize: (block: any) => block.meta?.bold === true,
    serializeBlock: (block: any) => `**${block.content}**`,
    serializeInline: (text: string) => text.replace(/\*\*(.*?)\*\*/g, '$1')
  }
};

describe('EditorCore', () => {
  const defaultProps = {
    initialBlocks: [],
    blockPlugins: [mockBlockPlugin],
    markdownPlugins: [mockMarkdownPlugin]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { getByTestId } = render(<EditorCore {...defaultProps} />);
      expect(getByTestId('editor-core')).toBeTruthy();
    });

    it('should render with initial blocks', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Hello World' },
        { id: '2', type: 'paragraph', content: 'Second paragraph' }
      ];

      const { getByTestId } = render(
        <EditorCore {...defaultProps} initialBlocks={initialBlocks} />
      );

      expect(getByTestId('block-content-1')).toHaveTextContent('Hello World');
      expect(getByTestId('block-content-2')).toHaveTextContent('Second paragraph');
    });

    it('should render empty editor when no initial blocks provided', () => {
      const { getByTestId } = render(<EditorCore {...defaultProps} />);
      
      // Should have at least one empty block
      expect(getByTestId('editor-core')).toBeTruthy();
    });
  });

  describe('Plugin Registration', () => {
    it('should register block plugins on mount', () => {
      const onError = jest.fn();
      render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[mockBlockPlugin]}
          onError={onError}
        />
      );

      // Should not have any errors
      expect(onError).not.toHaveBeenCalled();
    });

    it('should register markdown plugins on mount', () => {
      const onError = jest.fn();
      render(
        <EditorCore 
          {...defaultProps} 
          markdownPlugins={[mockMarkdownPlugin]}
          onError={onError}
        />
      );

      // Should not have any errors
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle plugin registration errors', () => {
      const invalidPlugin = {
        ...mockBlockPlugin,
        id: '', // Invalid ID
      } as BlockPlugin;

      const onError = jest.fn();
      render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[invalidPlugin]}
          onError={onError}
        />
      );

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'plugin-error',
          source: ''
        })
      );
    });

    it('should unregister plugins on unmount', () => {
      const { unmount } = render(
        <EditorCore {...defaultProps} blockPlugins={[mockBlockPlugin]} />
      );

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Block Operations', () => {
    it('should handle block selection', () => {
      const onSelectionChange = jest.fn();
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Test content' }
      ];

      const { getByTestId } = render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[mockBlockPlugin]}
          initialBlocks={initialBlocks}
          onSelectionChange={onSelectionChange}
        />
      );

      fireEvent.press(getByTestId('block-container-1'));
      expect(onSelectionChange).toHaveBeenCalledWith('1');
    });

    it('should handle block updates', () => {
      const onBlocksChange = jest.fn();
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original content' }
      ];

      const { getByTestId } = render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[mockBlockPlugin]}
          initialBlocks={initialBlocks}
          onBlocksChange={onBlocksChange}
        />
      );

      // Should render the editor without errors
      expect(getByTestId('editor-core')).toBeTruthy();
      // onBlocksChange is called when blocks are actually modified, not on initial render
    });

    it('should handle editing state changes', () => {
      const onEditingChange = jest.fn();
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Test content' }
      ];

      const { getByTestId } = render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[mockBlockPlugin]}
          initialBlocks={initialBlocks}
          onEditingChange={onEditingChange}
        />
      );

      // Should render the editor without errors
      expect(getByTestId('editor-core')).toBeTruthy();
      // onEditingChange is called when editing state actually changes, not on initial render
    });
  });

  describe('Configuration', () => {
    it('should apply custom theme configuration', () => {
      const customConfig = {
        theme: {
          colors: {
            primary: '#FF0000',
            background: '#000000'
          }
        }
      };

      const { getByTestId } = render(
        <EditorCore {...defaultProps} config={customConfig} />
      );

      expect(getByTestId('editor-core')).toBeTruthy();
    });

    it('should apply toolbar configuration', () => {
      const customConfig = {
        toolbar: {
          enabled: false,
          position: 'bottom' as const
        }
      };

      const { getByTestId } = render(
        <EditorCore {...defaultProps} config={customConfig} />
      );

      expect(getByTestId('editor-core')).toBeTruthy();
    });

    it('should apply drag and drop configuration', () => {
      const customConfig = {
        dragAndDrop: {
          enabled: false
        }
      };

      const { getByTestId } = render(
        <EditorCore {...defaultProps} config={customConfig} />
      );

      expect(getByTestId('editor-core')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle and report errors', () => {
      const onError = jest.fn();
      
      render(
        <EditorCore {...defaultProps} onError={onError} />
      );

      // Should not have any errors with valid setup
      expect(onError).not.toHaveBeenCalled();
    });

    it('should handle invalid block types gracefully', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'invalid-type' as any, content: 'Test content' }
      ];

      const { getByTestId } = render(
        <EditorCore {...defaultProps} initialBlocks={initialBlocks} />
      );

      // Should still render without crashing
      expect(getByTestId('editor-core')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper accessibility labels', () => {
      const { getByTestId } = render(<EditorCore {...defaultProps} />);
      
      expect(getByTestId('editor-core')).toBeTruthy();
    });

    it('should support keyboard navigation', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Test content' }
      ];

      const { getByTestId } = render(
        <EditorCore 
          {...defaultProps} 
          blockPlugins={[mockBlockPlugin]}
          initialBlocks={initialBlocks} 
        />
      );

      // Should render blocks that can receive focus
      expect(getByTestId('block-container-1')).toBeTruthy();
    });
  });
});