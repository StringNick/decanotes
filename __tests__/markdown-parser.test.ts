// Test suite for markdown parser core functionality
// This tests the core parsing logic separately from React Native components

import { Block } from '../components/MarkdownEditor';

// Mock the generateId function for consistent testing
const generateId = (): string => {
  return `test-${Math.random().toString(36).substr(2, 9)}`;
};

// Extract core functions for testing (we'll import these from the component)
// For now, let's copy the functions to test them independently

const parseMarkdownToBlocks = (markdown: string): Block[] => {
  if (!markdown.trim()) {
    return [{ id: generateId(), type: 'paragraph', content: '' }];
  }

  const blocks: Block[] = [];
  const lines = markdown.split('\n');
  let currentBlock: Block | null = null;
  let codeBlockContent: string[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmedLine = line.trim();
    
    // Skip empty lines unless we're in a code block
    if (!trimmedLine && !inCodeBlock) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // Handle code blocks
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        if (currentBlock) {
          currentBlock.content = codeBlockContent.join('\n');
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLanguage = trimmedLine.substring(3).trim();
        currentBlock = {
          id: generateId(),
          type: 'code',
          content: '',
          meta: { language: codeBlockLanguage || 'plaintext' }
        };
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Handle headings (must be at the start of a line)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'heading',
        content: headingMatch[2].trim(),
        meta: { level: Math.min(headingMatch[1].length, 6) }
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    // Handle quotes (can be nested) - require space after > markers
    const quoteMatch = trimmedLine.match(/^(>+)\s+(.*)$/);
    if (quoteMatch) {
      const [, markers, content] = quoteMatch;
      const quoteDepth = markers.length - 1; // 0 for >, 1 for >>, etc.
      
      // Always create a new quote block for each quote line
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'quote',
        content: content,
        meta: { depth: quoteDepth }
      };
      continue;
    }

    // Handle empty quote lines (just > markers)
    const emptyQuoteMatch = trimmedLine.match(/^(>+)\s*$/);
    if (emptyQuoteMatch) {
      const [, markers] = emptyQuoteMatch;
      const quoteDepth = markers.length - 1;
      
      // Always create a new quote block for each quote line
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'quote',
        content: '',
        meta: { depth: quoteDepth }
      };
      continue;
    }

    // Handle dividers
    if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'divider',
        content: ''
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    // Handle images
    const imageMatch = trimmedLine.match(/^!\[([^\]]*)\]\(([^)]+?)(?:\s+"([^"]*)")?\)$/);
    if (imageMatch) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'image',
        content: imageMatch[1], // alt text
        meta: { 
          url: imageMatch[2], 
          alt: imageMatch[1],
          title: imageMatch[3] || ''
        }
      };
      blocks.push(currentBlock);
      currentBlock = null;
      continue;
    }

    // Handle checklists (must come before lists)
    const checklistMatch = trimmedLine.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checklistMatch) {
      const [, checked, content] = checklistMatch;
      if (!currentBlock || currentBlock.type !== 'checklist' || 
          (currentBlock.meta?.checked !== (checked.toLowerCase() === 'x'))) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'checklist',
          content: content,
          meta: { checked: checked.toLowerCase() === 'x' }
        };
      } else {
        // Continue existing checklist with same checked state
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // Handle lists (can be nested)
    const listMatch = trimmedLine.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const [, indent, marker, content] = listMatch;
      const isOrdered = /\d+\./.test(marker);
      const depth = Math.floor(indent.length / 2); // 2 spaces per level
      
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'list',
          content: content,
          meta: { 
            ordered: isOrdered,
            depth: depth
          }
        };
      } else {
        // Continue existing list
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // Handle regular text
    if (!currentBlock) {
      currentBlock = {
        id: generateId(),
        type: 'paragraph',
        content: line
      };
    } else if (currentBlock.type === 'paragraph') {
      currentBlock.content += '\n' + line;
    } else {
      // Different block type, start a new paragraph
      blocks.push(currentBlock);
      currentBlock = {
        id: generateId(),
        type: 'paragraph',
        content: line
      };
    }
  }

  // Add the last block if it exists
  if (currentBlock) {
    blocks.push(currentBlock);
  }

  return blocks.length > 0 ? blocks : [{ id: generateId(), type: 'paragraph', content: '' }];
};

const blocksToMarkdown = (blocks: Block[]): string => {
  const result: string[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const nextBlock = blocks[i + 1];
    
    let blockMarkdown = '';
    
    switch (block.type) {
      case 'heading':
        blockMarkdown = `${'#'.repeat(block.meta?.level || 1)} ${block.content}`;
        break;
      case 'code':
        blockMarkdown = `\`\`\`${block.meta?.language || ''}\n${block.content}\n\`\`\``;
        break;
      case 'quote':
        const quoteDepth = block.meta?.depth || 0;
        const quotePrefix = '>'.repeat(quoteDepth + 1);
        if (block.content.trim()) {
          blockMarkdown = block.content
            .split('\n')
            .map(line => `${quotePrefix} ${line}`)
            .join('\n');
        } else {
          blockMarkdown = `${quotePrefix} `;
        }
        break;
      case 'list':
        const items = block.content.split('\n');
        const depth = block.meta?.depth || 0;
        const indent = '  '.repeat(depth);
        
        if (block.meta?.ordered) {
          blockMarkdown = items.map((item, index) => 
            `${indent}${index + 1}. ${item}`
          ).join('\n');
        } else {
          blockMarkdown = items.map(item => 
            `${indent}- ${item}`
          ).join('\n');
        }
        break;
      case 'checklist':
        const checked = block.meta?.checked ? 'x' : ' ';
        const checkDepth = block.meta?.depth || 0;
        const checkIndent = '  '.repeat(checkDepth);
        const checkItems = block.content.split('\n');
        blockMarkdown = checkItems.map(item => 
          `${checkIndent}- [${checked}] ${item}`
        ).join('\n');
        break;
      case 'divider':
        blockMarkdown = '---';
        break;
      case 'image':
        const title = block.meta?.title ? ` "${block.meta.title}"` : '';
        blockMarkdown = `![${block.content}](${block.meta?.url || ''}${title})`;
        break;
      default:
        blockMarkdown = block.content;
    }
    
    result.push(blockMarkdown);
    
    // Add appropriate spacing between blocks
    if (nextBlock) {
      // Add double newline between different block types (this is the standard)
      result.push('\n\n');
    }
  }
  
  return result.join('');
};

describe('Markdown Parser Core Functions', () => {
  describe('parseMarkdownToBlocks', () => {
    test('should parse empty markdown', () => {
      const result = parseMarkdownToBlocks('');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('paragraph');
      expect(result[0].content).toBe('');
    });

    test('should parse single paragraph', () => {
      const result = parseMarkdownToBlocks('Hello world');
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('paragraph');
      expect(result[0].content).toBe('Hello world');
    });

    test('should parse multiple paragraphs', () => {
      const markdown = 'First paragraph\n\nSecond paragraph';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('paragraph');
      expect(result[0].content).toBe('First paragraph');
      expect(result[1].type).toBe('paragraph');
      expect(result[1].content).toBe('Second paragraph');
    });

    test('should parse headings', () => {
      const markdown = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(6);
      
      for (let i = 0; i < 6; i++) {
        expect(result[i].type).toBe('heading');
        expect(result[i].meta?.level).toBe(i + 1);
        expect(result[i].content).toBe(`H${i + 1}`);
      }
    });

    test('should parse code blocks', () => {
      const markdown = '```javascript\nconsole.log("hello");\n```';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('code');
      expect(result[0].content).toBe('console.log("hello");');
      expect(result[0].meta?.language).toBe('javascript');
    });

    test('should parse code blocks without language', () => {
      const markdown = '```\nsome code\n```';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('code');
      expect(result[0].content).toBe('some code');
      expect(result[0].meta?.language).toBe('plaintext');
    });

    test('should parse quotes', () => {
      const markdown = '> First quote\n> Second quote';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('quote');
      expect(result[0].content).toBe('First quote');
      expect(result[0].meta?.depth).toBe(0);
      expect(result[1].type).toBe('quote');
      expect(result[1].content).toBe('Second quote');
      expect(result[1].meta?.depth).toBe(0);
    });

    test('should parse nested quotes', () => {
      const markdown = '> First level\n>> Second level\n>>> Third level';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(3);
      expect(result[0].meta?.depth).toBe(0);
      expect(result[1].meta?.depth).toBe(1);
      expect(result[2].meta?.depth).toBe(2);
    });

    test('should parse unordered lists', () => {
      const markdown = '- Item 1\n- Item 2\n- Item 3';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('list');
      expect(result[0].content).toBe('Item 1\nItem 2\nItem 3');
      expect(result[0].meta?.ordered).toBe(false);
    });

    test('should parse ordered lists', () => {
      const markdown = '1. Item 1\n2. Item 2\n3. Item 3';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('list');
      expect(result[0].content).toBe('Item 1\nItem 2\nItem 3');
      expect(result[0].meta?.ordered).toBe(true);
    });

    test('should parse checklists', () => {
      const markdown = '- [ ] Unchecked item\n- [x] Checked item';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('checklist');
      expect(result[0].content).toBe('Unchecked item');
      expect(result[0].meta?.checked).toBe(false);
      expect(result[1].type).toBe('checklist');
      expect(result[1].content).toBe('Checked item');
      expect(result[1].meta?.checked).toBe(true);
    });

    test('should parse dividers', () => {
      const markdown = '---';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('divider');
      expect(result[0].content).toBe('');
    });

    test('should parse images', () => {
      const markdown = '![Alt text](image.jpg "Title")';
      const result = parseMarkdownToBlocks(markdown);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('image');
      expect(result[0].content).toBe('Alt text');
      expect(result[0].meta?.url).toBe('image.jpg');
      expect(result[0].meta?.title).toBe('Title');
    });

    test('should handle complex mixed content', () => {
      const markdown = `# Title

This is a paragraph.

## Subtitle

> This is a quote
> 
>> Nested quote

\`\`\`javascript
console.log('code');
\`\`\`

- List item 1
- List item 2

1. Ordered item 1
2. Ordered item 2

- [ ] Todo item
- [x] Done item

---

![Image](test.jpg)`;

      const result = parseMarkdownToBlocks(markdown);
      expect(result.length).toBeGreaterThan(5);
      
      // Check that we have various block types
      const types = result.map(block => block.type);
      expect(types).toContain('heading');
      expect(types).toContain('paragraph');
      expect(types).toContain('quote');
      expect(types).toContain('code');
      expect(types).toContain('list');
      expect(types).toContain('checklist');
      expect(types).toContain('divider');
      expect(types).toContain('image');
    });
  });

  describe('blocksToMarkdown', () => {
    test('should convert simple paragraph', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'paragraph', content: 'Hello world' }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('Hello world');
    });

    test('should convert heading', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'heading', content: 'Title', meta: { level: 2 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('## Title');
    });

    test('should convert code block', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'code', content: 'console.log("hello");', meta: { language: 'javascript' } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('```javascript\nconsole.log("hello");\n```');
    });

    test('should convert quote', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'quote', content: 'This is a quote', meta: { depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('> This is a quote');
    });

    test('should convert nested quote', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'quote', content: 'Nested quote', meta: { depth: 1 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('>> Nested quote');
    });

    test('should convert unordered list', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'list', content: 'Item 1\nItem 2', meta: { ordered: false, depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('- Item 1\n- Item 2');
    });

    test('should convert ordered list', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'list', content: 'Item 1\nItem 2', meta: { ordered: true, depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('1. Item 1\n2. Item 2');
    });

    test('should convert checklist', () => {
      const blocks: Block[] = [
        { id: 'test', type: 'checklist', content: 'Todo item', meta: { checked: false, depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('- [ ] Todo item');
    });

    test('should convert multiple blocks with proper spacing', () => {
      const blocks: Block[] = [
        { id: '1', type: 'heading', content: 'Title', meta: { level: 1 } },
        { id: '2', type: 'paragraph', content: 'Paragraph text' },
        { id: '3', type: 'list', content: 'Item 1\nItem 2', meta: { ordered: false, depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('# Title\n\nParagraph text\n\n- Item 1\n- Item 2');
    });

    test('should handle consecutive quotes with double newlines', () => {
      const blocks: Block[] = [
        { id: '1', type: 'quote', content: 'First quote', meta: { depth: 0 } },
        { id: '2', type: 'quote', content: 'Second quote', meta: { depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('> First quote\n\n> Second quote');
    });

    test('should handle consecutive list items with double newlines', () => {
      const blocks: Block[] = [
        { id: '1', type: 'list', content: 'Item 1', meta: { ordered: false, depth: 0 } },
        { id: '2', type: 'list', content: 'Item 2', meta: { ordered: false, depth: 0 } }
      ];
      const result = blocksToMarkdown(blocks);
      expect(result).toBe('- Item 1\n\n- Item 2');
    });
  });

  describe('Round-trip conversion', () => {
    test('should preserve content through parse and convert cycles', () => {
      const originalMarkdown = `# Title

This is a paragraph with some text.

## Subtitle

> This is a quote
> Another quote line

\`\`\`javascript
console.log('hello');
\`\`\`

- List item 1
- List item 2

1. Ordered item 1
2. Ordered item 2

- [ ] Todo item
- [x] Done item

---

![Image](test.jpg "Title")`;

      const blocks = parseMarkdownToBlocks(originalMarkdown);
      const convertedMarkdown = blocksToMarkdown(blocks);
      
      // Parse again to ensure consistency
      const secondBlocks = parseMarkdownToBlocks(convertedMarkdown);
      const secondConvertedMarkdown = blocksToMarkdown(secondBlocks);
      
      expect(convertedMarkdown).toBe(secondConvertedMarkdown);
    });

    test('should handle edge cases in round-trip conversion', () => {
      const testCases = [
        '',
        'Simple text',
        '# Heading only',
        '> Quote only',
        '```\ncode\n```',
        '- Single list item',
        '1. Single ordered item',
        '- [ ] Single todo',
        '---',
        '![](image.jpg)'
      ];

      testCases.forEach(markdown => {
        const blocks = parseMarkdownToBlocks(markdown);
        const converted = blocksToMarkdown(blocks);
        const secondBlocks = parseMarkdownToBlocks(converted);
        const secondConverted = blocksToMarkdown(secondBlocks);
        
        expect(converted).toBe(secondConverted);
      });
    });
  });

  describe('Error handling and edge cases', () => {
    test('should handle malformed markdown gracefully', () => {
      const testCases = [
        '####### Too many hashes',
        '> Quote without space',
        '```unclosed code block',
        '- [ ] [ ] Double brackets',
        '![]()',
        '1. 2. 3. Multiple numbers'
      ];

      testCases.forEach(markdown => {
        expect(() => parseMarkdownToBlocks(markdown)).not.toThrow();
        const blocks = parseMarkdownToBlocks(markdown);
        expect(blocks).toHaveLength(1); // Should create at least one block
      });
    });

    test('should handle empty content in blocks', () => {
      const blocks: Block[] = [
        { id: '1', type: 'paragraph', content: '' },
        { id: '2', type: 'heading', content: '', meta: { level: 1 } },
        { id: '3', type: 'quote', content: '', meta: { depth: 0 } }
      ];
      
      expect(() => blocksToMarkdown(blocks)).not.toThrow();
      const result = blocksToMarkdown(blocks);
      expect(typeof result).toBe('string');
    });

    test('should handle missing meta information', () => {
      const blocks: Block[] = [
        { id: '1', type: 'heading', content: 'Title' }, // Missing meta
        { id: '2', type: 'code', content: 'code' }, // Missing meta
        { id: '3', type: 'list', content: 'Item' } // Missing meta
      ];
      
      expect(() => blocksToMarkdown(blocks)).not.toThrow();
      const result = blocksToMarkdown(blocks);
      expect(result).toContain('# Title'); // Should default to level 1
      expect(result).toContain('```'); // Should work without language
    });
  });
}); 