import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  InteractionManager,
  LayoutChangeEvent,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditorBlock, EditorBlockType } from '../../../types/editor';
import { EditorBottomBar } from '../components/EditorBottomBar';
import { PluginRegistry } from '../plugins/PluginRegistry';
import {
  EditorConfig,
  EditorError,
  ExtendedMarkdownEditorProps,
  ExtendedMarkdownEditorRef,
} from '../types/EditorTypes';
import { BlockPlugin, MarkdownPlugin } from '../types/PluginTypes';
import { FocusManager } from '../utils/FocusManager';
import { SafeBlockRenderer } from './BlockRenderer';
import { useEditor } from './EditorContext';
import { useEditorDragDrop } from './EditorDragDrop';
import { useEditorKeyboard } from './EditorKeyboard';

/**
 * Options for requestBlockFocus
 */
type FocusOptions = {
  reveal?: boolean; // Whether to scroll to make block visible (default: true)
  animated?: boolean; // Whether to animate scroll (default: true)
  viewPosition?: number; // Desired view position (0-1) when revealing (default: 0.5)
  viewOffset?: number; // Additional offset in pixels when revealing (default: 0)
  onRevealFailure?: (details: { blockId: string; extraOffset: number }) => void;
};

/**
 * Estimated block height for getItemLayout before actual measurement
 */
const ESTIMATED_BLOCK_HEIGHT = 60;
const MAX_REVEAL_ATTEMPTS = 3;

/**
 * Legacy type for compatibility during migration
 * @deprecated Use FocusOptions instead
 */
type BlockRefEntry = {
  container: View | null;
  focusable?: any;
};

/**
 * Core editor component that orchestrates all editor functionality
 */
export const EditorCore = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  (
    {
      blockPlugins = [],
      markdownPlugins = [],
      config = {},
      readOnly = false,
      theme,
      onBlocksChange,
      onSelectionChange,
      onEditingChange,
      onError,
      style,
      keyboardHeight = 0,
      keyboardDockVisible = false,
      keyboardDockBlockSection,
      keyboardDockFormattingSection,
      keyboardDockActionSection,
      ...props
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();
    // Plugin registry
    const [pluginRegistry] = useState(() => new PluginRegistry());

    // NEW: FocusManager for coordinating block focus and scroll
    const focusManager = useRef(new FocusManager()).current;

    // NEW: Track block heights for getItemLayout optimization
    const blockHeights = useRef(new Map<string, number>()).current;

    // NEW: Pending focus for newly created blocks (to handle async state updates)
    const pendingFocusBlockId = useRef<string | null>(null);

    // Refs
    const flatListRef = useRef<FlatList<EditorBlock>>(null);
    const editorRef = useRef<View>(null);
    const scrollOffsetRef = useRef(0);
    const pendingRevealBlockId = useRef<string | null>(null);
    const revealRetryCounts = useRef(new Map<string, number>()).current;

    // Legacy refs (kept for drag-drop compatibility during migration)
    const blockRefsMap = useRef<Map<string, BlockRefEntry>>(new Map());

    const [toolbarHeight, setToolbarHeight] = useState(0);
    const [bottomBarHeight, setBottomBarHeight] = useState(0);

    const handleToolbarLayout = useCallback((event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      setToolbarHeight(prev => (Math.abs(prev - height) > 1 ? height : prev));
    }, []);

    const handleBottomBarHeight = useCallback((height: number) => {
      setBottomBarHeight(prev => (Math.abs(prev - height) > 1 ? height : prev));
    }, []);

    useEffect(() => {
      globalThis.__DECANOTES_SAFE_AREA_BOTTOM__ = insets.bottom;
      return () => {
        globalThis.__DECANOTES_SAFE_AREA_BOTTOM__ = 0;
      };
    }, [insets.bottom]);

    useEffect(() => {
      globalThis.__DECANOTES_BOTTOM_BAR_HEIGHT__ = bottomBarHeight;
      return () => {
        globalThis.__DECANOTES_BOTTOM_BAR_HEIGHT__ = 0;
      };
    }, [bottomBarHeight]);

    useEffect(() => {
      globalThis.__DECANOTES_KEYBOARD_HEIGHT__ = keyboardHeight;
      return () => {
        globalThis.__DECANOTES_KEYBOARD_HEIGHT__ = 0;
      };
    }, [keyboardHeight]);

    const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
    }, []);

    const handleScrollSettled = useCallback(() => {
      if (!pendingRevealBlockId.current) {
        return;
      }

      const blockId = pendingRevealBlockId.current;
      pendingRevealBlockId.current = null;
      revealRetryCounts.delete(blockId);
      focusManager.notifyRevealComplete(blockId);
    }, [focusManager, revealRetryCounts]);

    const scheduleRevealCompletionCheck = useCallback(
      (blockId: string) => {
        InteractionManager.runAfterInteractions(() => {
          if (pendingRevealBlockId.current !== blockId) {
            return;
          }

          pendingRevealBlockId.current = null;
          focusManager.notifyRevealComplete(blockId);
        });

        setTimeout(() => {
          if (pendingRevealBlockId.current !== blockId) {
            return;
          }

          pendingRevealBlockId.current = null;
          focusManager.notifyRevealComplete(blockId);
        }, 160);
      },
      [focusManager]
    );

    // ====================
    // NEW: FlatList + FocusManager Functions
    // ====================

    /**
     * Track block heights for getItemLayout optimization
     */
    const handleBlockHeightChange = useCallback(
      (blockId: string, height: number) => {
        blockHeights.set(blockId, height);
      },
      [blockHeights]
    );

    /**
     * Get item layout for FlatList performance optimization
     * This eliminates the need for FlatList to measure items
     */
    const getItemLayout = useCallback(
      (data: ArrayLike<EditorBlock> | null | undefined, index: number) => {
        if (!data || index < 0 || index >= data.length) {
          return { length: ESTIMATED_BLOCK_HEIGHT, offset: 0, index };
        }

        const block = data[index];
        const height = blockHeights.get(block.id) || ESTIMATED_BLOCK_HEIGHT;

        // Calculate offset (sum of all previous block heights)
        let offset = 0;
        for (let i = 0; i < index; i++) {
          offset += blockHeights.get(data[i].id) || ESTIMATED_BLOCK_HEIGHT;
        }

        return { length: height, offset, index };
      },
      [blockHeights]
    );

    /**
     * Handle FlatList scroll-to-index failures
     * This happens when trying to scroll to unmeasured items
     */
    const handleScrollToIndexFailed = useCallback(
      (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
        if (__DEV__) {
          console.log('[EditorCore] scrollToIndex failed, retrying with offset', info);
        }

        // FlatList provides average item length, use it to estimate offset
        const offset = info.averageItemLength * info.index;

        // Scroll to estimated offset
        flatListRef.current?.scrollToOffset({
          offset,
          animated: true,
        });

        // Apply focus after scroll completes
        InteractionManager.runAfterInteractions(() => {
          focusManager.applyPendingFocus();
        });
      },
      [focusManager]
    );

    // ====================
    // End of NEW Functions (Part 1)
    // ====================

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
          ...config.theme?.colors,
        },
        spacing: {
          small: 4,
          medium: 8,
          large: 16,
          ...config.theme?.spacing,
        },
        typography: {
          fontSize: theme?.input?.fontSize || 16,
          lineHeight: theme?.input?.lineHeight || 24,
          fontFamily: 'System',
          ...config.theme?.typography,
        },
      },
      toolbar: {
        enabled: true,
        position: 'top',
        ...config.toolbar,
      },
      dragAndDrop: {
        enabled: true,
        ...config.dragAndDrop,
      },
      keyboard: {
        shortcuts: {},
        ...config.keyboard,
      },
      historyDebounceMs: 300,
      maxHistorySize: 50,
      debug: false,
      ...config,
    };

    const toolbarEnabled = editorConfig.toolbar?.enabled !== false;
    const safeAreaPadding = Math.max(16, insets.bottom);
    const baseContentPadding = bottomBarHeight > 0 ? bottomBarHeight + 40 : Math.max(180, 140 + safeAreaPadding);
    const contentPaddingBottom = baseContentPadding + (keyboardHeight > 0 ? keyboardHeight : 0);

    // Use editor state from EditorProvider
    const {
      state,
      createBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      duplicateBlock,
      selectBlock,
      // selectBlocks,
      clearSelection,
      focusBlock,
      // focusNext,
      // focusPrevious,
      // setMode,
      toggleMode,
      undo,
      redo,
      getMarkdown,
      setMarkdown,
      // validate,
      // reset
    } = useEditor();

    const { blocks, focusedBlockId, selectedBlocks, mode, errors, history } = state;
    // isDirty and isLoading are available in state but not used in this component

    /**
     * NEW: Request focus on a block with optional scroll-to-reveal
     * This is the single entry point for all block focus operations
     *
     * NOTE: For newly created blocks, use pendingFocusBlockId.current instead
     * of calling this directly, as the block may not be in the blocks array yet.
     *
     * @param blockId - ID of block to focus
     * @param options - Focus options
     * @param options.reveal - Whether to scroll to make block visible (default: true)
     * @param options.animated - Whether to animate scroll (default: true)
     */
    const requestBlockFocus = useCallback(
      (blockId: string, options: FocusOptions = {}) => {
        const reveal = options.reveal ?? true;
        const animated = options.animated ?? true;
        const viewPosition = options.viewPosition ?? 0.5;
        const viewOffset = options.viewOffset ?? 0;

        if (__DEV__) {
          console.log('[EditorCore] requestBlockFocus', { blockId, reveal, animated, viewPosition, viewOffset });
        }

        revealRetryCounts.set(blockId, 0);

        const handleRevealFailure = ({ extraOffset }: { blockId: string; extraOffset: number }) => {
          const attempts = (revealRetryCounts.get(blockId) ?? 0) + 1;
          revealRetryCounts.set(blockId, attempts);

          const safetyPadding = Math.max(bottomBarHeight, viewOffset) + 24;
          const targetOffset = Math.max(0, scrollOffsetRef.current + extraOffset + safetyPadding);

          if (attempts >= MAX_REVEAL_ATTEMPTS) {
            pendingRevealBlockId.current = null;
            revealRetryCounts.delete(blockId);
            scrollOffsetRef.current = targetOffset;
            flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
            focusManager.notifyRevealComplete(blockId);
            focusManager.applyPendingFocus();
            return;
          }

          pendingRevealBlockId.current = blockId;
          try {
            flatListRef.current?.scrollToOffset({
              offset: targetOffset,
              animated: true,
            });
            scheduleRevealCompletionCheck(blockId);
          } catch {
            scrollOffsetRef.current = targetOffset;
            flatListRef.current?.scrollToOffset({ offset: targetOffset, animated: false });
            focusManager.notifyRevealComplete(blockId);
            focusManager.applyPendingFocus();
          }

          options.onRevealFailure?.({ blockId, extraOffset });
        };

        // Register focus request with FocusManager
        focusManager.requestFocus(blockId, {
          reveal,
          animated,
          onRevealFailure: details => handleRevealFailure(details),
        });

        // If no reveal needed, just focus immediately
        if (!reveal) {
          focusManager.applyPendingFocus();
          return;
        }

        // Find block index for scrolling
        const blockIndex = blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) {
          console.warn(`[EditorCore] Block not found for focus: ${blockId}`);
          focusManager.clearDesiredFocus();
          return;
        }

        // Scroll to block using FlatList
        try {
          flatListRef.current?.scrollToIndex({
            index: blockIndex,
            animated,
            viewPosition,
            viewOffset,
          });

          if (animated) {
            pendingRevealBlockId.current = blockId;
            scheduleRevealCompletionCheck(blockId);
          } else {
            focusManager.notifyRevealComplete(blockId);
          }
        } catch (error) {
          console.warn('[EditorCore] Failed to scroll to block:', error);
          const { offset: estimatedOffset } = getItemLayout(blocks, blockIndex);
          const fallbackOffset = Math.max(0, estimatedOffset - viewOffset);
          try {
            flatListRef.current?.scrollToOffset({
              offset: fallbackOffset,
              animated,
            });
            if (animated) {
              pendingRevealBlockId.current = blockId;
              scheduleRevealCompletionCheck(blockId);
            } else {
              focusManager.notifyRevealComplete(blockId);
            }
          } catch {
            focusManager.notifyRevealComplete(blockId);
            focusManager.applyPendingFocus();
          }
        }
      },
      [blocks, focusManager, getItemLayout, scheduleRevealCompletionCheck, bottomBarHeight, revealRetryCounts]
    );

    // Keyboard handling hook
    const {
      // keyboardRef,
      // shortcuts,
      // focusEditor,
      blurEditor,
    } = useEditorKeyboard({
      blocks,
      selectedBlockId: focusedBlockId,
      editingBlockId: focusedBlockId, // Using focusedBlockId for editing
      blockPlugins,
      config: editorConfig,
      actions: {
        addBlock: (block: EditorBlock, index?: number) => createBlock(block.type, block.content, index, block.meta),
        updateBlock,
        deleteBlock,
        selectBlock: (blockId: string | null) => selectBlock(blockId || ''),
        startEditing: focusBlock,
        stopEditing: () => selectBlock(''),
        undo,
        redo,
        generateBlockId: () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      },
    });

    // Drag and drop hook
    const {
      dragState,
      getDragHandleProps,
      getDragOverlayProps,
      getDropIndicatorProps,
      getBlockProps,
      getDropZoneProps,
    } = useEditorDragDrop({
      blocks,
      blockPlugins,
      config: editorConfig,
      actions: {
        moveBlock,
        updateBlock,
        selectBlock: (blockId: string | null) => selectBlock(blockId || ''),
      },
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
      const newBlockId = createBlock('paragraph', '', blocks.length);
      if (newBlockId) {
        // Set pending focus - useEffect will apply when block is rendered
        pendingFocusBlockId.current = newBlockId;
      }
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
            meta: { level },
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
            meta: { depth },
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
          meta: { language },
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
            meta: { checked, level },
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
            meta: { listType, level },
          };
        }
      }

      // Check for divider patterns (--- or *** or ___) - single line only
      if (!isMultiline && content.match(/^(---|\*\*\*|___)\s*$/)) {
        return {
          ...updates,
          type: 'divider',
          content: '',
          meta: { dividerStyle: 'solid' },
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
              caption: imageMatch[3] || '',
            },
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
              meta: block.meta,
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
              meta: {},
            };
            const block = plugin.controller.onCreate(tempBlock);
            if (block && block.type === plugin.blockType) {
              return {
                ...updates,
                type: block.type,
                content: block.content,
                meta: block.meta,
              };
            }
          }
        }
      }

      return updates;
    };

    const handleBlockSelect = useCallback(
      (blockId: string) => {
        selectBlock(blockId);
        onSelectionChange?.(blockId);
      },
      [selectBlock, onSelectionChange]
    );

    const handleBlockEdit = useCallback(
      (blockId: string) => {
        focusBlock(blockId);
        onEditingChange?.(!!blockId);
      },
      [focusBlock, onEditingChange]
    );

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
    const handleToolbarAction = (
      actionId: string,
      blockType?: string,
      options?: { content?: string; meta?: Record<string, any> }
    ) => {
      switch (actionId) {
        case 'add-block':
          if (blockType) {
            const insertIndex = focusedBlockId ? blocks.findIndex(b => b.id === focusedBlockId) + 1 : blocks.length;

            const newBlockId = createBlock(blockType, options?.content ?? '', insertIndex, options?.meta);
            if (newBlockId) {
              if (__DEV__) {
                console.log('[EditorCore] add-block created', {
                  newBlockId,
                  insertIndex,
                  previousFocused: focusedBlockId,
                });
              }
              blockRefsMap.current.delete(newBlockId);
              handleBlockSelect(newBlockId);
              handleBlockEdit(newBlockId);
              // Set pending focus - useEffect will apply when block is rendered
              pendingFocusBlockId.current = newBlockId;
            }
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

    // ========================================
    // OLD scroll/focus functions REMOVED
    // Replaced by requestBlockFocus() + FocusManager
    // ========================================

    // Expose API through ref
    useImperativeHandle(
      ref,
      () => ({
        // Base MarkdownEditorRef methods
        getMarkdown: () => getMarkdown(),
        setMarkdown: (markdown: string) => setMarkdown(markdown),
        getBlocks: () => blocks,
        setBlocks: (newBlocks: EditorBlock[]) => {
          // TODO: Implement setBlocks
          // Not yet implemented
        },
        focus: () => {
          // Focus the currently focused block, or focus the last block
          if (focusedBlockId) {
            requestBlockFocus(focusedBlockId);
          } else if (blocks.length > 0) {
            const lastBlockId = blocks[blocks.length - 1].id;
            focusBlock(lastBlockId);
            requestBlockFocus(lastBlockId);
          }
        },
        insertBlock: (
          type: EditorBlockType,
          index?: number,
          options?: { meta?: Record<string, any>; content?: string }
        ) => {
          const newBlockId = createBlock(type, options?.content ?? '', index, options?.meta);
          if (!newBlockId) {
            return;
          }

          if (__DEV__) {
            console.log('[EditorCore] insertBlock', {
              newBlockId,
              type,
              index,
              focusedBlockId,
            });
          }

          handleBlockSelect(newBlockId);
          handleBlockEdit(newBlockId);
          // Set pending focus - useEffect will apply when block is rendered
          pendingFocusBlockId.current = newBlockId;
          return newBlockId;
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
        addBlock: (block: EditorBlock, index?: number) => createBlock(block.type, block.content, index, block.meta),
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

        // Content operations (use context methods which now use MarkdownRegistry)
        exportToMarkdown: () => getMarkdown(),
        importFromMarkdown: (markdown: string) => setMarkdown(markdown),
        exportToPlainText: () => blocks.map(b => b.content).join('\n'),

        // Editor state
        getEditorState: () => state,

        // Focus operations
        // focus is defined above in base methods
        blur: blurEditor,

        // Scroll and focus operations (NEW API)
        requestBlockFocus,

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
        },
      }),
      [
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
        blurEditor,
        requestBlockFocus,
        handleBlockSelect,
        handleBlockEdit,
        errors,
        history.canRedo,
        history.canUndo,
        mode,
      ]
    );

    // Render toolbar
    const renderToolbar = () => {
      if (!toolbarEnabled) return null;

      return (
        <View style={styles.toolbar} onLayout={handleToolbarLayout}>
          <TouchableOpacity style={styles.toolbarButton} onPress={() => handleToolbarAction('add-block', 'paragraph')}>
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
              color={
                history.canUndo
                  ? editorConfig.theme?.colors?.primary || '#007AFF'
                  : editorConfig.theme?.colors?.secondary || '#666'
              }
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
              color={
                history.canRedo
                  ? editorConfig.theme?.colors?.primary || '#007AFF'
                  : editorConfig.theme?.colors?.secondary || '#666'
              }
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.toolbarButton} onPress={() => console.log('Export:', getMarkdown())}>
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
            <Text style={styles.errorText}>No plugin found for block type: {block.type}</Text>
          </View>
        );
      }

      return (
        <React.Fragment key={block.id}>
          {/* Drop indicator */}
          {dragState.isDragging && <View {...getDropIndicatorProps(index)} />}

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
              focusManager={focusManager}
              onBlockHeightChange={handleBlockHeightChange}
              onBlockRefReady={ref => {
                // Legacy ref tracking for drag-drop compatibility
                if (ref) {
                  blockRefsMap.current.set(block.id, ref);
                } else {
                  blockRefsMap.current.delete(block.id);
                }
              }}
            />
          </View>

          {/* Final drop indicator */}
          {/* Disabled temporarily due to dragState not being used */}
          {/* {dragState.isDragging && index === blocks.length - 1 && (
            <View {...getDropIndicatorProps(blocks.length)} />
          )} */}
        </React.Fragment>
      );
    };

    /**
     * NEW: Render item for FlatList
     * Adapter between FlatList's renderItem and our renderBlock function
     */
    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<EditorBlock>) => {
        return renderBlock(item, index);
      },
      [renderBlock]
    );

    /**
     * NEW: Render footer (empty space for creating new blocks)
     */
    const renderFooter = useCallback(() => {
      return (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.addBlockButton}
            onPress={handleEmptySpacePress}
            accessibilityRole="button"
            accessibilityLabel="Add a new block"
          >
            <Ionicons name="add-circle-outline" size={20} color="#667085" />
            <Text style={styles.addBlockText}>Add block</Text>
          </TouchableOpacity>
        </View>
      );
    }, [handleEmptySpacePress]);

    // ========================================
    // NEW: Effect to apply pending focus when block is rendered
    // ========================================
    useEffect(() => {
      const pendingId = pendingFocusBlockId.current;
      if (!pendingId) return;

      const blockExists = blocks.some(b => b.id === pendingId);

      if (blockExists) {
        pendingFocusBlockId.current = null;

        if (__DEV__) {
          console.log('[EditorCore] Pending block ready, applying focus', { blockId: pendingId });
        }

        const viewPosition = 0; // Position at top, let viewOffset control spacing
        // Reserve space for keyboard even if not shown yet (it will appear when we focus)
        // Typical iOS keyboard is ~290-336px, Android ~260-290px
        const estimatedKeyboardHeight = keyboardHeight > 0 ? keyboardHeight : 290;
        // Add extra padding: keyboard + bottomBar + dock + safe area + padding
        const viewOffset = estimatedKeyboardHeight + bottomBarHeight + 100; // Extra 100px for dock and safe area

        requestBlockFocus(pendingId, {
          reveal: true,
          animated: true,
          viewPosition,
          viewOffset,
        });
      }
    }, [blocks, requestBlockFocus, keyboardHeight, bottomBarHeight]);

    // Adjust scroll when keyboard appears to keep focused block visible
    useEffect(() => {
      if (keyboardHeight === 0 || !focusedBlockId) {
        return;
      }

      // When keyboard appears, ensure focused block is still visible
      const blockIndex = blocks.findIndex(b => b.id === focusedBlockId);
      if (blockIndex === -1) {
        return;
      }

      // Wait a bit for keyboard animation to settle
      const timer = setTimeout(async () => {
        if (!focusManager.isBlockRegistered(focusedBlockId)) {
          return;
        }

        const blockIndex = blocks.findIndex(b => b.id === focusedBlockId);
        if (blockIndex === -1) return;

        const { height: windowHeight } = Dimensions.get('window');
        const safeArea = globalThis.__DECANOTES_SAFE_AREA_BOTTOM__ ?? 0;

        // Measure actual block position on screen
        const layout = await focusManager.measureBlock(focusedBlockId);

        if (!layout) {
          // Fallback to estimated positioning if measurement fails
          const targetY = windowHeight * 0.3;
          const { offset: blockOffset } = getItemLayout(blocks, blockIndex);
          const newOffset = blockOffset - targetY;

          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, newOffset),
            animated: true,
          });
          return;
        }

        // Calculate visible area (above keyboard and bottom bar)
        const visibleBottom = windowHeight - keyboardHeight - bottomBarHeight - safeArea;
        const blockBottom = layout.y + layout.height;

        // Check if block is hidden or too low
        const padding = 48; // Keep some padding above keyboard
        const targetBottom = visibleBottom - padding;

        if (blockBottom > targetBottom) {
          // Need to scroll up
          const currentScroll = scrollOffsetRef.current;
          const excessOverflow = blockBottom - targetBottom;
          const newOffset = currentScroll + excessOverflow;

          if (__DEV__) {
            console.log('[EditorCore] Adjusting scroll for keyboard', {
              focusedBlockId,
              blockY: layout.y,
              blockHeight: layout.height,
              blockBottom,
              visibleBottom,
              targetBottom,
              excessOverflow,
              currentScroll,
              newOffset,
            });
          }

          flatListRef.current?.scrollToOffset({
            offset: Math.max(0, newOffset),
            animated: true,
          });
        }
      }, 150); // Wait for keyboard animation

      return () => clearTimeout(timer);
    }, [keyboardHeight, focusedBlockId, blocks, bottomBarHeight, focusManager, getItemLayout]);

    // ========================================
    // OLD useEffects REMOVED
    // All scroll/focus coordination now handled by requestBlockFocus + FocusManager
    // No need for manual useEffects watching focusedBlockId, keyboardHeight, etc.
    // ========================================

    return (
      <View style={[styles.container, style]} ref={editorRef} testID="editor-core" {...props}>
        {toolbarEnabled && renderToolbar()}

        {/* NEW: FlatList for virtualized rendering */}
        <FlatList
          ref={flatListRef}
          data={blocks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          style={styles.content}
          onScroll={handleListScroll}
          contentContainerStyle={[
            styles.contentContainer,
            {
              // Dynamic padding to account for keyboard + bottom bar
              paddingBottom: contentPaddingBottom,
            },
          ]}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true} // Performance optimization
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={21}
          onMomentumScrollEnd={handleScrollSettled}
          onScrollEndDrag={handleScrollSettled}
          ListFooterComponent={renderFooter}
        />

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
            <Text style={styles.debugText}>Dragging: {dragState.isDragging ? dragState.draggedBlockId : 'none'}</Text>
          </View>
        )}

        {/* Unified bottom bar with toolbar and keyboard dock */}
        <EditorBottomBar
          keyboardHeight={keyboardHeight}
          visible={keyboardDockVisible}
          readOnly={readOnly}
          blockSection={keyboardDockBlockSection}
          formattingSection={keyboardDockFormattingSection}
          actionSection={keyboardDockActionSection}
          onHeightChange={handleBottomBarHeight}
        />
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
  contentContainer: {
    // paddingBottom is dynamic - applied inline
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
    marginVertical: 4,
  },
  errorBlock: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB3B3',
    marginVertical: 4,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  debugPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'monospace',
    marginVertical: 1,
  },
  editorContent: {
    flex: 1,
    minHeight: '100%',
  },
  blocksContainer: {
    flex: 1,
  },
  footerContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    backgroundColor: '#FFFFFF',
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addBlockText: {
    fontSize: 14,
    color: '#344054',
    fontWeight: '500',
    marginLeft: 8,
  },
});

EditorCore.displayName = 'EditorCore';
