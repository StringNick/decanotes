# Heading Backspace Transformation Demo

The editor now supports **smart heading backspace transformation**! When you press backspace at the beginning of a heading (cursor at position 0), it automatically converts the heading back to a paragraph with the markdown syntax visible.

## How It Works

### Cursor Position Detection
- The `HeadingComponent` tracks cursor position using `onSelectionChange`
- Cursor positions are stored globally for each heading block
- Only when cursor is at position 0 does the transformation occur

### Transformation Behavior

#### When Cursor is at Position 0 (Beginning)
- **H1 Heading** → `#Heading Text` (paragraph)
- **H2 Heading** → `##Heading Text` (paragraph)
- **H3 Heading** → `###Heading Text` (paragraph)  
- **H4 Heading** → `####Heading Text` (paragraph)
- **H5 Heading** → `#####Heading Text` (paragraph)
- **H6 Heading** → `######Heading Text` (paragraph)

#### When Cursor is NOT at Position 0
- Normal backspace behavior (deletes character)
- Heading remains as heading
- No transformation occurs

## Example Scenarios

### Scenario 1: Convert H2 to Paragraph
1. You have an H2 heading: **"Welcome to the Editor"**
2. Place cursor at the very beginning (before "W")
3. Press backspace
4. Result: Paragraph with content `##Welcome to the Editor`

### Scenario 2: Normal Backspace
1. You have an H1 heading: **"My Title"**
2. Place cursor in the middle (after "My ")
3. Press backspace
4. Result: H1 heading with content **"MyTitle"** (space deleted)

### Scenario 3: Convert H3 to Paragraph
1. You have an H3 heading: **"Section Header"**
2. Place cursor at position 0 (very beginning)
3. Press backspace
4. Result: Paragraph with content `###Section Header`

## Technical Implementation

The feature is implemented in `HeadingPlugin.tsx` with the following key components:

### 1. Cursor Position Tracking

```typescript
const [cursorPosition, setCursorPosition] = useState(0);

const handleSelectionChange = (event: any) => {
  const { selection } = event.nativeEvent;
  const position = selection.start;
  setCursorPosition(position);
  // Store cursor position globally for reference
  headingCursorPositions[block.id] = position;
};
```

### 2. Text Change Handler (React Native Approach)

Since React Native TextInput doesn't fire backspace events like web browsers, we detect deletion at the beginning through the `onChangeText` handler:

```typescript
const handleTextChange = (text: string) => {
  // Check if this is a backspace at position 0 (content deletion at start)
  if (text.length < block.content.length && cursorPosition === 0) {
    // Convert heading back to paragraph with markdown syntax
    const level = block.meta?.level || 1;
    const markdownPrefix = '#'.repeat(level);
    
    onBlockChange({ 
      type: 'paragraph',
      content: `${markdownPrefix}${block.content}`,
      meta: {}
    });
    return;
  }
  
  onBlockChange({ content: text });
};
```

### 3. React Native Compatibility

Unlike web browsers, React Native doesn't provide direct access to backspace key events. Instead, we:
- Track cursor position via `onSelectionChange`
- Detect content deletion in `onChangeText`
- Check if deletion occurred at position 0
- Transform the block type accordingly

## Benefits

1. **Intuitive UX**: Matches behavior of popular editors like Notion, Obsidian
2. **Non-destructive**: Content is preserved with markdown syntax
3. **Precise Control**: Only triggers when cursor is at exact beginning
4. **Reversible**: You can type the markdown syntax again to convert back
5. **Consistent**: Works for all heading levels (H1-H6)

## Try It Out!

1. Create a heading using `# Your heading text`
2. Place your cursor at the very beginning of the heading text
3. Press backspace
4. Watch it convert back to a paragraph with `#Your heading text`
5. You can then add a space after the `#` to convert it back to a heading, or edit the text as needed!

This feature makes the editor feel more natural and provides a smooth editing experience!