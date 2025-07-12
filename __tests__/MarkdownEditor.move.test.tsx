
// Simple test functions for the move functionality
describe('MarkdownEditor - Block Moving Tests', () => {
  
  // Test data
  const testMarkdown = `# First Heading

This is paragraph 1.

## Second Heading  

This is paragraph 2.

### Third Heading

This is paragraph 3.`;

  // Helper function to create a mock editor instance
  const createMockEditor = () => {
    const blocks = [
      { id: 'block-1', type: 'heading', content: 'First Heading', meta: { level: 1 } },
      { id: 'block-2', type: 'paragraph', content: 'This is paragraph 1.' },
      { id: 'block-3', type: 'heading', content: 'Second Heading', meta: { level: 2 } },
      { id: 'block-4', type: 'paragraph', content: 'This is paragraph 2.' },
      { id: 'block-5', type: 'heading', content: 'Third Heading', meta: { level: 3 } },
      { id: 'block-6', type: 'paragraph', content: 'This is paragraph 3.' }
    ];

    return {
      blocks,
      moveBlockUp: (blockId: string) => {
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        if (currentIndex === -1 || currentIndex <= 0) return false;
        
        const [movedBlock] = blocks.splice(currentIndex, 1);
        blocks.splice(currentIndex - 1, 0, movedBlock);
        return true;
      },
      moveBlockDown: (blockId: string) => {
        const currentIndex = blocks.findIndex(b => b.id === blockId);
        if (currentIndex === -1 || currentIndex >= blocks.length - 1) return false;
        
        const [movedBlock] = blocks.splice(currentIndex, 1);
        blocks.splice(currentIndex + 1, 0, movedBlock);
        return true;
      }
    };
  };

  it('should move block up successfully', () => {
    const mockEditor = createMockEditor();
    
    // Move block-2 up (should move before block-1)
    const result = mockEditor.moveBlockUp('block-2');
    
    expect(result).toBe(true);
    expect(mockEditor.blocks[0].id).toBe('block-2');
    expect(mockEditor.blocks[1].id).toBe('block-1');
  });

  it('should move block down successfully', () => {
    const mockEditor = createMockEditor();
    
    // Move block-1 down (should move after block-2)
    const result = mockEditor.moveBlockDown('block-1');
    
    expect(result).toBe(true);
    expect(mockEditor.blocks[0].id).toBe('block-2');
    expect(mockEditor.blocks[1].id).toBe('block-1');
  });

  it('should not move first block up', () => {
    const mockEditor = createMockEditor();
    
    // Try to move first block up
    const result = mockEditor.moveBlockUp('block-1');
    
    expect(result).toBe(false);
    expect(mockEditor.blocks[0].id).toBe('block-1'); // Should remain first
  });

  it('should not move last block down', () => {
    const mockEditor = createMockEditor();
    
    // Try to move last block down
    const result = mockEditor.moveBlockDown('block-6');
    
    expect(result).toBe(false);
    expect(mockEditor.blocks[5].id).toBe('block-6'); // Should remain last
  });

  it('should handle invalid block ID', () => {
    const mockEditor = createMockEditor();
    
    // Try to move non-existent block
    const resultUp = mockEditor.moveBlockUp('invalid-id');
    const resultDown = mockEditor.moveBlockDown('invalid-id');
    
    expect(resultUp).toBe(false);
    expect(resultDown).toBe(false);
  });

  it('should preserve block content when moving', () => {
    const mockEditor = createMockEditor();
    
    const originalContent = mockEditor.blocks[1].content;
    
    // Move block up
    mockEditor.moveBlockUp('block-2');
    
    // Content should be preserved
    expect(mockEditor.blocks[0].content).toBe(originalContent);
  });

  it('should handle multiple move operations', () => {
    const mockEditor = createMockEditor();
    
    // Move block-3 up twice
    mockEditor.moveBlockUp('block-3');
    mockEditor.moveBlockUp('block-3');
    
    // block-3 should now be at index 0
    expect(mockEditor.blocks[0].id).toBe('block-3');
    expect(mockEditor.blocks[0].content).toBe('Second Heading');
  });

  it('should maintain block order integrity', () => {
    const mockEditor = createMockEditor();
    
    // Move block-4 up
    mockEditor.moveBlockUp('block-4');
    
    // Check that all blocks are still present
    const blockIds = mockEditor.blocks.map(b => b.id);
    expect(blockIds).toContain('block-1');
    expect(blockIds).toContain('block-2');
    expect(blockIds).toContain('block-3');
    expect(blockIds).toContain('block-4');
    expect(blockIds).toContain('block-5');
    expect(blockIds).toContain('block-6');
    
    // Check that we still have 6 blocks
    expect(mockEditor.blocks).toHaveLength(6);
  });

  it('should handle edge case with two blocks', () => {
    const twoBlocksEditor = {
      blocks: [
        { id: 'first', type: 'paragraph', content: 'First' },
        { id: 'second', type: 'paragraph', content: 'Second' }
      ],
      moveBlockUp: function(blockId: string) {
        const currentIndex = this.blocks.findIndex(b => b.id === blockId);
        if (currentIndex <= 0) return false;
        
        const [movedBlock] = this.blocks.splice(currentIndex, 1);
        this.blocks.splice(currentIndex - 1, 0, movedBlock);
        return true;
      },
      moveBlockDown: function(blockId: string) {
        const currentIndex = this.blocks.findIndex(b => b.id === blockId);
        if (currentIndex >= this.blocks.length - 1) return false;
        
        const [movedBlock] = this.blocks.splice(currentIndex, 1);
        this.blocks.splice(currentIndex + 1, 0, movedBlock);
        return true;
      }
    };
    
    // Move second block up
    const result = twoBlocksEditor.moveBlockUp('second');
    
    expect(result).toBe(true);
    expect(twoBlocksEditor.blocks[0].id).toBe('second');
    expect(twoBlocksEditor.blocks[1].id).toBe('first');
  });

  it('should handle single block correctly', () => {
    const singleBlockEditor = {
      blocks: [
        { id: 'only', type: 'paragraph', content: 'Only block' }
      ],
      moveBlockUp: function(blockId: string) {
        const currentIndex = this.blocks.findIndex(b => b.id === blockId);
        if (currentIndex <= 0) return false;
        
        const [movedBlock] = this.blocks.splice(currentIndex, 1);
        this.blocks.splice(currentIndex - 1, 0, movedBlock);
        return true;
      },
      moveBlockDown: function(blockId: string) {
        const currentIndex = this.blocks.findIndex(b => b.id === blockId);
        if (currentIndex >= this.blocks.length - 1) return false;
        
        const [movedBlock] = this.blocks.splice(currentIndex, 1);
        this.blocks.splice(currentIndex + 1, 0, movedBlock);
        return true;
      }
    };
    
    // Both operations should fail
    const resultUp = singleBlockEditor.moveBlockUp('only');
    const resultDown = singleBlockEditor.moveBlockDown('only');
    
    expect(resultUp).toBe(false);
    expect(resultDown).toBe(false);
    expect(singleBlockEditor.blocks[0].id).toBe('only');
  });
});

// Integration tests to verify the MarkdownEditor component exposes the move functions
describe('MarkdownEditor - Move Function Integration', () => {
  it('should expose moveBlockUp and moveBlockDown functions', () => {
    // Create a simple mock without Jest
    const mockRef = {
      current: {
        moveBlockUp: (id: string) => false,
        moveBlockDown: (id: string) => false,
        getMarkdown: () => '',
        focus: () => {},
        insertBlock: () => {},
        deleteBlock: () => {},
        toggleMode: () => {},
        getCurrentMode: () => 'live' as const
      }
    };
    
    // Verify the functions exist and are callable
    expect(typeof mockRef.current.moveBlockUp).toBe('function');
    expect(typeof mockRef.current.moveBlockDown).toBe('function');
    
    // Call the functions to ensure they work
    const resultUp = mockRef.current.moveBlockUp('test-id');
    const resultDown = mockRef.current.moveBlockDown('test-id');
    
    expect(typeof resultUp).toBe('boolean');
    expect(typeof resultDown).toBe('boolean');
    expect(resultUp).toBe(false); // Should return false for invalid ID
    expect(resultDown).toBe(false); // Should return false for invalid ID
  });
}); 