import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from '../components/editor/utils/MarkdownRegistry';

// Test markdown content
const testMarkdown = `# Main Heading

## Secondary Heading

### Third Level

This is a paragraph with some text.

> This is a blockquote
> with multiple lines

\`\`\`javascript
console.log('Hello World');
\`\`\`

- List item 1
- List item 2
- List item 3

1. Ordered item 1
2. Ordered item 2

- [ ] Todo item
- [x] Completed item

---

![Image](test.jpg "Test Image")`;

const simpleHeadingMarkdown = `# Heee`;

describe('Markdown Integration Tests', () => {
  describe('Initial Markdown Parsing', () => {
    test('should parse markdown into correct EditorBlocks', () => {
      const blocks = parseMarkdownToBlocks(testMarkdown);
      
      console.log('Parsed blocks:', JSON.stringify(blocks, null, 2));
      
      // Check that we have blocks
      expect(blocks.length).toBeGreaterThan(0);
      
      // Check first block is heading
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toBe('Main Heading');
      expect(blocks[0].meta?.level).toBe(1);
      
      // Check second block is heading level 2
      const secondHeading = blocks.find(b => b.content === 'Secondary Heading');
      expect(secondHeading).toBeDefined();
      expect(secondHeading?.type).toBe('heading');
      expect(secondHeading?.meta?.level).toBe(2);
      
      // Check third heading
      const thirdHeading = blocks.find(b => b.content === 'Third Level');
      expect(thirdHeading).toBeDefined();
      expect(thirdHeading?.type).toBe('heading');
      expect(thirdHeading?.meta?.level).toBe(3);
      
      // Check paragraph
      const paragraph = blocks.find(b => b.content === 'This is a paragraph with some text.');
      expect(paragraph).toBeDefined();
      expect(paragraph?.type).toBe('paragraph');
      
      // Check quote
      const quote = blocks.find(b => b.type === 'quote');
      expect(quote).toBeDefined();
      
      // Check code block
      const codeBlock = blocks.find(b => b.type === 'code');
      expect(codeBlock).toBeDefined();
      expect(codeBlock?.meta?.language).toBe('javascript');
      
      // Check list
      const listBlock = blocks.find(b => b.type === 'list');
      expect(listBlock).toBeDefined();
      
      // Log block types for debugging
      const blockTypes = blocks.map(b => ({ type: b.type, content: b.content.substring(0, 50), meta: b.meta }));
      console.log('Block types and content:', blockTypes);
    });
    
    test('should parse simple heading correctly', () => {
      const blocks = parseMarkdownToBlocks(simpleHeadingMarkdown);
      
      console.log('Simple heading blocks:', JSON.stringify(blocks, null, 2));
      
      expect(blocks.length).toBe(1);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toBe('Heee');
      expect(blocks[0].meta?.level).toBe(1);
    });
    
    test('should handle round-trip conversion', () => {
      const originalBlocks = parseMarkdownToBlocks(testMarkdown);
      const convertedMarkdown = serializeBlocksToMarkdown(originalBlocks);
      const secondBlocks = parseMarkdownToBlocks(convertedMarkdown);
      
      console.log('Original markdown length:', testMarkdown.length);
      console.log('Converted markdown length:', convertedMarkdown.length);
      console.log('Original blocks count:', originalBlocks.length);
      console.log('Second blocks count:', secondBlocks.length);
      
      // Check that block counts match
      expect(secondBlocks.length).toBe(originalBlocks.length);
      
      // Check that heading blocks are preserved
      const originalHeadings = originalBlocks.filter(b => b.type === 'heading');
      const secondHeadings = secondBlocks.filter(b => b.type === 'heading');
      
      expect(secondHeadings.length).toBe(originalHeadings.length);
      
      // Check specific heading content
      originalHeadings.forEach((heading, index) => {
        expect(secondHeadings[index].content).toBe(heading.content);
        expect(secondHeadings[index].meta?.level).toBe(heading.meta?.level);
      });
    });
  });
  
  describe('MarkdownEditor Component Integration', () => {
    test('should render MarkdownEditor with initial markdown', async () => {
      let capturedBlocks: EditorBlock[] = [];
      
      const handleContentChange = (blocks: EditorBlock[]) => {
        capturedBlocks = blocks;
        console.log('Editor blocks changed:', blocks.map(b => ({ type: b.type, content: b.content.substring(0, 30) })));
      };
      
      const { getByTestId } = render(
        <MarkdownEditor
          initialMarkdown={testMarkdown}
          onContentChange={handleContentChange}
        />
      );
      
      // Wait for the editor to initialize
      await waitFor(() => {
        expect(getByTestId('editor-core')).toBeTruthy();
      });
      
      // Wait for blocks to be processed
      await waitFor(() => {
        expect(capturedBlocks.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
      
      console.log('Final captured blocks:', capturedBlocks.map(b => ({ 
        type: b.type, 
        content: b.content.substring(0, 50),
        meta: b.meta 
      })));
      
      // Check that we have heading blocks
      const headingBlocks = capturedBlocks.filter(b => b.type === 'heading');
      expect(headingBlocks.length).toBeGreaterThan(0);
      
      // Check specific heading
      const mainHeading = headingBlocks.find(b => b.content === 'Main Heading');
      expect(mainHeading).toBeDefined();
      expect(mainHeading?.meta?.level).toBe(1);
    });
    
    test('should render simple heading block correctly', async () => {
      let capturedBlocks: EditorBlock[] = [];
      
      const handleContentChange = (blocks: EditorBlock[]) => {
        capturedBlocks = blocks;
      };
      
      const { getByTestId } = render(
        <MarkdownEditor
          initialMarkdown={simpleHeadingMarkdown}
          onContentChange={handleContentChange}
        />
      );
      
      await waitFor(() => {
        expect(getByTestId('editor-core')).toBeTruthy();
      });
      
      await waitFor(() => {
        expect(capturedBlocks.length).toBe(1);
      }, { timeout: 3000 });
      
      console.log('Simple heading captured blocks:', capturedBlocks);
      
      expect(capturedBlocks[0].type).toBe('heading');
      expect(capturedBlocks[0].content).toBe('Heee');
      expect(capturedBlocks[0].meta?.level).toBe(1);
    });
  });
  
  describe('Plugin Detection Tests', () => {
    test('should detect correct plugins for each block type', () => {
      const blocks = parseMarkdownToBlocks(testMarkdown);
      
      // Group blocks by type
      const blocksByType = blocks.reduce((acc, block) => {
        if (!acc[block.type]) {
          acc[block.type] = [];
        }
        acc[block.type].push(block);
        return acc;
      }, {} as Record<string, EditorBlock[]>);
      
      console.log('Blocks grouped by type:', Object.keys(blocksByType).map(type => ({
        type,
        count: blocksByType[type].length,
        examples: blocksByType[type].slice(0, 2).map(b => b.content.substring(0, 30))
      })));
      
      // Check that we have the expected block types
      expect(blocksByType['heading']).toBeDefined();
      expect(blocksByType['paragraph']).toBeDefined();
      expect(blocksByType['quote']).toBeDefined();
      expect(blocksByType['code']).toBeDefined();
      expect(blocksByType['list']).toBeDefined();
      
      // Check heading levels
      const headings = blocksByType['heading'];
      const levels = headings.map(h => h.meta?.level).sort();
      expect(levels).toContain(1);
      expect(levels).toContain(2);
      expect(levels).toContain(3);
    });
  });
});