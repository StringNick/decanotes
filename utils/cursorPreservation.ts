interface CursorPosition {
  start: number;
  end: number;
}

// Helper function to calculate where cursor should be after text change
export function calculatePreservedCursor(
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