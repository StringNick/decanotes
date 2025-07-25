import { useContext } from 'react';
import { EditorContext } from './EditorProvider';
import { EditorContextInterface } from '../types/EditorTypes';

/**
 * Hook to access the editor context
 * Must be used within an EditorProvider
 */
export function useEditor(): EditorContextInterface {
  const context = useContext(EditorContext);
  
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  
  return context;
}

/**
 * Hook to access editor state only
 */
export function useEditorState() {
  const { state } = useEditor();
  return state;
}

/**
 * Hook to access editor actions only
 */
export function useEditorActions() {
  const {
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
  
  return {
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
  };
}

/**
 * Hook to access plugin registry
 */
export function useEditorPlugins() {
  const { getPlugin, executePluginAction } = useEditor();
  
  return {
    getPlugin,
    executePluginAction
  };
}