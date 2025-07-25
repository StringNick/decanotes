import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';

describe('Heading Plugin Integration', () => {
  test('should create and render heading block with HeadingPlugin', async () => {
    let editorRef: any = null;
    let capturedBlocks: EditorBlock[] = [];
    
    const handleContentChange = (blocks: EditorBlock[]) => {
      capturedBlocks = blocks;
      console.log('Blocks after heading insertion:', blocks.map(b => ({ 
        type: b.type, 
        content: b.content,
        meta: b.meta 
      })));
    };
    
    const { getByTestId } = render(
      <MarkdownEditor
        ref={(ref) => { editorRef = ref; }}
        onContentChange={handleContentChange}
      />
    );
    
    // Wait for editor to initialize
    await waitFor(() => {
      expect(getByTestId('editor-core')).toBeTruthy();
    });
    
    // Insert a heading block
    if (editorRef) {
      editorRef.insertBlock('heading');
      
      // Wait for the block to be created
      await waitFor(() => {
        expect(capturedBlocks.length).toBe(1);
      });
      
      expect(capturedBlocks[0].type).toBe('heading');
      expect(capturedBlocks[0].meta?.level).toBe(1); // Default heading level
      
      // Update the heading content
      editorRef.updateBlock(capturedBlocks[0].id, { 
        content: 'Test Heading',
        meta: { level: 2 }
      });
      
      await waitFor(() => {
        const headingBlock = capturedBlocks.find(b => b.content === 'Test Heading');
        expect(headingBlock).toBeDefined();
        expect(headingBlock?.meta?.level).toBe(2);
      });
      
      console.log('Final heading block:', capturedBlocks[0]);
    }
  });
  
  test('should parse markdown heading and use HeadingPlugin', async () => {
    const headingMarkdown = '# Test Heading\n\n## Secondary Heading\n\n### Third Level';
    let capturedBlocks: EditorBlock[] = [];
    
    const handleContentChange = (blocks: EditorBlock[]) => {
      capturedBlocks = blocks;
    };
    
    const { getByTestId } = render(
      <MarkdownEditor
        initialMarkdown={headingMarkdown}
        onContentChange={handleContentChange}
      />
    );
    
    await waitFor(() => {
      expect(getByTestId('editor-core')).toBeTruthy();
    });
    
    await waitFor(() => {
      expect(capturedBlocks.length).toBe(3);
    });
    
    // Check all blocks are headings with correct levels
    expect(capturedBlocks[0].type).toBe('heading');
    expect(capturedBlocks[0].content).toBe('Test Heading');
    expect(capturedBlocks[0].meta?.level).toBe(1);
    
    expect(capturedBlocks[1].type).toBe('heading');
    expect(capturedBlocks[1].content).toBe('Secondary Heading');
    expect(capturedBlocks[1].meta?.level).toBe(2);
    
    expect(capturedBlocks[2].type).toBe('heading');
    expect(capturedBlocks[2].content).toBe('Third Level');
    expect(capturedBlocks[2].meta?.level).toBe(3);
    
    console.log('Parsed heading blocks:', capturedBlocks.map(b => ({
      type: b.type,
      content: b.content,
      level: b.meta?.level
    })));
  });
});