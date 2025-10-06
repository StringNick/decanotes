import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../types/editor';
import { PluginRegistry } from '../plugins/PluginRegistry';
import { EditorConfig, EditorError, ExtendedMarkdownEditorProps, ExtendedMarkdownEditorRef } from '../types/EditorTypes';
import { BlockPlugin, MarkdownPlugin } from '../types/PluginTypes';
import { SafeBlockRenderer } from './BlockRenderer';
import { useEditor } from './EditorContext';
import { useEditorDragDrop } from './EditorDragDrop';
import { useEditorKeyboard } from './EditorKeyboard';

/**
 * Core editor component that orchestrates all editor functionality
 */
export const EditorCore = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  ({
    blockPlugins = [],
    markdownPlugins = [],
    config = {},
    theme,
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
    const blockRefsMap = useRef<Map<string, any>>(new Map());
    const shouldFocusLastBlock = useRef(false);
    
    // Configuration with defaults
    const editorConfig: EditorConfig = {
      theme: {
        colors: {
          primary: theme?.input?.color || '#007AFF',
          primaryLight: '#E3F2FD',
          secondary: theme?.placeholder?.color || '#666',
          background: theme?.container?.backgroundColor || '#fff',
          text: theme?.input?.color || '#000',
          border: theme?.focusedBlock?.backgroundColor || '#E5E5E7',
          ...config.theme?.colors
        },
        spacing: {
          small: 4,
          medium: 8,
          large: 16,
          ...config.theme?.spacing
        },
        typography: {
          fontSize: theme?.input?.fontSize || 16,
          lineHeight: theme?.input?.lineHeight || 24,
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

    // Use editor state from EditorProvider
    const {
      state,
      createBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      duplicateBlock,
      selectBlock,
      selectBlocks,
      clearSelection,
      focusBlock,
      focusNext,
      focusPrevious,
      setMode,
      toggleMode,
      undo,
      redo,
      getMarkdown,
      setMarkdown,
      validate,
      reset
    } = useEditor();
    
    const { blocks, focusedBlockId, selectedBlocks, mode, isDirty, isLoading, errors, history } = state;
    
    // Keyboard handling hook
    const {
      keyboardRef,
      shortcuts,
      focusEditor,
      blurEditor
    } = useEditorKeyboard({
      blocks,
      selectedBlockId: focusedBlockId,
      editingBlockId: focusedBlockId, // Using focusedBlockId for editing
      blockPlugins,
      config: editorConfig,
      actions: {
        addBlock: (block: EditorBlock, index?: number) => createBlock(block.type, block.content, index),
        updateBlock,
        deleteBlock,
        selectBlock: (blockId: string | null) => selectBlock(blockId || ''),
        startEditing: focusBlock,
        stopEditing: () => selectBlock(''),
        undo,
        redo,
        generateBlockId: () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
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
        moveBlock,
        updateBlock,
        selectBlock: (blockId: string | null) => selectBlock(blockId || '')
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

    // Handle clicking on empty space to create new paragraph
    const handleEmptySpacePress = useCallback(() => {
      // Create a new paragraph block at the end
      createBlock('paragraph', '', blocks.length);
      // Mark that we should focus the last block after it's created
      shouldFocusLastBlock.current = true;
    }, [createBlock, blocks.length]);

    // Handle block operations with proper callbacks
    const handleBlockChange = (blockId: string, updates: Partial<EditorBlock>) => {
      // Check for real-time markdown transformation when content changes
      if (updates.content !== undefined) {
        const transformedUpdates = detectAndTransformMarkdown(updates, blockPlugins, markdownPlugins);
        updateBlock(blockId, transformedUpdates);
      } else {
        updateBlock(blockId, updates);
      }
    };
    
    // Detect markdown patterns and transform block type
    const detectAndTransformMarkdown = (
      updates: Partial<EditorBlock>, 
      blockPlugins: BlockPlugin[], 
      markdownPlugins: MarkdownPlugin[]
    ): Partial<EditorBlock> => {
      const content = updates.content || '';
      
      // Skip transformation if content is empty
      if (!content.trim()) {
        return updates;
      }
      
      // Allow multiline content for code blocks
      const isMultiline = content.includes('\n');
      
      // Check for heading patterns (# ## ###) - single line only
      if (!isMultiline) {
        const headingMatch = content.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
          const level = headingMatch[1].length;
          const headingContent = headingMatch[2];
          return {
            ...updates,
            type: 'heading',
            content: headingContent,
            meta: { level }
          };
        }
      }
      
      // Check for quote pattern (> text) - single line only
      if (!isMultiline) {
        const quoteMatch = content.match(/^(>+)\s*(.*)$/);
        if (quoteMatch) {
          const depth = quoteMatch[1].length;
          const quoteContent = quoteMatch[2];
          return {
            ...updates,
            type: 'quote',
            content: quoteContent,
            meta: { depth }
          };
        }
      }
      
      // Check for code block pattern (```) - can be multiline
      if (content.startsWith('```')) {
        const firstLine = content.split('\n')[0];
        const language = firstLine.substring(3).trim() || 'text';
        const codeContent = isMultiline ? content.substring(content.indexOf('\n') + 1).replace(/\n?```$/, '') : '';
        return {
          ...updates,
          type: 'code',
          content: codeContent,
          meta: { language }
        };
      }
      
      // Check for checklist patterns first (- [ ] item or - [x] item) - single line only
      if (!isMultiline) {
        const checklistMatch = content.match(/^(\s*)-\s+\[([ x])\]\s+(.+)$/);
        if (checklistMatch) {
          const indentation = checklistMatch[1];
          const checkState = checklistMatch[2];
          const checklistContent = checklistMatch[3];
          const level = Math.floor(indentation.length / 2);
          const checked = checkState === 'x';
          
          return {
            ...updates,
            type: 'checklist',
            content: checklistContent,
            meta: { checked, level }
          };
        }
      }
       
      // Check for list patterns (- item or 1. item) - single line only
      if (!isMultiline) {
        const listMatch = content.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
        if (listMatch) {
          const indentation = listMatch[1];
          const marker = listMatch[2];
          const listContent = listMatch[3];
          const level = Math.floor(indentation.length / 2);
          const listType = /\d+\./.test(marker) ? 'ordered' : 'unordered';
          
          return {
            ...updates,
            type: 'list',
            content: listContent,
            meta: { listType, level }
          };
        }
      }
      
      // Check for divider patterns (--- or *** or ___) - single line only
      if (!isMultiline && content.match(/^(---|\*\*\*|___)\s*$/)) {
        return {
          ...updates,
          type: 'divider',
          content: '',
          meta: { dividerStyle: 'solid' }
        };
      }
      
      // Check for image patterns ![alt](url) - single line only
        if (!isMultiline) {
          const imageRegex = new RegExp('^!\\[([^\\]]*)\\]\\(([^\\s)]+)(?:\\s+"([^"]*)")?\\)$');
          const imageMatch = content.match(imageRegex);
          if (imageMatch) {
            return {
              ...updates,
              type: 'image',
              content: imageMatch[2], // URL
              meta: { 
                alt: imageMatch[1] || 'Image',
                url: imageMatch[2],
                caption: imageMatch[3] || ''
              }
            };
          }
        }
      
      // Try plugin-based markdown parsing
      for (const plugin of markdownPlugins) {
        if (plugin.parser && plugin.parser.canParse(content)) {
          const block = plugin.parser.parseBlock(content);
          if (block) {
            return {
              ...updates,
              type: block.type,
              content: block.content,
              meta: block.meta
            };
          }
        }
      }
      
      // Try block plugin markdown parsing
       for (const plugin of blockPlugins) {
         if (plugin.markdownSyntax && plugin.markdownSyntax.patterns.block) {
           const match = content.match(plugin.markdownSyntax.patterns.block);
           if (match && plugin.controller && plugin.controller.onCreate) {
             const tempBlock = {
               id: 'temp',
               type: plugin.blockType as any,
               content: content,
               meta: {}
             };
             const block = plugin.controller.onCreate(tempBlock);
             if (block && block.type === plugin.blockType) {
               return {
                 ...updates,
                 type: block.type,
                 content: block.content,
                 meta: block.meta
               };
             }
           }
         }
       }
      
      return updates;
    };
    
    const handleBlockSelect = (blockId: string) => {
      selectBlock(blockId);
      onSelectionChange?.(blockId);
    };
    
    const handleBlockEdit = (blockId: string) => {
      focusBlock(blockId);
      onEditingChange?.(!!blockId);
    };
    
    const handleBlockDelete = (blockId: string) => {
      deleteBlock(blockId);
    };
    
    const handleBlockDuplicate = (blockId: string) => {
      duplicateBlock(blockId);
    };
    
    const handleBlockMove = (blockId: string, direction: 'up' | 'down') => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex >= 0 && newIndex < blocks.length) {
        moveBlock(blockId, newIndex);
      }
    };

    // Toolbar actions
    const handleToolbarAction = (actionId: string, blockType?: string) => {
      switch (actionId) {
        case 'add-block':
          if (blockType) {
            const insertIndex = focusedBlockId 
              ? blocks.findIndex(b => b.id === focusedBlockId) + 1
              : blocks.length;
            
            createBlock(blockType, '', insertIndex);
          }
          break;
          
        case 'undo':
          undo();
          break;
          
        case 'redo':
          redo();
          break;
          
        default:
          // Unknown toolbar action
      }
    };

    // Focus and scroll operations
    const scrollToBlock = useCallback((blockId: string) => {
      const blockRef = blockRefsMap.current.get(blockId);
      if (blockRef && scrollViewRef.current) {
        // Measure the block's position and scroll to it
        blockRef.measureLayout(
          editorRef.current,
          (x: number, y: number, width: number, height: number) => {
            scrollViewRef.current?.scrollTo({
              y: Math.max(0, y - 100), // Offset for better visibility
              animated: true
            });
          },
          (error: any) => {
            console.warn('Failed to measure block position:', error);
          }
        );
      }
    }, []);
    
    // Focus block with input focus
    const focusBlockInput = useCallback((blockId: string) => {
      const blockRef = blockRefsMap.current.get(blockId);
      if (blockRef?.focus) {
        // Slight delay to ensure the block is rendered
        setTimeout(() => {
          blockRef.focus();
        }, 50);
      }
    }, []);

    // Expose API through ref
    useImperativeHandle(ref, () => ({
      // Base MarkdownEditorRef methods
      getMarkdown: () => getMarkdown(),
      focus: () => {
        // Focus the currently focused block, or focus the last block
        if (focusedBlockId) {
          focusBlockInput(focusedBlockId);
          scrollToBlock(focusedBlockId);
        } else if (blocks.length > 0) {
          const lastBlockId = blocks[blocks.length - 1].id;
          focusBlock(lastBlockId);
          focusBlockInput(lastBlockId);
          scrollToBlock(lastBlockId);
        }
      },
      insertBlock: (type: EditorBlockType, index?: number) => {
        createBlock(type, '', index);
      },
      moveBlockUp: (id: string) => {
        const blockIndex = blocks.findIndex(b => b.id === id);
        if (blockIndex > 0) {
          moveBlock(id, blockIndex - 1);
          return true;
        }
        return false;
      },
      moveBlockDown: (id: string) => {
        const blockIndex = blocks.findIndex(b => b.id === id);
        if (blockIndex < blocks.length - 1) {
          moveBlock(id, blockIndex + 1);
          return true;
        }
        return false;
      },
      toggleMode: () => {
        toggleMode();
      },
      getCurrentMode: () => mode,
      
      // Block operations
      addBlock: (block: EditorBlock, index?: number) => createBlock(block.type, block.content, index),
      updateBlock: updateBlock,
      deleteBlock: deleteBlock,
      moveBlock: moveBlock,
      duplicateBlock: duplicateBlock,
      
      // Selection operations
      selectBlock: selectBlock,
      clearSelection: clearSelection,
      getSelectedBlock: () => blocks.find(b => b.id === focusedBlockId) || null,
      
      // Editing operations
      startEditing: focusBlock,
      stopEditing: () => selectBlock(''),
      getEditingBlock: () => blocks.find(b => b.id === focusedBlockId) || null,
      
      // Plugin operations
      registerBlockPlugin: (plugin: BlockPlugin) => pluginRegistry.register(plugin),
      unregisterBlockPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      registerMarkdownPlugin: (plugin: MarkdownPlugin) => pluginRegistry.register(plugin),
      unregisterMarkdownPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      getBlockPlugins: () => pluginRegistry.getAllBlockPlugins(),
      getMarkdownPlugins: () => pluginRegistry.getMarkdownPlugins(),
      
      // Content operations
      exportToMarkdown: () => getMarkdown(),
      importFromMarkdown: (markdown: string) => setMarkdown(markdown),
      exportToPlainText: () => blocks.map(b => b.content).join('\n'),
      getBlocks: () => blocks,
      setBlocks: (newBlocks: EditorBlock[]) => {
        // TODO: Implement setBlocks
        // Not yet implemented
      },
      
      // Editor state
      getEditorState: () => state,
      
      // Focus operations
      // focus is defined above in base methods
      blur: blurEditor,
      
      // Scroll operations
      scrollToBlock,
      
      // History operations
      undo: () => undo(),
      redo: () => redo(),
      canUndo: () => history.canUndo,
      canRedo: () => history.canRedo,
      
      // Plugin methods
      registerPlugin: (plugin: BlockPlugin | MarkdownPlugin) => pluginRegistry.register(plugin),
      unregisterPlugin: (pluginId: string) => pluginRegistry.unregister(pluginId),
      getRegisteredPlugins: () => pluginRegistry.getAllPlugins(),
      
      // Advanced operations
      selectBlocks: (ids: string[]) => {
        // TODO: Implement multi-block selection
        // Not yet implemented
      },
      validateContent: () => errors,
      
      // Export/Import operations
      exportToFormat: (format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          return getMarkdown();
        }
        // TODO: Implement HTML and JSON export
        return '';
      },
      importFromFormat: (content: string, format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          setMarkdown(content);
        } else {
          // TODO: Implement HTML and JSON import
          // Not yet implemented
        }
      }
    }), [
      createBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      duplicateBlock,
      selectBlock,
      clearSelection,
      focusBlock,
      getMarkdown,
      setMarkdown,
      undo,
      redo,
      toggleMode,
      blocks,
      focusedBlockId,
      state,
      pluginRegistry,
      markdownPlugins,
      focusEditor,
      blurEditor,
      scrollToBlock,
      focusBlockInput
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
            disabled={!history.canUndo}
          >
            <Ionicons 
              name="arrow-undo" 
              size={20} 
              color={history.canUndo ? (editorConfig.theme?.colors?.primary || '#007AFF') : (editorConfig.theme?.colors?.secondary || '#666')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => handleToolbarAction('redo')}
            disabled={!history.canRedo}
          >
            <Ionicons 
              name="arrow-redo" 
              size={20} 
              color={history.canRedo ? (editorConfig.theme?.colors?.primary || '#007AFF') : (editorConfig.theme?.colors?.secondary || '#666')} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.toolbarButton}
            onPress={() => console.log('Export:', getMarkdown())}
          >
            <Ionicons name="download" size={20} color={editorConfig.theme?.colors?.primary || '#007AFF'} />
            <Text style={styles.toolbarButtonText}>Export</Text>
          </TouchableOpacity>
        </View>
      );
    };

    // Render block
    const renderBlock = (block: EditorBlock, index: number) => {
      const isSelected = selectedBlocks.includes(block.id);
      const isEditing = focusedBlockId === block.id;
      
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
              onBlockRefReady={(ref) => {
                if (ref) {
                  blockRefsMap.current.set(block.id, ref);
                } else {
                  blockRefsMap.current.delete(block.id);
                }
              }}
            />
          </View>
          
          {/* Final drop indicator */}
          {dragState.isDragging && index === blocks.length - 1 && (
            <View {...getDropIndicatorProps(blocks.length)} />
          )}
        </React.Fragment>
      );
    };

    // Effect to focus newly created blocks
    useEffect(() => {
      if (focusedBlockId && blocks.find(b => b.id === focusedBlockId)) {
        focusBlockInput(focusedBlockId);
        scrollToBlock(focusedBlockId);
      }
    }, [focusedBlockId]);
    
    // Effect to auto-focus last block when created via empty space press
    useEffect(() => {
      if (shouldFocusLastBlock.current && blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        shouldFocusLastBlock.current = false;
        // Focus the last block
        focusBlock(lastBlock.id);
        selectBlock(lastBlock.id);
      }
    }, [blocks, focusBlock, selectBlock]);

    return (
      <View 
        style={[styles.container, style]} 
        ref={editorRef}
        testID="editor-core"
        {...props}
      >
        {editorConfig.toolbar?.enabled !== false && renderToolbar()}
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.blocksContainer}>
            {blocks.map(renderBlock)}
          </View>
          
          {/* Clickable empty space to create new block */}
          <TouchableOpacity
            style={styles.emptySpace}
            onPress={handleEmptySpacePress}
            activeOpacity={1}
          >
            <Text style={styles.emptySpaceHint}>Tap here to add a new block...</Text>
          </TouchableOpacity>
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
              Blocks: {blocks.length} | Selected: {focusedBlockId || 'none'} | Editing: {focusedBlockId || 'none'}
            </Text>
            <Text style={styles.debugText}>
              History: {history.past.length} past, {history.future.length} future
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
    backgroundColor: 'transparent',
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
  },
  editorContent: {
    flex: 1,
    minHeight: '100%'
  },
  blocksContainer: {
    flex: 1
  },
  emptySpace: {
    minHeight: 200,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptySpaceHint: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic'
  }
});

EditorCore.displayName = 'EditorCore';