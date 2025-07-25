import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { EditorBlock, EditorMode, EditorBlockType } from '../../../types/editor';
import { ExtendedMarkdownEditorProps, ExtendedMarkdownEditorRef, EditorConfig, EditorError } from '../types/EditorTypes';
import { BlockPlugin, MarkdownPlugin } from '../types/PluginTypes';
import { PluginRegistry } from '../plugins/PluginRegistry';
import { useEditorState } from './EditorState';
import { useEditorKeyboard } from './EditorKeyboard';
import { useEditorDragDrop } from './EditorDragDrop';
import { SafeBlockRenderer } from './BlockRenderer';
import { Ionicons } from '@expo/vector-icons';

/**
 * Core editor component that orchestrates all editor functionality
 */
export const EditorCore = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  ({
    initialBlocks = [],
    blockPlugins = [],
    markdownPlugins = [],
    config = {},
    onBlocksChange,
    onSelectionChange,
    onEditingChange,
    onError,
    style,
    ...props
  }, ref) => {
    // Plugin registry
    const [pluginRegistry] = useState(() => new PluginRegistry());
    
    // Refs
    const scrollViewRef = useRef<ScrollView>(null);
    const editorRef = useRef<View>(null);
    
    // Configuration with defaults
    const editorConfig: EditorConfig = {
      theme: {
        colors: {
          primary: '#007AFF',
          primaryLight: '#E3F2FD',
          secondary: '#666',
          background: '#fff',
          text: '#000',
          border: '#E5E5E7',
          ...config.theme?.colors
        },
        spacing: {
          small: 4,
          medium: 8,
          large: 16,
          ...config.theme?.spacing
        },
        typography: {
          fontSize: 16,
          lineHeight: 24,
          fontFamily: 'System',
          ...config.theme?.typography
        }
      },
      toolbar: {
        enabled: true,
        position: 'top',
        ...config.toolbar
      },
      dragAndDrop: {
        enabled: true,
        ...config.dragAndDrop
      },
      keyboard: {
        shortcuts: {},
        ...config.keyboard
      },
      historyDebounceMs: 300,
      maxHistorySize: 50,
      debug: false,
      ...config
    };

    // State management hook
    const {
      blocks,
      selectedBlockId,
      editingBlockId,
      editorState,
      actions
    } = useEditorState({
      initialBlocks,
      onBlocksChange,
      config: editorConfig
    });
    
    // Keyboard handling hook
    const {
      keyboardRef,
      shortcuts,
      focusEditor,
      blurEditor
    } = useEditorKeyboard({
      blocks,
      selectedBlockId,
      editingBlockId,
      blockPlugins,
      config: editorConfig,
      actions
    });
    
    // Drag and drop hook
    const {
      dragState,
      getDragHandleProps,
      getDragOverlayProps,
      getDropIndicatorProps,
      getBlockProps,
      getDropZoneProps
    } = useEditorDragDrop({
      blocks,
      blockPlugins,
      config: editorConfig,
      actions: {
        moveBlock: actions.moveBlock,
        updateBlock: actions.updateBlock,
        selectBlock: actions.selectBlock
      }
    });

    // Register plugins
    useEffect(() => {
      // Register block plugins
      blockPlugins.forEach((plugin: BlockPlugin) => {
        try {
          pluginRegistry.register(plugin);
        } catch (error: any) {
            console.error(`Failed to register block plugin ${plugin.id}:`, error);
            onError?.({ type: 'plugin-error', message: error.message, source: plugin.id, details: error } as EditorError);
        }
      });
      
      // Register markdown plugins
      markdownPlugins.forEach((plugin: MarkdownPlugin) => {
          try {
            pluginRegistry.register(plugin);
          } catch (error: any) {
            console.error(`Failed to register markdown plugin ${plugin.id}:`, error);
            onError?.({ type: 'plugin-error', message: error.message, source: plugin.id, details: error } as EditorError);
          }
        });
      
      return () => {
        // Cleanup plugins on unmount
        blockPlugins.forEach((plugin: BlockPlugin) => {
          try {
            pluginRegistry.unregister(plugin.id);
          } catch (error) {
            console.error(`Failed to unregister block plugin ${plugin.id}:`, error);
          }
        });
        markdownPlugins.forEach((plugin: MarkdownPlugin) => {
          try {
            pluginRegistry.unregister(plugin.id);
          } catch (error) {
            console.error(`Failed to unregister markdown plugin ${plugin.id}:`, error);
          }
        });
      };
    }, [blockPlugins, markdownPlugins, pluginRegistry, onError]);

    // Get block plugin for a given block type
    const getBlockPlugin = (blockType: string) => {
      return blockPlugins.find((plugin: BlockPlugin) => plugin.blockType === blockType);
    };

    // Handle block operations with proper callbacks
    const handleBlockChange = (blockId: string, updates: Partial<EditorBlock>) => {
      actions.updateBlock(blockId, updates);
    };
    
    const handleBlockSelect = (blockId: string) => {
      actions.selectBlock(blockId);
      onSelectionChange?.(blockId);
    };
    
    const handleBlockEdit = (blockId: string) => {
      actions.startEditing(blockId);
      onEditingChange?.(!!blockId);
    };
    
    const handleBlockDelete = (blockId: string) => {
      actions.deleteBlock(blockId);
    };
    
    const handleBlockDuplicate = (blockId: string) => {
      actions.duplicateBlock(blockId);
    };
    
    const handleBlockMove = (blockId: string, direction: 'up' | 'down') => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < blocks.length) {
        actions.moveBlock(blockId, newIndex);
      }
    };

    // Toolbar actions
    const handleToolbarAction = (actionId: string, blockType?: string) => {
      switch (actionId) {
        case 'add-block':
          if (blockType) {
            const newBlock: EditorBlock = {
              id: actions.generateBlockId(),
              type: blockType as any,
              content: '',
              meta: {}
            };
            
            const insertIndex = selectedBlockId 
              ? blocks.findIndex(b => b.id === selectedBlockId) + 1
              : blocks.length;
            
            actions.addBlock(newBlock, insertIndex);
          }
          break;
          
        case 'undo':
          actions.undo();
          break;
          
        case 'redo':
          actions.redo();
          break;
          
        default:
          console.warn(`Unknown toolbar action: ${actionId}`);
      }
    };

    // Focus and scroll operations
    const scrollToBlock = (blockId: string) => {
      // Implementation would depend on block positioning
      // This is a placeholder
      console.log('Scroll to block:', blockId);
    };

    // Expose API through ref
    useImperativeHandle(ref, () => ({
      // Base MarkdownEditorRef methods
      getMarkdown: () => actions.exportToMarkdown(markdownPlugins),
      focus: () => {
        // TODO: Implement focus functionality
        console.warn('focus not yet implemented');
      },
      insertBlock: (type: EditorBlockType, index?: number) => {
        const newBlock: EditorBlock = {
          id: actions.generateBlockId(),
          type: type as EditorBlockType,
          content: '',
          meta: {}
        };
        actions.addBlock(newBlock, index);
      },
      moveBlockUp: (id: string) => {
        const blockIndex = blocks.findIndex(b => b.id === id);
        if (blockIndex > 0) {
          actions.moveBlock(id, blockIndex - 1);
          return true;
        }
        return false;
      },
      moveBlockDown: (id: string) => {
        const blockIndex = blocks.findIndex(b => b.id === id);
        if (blockIndex < blocks.length - 1) {
          actions.moveBlock(id, blockIndex + 1);
          return true;
        }
        return false;
      },
      toggleMode: () => {
        // TODO: Implement mode toggling
        console.warn('toggleMode not yet implemented');
      },
      getCurrentMode: () => 'edit' as EditorMode,
      
      // Block operations
      addBlock: (block: EditorBlock, index?: number) => actions.addBlock(block, index),
      updateBlock: actions.updateBlock,
      deleteBlock: actions.deleteBlock,
      moveBlock: actions.moveBlock,
      duplicateBlock: actions.duplicateBlock,
      
      // Selection operations
      selectBlock: actions.selectBlock,
      clearSelection: actions.clearSelection,
      getSelectedBlock: () => blocks.find(b => b.id === selectedBlockId) || null,
      
      // Editing operations
      startEditing: actions.startEditing,
      stopEditing: actions.stopEditing,
      getEditingBlock: () => blocks.find(b => b.id === editingBlockId) || null,
      
      // Plugin operations
      registerBlockPlugin: (plugin: BlockPlugin) => pluginRegistry.register(plugin),
      unregisterBlockPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      registerMarkdownPlugin: (plugin: MarkdownPlugin) => pluginRegistry.register(plugin),
      unregisterMarkdownPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      getBlockPlugins: () => pluginRegistry.getAllBlockPlugins(),
      getMarkdownPlugins: () => pluginRegistry.getMarkdownPlugins(),
      
      // Content operations
      exportToMarkdown: () => actions.exportToMarkdown(markdownPlugins),
      importFromMarkdown: (markdown: string) => actions.importFromMarkdown(markdown, markdownPlugins),
      exportToPlainText: actions.exportToPlainText,
      getBlocks: () => blocks,
      setBlocks: actions.setBlocks,
      
      // Editor state
      getEditorState: () => editorState,
      
      // Focus operations
      // focus is defined above in base methods
      blur: blurEditor,
      
      // Scroll operations
      scrollToBlock,
      
      // History operations
      undo: () => actions.undo(),
      redo: () => actions.redo(),
      canUndo: () => editorState.history.canUndo,
      canRedo: () => editorState.history.canRedo,
      
      // Plugin methods
      registerPlugin: (plugin: BlockPlugin | MarkdownPlugin) => pluginRegistry.register(plugin),
      unregisterPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      getRegisteredPlugins: () => pluginRegistry.getAllPlugins(),
      
      // Advanced operations
      selectBlocks: (ids: string[]) => {
        // TODO: Implement multi-block selection
        console.warn('selectBlocks not yet implemented');
      },
      validateContent: () => editorState.errors,
      
      // Export/Import operations
      exportToFormat: (format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          return actions.exportToMarkdown(markdownPlugins);
        }
        // TODO: Implement HTML and JSON export
        console.warn(`Export to ${format} not yet implemented`);
        return '';
      },
      importFromFormat: (content: string, format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          actions.importFromMarkdown(content, markdownPlugins);
        } else {
          // TODO: Implement HTML and JSON import
          console.warn(`Import from ${format} not yet implemented`);
        }
      }
    }), [
      actions,
      blocks,
      selectedBlockId,
      editingBlockId,
      editorState,
      pluginRegistry,
      markdownPlugins,
      focusEditor,
      blurEditor,
      scrollToBlock
    ]);

    // Render toolbar
    const renderToolbar = () => {
      if (!editorConfig.toolbar?.enabled) return null;
      
      return (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => handleToolbarAction('add-block', 'paragraph')}
          >
            <Ionicons name="add" size={20} color={editorConfig.theme?.colors?.primary || '#007AFF'} />
            <Text style={styles.toolbarButtonText}>Add Block</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => handleToolbarAction('undo')}
            disabled={!editorState.history.canUndo}
          >
            <Ionicons 
              name="arrow-undo" 
              size={20} 
              color={editorState.history.canUndo ? (editorConfig.theme?.colors?.primary || '#007AFF') : (editorConfig.theme?.colors?.secondary || '#666')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => handleToolbarAction('redo')}
            disabled={!editorState.history.canRedo}
          >
            <Ionicons 
              name="arrow-redo" 
              size={20} 
              color={editorState.history.canRedo ? (editorConfig.theme?.colors?.primary || '#007AFF') : (editorConfig.theme?.colors?.secondary || '#666')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => console.log('Export:', actions.exportToMarkdown(markdownPlugins))}
          >
            <Ionicons name="download" size={20} color={editorConfig.theme?.colors?.primary || '#007AFF'} />
            <Text style={styles.toolbarButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Render block
    const renderBlock = (block: EditorBlock, index: number) => {
      const isSelected = selectedBlockId === block.id;
      const isEditing = editingBlockId === block.id;
      
      // Find the appropriate plugin for this block type
      const plugin = getBlockPlugin(block.type);
      
      if (!plugin) {
        return (
          <View key={block.id} style={styles.errorBlock}>
            <Text style={styles.errorText}>
              No plugin found for block type: {block.type}
            </Text>
          </View>
        );
      }
      
      return (
        <React.Fragment key={block.id}>
          {/* Drop indicator */}
          {dragState.isDragging && (
            <View {...getDropIndicatorProps(index)} />
          )}
          
          {/* Drop zone */}
          <View {...getDropZoneProps(index)}>
            <SafeBlockRenderer
              block={block}
              index={index}
              isSelected={isSelected}
              isEditing={isEditing}
              blockPlugin={plugin}
              config={editorConfig}
              onBlockChange={handleBlockChange}
              onBlockSelect={handleBlockSelect}
              onBlockEdit={handleBlockEdit}
              onBlockDelete={handleBlockDelete}
              onBlockDuplicate={handleBlockDuplicate}
              onBlockMove={handleBlockMove}
              dragHandleProps={getDragHandleProps(block.id)}
              blockProps={getBlockProps(block.id, index)}
            />
          </View>
          
          {/* Final drop indicator */}
          {dragState.isDragging && index === blocks.length - 1 && (
            <View {...getDropIndicatorProps(blocks.length)} />
          )}
        </React.Fragment>
      );
    };

    return (
      <View 
        style={[styles.container, style]} 
        ref={keyboardRef}
        testID="editor-core"
        {...props}
      >
        {renderToolbar()}
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {blocks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons 
                name="document-text-outline" 
                size={48} 
                color={editorConfig.theme?.colors?.secondary || '#666'} 
              />
              <Text style={styles.emptyStateText}>
                Start writing by adding your first block
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => handleToolbarAction('add-block', 'paragraph')}
              >
                <Text style={styles.emptyStateButtonText}>Add Paragraph</Text>
              </TouchableOpacity>
            </View>
          ) : (
            blocks.map(renderBlock)
          )}
        </ScrollView>
        
        {/* Drag overlay */}
        {dragState.isDragging && dragState.draggedBlockId && (
          <View {...getDragOverlayProps()}>
            {(() => {
              const draggedBlock = blocks.find(b => b.id === dragState.draggedBlockId);
              const plugin = draggedBlock ? getBlockPlugin(draggedBlock.type) : null;
              
              if (draggedBlock && plugin) {
                const BlockComponent = plugin.component;
                return (
                  <BlockComponent
                    block={draggedBlock}
                    isSelected={false}
                    isEditing={false}
                    onBlockChange={() => {}}
                    onAction={() => {}}
                    onFocus={() => {}}
                    onBlur={() => {}}
                    config={editorConfig}
                  />
                );
              }
              
              return null;
            })()} 
          </View>
        )}
        
        {editorConfig.debug && (
          <View style={styles.debugPanel}>
            <Text style={styles.debugText}>
              Blocks: {blocks.length} | Selected: {selectedBlockId || 'none'} | Editing: {editingBlockId || 'none'}
            </Text>
            <Text style={styles.debugText}>
              History: {editorState.history.past.length} past, {editorState.history.future.length} future
            </Text>
            <Text style={styles.debugText}>
              Dragging: {dragState.isDragging ? dragState.draggedBlockId : 'none'}
            </Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: '#F8F9FA',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  toolbarButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  blockContainer: {
    marginVertical: 4
  },
  errorBlock: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB3B3',
    marginVertical: 4
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center'
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 1
  }
});

EditorCore.displayName = 'EditorCore';