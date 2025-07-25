import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Block, EditorBlock } from '../../types/editor';
import { useEditor } from './core/EditorContext';
import { EditorCore } from './core/EditorCore';
import { useEditorKeyboard } from './EditorKeyboard';
import EditorProvider from './core/EditorProvider';
import { PluginRegistry } from './plugins/PluginRegistry';
import { ExtendedMarkdownEditorProps, ExtendedMarkdownEditorRef } from './types/EditorTypes';
import { parseMarkdownToBlocks, serializeBlocksToMarkdown } from './utils/MarkdownRegistry';

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
  VideoPlugin
} from './plugins/built-in';

/**
 * Internal editor component that has access to editor context
 */
const EditorWithContext = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  (props, ref) => {
    const {
      initialBlocks = [] as any,
      plugins = [],
      config = {},
      onContentChange,
      onSelectionChange,
      onError,
      style,
      theme = 'light',
      readOnly = false,
      autoFocus = false,
      placeholder = 'Start writing...',
      shortcuts = [],
      ...otherProps
    } = props;

    const context = useEditor();
    const { state } = context;
    
    // Create plugin registry
    const pluginRegistry = new PluginRegistry();
    
    // Built-in plugins array
    const builtInPlugins = [
      new ParagraphPlugin(),
      new HeadingPlugin(),
      new CodePlugin(),
      new ImagePlugin(),
      new ListPlugin(),
      new QuotePlugin(),
      new DividerPlugin(),
      new VideoPlugin(),
      new CalloutPlugin(),
      new ChecklistPlugin()
    ];
    
    // Combine built-in and custom plugins
    const allPlugins = [
      ...builtInPlugins,
      ...(plugins || [])
    ];
  
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
        return context.getMarkdown();
      }
      return JSON.stringify(state.blocks);
    },
    importContent: (content: string, format: string) => {
      if (format === 'markdown') {
        context.setMarkdown(content);
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
        (state.blocks.find((b: EditorBlock) => b.id === state.focusedBlockId) as Block) || null : null,
      getSelectedBlocks: () => state.selectedBlocks.map((id: string) => 
        state.blocks.find((b: EditorBlock) => b.id === id)).filter(Boolean) as Block[],
      pluginRegistry,
      shortcuts
    });

    // Expose editor methods via ref
    useImperativeHandle(ref, () => ({
      // Content methods
      getBlocks: () => state.blocks,
      setBlocks: (blocks: Block[]) => {
        actions.setBlocks(blocks);
      },
      getMarkdown: () => serializeBlocksToMarkdown(state.blocks),
      setMarkdown: (markdown: string) => {
        const blocks = parseMarkdownToBlocks(markdown);
        actions.setBlocks(blocks);
      },
      insertBlock: (type: any, index?: number) => {
        // Create a new block of the specified type
        const newBlock = {
          id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: type,
          content: '',
          meta: {}
        };
        actions.createBlock(newBlock.type, newBlock.content, index);
      },
      updateBlock: (id: string, updates: Partial<Block>) => {
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
        return actions.exportContent(format);
      },
      importContent: (content: string, format: 'markdown' | 'json' = 'markdown') => {
        actions.importContent(content, format);
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
          const blocks = parseMarkdownToBlocks(content);
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
    }), [state, actions, pluginRegistry]);

    // Handle content changes
    useEffect(() => {
      if (onContentChange) {
        onContentChange(state.blocks);
      }
    }, [state.blocks, onContentChange]);

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

    return (
      <View 
        style={[styles.container, style]}
        {...otherProps}
      >
        <EditorCore
          ref={editorRef}
          initialBlocks={initialBlocks}
          plugins={plugins}
          config={config}
          theme={theme}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
        />
      </View>
    );
  }
);

/**
 * Main MarkdownEditor component with provider
 */
export const MarkdownEditor = forwardRef<ExtendedMarkdownEditorRef, ExtendedMarkdownEditorProps>(
  (props, ref) => {
    const {
      initialBlocks = [],
      plugins = [],
      config = {},
      ...otherProps
    } = props;

    // Create plugin registry and register built-in plugins
    const pluginRegistry = new PluginRegistry();
    
    // Register built-in block plugins
    pluginRegistry.register(new ParagraphPlugin());
    pluginRegistry.register(new HeadingPlugin());
    pluginRegistry.register(new CodePlugin()); // Class-based plugin
    pluginRegistry.register(new ImagePlugin()); // Class-based plugin
    pluginRegistry.register(new ListPlugin()); // Class-based plugin
    pluginRegistry.register(new QuotePlugin()); // Class-based plugin
    pluginRegistry.register(new DividerPlugin()); // Class-based plugin
    pluginRegistry.register(new VideoPlugin()); // Class-based plugin
    pluginRegistry.register(new CalloutPlugin()); // Class-based plugin
    pluginRegistry.register(new ChecklistPlugin()); // Class-based plugin

    // Register custom plugins
    plugins.forEach(plugin => {
      pluginRegistry.register(plugin);
    });

    return (
      <EditorProvider 
        initialBlocks={initialBlocks}
        plugins={plugins}
        onError={props.onError}
      >
        <EditorWithContext ref={ref} {...otherProps} />
      </EditorProvider>
    );
  }
);

MarkdownEditor.displayName = 'MarkdownEditor';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  }
});

export default MarkdownEditor;