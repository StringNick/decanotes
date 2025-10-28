import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { EditorBlock } from '../../types/editor';
import { useEditor } from './core/EditorContext';
import { EditorCore } from './core/EditorCore';
import EditorProvider from './core/EditorProvider';
import { useEditorKeyboard } from './EditorKeyboard';
import { ExtendedMarkdownEditorProps, ExtendedMarkdownEditorRef } from './types/EditorTypes';
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from './utils/MarkdownRegistry';
import { EditorThemeProvider } from './contexts/EditorThemeContext';

// Built-in plugins
import {
  CalloutPlugin,
  ChecklistPlugin,
  CodePlugin,
  DividerPlugin,
  HeadingPlugin,
  ImagePlugin,
  ListPlugin,
  ParagraphPlugin,
  QuotePlugin,
  TablePlugin,
  VideoPlugin
} from './plugins/built-in';

/**
 * Internal editor component that has access to editor context
 */
const EditorWithContext = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  (props, ref) => {
    const {
      // initialBlocks prop is unused here - we use state.blocks from context
      // initialBlocks = [] as any,
      plugins = [],
      config = {},
      onContentChange,
      onBlocksChange,
      onSelectionChange,
      onError,
      style,
      theme = 'light',
      readOnly = false,
      autoFocus = false,
      placeholder = 'Start writing...',
      shortcuts = [],
      keyboardHeight,
      keyboardDockVisible,
      keyboardDockBlockSection,
      keyboardDockFormattingSection,
      keyboardDockActionSection,
      ...otherProps
    } = props;

    const context = useEditor();
    const { state, pluginRegistry } = context;

    // Use the plugins passed from the parent component
    const allPlugins = plugins || [];
  
  // Create actions object for compatibility
  const actions = {
    dispatch: context.dispatch,
    createBlock: context.createBlock,
    updateBlock: context.updateBlock,
    deleteBlock: context.deleteBlock,
    moveBlock: context.moveBlock,
    duplicateBlock: context.duplicateBlock,
    selectBlock: context.selectBlock,
    selectBlocks: context.selectBlocks,
    clearSelection: context.clearSelection,
    focusBlock: context.focusBlock,
    focusNext: context.focusNext,
    focusPrevious: context.focusPrevious,
    setMode: context.setMode,
    toggleMode: context.toggleMode,
    undo: context.undo,
    redo: context.redo,
    getMarkdown: context.getMarkdown,
    setMarkdown: context.setMarkdown,
    validate: context.validate,
    reset: context.reset,
    setBlocks: (blocks: EditorBlock[]) => {
      context.dispatch({ type: 'SET_BLOCKS', blocks });
    },
    exportContent: (format: string) => {
      if (format === 'markdown') {
        return serializeBlocksToMarkdown(state.blocks);
      }
      return JSON.stringify(state.blocks);
    },
    importContent: (content: string, format: string) => {
      if (format === 'markdown') {
        const blocks = parseMarkdownToBlocks(content, allPlugins);
        context.dispatch({ type: 'SET_BLOCKS', blocks });
      } else {
        try {
          const blocks = JSON.parse(content);
          context.dispatch({ type: 'SET_BLOCKS', blocks });
        } catch (e) {
          console.error('Failed to import content:', e);
        }
      }
    },
    registerPlugin: (plugin: any) => {
      pluginRegistry.register(plugin);
    },
    unregisterPlugin: (id: string) => {
      pluginRegistry.unregister(id);
    }
  };
    const editorRef = useRef<any>(null);

    // Set up keyboard handling
    const { handleKeyDown } = useEditorKeyboard({
      onAction: actions.dispatch,
      getCurrentBlock: () => state.focusedBlockId ? 
        (state.blocks.find((b: EditorBlock) => b.id === state.focusedBlockId) as EditorBlock) || null : null,
      getSelectedBlocks: () => state.selectedBlocks.map((id: string) => 
        state.blocks.find((b: EditorBlock) => b.id === id)).filter(Boolean) as EditorBlock[],
      pluginRegistry,
      shortcuts
    });

    // Expose editor methods via ref
    useImperativeHandle(ref, () => ({
      // Content methods
      getBlocks: () => state.blocks,
      setBlocks: (blocks: EditorBlock[]) => {
        actions.setBlocks(blocks);
      },
      getMarkdown: () => serializeBlocksToMarkdown(state.blocks),
      setMarkdown: (markdown: string) => {
        const blocks = parseMarkdownToBlocks(markdown, allPlugins);
        actions.setBlocks(blocks);
      },
      insertBlock: (type: any, index?: number, options?: { meta?: Record<string, any>; content?: string }) => {
        const newBlockId = editorRef.current?.insertBlock(type, index, options);

        if (newBlockId) {
          if (__DEV__) {
            console.log('[MarkdownEditor] insertBlock delegated', {
              newBlockId,
              type,
              index
            });
          }
          return newBlockId;
        }

        if (__DEV__) {
          console.warn('[MarkdownEditor] insertBlock fallback path', {
            type,
            index
          });
        }

        const fallbackId = actions.createBlock(type, options?.content ?? '', index, options?.meta);
        return fallbackId || null;
      },
      updateBlock: (id: string, updates: Partial<EditorBlock>) => {
        actions.updateBlock(id, updates);
      },
      deleteBlock: (id: string) => {
        actions.deleteBlock(id);
      },
      duplicateBlock: (id: string) => {
        actions.duplicateBlock(id);
      },
      moveBlock: (id: string, newIndex: number) => {
        actions.moveBlock(id, newIndex);
      },

      // Selection methods
      getSelection: () => ({
        focusedBlockId: state.focusedBlockId,
        selectedBlockIds: state.selectedBlocks,
        selectionRange: null
      }),
      setSelection: (selection: any) => {
        if (selection.focusedBlockId !== undefined) {
          actions.focusBlock(selection.focusedBlockId);
        }
        if (selection.selectedBlockIds !== undefined) {
          actions.selectBlocks(selection.selectedBlockIds);
        }
        // Note: selectionRange is not implemented in the current context
      },
      selectBlock: (id: string) => {
        actions.focusBlock(id);
        actions.selectBlocks([id]);
      },
      selectBlocks: (ids: string[]) => {
        actions.selectBlocks(ids);
      },
      clearSelection: () => {
        actions.selectBlocks([]);
        actions.focusBlock('');
      },

      // Focus methods
      focus: () => {
        if (editorRef.current?.focus) {
          editorRef.current.focus();
        }
      },
      blur: () => {
        if (editorRef.current?.blur) {
          editorRef.current.blur();
        }
      },
      focusBlock: (id: string) => {
        actions.focusBlock(id);
      },

      // History methods
      undo: () => {
        actions.undo();
      },
      redo: () => {
        actions.redo();
      },
      canUndo: () => state.history.past.length > 0,
      canRedo: () => state.history.future.length > 0,

      // Plugin methods
      registerPlugin: (plugin) => {
        actions.registerPlugin(plugin);
      },
      unregisterPlugin: (id: string) => {
        actions.unregisterPlugin(id);
      },
      getPlugin: (id: string) => {
        return pluginRegistry.getPlugin(id);
      },
      getPlugins: () => ({
        blockPlugins: pluginRegistry.getAllBlockPlugins(),
        markdownPlugins: pluginRegistry.getMarkdownPlugins()
      }),

      // Utility methods
      exportContent: (format: 'markdown' | 'json' = 'markdown') => {
        if (format === 'markdown') {
          return serializeBlocksToMarkdown(state.blocks);
        }
        return JSON.stringify(state.blocks);
      },
      importContent: (content: string, format: 'markdown' | 'json' = 'markdown') => {
        if (format === 'markdown') {
          const blocks = parseMarkdownToBlocks(content, allPlugins);
          actions.setBlocks(blocks);
        } else {
          try {
            const blocks = JSON.parse(content);
            actions.setBlocks(blocks);
          } catch (e) {
            console.error('Failed to import content:', e);
          }
        }
      },
      isEmpty: () => {
        return state.blocks.length === 0 || 
          (state.blocks.length === 1 && !state.blocks[0].content.trim());
      },
      getWordCount: () => {
        return state.blocks.reduce((count: number, block: EditorBlock) => {
          return count + (block.content.match(/\S+/g) || []).length;
        }, 0);
      },
      getCharacterCount: () => {
        return state.blocks.reduce((count: number, block: EditorBlock) => {
          return count + block.content.length;
        }, 0);
      },
      
      // Missing methods for ExtendedMarkdownEditorRef
      getRegisteredPlugins: () => {
        return [];
      },
      validateContent: () => {
        return [];
      },
      exportToFormat: (format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          return serializeBlocksToMarkdown(state.blocks);
        }
        return '';
      },
      importFromFormat: (content: string, format: 'markdown' | 'html' | 'json') => {
        if (format === 'markdown') {
          const blocks = parseMarkdownToBlocks(content, allPlugins);
          actions.setBlocks(blocks);
        }
      },
      moveBlockUp: (id: string) => {
        // Implementation needed
        return false;
      },
      moveBlockDown: (id: string) => {
        // Implementation needed
        return false;
      },
      toggleMode: () => {
        // Implementation needed
      },
      getCurrentMode: () => {
        return 'edit' as any;
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [state, actions]);

    // Handle content changes
    useEffect(() => {
      if (onContentChange) {
        onContentChange(state.blocks);
      }
      if (onBlocksChange) {
        onBlocksChange(state.blocks);
      }
    }, [state.blocks, onContentChange, onBlocksChange]);

    // Handle selection changes
    useEffect(() => {
      if (onSelectionChange) {
        onSelectionChange({
          focusedBlockId: state.focusedBlockId,
          selectedBlockIds: state.selectedBlocks,
          selectionRange: null
        });
      }
    }, [state.focusedBlockId, state.selectedBlocks, onSelectionChange]);

    // Handle errors
    useEffect(() => {
      if (state.errors && state.errors.length > 0 && onError) {
        onError(state.errors[0]);
      }
    }, [state.errors, onError]);

    // Separate block and markdown plugins
    const blockPlugins = allPlugins.filter(plugin => plugin.type === 'block');
    const markdownPlugins = allPlugins.filter(plugin => plugin.type === 'markdown');
    
    // console.log('🔧 Block plugins being passed to EditorCore:', blockPlugins.map(p => ({ id: p.id, blockType: p.blockType })));

    return (
      <View
        style={[styles.container, style]}
        {...otherProps}
      >
        <EditorThemeProvider theme={theme}>
          <EditorCore
            ref={editorRef}
            initialBlocks={state.blocks}
            blockPlugins={blockPlugins}
            markdownPlugins={markdownPlugins}
            config={config}
            theme={theme}
            readOnly={readOnly}
            autoFocus={autoFocus}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            keyboardHeight={keyboardHeight}
            keyboardDockVisible={keyboardDockVisible}
            keyboardDockBlockSection={keyboardDockBlockSection}
            keyboardDockFormattingSection={keyboardDockFormattingSection}
            keyboardDockActionSection={keyboardDockActionSection}
          />
        </EditorThemeProvider>
      </View>
    );
  }
);

EditorWithContext.displayName = 'EditorWithContext';

/**
 * Main MarkdownEditor component with provider
 */
export const MarkdownEditor = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  (props, ref) => {
    const {
      initialBlocks = [],
      initialMarkdown,
      plugins = [],
      ...otherProps
    } = props;

    // Create singleton built-in plugins using useMemo
    const builtInPlugins = useMemo(() => [
      new ParagraphPlugin(),
      new HeadingPlugin(),
      new CodePlugin(),
      new ImagePlugin(),
      new ListPlugin(),
      new QuotePlugin(),
      new DividerPlugin(),
      new VideoPlugin(),
      new CalloutPlugin(),
      new ChecklistPlugin(),
      new TablePlugin()
    ], []);

    // Combine built-in and custom plugins
    const allPlugins = useMemo(() => [
      ...builtInPlugins,
      ...plugins
    ], [builtInPlugins, plugins]);

    // Convert initialMarkdown to initialBlocks if provided (only once)
    const processedInitialBlocks = useMemo(() => {
      if (initialMarkdown) {
        return parseMarkdownToBlocks(initialMarkdown, allPlugins);
      }
      return initialBlocks;
    }, [initialMarkdown, initialBlocks, allPlugins]);

    return (
      <EditorProvider
        initialBlocks={processedInitialBlocks}
        plugins={allPlugins}
        onError={props.onError}
      >
        <EditorWithContext ref={ref} plugins={allPlugins} {...otherProps} />
      </EditorProvider>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  }
});

export default MarkdownEditor;
