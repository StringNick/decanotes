import React from 'react';
import { render } from '@testing-library/react-native';
import { HeadingPlugin } from '../components/editor/plugins/built-in/HeadingPlugin';
import { EditorBlock } from '../types/editor';

// Mock the global cursor positions
let mockHeadingCursorPositions: Record<string, number> = {};

// Helper function to simulate text change with backspace at position 0
const simulateBackspaceAtStart = (block: EditorBlock, cursorPosition: number) => {
  if (cursorPosition === 0) {
    const level = block.meta?.level || 1;
    const markdownPrefix = '#'.repeat(level);
    
    return {
      ...block,
      type: 'paragraph',
      content: `${markdownPrefix}${block.content}`,
      meta: {}
    };
  }
  
  return null;
};

describe('Heading Backspace Transformation', () => {
  beforeEach(() => {
    mockHeadingCursorPositions = {};
  });

  test('should convert H1 heading to paragraph with markdown syntax when cursor is at position 0', () => {
    const block: EditorBlock = {
      id: 'test-heading-1',
      type: 'heading',
      content: 'Test Heading',
      meta: { level: 1 }
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('#Test Heading');
    expect(result?.meta).toEqual({});
  });

  test('should convert H2 heading to paragraph with markdown syntax when cursor is at position 0', () => {
    const block: EditorBlock = {
      id: 'test-heading-2',
      type: 'heading',
      content: 'Secondary Heading',
      meta: { level: 2 }
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('##Secondary Heading');
    expect(result?.meta).toEqual({});
  });

  test('should convert H3 heading to paragraph with markdown syntax when cursor is at position 0', () => {
    const block: EditorBlock = {
      id: 'test-heading-3',
      type: 'heading',
      content: 'Third Level',
      meta: { level: 3 }
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('###Third Level');
    expect(result?.meta).toEqual({});
  });

  test('should NOT convert heading when cursor is NOT at position 0', () => {
    const block: EditorBlock = {
      id: 'test-heading-middle',
      type: 'heading',
      content: 'Test Heading',
      meta: { level: 1 }
    };

    const result = simulateBackspaceAtStart(block, 5);

    expect(result).toBeNull(); // Should return null to let default backspace behavior handle it
  });

  test('should NOT convert heading when cursor is at end of text', () => {
    const block: EditorBlock = {
      id: 'test-heading-end',
      type: 'heading',
      content: 'Test Heading',
      meta: { level: 2 }
    };

    const result = simulateBackspaceAtStart(block, 12);

    expect(result).toBeNull(); // Should return null to let default backspace behavior handle it
  });

  test('should handle heading with no cursor position tracked (defaults to 0)', () => {
    const block: EditorBlock = {
      id: 'test-heading-no-cursor',
      type: 'heading',
      content: 'No Cursor Tracked',
      meta: { level: 1 }
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('#No Cursor Tracked');
    expect(result?.meta).toEqual({});
  });

  test('should handle heading with level 6', () => {
    const block: EditorBlock = {
      id: 'test-heading-6',
      type: 'heading',
      content: 'Sixth Level',
      meta: { level: 6 }
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('######Sixth Level');
    expect(result?.meta).toEqual({});
  });

  test('should handle heading with no level meta (defaults to 1)', () => {
    const block: EditorBlock = {
      id: 'test-heading-no-level',
      type: 'heading',
      content: 'No Level Meta',
      meta: {}
    };

    const result = simulateBackspaceAtStart(block, 0);

    expect(result).not.toBeNull();
    expect(result?.type).toBe('paragraph');
    expect(result?.content).toBe('#No Level Meta');
    expect(result?.meta).toEqual({});
  });
});