# Real-time Markdown Transformation Demo

The editor now supports real-time markdown transformation! When you type markdown syntax, it automatically converts to the appropriate block type.

## Supported Transformations

### Headings
- Type `# Heading` → Converts to H1 heading
- Type `## Heading` → Converts to H2 heading  
- Type `### Heading` → Converts to H3 heading
- And so on up to H6 (`######`)

### Quotes
- Type `> Quote text` → Converts to quote block

### Lists
- Type `- List item` → Converts to unordered list
- Type `* List item` → Converts to unordered list
- Type `+ List item` → Converts to unordered list
- Type `1. List item` → Converts to ordered list

### Checklists
- Type `- [ ] Todo item` → Converts to unchecked checklist
- Type `- [x] Done item` → Converts to checked checklist

### Code Blocks
- Type ``` → Converts to code block (plain text)
- Type ```javascript → Converts to JavaScript code block
- Type ```python → Converts to Python code block

### Dividers
- Type `---` → Converts to horizontal divider
- Type `***` → Converts to horizontal divider
- Type `___` → Converts to horizontal divider

## How It Works

The transformation happens in real-time as you type. The system:

1. **Detects markdown patterns** when content changes
2. **Parses the syntax** to extract the content and metadata
3. **Transforms the block type** automatically
4. **Preserves the content** while applying the appropriate formatting

## Technical Implementation

The real-time transformation is implemented in `EditorCore.tsx` with the `detectAndTransformMarkdown` function that:

- Checks for various markdown patterns using regex
- Prioritizes more specific patterns (e.g., checklists before lists)
- Only transforms single-line content (multiline content is preserved as-is)
- Supports plugin-based parsing for custom block types

## Try It Out!

Open the editor and try typing any of the markdown syntax above. You'll see the block type change automatically as you type!