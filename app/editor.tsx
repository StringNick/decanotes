import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckSquare, Code, Heading1, Heading2, Heading3, Lightbulb, List, ListOrdered, Minus, Plus, Quote, Redo2, Type, Undo2, X, Save, Copy, FileText } from 'lucide-react-native';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Animated, FlatList, Keyboard, StatusBar, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Crypto from 'expo-crypto';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { FormattingToolbar } from '../components/editor/components/FormattingToolbar';
import { ExtendedMarkdownEditorRef } from '../components/editor/types/EditorTypes';
import { getEditorTheme } from '../themes/defaultTheme';
import { EditorBlock, EditorBlockType } from '../types/editor';
import { useStorage } from '@/contexts/StorageContext';
import type { Note } from '@/types/storage';


const initialMarkdown = `# Welcome to DecanNotes Editor

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

Enjoy creating with DecanNotes! 🚀`;

// Import built-in plugins

export default function EditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ noteId?: string }>();
  const colorScheme = useColorScheme();
  const { loadNote, saveNote, currentNote, setCurrentNote, hasUnsavedChanges, markAsChanged, clearUnsavedChanges } = useStorage();
  
  const editorRef = useRef<ExtendedMarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [showBlockComponents, setShowBlockComponents] = useState(false);
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('Untitled');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showMarkdownModal, setShowMarkdownModal] = useState(false);
  const [rawMarkdown, setRawMarkdown] = useState('');
  const isInitialLoad = useRef(true);
  const initialBlocksRef = useRef<EditorBlock[]>([]);
  const isTitleManuallySet = useRef(false);
  const blockComponentsAnim = useRef(new Animated.Value(0)).current;

  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  // Load note if noteId is provided
  useEffect(() => {
    const loadExistingNote = async () => {
      if (params.noteId) {
        try {
          const note = await loadNote(params.noteId);
          if (note) {
            setBlocks(note.content);
            const title = note.title || 'Untitled';
            setNoteTitle(title);
            initialBlocksRef.current = note.content;
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
  }, [params.noteId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setCurrentNote(null);
      clearUnsavedChanges();
    };
  }, []);

  // Handle adding blocks
  const handleAddBlock = useCallback((blockType: EditorBlockType) => {
    if (editorRef.current) {
      editorRef.current.insertBlock(blockType);
      // Focus the newly added block
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 100);
    }
    hideBlockComponents();
    Keyboard.dismiss();
  }, []);

  // Show block components with animation
  const showBlockComponentsWithAnimation = useCallback(() => {
    setShowBlockComponents(true);
    Animated.spring(blockComponentsAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [blockComponentsAnim]);

  // Hide block components with animation
  const hideBlockComponents = useCallback(() => {
    Animated.spring(blockComponentsAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setShowBlockComponents(false);
    });
  }, [blockComponentsAnim]);

  // Handle block changes
  const handleBlockChange = useCallback((blocks: EditorBlock[]) => {
    setBlocks(blocks);
    
    // Don't mark as changed during initial load
    if (isInitialLoad.current) {
      return;
    }
    
    // Check if blocks actually changed by comparing with initial blocks
    const hasActualChanges = JSON.stringify(blocks) !== JSON.stringify(initialBlocksRef.current);
    
    if (hasActualChanges) {
      markAsChanged();
    }
  }, [markAsChanged]);

  // Save note handler
  const handleSaveNote = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
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

      await saveNote(note);
      // Update initial blocks reference after successful save
      initialBlocksRef.current = blocks;
      Alert.alert('Success', 'Note saved successfully!');
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, currentNote, saveNote, isSaving, noteTitle]);

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
    console.log('Formatting action:', actionId);
    // TODO: Implement formatting actions
  }, []);

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

  // Get raw markdown
  const handleGetRawMarkdown = useCallback(() => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      setRawMarkdown(markdown);
      setShowMarkdownModal(true);
    }
  }, []);

  // Copy markdown to clipboard
  const handleCopyMarkdown = useCallback(async () => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      await Clipboard.setStringAsync(markdown);
      Alert.alert('Copied!', 'Markdown copied to clipboard');
    }
  }, []);

  const handleCopyFromModal = useCallback(async () => {
    await Clipboard.setStringAsync(rawMarkdown);
    Alert.alert('Copied!', 'Markdown copied to clipboard');
    setShowMarkdownModal(false);
  }, [rawMarkdown]);

  // Block types for the menu - Notion-style
  const blockTypes: Array<{ type: EditorBlockType; icon: React.ComponentType<any>; label: string; meta?: any }> = [
    { type: 'paragraph', icon: Type, label: 'Text' },
    { type: 'heading', icon: Heading1, label: 'Heading 1', meta: { level: 1 } },
    { type: 'heading', icon: Heading2, label: 'Heading 2', meta: { level: 2 } },
    { type: 'heading', icon: Heading3, label: 'Heading 3', meta: { level: 3 } },
    { type: 'list', icon: List, label: 'Bulleted list' },
    { type: 'list', icon: ListOrdered, label: 'Numbered list', meta: { ordered: true } },
    { type: 'checklist', icon: CheckSquare, label: 'To-do list' },
    { type: 'quote', icon: Quote, label: 'Quote' },
    { type: 'divider', icon: Minus, label: 'Divider' },
    { type: 'code', icon: Code, label: 'Code' },
    { type: 'callout', icon: Lightbulb, label: 'Callout' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      {/* Compact Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => {
              if (hasUnsavedChanges) {
                Alert.alert(
                  'Unsaved Changes',
                  'You have unsaved changes. Do you want to save before leaving?',
                  [
                    { text: 'Discard', style: 'destructive', onPress: () => router.back() },
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Save', 
                      onPress: async () => {
                        await handleSaveNote();
                        router.back();
                      }
                    },
                  ]
                );
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
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleRename}
            >
              <Ionicons name="pencil" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleGetRawMarkdown}
            >
              <FileText size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleCopyMarkdown}
            >
              <Copy size={16} color={colors.textSecondary} />
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
      ) : (
        <View style={styles.editorContainer}>
          <MarkdownEditor
            ref={editorRef}
            initialMarkdown={initialMarkdown}
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
                  secondary: colors.icon
                }
              }
            }}
          />
        </View>
      )}

      {/* Minimal Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        <View style={styles.leftToolbarButtons}>
          <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleUndo}
        >
          <Undo2 size={20} color={colors.background} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={handleRedo}
        >
          <Redo2 size={20} color={colors.background} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={showBlockComponentsWithAnimation}
        >
          <Plus size={20} color={colors.background} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => setShowFormattingToolbar(!showFormattingToolbar)}
        >
          <Ionicons name="text" size={20} color={colors.background} />
        </TouchableOpacity>
        </View>
        
        {showBlockComponents && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={hideBlockComponents}
          >
            <X size={20} color={colors.background} />
          </TouchableOpacity>
        )}
      </View>

      {/* Formatting Toolbar */}
      {showFormattingToolbar && (
        <View style={styles.formattingToolbarContainer}>
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
      )}

      {/* Block Components Selection Panel */}
      {showBlockComponents && (
        <View style={styles.blockComponentsPanel}>
          <FlatList
            data={blockTypes}
            numColumns={2}
            style={styles.blockPanelContent}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.blockPanelRow}
            renderItem={({ item, index }) => {
               const IconComponent = item.icon;
               return (
                 <TouchableOpacity
                   style={styles.blockPanelItem}
                   onPress={() => handleAddBlock(item.type)}
                 >
                   <View style={styles.blockPanelIconContainer}>
                     <IconComponent size={18} color={colors.text} />
                   </View>
                   <Text style={styles.blockPanelLabel}>{item.label}</Text>
                 </TouchableOpacity>
               );
             }}
            keyExtractor={(item, index) => index.toString()}
          />
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
              style={[styles.modalInput, { 
                color: colors.text,
                borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              }]}
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
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmRename}
              >
                <Text style={styles.modalButtonTextConfirm}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Raw Markdown Modal */}
      <Modal
        visible={showMarkdownModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMarkdownModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.markdownModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.markdownModalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Raw Markdown</Text>
              <TouchableOpacity onPress={() => setShowMarkdownModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={[styles.markdownContainer, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            }]}>
              <Text style={[styles.markdownText, { color: colors.text }]}>{rawMarkdown}</Text>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm, styles.copyButton]}
              onPress={handleCopyFromModal}
            >
              <Copy size={16} color="#FFFFFF" />
              <Text style={styles.modalButtonTextConfirm}>Copy to Clipboard</Text>
            </TouchableOpacity>
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
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      maxHeight: 400,
    },
    markdownText: {
      fontSize: 14,
      fontFamily: 'SpaceMono',
      lineHeight: 20,
    },
    copyButton: {
      flexDirection: 'row',
      gap: 8,
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
    editorContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bottomContainer: {
      backgroundColor: colors.background, // Changed from colors.surface to match status bar
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    bottomToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: colors.dark,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    leftToolbarButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: 10,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      marginRight: 8,
    },

    blockComponentsPanel: {
      height: 320,
      backgroundColor: colors.background, // Changed from colors.surface to match status bar
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    blockPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    blockPanelTitle: {
      fontSize: 18,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.text,
    },
    blockPanelContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    blockPanelRow: {
      justifyContent: 'space-between',
      paddingHorizontal: 0,
    },
    blockPanelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 12,
      marginBottom: 8,
      backgroundColor: 'transparent',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flex: 0.48,
    },
    blockPanelIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    blockPanelLabel: {
      fontSize: 16,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.text,
      flex: 1,
    },
    formattingToolbarContainer: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
  });
};
