import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Block, BlockType, EditorBlock, EditorBlockType, EditorMode } from '../../../types/editor';
import { EditorState, EditorAction, EditorContextInterface, ExtendedBlock, EditorError } from '../types/EditorTypes';
import { BlockPlugin, MarkdownPlugin } from '../types/PluginTypes';
import { PluginRegistry } from '../plugins/PluginRegistry';

// Create the editor context
const EditorContext = createContext<EditorContextInterface | null>(null);

// Initial editor state
const initialState: EditorState = {
  blocks: [],
  focusedBlockId: null,
  selectedBlocks: [],
  mode: 'edit',
  isDirty: false,
  isLoading: false,
  errors: [],
  history: {
    past: [],
    present: [],
    future: [],
    canUndo: false,
    canRedo: false
  }
};

// Editor reducer
function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_BLOCKS':
      return {
        ...state,
        blocks: action.blocks,
        isDirty: true,
        history: {
          ...state.history,
          past: [...state.history.past, state.blocks],
          present: action.blocks,
          future: []
        }
      };

    case 'ADD_BLOCK':
      const newBlocks = [...state.blocks];
      const insertIndex = action.index ?? newBlocks.length;
      newBlocks.splice(insertIndex, 0, action.block);
      return {
        ...state,
        blocks: newBlocks,
        isDirty: true,
        history: {
          ...state.history,
          past: [...state.history.past, state.blocks],
          present: newBlocks,
          future: []
        }
      };

    case 'UPDATE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.map(block => 
          block.id === action.id ? { ...block, ...action.changes } : block
        ),
        isDirty: true
      };

    case 'DELETE_BLOCK':
      return {
        ...state,
        blocks: state.blocks.filter(block => block.id !== action.id),
        focusedBlockId: state.focusedBlockId === action.id ? null : state.focusedBlockId,
        selectedBlocks: state.selectedBlocks.filter(id => id !== action.id),
        isDirty: true
      };

    case 'MOVE_BLOCK':
      const blocksToMove = [...state.blocks];
      const blockIndex = blocksToMove.findIndex(b => b.id === action.id);
      if (blockIndex !== -1) {
        const [movedBlock] = blocksToMove.splice(blockIndex, 1);
        blocksToMove.splice(action.newIndex, 0, movedBlock);
      }
      return {
        ...state,
        blocks: blocksToMove,
        isDirty: true
      };

    case 'SET_FOCUS':
      return {
        ...state,
        focusedBlockId: action.blockId
      };

    case 'SET_SELECTION':
      return {
        ...state,
        selectedBlocks: action.blockIds
      };

    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.isLoading
      };

    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.error]
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };

    case 'UNDO':
      if (state.history.past.length === 0) return state;
      const previous = state.history.past[state.history.past.length - 1];
      const newPast = state.history.past.slice(0, state.history.past.length - 1);
      return {
        ...state,
        blocks: previous,
        history: {
          past: newPast,
          present: previous,
          future: [state.blocks, ...state.history.future],
          canUndo: newPast.length > 0,
          canRedo: true
        }
      };

    case 'REDO':
      if (state.history.future.length === 0) return state;
      const next = state.history.future[0];
      const newFuture = state.history.future.slice(1);
      return {
        ...state,
        blocks: next,
        history: {
          past: [...state.history.past, state.blocks],
          present: next,
          future: newFuture,
          canUndo: true,
          canRedo: newFuture.length > 0
        }
      };

    case 'INDENT_BLOCK':
      // For now, just return state - implement indentation logic later
      return state;

    case 'OUTDENT_BLOCK':
      // For now, just return state - implement outdentation logic later
      return state;

    case 'COPY_BLOCKS':
      // For now, just return state - implement copy logic later
      return state;

    case 'CUT_BLOCKS':
      // For now, just return state - implement cut logic later
      return state;

    case 'PASTE_BLOCKS':
      // For now, just return state - implement paste logic later
      return state;

    case 'EXTEND_SELECTION_UP':
      // For now, just return state - implement selection extension logic later
      return state;

    case 'EXTEND_SELECTION_DOWN':
      // For now, just return state - implement selection extension logic later
      return state;

    case 'MOVE_CURSOR_UP':
      // For now, just return state - implement cursor movement logic later
      return state;

    case 'MOVE_CURSOR_DOWN':
      // For now, just return state - implement cursor movement logic later
      return state;

    case 'MOVE_CURSOR_LEFT':
      // For now, just return state - implement cursor movement logic later
      return state;

    case 'MOVE_CURSOR_RIGHT':
      // For now, just return state - implement cursor movement logic later
      return state;

    case 'SELECT_ALL':
      // For now, just return state - implement select all logic later
      return state;

    case 'DELETE_FORWARD':
      // For now, just return state - implement delete forward logic later
      return state;

    case 'INSERT_LINE_BREAK':
      // For now, just return state - implement line break logic later
      return state;

    case 'DELETE_BACKWARD':
      // For now, just return state - implement delete backward logic later
      return state;

    case 'FORMAT_TEXT':
      // For now, just return state - implement text formatting logic later
      return state;

    default:
      return state;
  }
}

// Editor provider props
interface EditorProviderProps {
  children: React.ReactNode;
  initialBlocks?: ExtendedBlock[];
  plugins?: (BlockPlugin | MarkdownPlugin)[];
  onError?: (error: EditorError) => void;
}

// Editor provider component
export default function EditorProvider({ 
  children, 
  initialBlocks = [], 
  plugins = [],
  onError 
}: EditorProviderProps) {
  const [state, dispatch] = useReducer(editorReducer, {
    ...initialState,
    blocks: initialBlocks
  });
  
  const [pluginRegistry] = React.useState(() => new PluginRegistry());

  // Register plugins on mount
  useEffect(() => {
    plugins.forEach(plugin => {
      try {
        pluginRegistry.register(plugin);
      } catch (error) {
        const editorError: EditorError = {
          type: 'plugin-error',
          message: `Failed to register plugin: ${error}`,
          source: plugin.id
        };
        dispatch({ type: 'ADD_ERROR', error: editorError });
        onError?.(editorError);
      }
    });
  }, [plugins, pluginRegistry, onError]);

  // Generate unique ID
  const generateId = useCallback(() => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Block operations
  const createBlock = useCallback((type: EditorBlockType | string, content = '', index?: number) => {
    const newBlock: ExtendedBlock = {
      id: generateId(),
      type: type as EditorBlockType,
      content,
      meta: {}
    };
    dispatch({ type: 'ADD_BLOCK', block: newBlock, index });
  }, [generateId]);

  const updateBlock = useCallback((id: string, changes: Partial<ExtendedBlock>) => {
    dispatch({ type: 'UPDATE_BLOCK', id, changes });
  }, []);

  const deleteBlock = useCallback((id: string) => {
    dispatch({ type: 'DELETE_BLOCK', id });
  }, []);

  const moveBlock = useCallback((id: string, newIndex: number) => {
    dispatch({ type: 'MOVE_BLOCK', id, newIndex });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const block = state.blocks.find(b => b.id === id);
    if (block) {
      const duplicated: ExtendedBlock = {
        ...block,
        id: generateId()
      };
      const index = state.blocks.findIndex(b => b.id === id) + 1;
      dispatch({ type: 'ADD_BLOCK', block: duplicated, index });
    }
  }, [state.blocks, generateId]);

  // Selection operations
  const selectBlock = useCallback((id: string) => {
    dispatch({ type: 'SET_SELECTION', blockIds: [id] });
  }, []);

  const selectBlocks = useCallback((ids: string[]) => {
    dispatch({ type: 'SET_SELECTION', blockIds: ids });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: 'SET_SELECTION', blockIds: [] });
  }, []);

  // Focus operations
  const focusBlock = useCallback((id: string) => {
    dispatch({ type: 'SET_FOCUS', blockId: id });
  }, []);

  const focusNext = useCallback(() => {
    if (state.focusedBlockId) {
      const currentIndex = state.blocks.findIndex(b => b.id === state.focusedBlockId);
      if (currentIndex < state.blocks.length - 1) {
        dispatch({ type: 'SET_FOCUS', blockId: state.blocks[currentIndex + 1].id });
      }
    }
  }, [state.focusedBlockId, state.blocks]);

  const focusPrevious = useCallback(() => {
    if (state.focusedBlockId) {
      const currentIndex = state.blocks.findIndex(b => b.id === state.focusedBlockId);
      if (currentIndex > 0) {
        dispatch({ type: 'SET_FOCUS', blockId: state.blocks[currentIndex - 1].id });
      }
    }
  }, [state.focusedBlockId, state.blocks]);

  // Mode operations
  const setMode = useCallback((mode: EditorMode) => {
    dispatch({ type: 'SET_MODE', mode });
  }, []);

  const toggleMode = useCallback(() => {
    const modes: EditorMode[] = ['edit', 'preview', 'raw'];
    const currentIndex = modes.indexOf(state.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    dispatch({ type: 'SET_MODE', mode: nextMode });
  }, [state.mode]);

  // History operations
  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const canUndo = useCallback(() => {
    return state.history.past.length > 0;
  }, [state.history.past.length]);

  const canRedo = useCallback(() => {
    return state.history.future.length > 0;
  }, [state.history.future.length]);

  // Plugin operations
  const getPlugin = useCallback((id: string) => {
    return pluginRegistry.getPlugin(id);
  }, [pluginRegistry]);

  const executePluginAction = useCallback((pluginId: string, actionId: string, data?: any) => {
    const plugin = pluginRegistry.getPlugin(pluginId);
    if (plugin && plugin.type === 'block') {
      const blockPlugin = plugin as BlockPlugin;
      // Execute plugin action logic here
      console.log(`Executing action ${actionId} on plugin ${pluginId}`, data);
    }
  }, [pluginRegistry]);

  // Content operations
  const getMarkdown = useCallback(() => {
    // Convert blocks to markdown
    return state.blocks.map(block => {
      switch (block.type) {
        case 'heading':
          const level = block.meta?.level || 1;
          return `${'#'.repeat(level)} ${block.content}`;
        case 'code':
          const language = block.meta?.language || '';
          return `\`\`\`${language}\n${block.content}\n\`\`\``;
        case 'quote':
          return `> ${block.content}`;
        default:
          return block.content;
      }
    }).join('\n\n');
  }, [state.blocks]);

  const setMarkdown = useCallback((markdown: string) => {
    // Parse markdown to blocks (simplified)
    const lines = markdown.split('\n');
    const newBlocks: ExtendedBlock[] = [];
    
    lines.forEach(line => {
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)?.[0].length || 1;
        const content = line.replace(/^#+\s*/, '');
        newBlocks.push({
          id: generateId(),
          type: 'heading',
          content,
          meta: { level }
        });
      } else if (line.startsWith('>')) {
        const content = line.replace(/^>\s*/, '');
        newBlocks.push({
          id: generateId(),
          type: 'quote',
          content
        });
      } else if (line.trim()) {
        newBlocks.push({
          id: generateId(),
          type: 'paragraph',
          content: line
        });
      }
    });
    
    dispatch({ type: 'SET_BLOCKS', blocks: newBlocks });
  }, [generateId]);

  const validate = useCallback((): EditorError[] => {
    const errors: EditorError[] = [];
    
    state.blocks.forEach(block => {
      const plugin = pluginRegistry.getBlockPlugin(block.type);
      if (!plugin) {
        errors.push({
          type: 'validation-error',
          message: `No plugin found for block type: ${block.type}`,
          source: block.id
        });
      }
    });
    
    return errors;
  }, [state.blocks, pluginRegistry]);

  const reset = useCallback(() => {
    dispatch({ type: 'SET_BLOCKS', blocks: [] });
    dispatch({ type: 'CLEAR_ERRORS' });
  }, []);

  // Context value
  const contextValue: EditorContextInterface = {
    state,
    dispatch,
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
    canUndo,
    canRedo,
    getPlugin,
    executePluginAction,
    getMarkdown,
    setMarkdown,
    validate,
    reset
  };

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}

// Export the context for use in other components
export { EditorContext };