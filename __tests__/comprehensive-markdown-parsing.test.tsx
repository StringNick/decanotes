import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';

// Comprehensive markdown content that includes all supported block types
const comprehensiveMarkdown = `# Main Heading (H1)

## Secondary Heading (H2)

### Tertiary Heading (H3)

#### Fourth Level Heading (H4)

##### Fifth Level Heading (H5)

###### Sixth Level Heading (H6)

This is a regular paragraph with some text content.

Another paragraph with **bold text** and *italic text*.

> This is a blockquote
> with multiple lines
> and enhanced typography

\`\`\`javascript
// This is a code block
const editor = new MarkdownEditor({
  plugins: [...builtInPlugins],
  theme: 'modern'
});
\`\`\`

\`\`\`python
# Python code block
def hello_world():
    print("Hello, World!")
\`\`\`

- Regular list item 1
- Regular list item 2
- Regular list item 3

1. Numbered list item 1
2. Numbered list item 2
3. Numbered list item 3

- [ ] Unchecked checklist item
- [x] Checked checklist item
- [ ] Another unchecked item
- [x] Another checked item

![Image with alt text](https://via.placeholder.com/400x200 "Image title")

---

> Another blockquote
> to test multiple quotes

Final paragraph to end the document.`;

describe('Comprehensive Markdown Parsing', () => {
  let capturedBlocks: EditorBlock[] = [];

  const handleContentChange = (blocks: EditorBlock[]) => {
    capturedBlocks = blocks;
    console.log('Captured blocks:', blocks.map(b => ({ type: b.type, content: b.content.substring(0, 50), meta: b.meta })));
  };

  beforeEach(() => {
    capturedBlocks = [];
  });

  it('should parse all markdown block types correctly', async () => {
    render(
      <MarkdownEditor
        initialMarkdown={comprehensiveMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    // Wait for the markdown to be parsed and blocks to be created
    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    console.log('Total blocks parsed:', capturedBlocks.length);
    
    // Test heading blocks with different levels
    const headingBlocks = capturedBlocks.filter(block => block.type === 'heading');
    expect(headingBlocks.length).toBe(6); // H1 through H6
    
    // Verify heading levels
    expect(headingBlocks[0].meta?.level).toBe(1); // H1
    expect(headingBlocks[1].meta?.level).toBe(2); // H2
    expect(headingBlocks[2].meta?.level).toBe(3); // H3
    expect(headingBlocks[3].meta?.level).toBe(4); // H4
    expect(headingBlocks[4].meta?.level).toBe(5); // H5
    expect(headingBlocks[5].meta?.level).toBe(6); // H6
    
    // Verify heading content
    expect(headingBlocks[0].content).toBe('Main Heading (H1)');
    expect(headingBlocks[1].content).toBe('Secondary Heading (H2)');
    
    // Test paragraph blocks
    const paragraphBlocks = capturedBlocks.filter(block => block.type === 'paragraph');
    expect(paragraphBlocks.length).toBeGreaterThan(0);
    
    // Test quote blocks
    const quoteBlocks = capturedBlocks.filter(block => block.type === 'quote');
    expect(quoteBlocks.length).toBeGreaterThan(0);
    
    // Test code blocks
    const codeBlocks = capturedBlocks.filter(block => block.type === 'code');
    expect(codeBlocks.length).toBe(2); // JavaScript and Python code blocks
    
    // Verify code block languages
    const jsCodeBlock = codeBlocks.find(block => block.meta?.language === 'javascript');
    const pyCodeBlock = codeBlocks.find(block => block.meta?.language === 'python');
    expect(jsCodeBlock).toBeDefined();
    expect(pyCodeBlock).toBeDefined();
    
    // Test list blocks
    const listBlocks = capturedBlocks.filter(block => block.type === 'list');
    expect(listBlocks.length).toBeGreaterThan(0);
    
    // Test checklist blocks
    const checklistBlocks = capturedBlocks.filter(block => block.type === 'checklist');
    expect(checklistBlocks.length).toBeGreaterThan(0);
    
    // Test image blocks
    const imageBlocks = capturedBlocks.filter(block => block.type === 'image');
    expect(imageBlocks.length).toBe(1);
    
    // Test divider blocks
    const dividerBlocks = capturedBlocks.filter(block => block.type === 'divider');
    expect(dividerBlocks.length).toBe(1);
  });

  it('should parse specific markdown elements correctly', async () => {
    const specificMarkdown = `# Test Heading

- [ ] Unchecked task
- [x] Checked task

\`\`\`typescript
interface Test {
  name: string;
}
\`\`\`

> Important note

![Test Image](test.jpg)`;

    render(
      <MarkdownEditor
        initialMarkdown={specificMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify specific block types and their properties
    const heading = capturedBlocks.find(block => block.type === 'heading');
    expect(heading).toBeDefined();
    expect(heading?.content).toBe('Test Heading');
    expect(heading?.meta?.level).toBe(1);

    const codeBlock = capturedBlocks.find(block => block.type === 'code');
    expect(codeBlock).toBeDefined();
    expect(codeBlock?.meta?.language).toBe('typescript');
    expect(codeBlock?.content).toContain('interface Test');

    const quote = capturedBlocks.find(block => block.type === 'quote');
    expect(quote).toBeDefined();
    expect(quote?.content).toBe('Important note');

    const image = capturedBlocks.find(block => block.type === 'image');
    expect(image).toBeDefined();
    expect(image?.content).toBe('test.jpg');
    expect(image?.meta?.alt).toBe('Test Image');
  });

  it('should handle empty and edge case markdown', async () => {
    const edgeCaseMarkdown = `

# 

\`\`\`
\`\`\`

> 

- [ ] 

`;

    render(
      <MarkdownEditor
        initialMarkdown={edgeCaseMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThanOrEqual(0);
    }, { timeout: 3000 });

    // Should handle edge cases gracefully without crashing
    console.log('Edge case blocks:', capturedBlocks.length);
  });

  it('should preserve block order from markdown', async () => {
    const orderedMarkdown = `# First

Paragraph

## Second

> Quote

### Third`;

    render(
      <MarkdownEditor
        initialMarkdown={orderedMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // Verify the order of blocks matches the markdown order
    expect(capturedBlocks[0].type).toBe('heading');
    expect(capturedBlocks[0].content).toBe('First');
    expect(capturedBlocks[0].meta?.level).toBe(1);

    expect(capturedBlocks[1].type).toBe('paragraph');
    expect(capturedBlocks[1].content).toBe('Paragraph');

    expect(capturedBlocks[2].type).toBe('heading');
    expect(capturedBlocks[2].content).toBe('Second');
    expect(capturedBlocks[2].meta?.level).toBe(2);

    expect(capturedBlocks[3].type).toBe('quote');
    expect(capturedBlocks[3].content).toBe('Quote');

    expect(capturedBlocks[4].type).toBe('heading');
    expect(capturedBlocks[4].content).toBe('Third');
    expect(capturedBlocks[4].meta?.level).toBe(3);
  });
});