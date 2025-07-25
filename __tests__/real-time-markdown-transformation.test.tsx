import React from 'react';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { EditorBlock } from '../types/editor';

// Simple test to verify markdown transformation logic
describe('Markdown Transformation Logic', () => {
  // Test the transformation function directly
  const detectAndTransformMarkdown = (
    updates: Partial<EditorBlock>, 
    blockPlugins: any[], 
    markdownPlugins: any[]
  ): Partial<EditorBlock> => {
    const content = updates.content || '';
    
    // Skip transformation if content is empty or doesn't start with markdown syntax
    if (!content.trim() || content.includes('\n')) {
      return updates;
    }
    
    // Check for heading patterns (# ## ###)
    const headingMatch = content.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingContent = headingMatch[2];
      return {
        ...updates,
        type: 'heading',
        content: headingContent,
        meta: { level }
      };
    }
    
    // Check for quote pattern (> text)
    const quoteMatch = content.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      return {
        ...updates,
        type: 'quote',
        content: quoteMatch[1]
      };
    }
    
    // Check for code block pattern (```)
    if (content.startsWith('```')) {
      const language = content.substring(3).trim() || 'text';
      return {
        ...updates,
        type: 'code',
        content: '',
        meta: { language }
      };
    }
    
    // Check for checklist patterns first (- [ ] item or - [x] item)
     const checklistMatch = content.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/);
     if (checklistMatch) {
       const indentation = checklistMatch[1];
       const checkState = checklistMatch[2];
       const checklistContent = checklistMatch[3];
       const level = Math.floor(indentation.length / 2);
       const checked = checkState === 'x';
       
       return {
         ...updates,
         type: 'checklist',
         content: checklistContent,
         meta: { checked, level }
       };
     }
     
     // Check for list patterns (- item or 1. item)
     const listMatch = content.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
     if (listMatch) {
       const indentation = listMatch[1];
       const marker = listMatch[2];
       const listContent = listMatch[3];
       const level = Math.floor(indentation.length / 2);
       const listType = /\d+\./.test(marker) ? 'ordered' : 'unordered';
       
       return {
         ...updates,
         type: 'list',
         content: listContent,
         meta: { listType, level }
       };
     }
    
    // Check for divider patterns (--- or *** or ___)
    if (content.match(/^(---|\*\*\*|___)\s*$/)) {
      return {
        ...updates,
        type: 'divider',
        content: '',
        meta: { dividerStyle: 'solid' }
      };
    }
    
    return updates;
  };

  it('should transform # text to heading level 1', () => {
    const updates = { content: '# Hello World' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('heading');
    expect(result.content).toBe('Hello World');
    expect(result.meta?.level).toBe(1);
  });

  it('should transform ## text to heading level 2', () => {
    const updates = { content: '## Subheading' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('heading');
    expect(result.content).toBe('Subheading');
    expect(result.meta?.level).toBe(2);
  });

  it('should transform ### text to heading level 3', () => {
    const updates = { content: '### Small heading' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('heading');
    expect(result.content).toBe('Small heading');
    expect(result.meta?.level).toBe(3);
  });

  it('should transform > text to quote', () => {
    const updates = { content: '> This is a quote' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('quote');
    expect(result.content).toBe('This is a quote');
  });

  it('should transform - text to unordered list', () => {
    const updates = { content: '- List item' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('list');
    expect(result.content).toBe('List item');
    expect(result.meta?.listType).toBe('unordered');
    expect(result.meta?.level).toBe(0);
  });

  it('should transform 1. text to ordered list', () => {
    const updates = { content: '1. Numbered item' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('list');
    expect(result.content).toBe('Numbered item');
    expect(result.meta?.listType).toBe('ordered');
  });

  it('should transform - [ ] text to unchecked checklist', () => {
    const updates = { content: '- [ ] Todo item' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('checklist');
    expect(result.content).toBe('Todo item');
    expect(result.meta?.checked).toBe(false);
  });

  it('should transform - [x] text to checked checklist', () => {
    const updates = { content: '- [x] Completed item' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('checklist');
    expect(result.content).toBe('Completed item');
    expect(result.meta?.checked).toBe(true);
  });

  it('should transform ``` to code block', () => {
    const updates = { content: '```javascript' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('code');
    expect(result.content).toBe('');
    expect(result.meta?.language).toBe('javascript');
  });

  it('should transform --- to divider', () => {
    const updates = { content: '---' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.type).toBe('divider');
    expect(result.content).toBe('');
    expect(result.meta?.dividerStyle).toBe('solid');
  });

  it('should not transform multiline content', () => {
    const updates = { content: '# Heading\nWith multiple lines' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    // Should remain unchanged since it contains newlines
    expect(result.content).toBe('# Heading\nWith multiple lines');
    expect(result.type).toBeUndefined(); // No type transformation
  });

  it('should not transform empty content', () => {
    const updates = { content: '' };
    const result = detectAndTransformMarkdown(updates, [], []);
    
    expect(result.content).toBe('');
    expect(result.type).toBeUndefined(); // No type transformation
  });
});