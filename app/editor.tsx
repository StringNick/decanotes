import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Animated, FlatList, Keyboard, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MarkdownEditor from '../components/editor/MarkdownEditor';
import { ExtendedMarkdownEditorRef } from '../components/editor/types/EditorTypes';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../types/editor';

// Import built-in plugins

export default function EditorScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const editorRef = useRef<ExtendedMarkdownEditorRef>(null);
  const [blocks, setBlocks] = useState<EditorBlock[]>([]);
  const [showBlockComponents, setShowBlockComponents] = useState(false);
  const blockComponentsAnim = useRef(new Animated.Value(0)).current;

  // Mock page data - in real app this would come from navigation params
  const pageTitle = "Untitled";

  // Get theme colors
  const theme = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  // Handle adding blocks
  const handleAddBlock = useCallback((blockType: EditorBlockType) => {
    if (editorRef.current) {
      console.log('insert block');
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
  }, []);

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

  // Block types for the menu - Notion-style
  const blockTypes: Array<{ type: EditorBlockType; icon: string; label: string; meta?: any }> = [
    { type: 'paragraph', icon: '📝', label: 'Text' },
    { type: 'heading', icon: 'H₁', label: 'Heading 1', meta: { level: 1 } },
    { type: 'heading', icon: 'H₂', label: 'Heading 2', meta: { level: 2 } },
    { type: 'heading', icon: 'H₃', label: 'Heading 3', meta: { level: 3 } },
    { type: 'list', icon: '•', label: 'Bulleted list' },
    { type: 'list', icon: '1.', label: 'Numbered list', meta: { ordered: true } },
    { type: 'checklist', icon: '☐', label: 'To-do list' },
    { type: 'quote', icon: '❝', label: 'Quote' },
    { type: 'divider', icon: '—', label: 'Divider' },
    { type: 'code', icon: '</>', label: 'Code' },
    { type: 'callout', icon: '💡', label: 'Callout' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background} 
      />
      {/* Notion-style Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <View style={styles.editorContainer}>
        <MarkdownEditor
          ref={editorRef}
          placeholder="Start writing..."
          onBlocksChange={handleBlockChange}
          theme={colorScheme || 'light'}
          config={{
            toolbar: { enabled: false },
            theme: {
              colors: {
                background: theme.background,
                text: theme.text,
                border: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                primary: theme.tint,
                secondary: theme.icon
              }
            }
          }}
        />
      </View>

      {/* Minimal Bottom Toolbar */}
      <View style={styles.bottomToolbar}>
        <View style={styles.leftToolbarButtons}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleUndo}
          >
            <Ionicons name="arrow-undo" size={20} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={handleRedo}
          >
            <Ionicons name="arrow-redo" size={20} color={theme.text} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={showBlockComponentsWithAnimation}
          >
            <Ionicons name="add" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
        
        {showBlockComponents && (
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={hideBlockComponents}
          >
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Block Components Selection Panel */}
      {showBlockComponents && (
        <View style={styles.blockComponentsPanel}>
          <FlatList
            data={blockTypes}
            numColumns={2}
            style={styles.blockPanelContent}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.blockPanelRow}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={styles.blockPanelItem}
                onPress={() => handleAddBlock(item.type)}
              >
                <View style={styles.blockPanelIconContainer}>
                  <Text style={styles.blockPanelIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.blockPanelLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      )}
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 0.5,
      borderBottomColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: colorScheme === 'dark' ? 0.3 : 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.3,
    },
    lastModified: {
      fontSize: 13,
      color: colors.icon,
      marginTop: 2,
    },
    moreButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 12,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    editorContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    bottomContainer: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
      borderTopWidth: 0.5,
      borderTopColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.1,
      shadowRadius: 8,
      elevation: 8,
    },
    bottomToolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 2,
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f8f9fa',
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? '#333' : '#e1e5e9',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    leftToolbarButtons: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconButton: {
      padding: 0,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    blockComponentsPanel: {
      height: 250,
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderTopWidth: 1,
      borderTopColor: colorScheme === 'dark' ? '#333' : '#e1e5e9',
    },
    blockPanelHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#333' : '#e1e5e9',
    },
    blockPanelTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a',
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
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      flex: 0.48,
    },
    blockPanelIconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },
    blockPanelIcon: {
      fontSize: 18,
      textAlign: 'center',
    },
    blockPanelLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colorScheme === 'dark' ? '#ffffff' : '#1a1a1a',
      flex: 1,
    },
  });
};