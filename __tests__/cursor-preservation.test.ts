// Test cursor preservation logic for block editing
// This tests the core logic without React Native dependencies

interface CursorPosition {
  start: number;
  end: number;
}

// Helper function to calculate where cursor should be after text change
function calculatePreservedCursor(
  oldText: string,
  newText: string,
  oldCursor: CursorPosition,
  blockType: string
): CursorPosition {
  // Special handling for checklist blocks
  if (blockType === 'checklist') {
    const oldChecklistMatch = oldText.match(/^- \[([ x])\] /);
    const newChecklistMatch = newText.match(/^- \[([ x])\] /);
    
    if (oldChecklistMatch && newChecklistMatch) {
      const oldPrefix = oldChecklistMatch[0]; // "- [x] " or "- [ ] "
      const newPrefix = newChecklistMatch[0];
      const lengthDiff = newPrefix.length - oldPrefix.length;
      
      // If cursor is within checkbox syntax (positions 0-5)
      if (oldCursor.start <= oldPrefix.length) {
        // For specific positions in checkbox syntax
        if (oldCursor.start === 4 && oldPrefix === '- [x] ' && newPrefix === '- [ ] ') {
          // Deleting 'x' from position 4 -> move to position 3
          return { start: 3, end: 3 };
        }
        if (oldCursor.start === 3 && oldPrefix === '- [ ] ' && newPrefix === '- [x] ') {
          // Adding 'x' at position 3 -> move to position 4
          return { start: 4, end: 4 };
        }
        // For other positions, adjust by length difference
        return {
          start: Math.max(0, Math.min(oldCursor.start + lengthDiff, newPrefix.length)),
          end: Math.max(0, Math.min(oldCursor.end + lengthDiff, newPrefix.length))
        };
      }
      
      // If cursor is after prefix, adjust by length difference
      return {
        start: Math.min(oldCursor.start + lengthDiff, newText.length),
        end: Math.min(oldCursor.end + lengthDiff, newText.length)
      };
    }
  }

  // For other block types with syntax prefixes
  const syntaxPrefixes = {
    heading: /^#{1,6} /,
    quote: /^>+ /,
    code: /^```[^\\n]*/,
    list: /^(\s*)([-*+]|\d+\.) /
  };

  const prefixPattern = syntaxPrefixes[blockType as keyof typeof syntaxPrefixes];
  
  if (!prefixPattern) {
    // No special handling for regular paragraphs
    return oldCursor;
  }

  const oldMatch = oldText.match(prefixPattern);
  const newMatch = newText.match(prefixPattern);
  
  if (!oldMatch || !newMatch) {
    // If prefix pattern changes, keep cursor as-is
    return { 
      start: Math.min(oldCursor.start, newText.length), 
      end: Math.min(oldCursor.end, newText.length) 
    };
  }

  const oldPrefixLength = oldMatch[0].length;
  const newPrefixLength = newMatch[0].length;
  const lengthDiff = newPrefixLength - oldPrefixLength;

  // If cursor is within the prefix area, adjust by the length difference
  if (oldCursor.start <= oldPrefixLength) {
    const newStart = Math.max(0, Math.min(oldCursor.start + lengthDiff, newPrefixLength));
    const newEnd = Math.max(0, Math.min(oldCursor.end + lengthDiff, newPrefixLength));
    return { start: newStart, end: newEnd };
  }

  // If cursor is after prefix, adjust by length difference
  return {
    start: Math.min(oldCursor.start + lengthDiff, newText.length),
    end: Math.min(oldCursor.end + lengthDiff, newText.length)
  };
}

describe('Cursor Preservation Logic', () => {
  describe('Checklist blocks', () => {
    test('should preserve cursor when deleting x from checkbox', () => {
      const oldText = '- [x] Task item';
      const newText = '- [ ] Task item';
      const oldCursor = { start: 4, end: 4 }; // After 'x'
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should move cursor to position 3 (between brackets)
      expect(result).toEqual({ start: 3, end: 3 });
    });

    test('should preserve cursor when adding x to checkbox', () => {
      const oldText = '- [ ] Task item';
      const newText = '- [x] Task item';
      const oldCursor = { start: 3, end: 3 }; // Between brackets
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should move cursor to position 4 (after 'x')
      expect(result).toEqual({ start: 4, end: 4 });
    });

    test('should handle cursor after closing bracket', () => {
      const oldText = '- [x] Task item';
      const newText = '- [x] Task item';
      const oldCursor = { start: 5, end: 5 }; // After ']'
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should stay at position 5
      expect(result).toEqual({ start: 5, end: 5 });
    });

    test('should handle cursor in text portion', () => {
      const oldText = '- [x] Task item';
      const newText = '- [ ] Task item';
      const oldCursor = { start: 10, end: 10 }; // In 'Task'
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should stay at same position (both prefixes are same length: "- [x] " and "- [ ] ")
      expect(result).toEqual({ start: 10, end: 10 });
    });
  });

  describe('Heading blocks', () => {
    test('should preserve cursor when adding heading level', () => {
      const oldText = '## Title';
      const newText = '### Title';
      const oldCursor = { start: 2, end: 2 }; // After second #
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'heading');
      
      // Should move to position 3 (after third #)
      expect(result).toEqual({ start: 3, end: 3 });
    });

    test('should preserve cursor when removing heading level', () => {
      const oldText = '### Title';
      const newText = '## Title';
      const oldCursor = { start: 3, end: 3 }; // After third #
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'heading');
      
      // Should move to position 2 (after second #)
      expect(result).toEqual({ start: 2, end: 2 });
    });

    test('should handle cursor in title portion', () => {
      const oldText = '## Title';
      const newText = '### Title';
      const oldCursor = { start: 5, end: 5 }; // In 'Title'
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'heading');
      
      // Should adjust by +1 (# added)
      expect(result).toEqual({ start: 6, end: 6 });
    });
  });

  describe('Quote blocks', () => {
    test('should preserve cursor when adding quote depth', () => {
      const oldText = '>> Quote text';
      const newText = '>>> Quote text';
      const oldCursor = { start: 2, end: 2 }; // After second >
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'quote');
      
      // Should move to position 3 (after third >)
      expect(result).toEqual({ start: 3, end: 3 });
    });

    test('should preserve cursor when removing quote depth', () => {
      const oldText = '>>> Quote text';
      const newText = '>> Quote text';
      const oldCursor = { start: 3, end: 3 }; // After third >
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'quote');
      
      // Should move to position 2 (after second >)
      expect(result).toEqual({ start: 2, end: 2 });
    });
  });

  describe('List blocks', () => {
    test('should preserve cursor when changing list marker', () => {
      const oldText = '- List item';
      const newText = '1. List item';
      const oldCursor = { start: 1, end: 1 }; // After -
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'list');
      
      // Should move to position 2 (after '1.')
      expect(result).toEqual({ start: 2, end: 2 });
    });

    test('should handle nested list changes', () => {
      const oldText = '  - Nested item';
      const newText = '  1. Nested item';
      const oldCursor = { start: 3, end: 3 }; // After -
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'list');
      
      // Should move to position 4 (after '1.')
      expect(result).toEqual({ start: 4, end: 4 });
    });
  });

  describe('Edge cases', () => {
    test('should handle cursor beyond text length', () => {
      const oldText = '- [x] Short';
      const newText = '- [ ] Short';
      const oldCursor = { start: 100, end: 100 }; // Beyond text
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should clamp to text length
      expect(result).toEqual({ start: 11, end: 11 });
    });

    test('should handle empty text', () => {
      const oldText = '';
      const newText = '- [ ] New';
      const oldCursor = { start: 0, end: 0 };
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should stay at start
      expect(result).toEqual({ start: 0, end: 0 });
    });

    test('should handle non-syntax blocks', () => {
      const oldText = 'Regular text';
      const newText = 'Modified text';
      const oldCursor = { start: 5, end: 5 };
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'paragraph');
      
      // Should keep original cursor
      expect(result).toEqual({ start: 5, end: 5 });
    });

    test('should handle cursor at start of text', () => {
      const oldText = '- [x] Task';
      const newText = '- [ ] Task';
      const oldCursor = { start: 0, end: 0 }; // At start
      
      const result = calculatePreservedCursor(oldText, newText, oldCursor, 'checklist');
      
      // Should stay at start
      expect(result).toEqual({ start: 0, end: 0 });
    });
  });
}); 