// app/(tabs)/index.tsx
import React, { useCallback, useRef, useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, View } from 'react-native';
import MarkdownEditor from '../../components/MarkdownEditor';
import { Block, EditorMode, MarkdownEditorRef } from '../../types/editor';

export default function EditorScreen() {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentMode, setCurrentMode] = useState<EditorMode>('edit');

  // Example initial markdown content
  const initialMarkdown = `# Markdown Editor - All Components

## Headers

# Heading 1
## Heading 2  
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6

## Text Emphasis

**Bold text with asterisks**
__Bold text with underscores__

*Italic text with asterisks*
_Italic text with underscores_

_Italic text with **bold word** inside_
**Bold text with _italic word_ inside**

## Inline Code

Here's some \`inline code\` in a sentence.
Use \`console.log()\` for debugging.

## Code Blocks

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return \`Welcome to the markdown editor!\`;
}

greet('Developer');
\`\`\`

\`\`\`python
def calculate_sum(a, b):
    """Calculate the sum of two numbers."""
    return a + b

result = calculate_sum(5, 3)
print(f"Result: {result}")
\`\`\`

\`\`\`
Plain code block without language
No syntax highlighting
\`\`\`

## Lists

### Unordered Lists

- First item
- Second item  
- Third item with nested:
  - Nested item 1
  - Nested item 2
    - Double nested item
    - Another double nested

### Ordered Lists

1. First numbered item
2. Second numbered item
3. Third item with nested:
   1. Nested numbered 1
   2. Nested numbered 2
      1. Double nested numbered
      2. Another double nested

## Checklists

- [ ] Unchecked task
- [x] Completed task
- [ ] Another pending task
- [x] Another completed task
  - [ ] Nested unchecked
  - [x] Nested checked

## Blockquotes

> This is a simple blockquote.

> This is a longer blockquote that spans multiple lines.
> It demonstrates how blockquotes work in markdown.

> Level 1 quote
>> Level 2 nested quote
>>> Level 3 deeply nested quote

> Another quote after nested ones

## Dividers

Above this line is content.

---

Below this line is more content.

***

Alternative divider style.

___

Yet another divider style.

## Images

![Sample Image](https://via.placeholder.com/300x200 "This is a sample image")

![Another Image](/path/to/image.jpg "Another sample")

## Mixed Content Example

Here's a paragraph with **bold text**, _italic text_, and \`inline code\`.

> Quote with **bold** and _italic_ text
>> Nested quote with \`code\` inside

1. Ordered list with **formatting**
2. Item with _italic text_
3. Item with \`inline code\`

- [ ] Checklist with **bold** text
- [x] Completed item with _italic_ text

\`\`\`markdown
# This is a code block showing markdown syntax
**Bold** and _italic_ text
- List item
> Blockquote
\`\`\`

## Testing Nested Formatting

_This entire sentence is italic with **this part bold** and back to italic._

**This entire sentence is bold with _this part italic_ and back to bold.**

Mix of \`code\`, **bold**, and _italic_ in one sentence.

---

## Live Editor Features

- Type \`#\` followed by space for headings
- Type \`\`\`\` for code blocks  
- Type \`>\` for blockquotes
- Type \`-\` for lists
- Type \`- [ ]\` for checklists
- Type \`---\` for dividers
- Use \`**text**\` for bold
- Use \`_text_\` for italic
- Use \`\`text\`\` for inline code

Ready to test all markdown features!
`;

  // Get the current markdown content
  const handleGetMarkdown = useCallback(() => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      // console.log('Currentxmarkdown:', markdown);
      // Alert.alert('Markdown Content', `${markdown.slice(0, 200)}...`);
    }
  }, []);

  // Focus the editor
  const handleFocusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  // Toggle editor mode
  const handleToggleMode = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.toggleMode();
      const newMode = editorRef.current.getCurrentMode();
      setCurrentMode(newMode);
    }
  }, []);

  // Add a new heading block
  const handleAddHeading = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('heading');
    }
  }, []);

  // Add a new code block
  const handleAddCodeBlock = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('code');
    }
  }, []);

  // Add a new quote block
  const handleAddQuote = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('quote');
    }
  }, []);

  // Add a new list block
  const handleAddList = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('list');
    }
  }, []);

  // Add a new checklist block
  const handleAddChecklist = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('checklist');
    }
  }, []);

  // Add a new divider block
  const handleAddDivider = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('divider');
    }
  }, []);

  // Add a new image block
  const handleAddImage = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('image');
    }
  }, []);
 
  // Handle real-time markdown changes
  const handleMarkdownChange = useCallback((markdown: string) => {
    // console.log('Markdown changed:', markdown);
  }, []);

  // Handle block changes
  const handleBlockChange = (blocks: Block[]) => {
    console.log(
      'image',
      blocks
        .filter(b => b.type === 'image')
        .map(b => ({ id: b.id, checked: b.meta?.checked, text: b.content }))
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Minimalistic Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarSection}>
          <Button 
            title={`Mode: ${currentMode.toUpperCase()}`} 
            onPress={handleToggleMode}
            color="#4F46E5"
          />
          <Button 
            title="Export" 
            onPress={handleGetMarkdown}
            color="#059669" 
          />
        </View>
             </View>

      <MarkdownEditor
        ref={editorRef}
        initialMarkdown={initialMarkdown}
        // onMarkdownChange={handleMarkdownChange}
        onBlockChange={handleBlockChange}
        placeholder="Start typing... Use # for headings, ``` for code, > for quotes"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  toolbar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        paddingTop: 50, // Account for iOS status bar
      },
    }),
  },
  toolbarSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
});