import React from 'react';
import { render, act } from '@testing-library/react-native';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('MarkdownEditor insertBlock', () => {
  it('should insert a paragraph block', async () => {
    let editorRef: any;
    
    const TestComponent = () => {
      return (
        <MarkdownEditor
          ref={(ref) => { editorRef = ref; }}
          placeholder="Test editor"
        />
      );
    };

    render(<TestComponent />);
    
    // Test insertBlock functionality
    if (editorRef) {
      // Initially should be empty
      expect(editorRef.getBlocks()).toHaveLength(0);
      
      // Insert a paragraph block
      await act(async () => {
        editorRef.insertBlock('paragraph');
      });
      
      // Should now have one block
      const blocks = editorRef.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('paragraph');
      expect(blocks[0].content).toBe('');
    }
  });

  it('should insert a heading block', async () => {
    let editorRef: any;
    
    const TestComponent = () => {
      return (
        <MarkdownEditor
          ref={(ref) => { editorRef = ref; }}
          placeholder="Test editor"
        />
      );
    };

    render(<TestComponent />);
    
    // Test insertBlock functionality
    if (editorRef) {
      // Insert a heading block
      await act(async () => {
        editorRef.insertBlock('heading');
      });
      
      // Should now have one block
      const blocks = editorRef.getBlocks();
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading');
    }
  });

  it('should insert block at specific index', async () => {
    let editorRef: any;
    
    const TestComponent = () => {
      return (
        <MarkdownEditor
          ref={(ref) => { editorRef = ref; }}
          placeholder="Test editor"
          initialBlocks={[
            { id: '1', type: 'paragraph', content: 'First block' },
            { id: '2', type: 'paragraph', content: 'Second block' }
          ]}
        />
      );
    };

    render(<TestComponent />);
    
    // Test insertBlock functionality
    if (editorRef) {
      // Insert a block at index 1
      await act(async () => {
        editorRef.insertBlock('paragraph', 1);
      });
      
      // Should now have three blocks
      const blocks = editorRef.getBlocks();
      expect(blocks).toHaveLength(3);
      expect(blocks[1].type).toBe('paragraph');
      expect(blocks[1].content).toBe('');
    }
  });
});