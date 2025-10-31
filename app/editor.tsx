import { Colors } from '@/constants/Colors';
import { useStorage } from '@/contexts/StorageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useKeyboardOffset } from '@/hooks/useKeyboardOffset';
import type { Note } from '@/types/storage';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    CheckSquare,
    Code,
    Heading1,
    Heading2,
    Heading3,
    Lightbulb,
    List,
    ListOrdered,
    Minus,
    Plus,
    Quote,
    Redo2,
    Save,
    Table,
    Type,
    Undo2,
    X,
} from 'lucide-react-native';
import React, { StrictMode, useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Modal,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MarkdownEditor } from '../components/editor/MarkdownEditor';
import { FormattingToolbar } from '../components/editor/components/FormattingToolbar';
import { ExtendedMarkdownEditorRef } from '../components/editor/types/EditorTypes';
import { getEditorTheme } from '../themes/defaultTheme';
import { EditorBlock, EditorBlockType } from '../types/editor';

// Demo markdown text (not used - we use initialBlocks from loaded notes instead)
/* const initialMarkdown = `# Welcome to DecanNotes Editor

## All Supported Markdown Components

This editor supports a comprehensive set of markdown components for rich content creation.

### Text Formatting

This is a regular paragraph with **bold text** and *italic text* for emphasis.

Another paragraph demonstrating the text formatting capabilities.

### Headings

# Heading Level 1
## Heading Level 2  
### Heading Level 3
#### Heading Level 4
##### Heading Level 5
###### Heading Level 6

### Lists

#### Unordered Lists
- First item
- Second item
- Third item
  - Nested item
  - Another nested item

#### Ordered Lists
1. First numbered item
2. Second numbered item
3. Third numbered item
   1. Nested numbered item
   2. Another nested numbered item

### Checklists

- [ ] Unchecked task item
- [x] Completed task item
- [ ] Another pending task
- [x] Another completed task
  - [ ] Nested unchecked item
  - [x] Nested completed item

### Blockquotes

> This is a blockquote with enhanced typography
> and improved visual hierarchy for better readability.

> Another blockquote example
> demonstrating multi-line support.

### Code Blocks

\`\`\`javascript
// JavaScript code example
const editor = new MarkdownEditor({
  plugins: [...builtInPlugins],
  theme: 'modern',
  features: {
    dragAndDrop: true,
    toolbar: true,
    shortcuts: true
  }
});
\`\`\`

\`\`\`python
# Python code example
def hello_world():
    print("Hello, World!")
    return "Success"
\`\`\`

\`\`\`json
{
  "name": "DecanNotes",
  "version": "1.0.0",
  "features": [
    "markdown",
    "real-time editing",
    "plugin system"
  ]
}
\`\`\`

### Images

![Sample Image](https://via.placeholder.com/400x200 "Sample image with caption")

### Dividers

---

### Callouts

> [!NOTE] Information Callout
> This is an informational callout block for important notes.

> [!TIP] Helpful Tip
> This is a tip callout for providing helpful suggestions.

> [!WARNING] Warning Notice
> This is a warning callout for important warnings.

> [!DANGER] Danger Alert
> This is a danger callout for critical alerts.

---

## Advanced Features

### Real-time Markdown Transformation

The editor supports real-time transformation of markdown syntax:
- Type \`# Heading\` → Converts to heading
- Type \`> Quote\` → Converts to blockquote
- Type \`- List item\` → Converts to list
- Type \`- [ ] Task\` → Converts to checklist
- Type \`\`\`\` → Converts to code block
- Type \`---\` → Converts to divider

### Drag and Drop
Blocks can be reordered by dragging and dropping for better organization.

### Keyboard Shortcuts
- **Ctrl/Cmd + B**: Bold text
- **Ctrl/Cmd + I**: Italic text
- **Ctrl/Cmd + K**: Inline code
- **Ctrl/Cmd + Shift + L**: Create list
- **Enter**: Create new block
- **Backspace**: Delete/merge blocks

---

## Getting Started

1. **Start typing** to create content
2. **Use markdown syntax** for formatting
3. **Try the toolbar** for quick actions
4. **Experiment with drag and drop** for reordering
5. **Use keyboard shortcuts** for efficiency

Enjoy creating with DecanNotes! 🚀`; */

// Import built-in plugins

/**
 * Helper function to detect and convert table markdown in paragraph blocks
 */
function convertTableMarkdownToBlocks(blocks: EditorBlock[]): EditorBlock[] {
  return blocks.map(block => {
    // Only process paragraph blocks
    if (block.type !== 'paragraph') {
      return block;
    }

    const content = block.content.trim();
    const lines = content.split('\n');

    // Check if all lines start with | (table syntax)
    const isTableMarkdown = lines.length >= 2 && lines.every(line => line.trim().startsWith('|'));

    if (isTableMarkdown) {
      // Helper function to parse table row
      const parseTableRow = (line: string): string[] => {
        return line
          .split('|')
          .slice(1, -1) // Remove first and last empty elements
          .map(cell => cell.trim());
      };

      // Parse header row
      const headers = parseTableRow(lines[0]);

      // Parse alignment row (should contain dashes and optional colons)
      if (lines.length >= 2) {
        const alignmentCells = parseTableRow(lines[1]);

        // Validate that second row is an alignment row
        const isValidAlignmentRow = alignmentCells.every(cell => /^:?-+:?$/.test(cell));

        if (isValidAlignmentRow && headers.length > 0) {
          const alignments = alignmentCells.map(cell => {
            const startsWithColon = cell.startsWith(':');
            const endsWithColon = cell.endsWith(':');

            if (startsWithColon && endsWithColon) return 'center';
            if (endsWithColon) return 'right';
            if (startsWithColon) return 'left';
            return 'left'; // default
          }) as ('left' | 'center' | 'right')[];

          // Parse data rows
          const rows = lines.slice(2).map(line => parseTableRow(line));

          // Return a table block
          return {
            id: block.id, // Keep the same ID
            type: 'table' as EditorBlockType,
            content: '',
            meta: {
              headers,
              rows,
              alignments,
            },
          };
        }
      }
    }

    // Return the block unchanged if it's not table markdown
    return block;
  });
}

export default function EditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const { effectiveTheme } = useTheme();
  const colorScheme = effectiveTheme; // Use app theme setting instead of system theme
  const { loadNote, saveNote, currentNote, setCurrentNote, hasUnsavedChanges, markAsChanged, clearUnsavedChanges, autoSaveEnabled } =
    useStorage();

  const editorRef = useRef<ExtendedMarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [showBlockComponents, setShowBlockComponents] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('Untitled');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isMarkdownMode, setIsMarkdownMode] = useState(false);
  const [markdownText, setMarkdownText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const isInitialLoad = useRef(true);
  const initialBlocksRef = useRef<EditorBlock[]>([]);
  const isTitleManuallySet = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const keyboardOffset = useKeyboardOffset();

  // Load note if noteId is provided
  useEffect(() => {
    const loadExistingNote = async () => {
      if (params.noteId) {
        try {
          const note = await loadNote(params.noteId);
          if (note) {
            if (__DEV__) {
              console.log(
                '[EditorScreen] Raw note.content from storage:',
                JSON.stringify(note.content.slice(0, 10), null, 2)
              );
            }

            // Convert any paragraph blocks containing table markdown
            const processedBlocks = convertTableMarkdownToBlocks(note.content);

            if (__DEV__) {
              const footnoteBlocks = processedBlocks.filter(b => b.type === 'footnote');
              console.log('[EditorScreen] Loaded blocks:', processedBlocks.length);
              console.log(
                '[EditorScreen] Footnote blocks:',
                footnoteBlocks.length,
                footnoteBlocks.map(b => b.meta?.footnoteId)
              );
              console.log(
                '[EditorScreen] Block types:',
                processedBlocks.map(b => b.type)
              );
            }

            setBlocks(processedBlocks);
            const title = note.title || 'Untitled';
            setNoteTitle(title);
            initialBlocksRef.current = processedBlocks;
            // If note has a title, consider it manually set
            if (title && title !== 'Untitled') {
              isTitleManuallySet.current = true;
            }
          }
        } catch (error) {
          console.error('Failed to load note:', error);
          Alert.alert('Error', 'Failed to load note');
        }
      } else {
        // New note - no initial content
        initialBlocksRef.current = [];
        isTitleManuallySet.current = false;
      }
      setIsLoading(false);
      // Mark as loaded after a short delay to allow editor to initialize
      setTimeout(() => {
        isInitialLoad.current = false;
        clearUnsavedChanges();
      }, 500);
    };

    loadExistingNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.noteId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setCurrentNote(null);
      clearUnsavedChanges();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show block components with animation
  const showBlockComponentsWithAnimation = useCallback(() => {
    Keyboard.dismiss();
    setShowBlockComponents(true);
  }, []);

  const hideBlockComponents = useCallback(() => {
    setShowBlockComponents(false);
  }, []);

  // Handle adding blocks
  const handleAddBlock = useCallback(
    (blockType: EditorBlockType, meta?: Record<string, any>) => {
      Keyboard.dismiss();
      if (editorRef.current) {
        if (__DEV__) {
          console.log('[EditorScreen] handleAddBlock start', { blockType, meta });
        }

        // Insert the new block
        editorRef.current.insertBlock(blockType, undefined, { meta });

        if (__DEV__) {
          console.log('[EditorScreen] handleAddBlock insertBlock dispatched', { blockType, meta });
        }
      }
      hideBlockComponents();
    },
    [hideBlockComponents]
  );

  // Handle block changes
  const handleBlockChange = useCallback(
    (blocks: EditorBlock[]) => {
      setBlocks(blocks);

      // Don't mark as changed during initial load
      if (isInitialLoad.current) {
        return;
      }

      // Check if blocks actually changed by comparing with initial blocks
      const hasActualChanges = JSON.stringify(blocks) !== JSON.stringify(initialBlocksRef.current);

      if (hasActualChanges) {
        markAsChanged();
      } else if (hasUnsavedChanges) {
        clearUnsavedChanges();
      }
    },
    [markAsChanged, clearUnsavedChanges, hasUnsavedChanges]
  );

  // Auto-save with debounce
  const performSave = useCallback(async () => {
    if (isSaving || blocks.length === 0) return;

    setIsSaving(true);
    setSaveStatus('saving');
    try {
      if (__DEV__) {
        const footnoteBlocks = blocks.filter(b => b.type === 'footnote');
        console.log('[performSave] Saving blocks count:', blocks.length);
        console.log(
          '[performSave] Footnote blocks:',
          footnoteBlocks.length,
          footnoteBlocks.map(b => b.meta?.footnoteId)
        );
      }

      // Generate note preview from blocks
      const preview = blocks
        .filter(b => b.type === 'paragraph' || b.type === 'heading')
        .slice(0, 3)
        .map(b => b.content)
        .join(' ')
        .substring(0, 150);

      // Use current noteTitle if manually set, otherwise extract from content
      let title = noteTitle;
      if (!isTitleManuallySet.current && (!title || title === 'Untitled')) {
        // Auto-extract title from first heading or use first paragraph
        const titleBlock = blocks.find(b => b.type === 'heading' && b.meta?.level === 1);
        title = titleBlock?.content || blocks[0]?.content || 'Untitled';
        setNoteTitle(title);
      }

      const note: Note = {
        id: currentNote?.id || Crypto.randomUUID(),
        title,
        content: blocks,
        preview: preview || 'Empty note',
        color: currentNote?.color || 'default',
        createdAt: currentNote?.createdAt || new Date(),
        updatedAt: new Date(),
        lastModified: new Date(),
      };

      const savedNote = await saveNote(note);
      // Update current note with stable ID from backend
      setCurrentNote(savedNote);
      // Update initial blocks reference after successful save
      initialBlocksRef.current = blocks;
      clearUnsavedChanges();
      setSaveStatus('saved');
      
      // Show saved status briefly, then hide
      setTimeout(() => setSaveStatus('saved'), 1000);
    } catch (error) {
      console.error('Failed to save note:', error);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, currentNote, saveNote, isSaving, noteTitle, clearUnsavedChanges, setCurrentNote]);

  // Trigger auto-save when blocks change (if enabled)
  useEffect(() => {
    if (isInitialLoad.current || blocks.length === 0 || !autoSaveEnabled) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set status to unsaved immediately
    setSaveStatus('unsaved');

    // Debounce save by 2 seconds
    autoSaveTimerRef.current = setTimeout(() => {
      performSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [blocks, performSave, autoSaveEnabled]);

  // Manual save handler (for explicit save button)
  const handleSaveNote = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await performSave();
  }, [performSave]);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  }, []);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  }, []);

  // Handle formatting actions
  const handleFormattingAction = useCallback((actionId: string) => {
    if (!editorRef.current) return;

    // Get current blocks
    const currentBlocks = editorRef.current.getBlocks();
    if (currentBlocks.length === 0) return;

    // For now, apply formatting to the last block (where cursor likely is)
    const lastBlock = currentBlocks[currentBlocks.length - 1];
    if (!lastBlock || lastBlock.type !== 'paragraph') return;

    const content = lastBlock.content;
    let newContent = content;

    switch (actionId) {
      case 'bold':
        newContent = content.includes('**') ? content.replace(/\*\*/g, '') : `**${content}**`;
        break;
      case 'italic':
        newContent = content.includes('*') && !content.includes('**') ? content.replace(/\*/g, '') : `*${content}*`;
        break;
      case 'strikethrough':
        newContent = content.includes('~~') ? content.replace(/~~/g, '') : `~~${content}~~`;
        break;
      case 'code':
        newContent = content.includes('`') ? content.replace(/`/g, '') : `\`${content}\``;
        break;
      case 'link':
        if (!content.includes('[')) {
          newContent = `[${content}](url)`;
        }
        break;
      default:
        return;
    }

    // Update blocks array
    const updatedBlocks = [...currentBlocks];
    updatedBlocks[updatedBlocks.length - 1] = { ...lastBlock, content: newContent };
    
    // Apply via setBlocks
    setBlocks(updatedBlocks);
    markAsChanged();
  }, [markAsChanged]);

  // Handle rename
  const handleRename = useCallback(() => {
    setTempTitle(noteTitle);
    setShowRenameModal(true);
  }, [noteTitle]);

  const handleConfirmRename = useCallback(() => {
    if (tempTitle.trim()) {
      setNoteTitle(tempTitle.trim());
      isTitleManuallySet.current = true; // Mark title as manually set
      // Only mark as changed if not in initial load
      if (!isInitialLoad.current) {
        markAsChanged();
      }
    }
    setShowRenameModal(false);
  }, [tempTitle, markAsChanged]);

  // Toggle markdown mode
  const handleToggleMarkdownMode = useCallback(() => {
    console.log('[Toggle] Called, isMarkdownMode:', isMarkdownMode);
    
    if (isMarkdownMode) {
      // Switching from markdown to blocks - parse and apply changes
      console.log('[Toggle] Switching to BLOCKS mode, markdown length:', markdownText.length);
      
      try {
        // Import the parser directly to parse markdown into blocks
        // We can't use editorRef here because MarkdownEditor is unmounted
        const { parseMarkdownToBlocks } = require('../components/editor/utils/MarkdownRegistry');
        
        // Parse markdown to blocks (using built-in plugins)
        const parsedBlocks = parseMarkdownToBlocks(markdownText, []);
        console.log('[Toggle] Parsed blocks:', parsedBlocks.length);
        
        // Update blocks state - this will trigger the editor to re-render with new blocks
        setBlocks(parsedBlocks);
        
        // Mark as changed if content differs
        const hasActualChanges = JSON.stringify(parsedBlocks) !== JSON.stringify(initialBlocksRef.current);
        if (hasActualChanges && !isInitialLoad.current) {
          markAsChanged();
        }
        
        // Switch mode
        setIsMarkdownMode(false);
      } catch (error) {
        console.error('[Toggle] Failed to parse markdown:', error);
        Alert.alert('Error', 'Failed to parse markdown. Please check your syntax.');
      }
    } else {
      // Switching from blocks to markdown - get fresh markdown
      console.log('[Toggle] Switching to MARKDOWN mode');
      
      if (editorRef.current) {
        const markdown = editorRef.current.getMarkdown();
        console.log('[Toggle] Got markdown, length:', markdown.length);
        setMarkdownText(markdown);
      }
      setIsMarkdownMode(true);
    }
  }, [isMarkdownMode, markdownText, markAsChanged]);

  // Handle markdown text change
  const handleMarkdownTextChange = useCallback((text: string) => {
    setMarkdownText(text);
    if (!isInitialLoad.current) {
      markAsChanged();
    }
  }, [markAsChanged]);

  // Block types for the menu - Notion-style
  const blockTypes: {
    type: EditorBlockType;
    icon: React.ComponentType<any>;
    label: string;
    meta?: Record<string, any>;
  }[] = [
    { type: 'paragraph', icon: Type, label: 'Text' },
    { type: 'heading', icon: Heading1, label: 'Heading 1', meta: { level: 1 } },
    { type: 'heading', icon: Heading2, label: 'Heading 2', meta: { level: 2 } },
    { type: 'heading', icon: Heading3, label: 'Heading 3', meta: { level: 3 } },
    { type: 'list', icon: List, label: 'Bulleted list', meta: { listType: 'unordered' } },
    { type: 'list', icon: ListOrdered, label: 'Numbered list', meta: { listType: 'ordered' } },
    { type: 'checklist', icon: CheckSquare, label: 'To-do list' },
    { type: 'quote', icon: Quote, label: 'Quote' },
    { type: 'divider', icon: Minus, label: 'Divider' },
    { type: 'code', icon: Code, label: 'Code' },
    { type: 'callout', icon: Lightbulb, label: 'Callout' },
    { type: 'table', icon: Table, label: 'Table' },
  ];

  const blockDockSection = showBlockComponents ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.blockQuickContent}>
      {blockTypes.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <TouchableOpacity
            key={`dock-block-${index}`}
            style={styles.blockQuickChip}
            onPress={() => handleAddBlock(item.type, item.meta)}
            activeOpacity={0.85}
          >
            <View style={styles.blockQuickIcon}>
              <IconComponent size={16} color={colors.tint} />
            </View>
            <Text style={styles.blockQuickLabel}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  ) : null;

  const formattingDockSection = showFormattingToolbar ? (
    <View style={styles.formattingToolbarCompact}>
      <FormattingToolbar
        actions={[
          { id: 'bold', icon: 'text', label: 'Bold', isActive: false },
          { id: 'italic', icon: 'text', label: 'Italic', isActive: false },
          { id: 'underline', icon: 'text', label: 'Underline', isActive: false },
          { id: 'code', icon: 'code', label: 'Code', isActive: false },
        ]}
        onActionPress={handleFormattingAction}
      />
    </View>
  ) : null;

  const actionDockSection = (
    <>
      <View style={styles.dockHistoryGroup}>
        <TouchableOpacity style={styles.dockButtonSurface} onPress={handleUndo} activeOpacity={0.7}>
          <Undo2 size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.dockButtonSurface} onPress={handleRedo} activeOpacity={0.7}>
          <Redo2 size={18} color={colors.text} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.dockPrimaryButton, showBlockComponents && styles.dockPrimaryButtonActive]}
        onPress={showBlockComponents ? hideBlockComponents : showBlockComponentsWithAnimation}
        activeOpacity={0.7}
      >
        {showBlockComponents ? (
          <X size={18} color={colors.background} strokeWidth={2} />
        ) : (
          <Plus size={18} color={colors.background} strokeWidth={2} />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dockButtonSurface, showFormattingToolbar && styles.dockToggleActive]}
        onPress={() => setShowFormattingToolbar(!showFormattingToolbar)}
        activeOpacity={0.7}
      >
        <Ionicons name="text" size={18} color={showFormattingToolbar ? colors.tint : colors.text} />
      </TouchableOpacity>
    </>
  );

  const dockVisible = true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      
      {/* Save Status Toast */}
      {saveStatus !== 'saved' && (
        <View style={[styles.saveToast, { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)' }]}>
          <Text style={[styles.saveToastText, { color: colors.text }]}>
            {saveStatus === 'saving' ? '💾 Saving...' : saveStatus === 'unsaved' ? '✏️ Unsaved changes' : ''}
          </Text>
        </View>
      )}

      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (hasUnsavedChanges) {
                Alert.alert('Unsaved Changes', 'You have unsaved changes. Do you want to save before leaving?', [
                  { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Save',
                    onPress: async () => {
                      await handleSaveNote();
                      router.back();
                    },
                  },
                ]);
              } else {
                router.back();
              }
            }}
          >
            <Ionicons name="arrow-back" size={16} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.pageTitle}>{noteTitle}</Text>
            {hasUnsavedChanges && (
              <View style={styles.unsavedIndicator}>
                <View style={styles.unsavedDot} />
              </View>
            )}
          </View>

          <View style={styles.headerActions}>
            {hasUnsavedChanges && (
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveNote}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Save size={16} color={colors.background} />
                )}
              </TouchableOpacity>
            )}
            
            {/* Тумблер Blocks ↔ Markdown */}
            <View style={styles.modeToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  !isMarkdownMode && styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  if (isMarkdownMode) {
                    handleToggleMarkdownMode();
                  }
                }}
              >
                <Type size={14} color={!isMarkdownMode ? colors.background : colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modeToggleButton,
                  isMarkdownMode && styles.modeToggleButtonActive,
                ]}
                onPress={() => {
                  if (!isMarkdownMode) {
                    handleToggleMarkdownMode();
                  }
                }}
              >
                <Code size={14} color={isMarkdownMode ? colors.background : colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={handleRename}>
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Editor */}
      {isLoading ? (
        <View style={[styles.editorContainer, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading note...</Text>
        </View>
      ) : isMarkdownMode ? (
        <View style={styles.editorContainer}>
          <ScrollView 
            style={styles.markdownScrollContainer}
            contentContainerStyle={{ paddingBottom: keyboardOffset || 20 }}
            keyboardShouldPersistTaps="handled"
          >
            <TextInput
              style={[
                styles.markdownEditor,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                },
              ]}
              value={markdownText}
              onChangeText={handleMarkdownTextChange}
              multiline
              textAlignVertical="top"
              placeholder="# Markdown text here..."
              placeholderTextColor={colors.textSecondary}
              autoFocus={false}
            />
          </ScrollView>
        </View>
      ) : (
        <View style={styles.editorContainer}>
          <StrictMode>
            <MarkdownEditor
              ref={editorRef}
              initialBlocks={blocks}
              placeholder="Start writing..."
              onBlocksChange={handleBlockChange}
              theme={getEditorTheme(colorScheme || 'light')}
              config={{
                toolbar: { enabled: false },
                theme: {
                  colors: {
                    background: colors.background,
                    text: colors.text,
                    border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    primary: colors.tint,
                    secondary: colors.icon,
                  },
                },
              }}
              keyboardHeight={keyboardOffset}
              keyboardDockVisible={dockVisible}
              keyboardDockBlockSection={blockDockSection}
              keyboardDockFormattingSection={formattingDockSection}
              keyboardDockActionSection={actionDockSection}
            />
          </StrictMode>
        </View>
      )}

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rename Note</Text>
            <TextInput
              style={[
                styles.modalInput,
                {
                  color: colors.text,
                  borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                  backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                },
              ]}
              value={tempTitle}
              onChangeText={setTempTitle}
              placeholder="Enter note title"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmRename}>
                <Text style={styles.modalButtonTextConfirm}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pageTitle: {
      fontSize: 18,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.text,
      letterSpacing: -0.3,
    },
    unsavedIndicator: {
      padding: 4,
    },
    unsavedDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#FCD34D',
    },
    saveButton: {
      backgroundColor: colors.tint,
    },
    saveToast: {
      position: 'absolute',
      top: 60,
      alignSelf: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      zIndex: 1000,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    saveToastText: {
      fontSize: 13,
      fontFamily: 'AlbertSans_500Medium',
    },
    loadingContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'AlbertSans_500Medium',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      width: '100%',
      maxWidth: 400,
      borderRadius: 16,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    markdownModalContent: {
      maxHeight: '80%',
    },
    markdownModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: 'AlbertSans_600SemiBold',
      marginBottom: 16,
    },
    modalInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalButtonCancel: {
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    modalButtonConfirm: {
      backgroundColor: colors.tint,
    },
    modalButtonTextCancel: {
      fontSize: 16,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.text,
    },
    modalButtonTextConfirm: {
      fontSize: 16,
      fontFamily: 'AlbertSans_500Medium',
      color: '#FFFFFF',
    },
    markdownContainer: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      maxHeight: 400,
    },
    markdownText: {
      fontSize: 14,
      fontFamily: 'SpaceMono',
      lineHeight: 20,
    },
    markdownInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      minHeight: 400,
      maxHeight: 400,
      fontSize: 14,
      fontFamily: 'SpaceMono',
      lineHeight: 20,
    },
    markdownModalActions: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'flex-end',
    },
    copyButton: {
      flexDirection: 'row',
      gap: 8,
    },
    modalButtonSecondary: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 20,
    },
    modalButtonTextSecondary: {
      fontSize: 16,
      fontFamily: 'AlbertSans_500Medium',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    modeToggleContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 2,
      gap: 2,
    },
    modeToggleButton: {
      width: 28,
      height: 28,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    modeToggleButtonActive: {
      backgroundColor: colors.tint,
    },
    editorContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    markdownScrollContainer: {
      flex: 1,
    },
    markdownEditor: {
      minHeight: '100%',
      padding: 16,
      fontSize: 16,
      fontFamily: 'SpaceMono',
      lineHeight: 24,
    },
    blockQuickContent: {
      paddingHorizontal: 12,
      paddingRight: 6,
    },
    blockQuickChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.04)',
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)',
      marginRight: 8,
    },
    blockQuickIcon: {
      width: 24,
      height: 24,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.1)',
      marginRight: 6,
    },
    blockQuickLabel: {
      fontSize: 12,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.text,
    },
    formattingToolbarCompact: {
      paddingHorizontal: 4,
    },
    dockHistoryGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dockButtonSurface: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)',
    },
    dockToggleActive: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(20, 184, 166, 0.18)' : 'rgba(20, 184, 166, 0.15)',
    },
    dockPrimaryButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tint,
    },
    dockPrimaryButtonActive: {
      backgroundColor: colors.textSecondary,
    },
  });
};
