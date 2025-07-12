// app/(tabs)/index.tsx
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Button, StyleSheet, View } from 'react-native';
import MarkdownEditor, { Block, MarkdownEditorRef } from '../../components/MarkdownEditor';

export default function EditorScreen() {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Example initial markdown content
  const initialMarkdown = `
 # Markdown syntax guide

## Headers

# This is a Heading h1
## This is a Heading h2
###### This is a Heading h6

## Emphasis

*This text will be italic*  
_This will also be italic_

**This text will be bold**  
__This will also be bold__

_You **can** combine them as italic and word 'can' bold_

And here's some \`inline code\` for testing.

## Lists

### Unordered

* Item 1
* Item 2
* Item 2a
* Item 2b
    * Item 3a
    * Item 3b

### Ordered

1. Item 1
2. Item 2
3. Item 3
    1. Item 3a
    2. Item 3b

## Images

![This is an alt text.](/image/sample.webp "This is a sample image.")

## Links

You may be using [Markdown Live Preview](https://markdownlivepreview.com/).

## Blockquotes

> Markdown is a lightweight markup language with plain-text-formatting syntax, created in 2004 by John Gruber with Aaron Swartz.
>
>> Markdown is often used to format readme files, for writing messages in online discussion forums, and to create rich text using a plain text editor.

## Tables

| Left columns  | Right columns |
| ------------- |:-------------:|
| left foo      | right foo     |
| left bar      | right bar     |
| left baz      | right baz     |

## Blocks of code

\`\`\`javascript
let message = 'Hello world';
alert(message);
\`\`\`

## Inline code

This web site is using \`markedjs/marked\`.
 `;

  // Get the current markdown content
  const handleGetMarkdown = useCallback(() => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      console.log('Current markdown:', markdown);
      Alert.alert('Markdown Content', markdown);
    }
  }, []);

  // Focus the editor
  const handleFocusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
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
    console.log('Markdown changed:', markdown);
  }, []);

  // Handle block changes
  const handleBlockChange = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    console.log('Blocks changed:', newBlocks);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.toolbarRow}>
          <Button title="Get Markdown" onPress={handleGetMarkdown} />
          <Button title="Focus" onPress={handleFocusEditor} />
        </View>
        <View style={styles.toolbarRow}>
          <Button title="+ Heading" onPress={handleAddHeading} />
          <Button title="+ Code" onPress={handleAddCodeBlock} />
          <Button title="+ Quote" onPress={handleAddQuote} />
        </View>
        <View style={styles.toolbarRow}>
          <Button title="+ List" onPress={handleAddList} />
          <Button title="+ Checklist" onPress={handleAddChecklist} />
          <Button title="+ Divider" onPress={handleAddDivider} />
          <Button title="+ Image" onPress={handleAddImage} />
        </View>
      </View>

      <MarkdownEditor
        ref={editorRef}
        initialMarkdown={initialMarkdown}
        onMarkdownChange={handleMarkdownChange}
        onBlockChange={handleBlockChange}
        placeholder="Start typing... Use # for headings, ``` for code, > for quotes"
        theme={{
          // Custom theme example
          focusedBlock: {
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderRadius: 8,
            padding: 4,
          },
          focusedInput: {
            backgroundColor: '#ffffff',
            borderColor: '#3b82f6',
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    display: 'none',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});