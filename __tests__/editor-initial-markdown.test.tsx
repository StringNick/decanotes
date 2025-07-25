import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';

// Test the initial markdown from editor.tsx
const editorInitialMarkdown = `# New Markdown Editor - Enhanced Features

## Welcome to the Enhanced Editor

This is the new markdown editor with advanced plugin support and enhanced features.

## Key Features

### Plugin System
- Extensible plugin architecture
- Built-in plugins for all common block types
- Custom plugin support

### Enhanced Blocks

#### Text Formatting
**Bold text** and _italic text_ with enhanced rendering.

#### Code Blocks
\`\`\`javascript
// Enhanced code block with better syntax highlighting
const editor = new MarkdownEditor({
  plugins: [...builtInPlugins, ...customPlugins],
  theme: 'modern',
  features: {
    dragAndDrop: true,
    toolbar: true,
    shortcuts: true
  }
});
\`\`\`

#### Interactive Elements

- [ ] Enhanced checklist items
- [x] With better interaction
- [ ] And improved styling

> Enhanced blockquotes with better typography
> and improved visual hierarchy

#### Media Support

![Enhanced Image Support](https://via.placeholder.com/400x200 "Enhanced image handling")

---

## Advanced Features

### Drag and Drop
Blocks can be reordered by dragging and dropping.

### Keyboard Shortcuts
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + K**: Code
- **Ctrl/Cmd + Shift + L**: List

### Real-time Collaboration
Support for real-time collaborative editing (when enabled).

### Export Options
Multiple export formats including:
- Markdown
- HTML
- JSON

---

## Getting Started

1. Start typing to create content
2. Use markdown syntax for formatting
3. Try the toolbar for quick actions
4. Experiment with drag and drop

Enjoy the enhanced editing experience!`;

describe('Editor Initial Markdown', () => {
  let capturedBlocks: EditorBlock[] = [];

  const handleContentChange = (blocks: EditorBlock[]) => {
    capturedBlocks = blocks;
  };

  beforeEach(() => {
    capturedBlocks = [];
  });

  it('should parse the editor.tsx initial markdown correctly', async () => {
    render(
      <MarkdownEditor
        initialMarkdown={editorInitialMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    // Wait for the markdown to be parsed and blocks to be created
    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    console.log('Total blocks parsed from editor.tsx markdown:', capturedBlocks.length);
    console.log('Block types:', capturedBlocks.map(b => b.type));
    
    // Verify we have the expected block types
    const blockTypes = capturedBlocks.map(b => b.type);
    
    // Should have headings
    expect(blockTypes.filter(type => type === 'heading').length).toBeGreaterThan(0);
    
    // Should have paragraphs
    expect(blockTypes.filter(type => type === 'paragraph').length).toBeGreaterThan(0);
    
    // Should have code blocks
    expect(blockTypes.filter(type => type === 'code').length).toBeGreaterThan(0);
    
    // Should have checklist items
    expect(blockTypes.filter(type => type === 'checklist').length).toBeGreaterThan(0);
    
    // Should have quotes
    expect(blockTypes.filter(type => type === 'quote').length).toBeGreaterThan(0);
    
    // Should have images
    expect(blockTypes.filter(type => type === 'image').length).toBeGreaterThan(0);
    
    // Should have dividers
    expect(blockTypes.filter(type => type === 'divider').length).toBeGreaterThan(0);
    
    // Should have lists
    expect(blockTypes.filter(type => type === 'list').length).toBeGreaterThan(0);
    
    // Verify specific content
    const mainHeading = capturedBlocks.find(b => b.type === 'heading' && b.content === 'New Markdown Editor - Enhanced Features');
    expect(mainHeading).toBeDefined();
    expect(mainHeading?.meta?.level).toBe(1);
    
    // Verify checklist items
    const checklistItems = capturedBlocks.filter(b => b.type === 'checklist');
    expect(checklistItems.length).toBe(3);
    
    // Check that one item is checked and two are unchecked
    const checkedItems = checklistItems.filter(item => item.meta?.checked === true);
    const uncheckedItems = checklistItems.filter(item => item.meta?.checked === false);
    expect(checkedItems.length).toBe(1);
    expect(uncheckedItems.length).toBe(2);
    
    // Verify code block
    const codeBlocks = capturedBlocks.filter(b => b.type === 'code');
    expect(codeBlocks.length).toBe(1);
    expect(codeBlocks[0].meta?.language).toBe('javascript');
    expect(codeBlocks[0].content).toContain('const editor = new MarkdownEditor');
    
    // Verify image
    const imageBlocks = capturedBlocks.filter(b => b.type === 'image');
    expect(imageBlocks.length).toBe(1);
    expect(imageBlocks[0].meta?.alt).toBe('Enhanced Image Support');
    expect(imageBlocks[0].content).toBe('https://via.placeholder.com/400x200 "Enhanced image handling"');
  });

  it('should handle round-trip conversion correctly', async () => {
    render(
      <MarkdownEditor
        initialMarkdown={editorInitialMarkdown}
        onContentChange={handleContentChange}
        placeholder="Test editor"
      />
    );

    await waitFor(() => {
      expect(capturedBlocks.length).toBeGreaterThan(0);
    }, { timeout: 3000 });

    // The blocks should be parsed correctly and contain all the expected content
    expect(capturedBlocks.length).toBeGreaterThan(20); // Should have many blocks from the complex markdown
    
    // Verify that we can find key content pieces
    const allContent = capturedBlocks.map(b => b.content).join(' ');
    expect(allContent).toContain('Enhanced Features');
    expect(allContent).toContain('Plugin System');
    expect(allContent).toContain('Enhanced checklist items');
    expect(allContent).toContain('Enhanced blockquotes');
  });
});