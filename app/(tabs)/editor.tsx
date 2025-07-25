import React, { useCallback, useRef, useState } from 'react';
import { Button, Platform, StatusBar, StyleSheet, View } from 'react-native';
import MarkdownEditor from '../../components/MarkdownEditor';
import { Block, EditorBlock, EditorMode, MarkdownEditorRef } from '../../types/editor';

export default function NewEditorScreen() {
  const editorRef = useRef<MarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [currentMode, setCurrentMode] = useState<EditorMode>('edit');

  // Example initial markdown content
  const initialMarkdown = `# New Markdown Editor - Enhanced Features

## Welcome to the Enhanced Editor

This is the new markdown editor with advanced plugin support and enhanced features.

## Key Features

### Plugin System
- Extensible plugin architecture
- Built-in plugins for all common block types
- Custom plugin support

### Enhanced Blocks

#### Text Formatting
**Bold text** and _italic text_ with enhanced rendering.

#### Code Blocks
\`\`\`javascript
// Enhanced code block with better syntax highlighting
const editor = new MarkdownEditor({
  plugins: [...builtInPlugins, ...customPlugins],
  theme: 'modern',
  features: {
    dragAndDrop: true,
    toolbar: true,
    shortcuts: true
  }
});
\`\`\`

#### Interactive Elements

- [ ] Enhanced checklist items
- [x] With better interaction
- [ ] And improved styling

> Enhanced blockquotes with better typography
> and improved visual hierarchy

#### Media Support

![Enhanced Image Support](https://via.placeholder.com/400x200 "Enhanced image handling")

---

## Advanced Features

### Drag and Drop
Blocks can be reordered by dragging and dropping.

### Keyboard Shortcuts
- **Ctrl/Cmd + B**: Bold
- **Ctrl/Cmd + I**: Italic
- **Ctrl/Cmd + K**: Code
- **Ctrl/Cmd + Shift + L**: List

### Real-time Collaboration
Support for real-time collaborative editing (when enabled).

### Export Options
Multiple export formats including:
- Markdown
- HTML
- JSON

---

## Getting Started

1. Start typing to create content
2. Use markdown syntax for formatting
3. Try the toolbar for quick actions
4. Experiment with drag and drop

Enjoy the enhanced editing experience!
`;

  // Get the current markdown content
  const handleGetMarkdown = useCallback(() => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      console.log('Current markdown:', markdown);
      // You could show an alert or export the content
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

  // Add block functions (using the original editor interface)
  const handleAddHeading = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('heading');
    }
  }, []);

  const handleAddCodeBlock = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('code');
    }
  }, []);

  const handleAddQuote = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.insertBlock('quote');
    }
  }, []);

  // Handle block changes
  const handleBlockChange = useCallback((blocks: Block[]) => {
    setBlocks(blocks);
    console.log('Blocks updated:', blocks.length, 'blocks');
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Enhanced Toolbar */}
      <View style={styles.toolbar}>
        <View style={styles.toolbarSection}>
          <Button 
            title={`Mode: ${currentMode.toUpperCase()}`} 
            onPress={handleToggleMode}
            color="#4F46E5"
          />
          <Button 
            title="Focus" 
            onPress={handleFocusEditor}
            color="#7C3AED" 
          />
        </View>
        
        <View style={styles.toolbarSection}>
          <Button 
            title="H1" 
            onPress={handleAddHeading}
            color="#DC2626" 
          />
          <Button 
            title="Code" 
            onPress={handleAddCodeBlock}
            color="#7C2D12" 
          />
          <Button 
            title="Quote" 
            onPress={handleAddQuote}
            color="#0891B2" 
          />
        </View>
        
        <View style={styles.toolbarSection}>
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
        onBlockChange={handleBlockChange}
        placeholder="Start typing with the enhanced editor... Use # for headings, ``` for code, > for quotes"
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: 4,
    gap: 8,
  },
});