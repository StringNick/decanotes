import { useCallback, useEffect } from 'react';
import { Block, EditorBlock } from '../../types/editor';
import { EditorAction } from './types/EditorTypes';
import { BlockPlugin } from './plugins/BlockPlugin';
import { PluginRegistry } from './plugins/PluginRegistry';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: string | ((event: KeyboardEvent) => void);
  description?: string;
  preventDefault?: boolean;
}

export interface EditorKeyboardOptions {
  onAction: (action: EditorAction) => void;
  getCurrentBlock: () => Block | null;
  getSelectedBlocks: () => Block[];
  pluginRegistry: PluginRegistry;
  shortcuts?: KeyboardShortcut[];
}

/**
 * Default keyboard shortcuts for the editor
 */
const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Text formatting
  {
    key: 'b',
    ctrlKey: true,
    action: 'format:bold',
    description: 'Bold text',
    preventDefault: true
  },
  {
    key: 'i',
    ctrlKey: true,
    action: 'format:italic',
    description: 'Italic text',
    preventDefault: true
  },
  {
    key: 'u',
    ctrlKey: true,
    action: 'format:underline',
    description: 'Underline text',
    preventDefault: true
  },
  {
    key: 'k',
    ctrlKey: true,
    action: 'format:link',
    description: 'Insert link',
    preventDefault: true
  },
  
  // Block operations
  {
    key: 'Enter',
    action: 'block:new',
    description: 'Create new block'
  },
  {
    key: 'Enter',
    shiftKey: true,
    action: 'block:break',
    description: 'Line break',
    preventDefault: true
  },
  {
    key: 'Backspace',
    action: 'block:backspace',
    description: 'Delete or merge blocks'
  },
  {
    key: 'Delete',
    action: 'block:delete',
    description: 'Delete forward'
  },
  {
    key: 'Tab',
    action: 'block:indent',
    description: 'Indent block',
    preventDefault: true
  },
  {
    key: 'Tab',
    shiftKey: true,
    action: 'block:outdent',
    description: 'Outdent block',
    preventDefault: true
  },
  
  // Navigation
  {
    key: 'ArrowUp',
    action: 'navigation:up',
    description: 'Move cursor up'
  },
  {
    key: 'ArrowDown',
    action: 'navigation:down',
    description: 'Move cursor down'
  },
  {
    key: 'ArrowLeft',
    action: 'navigation:left',
    description: 'Move cursor left'
  },
  {
    key: 'ArrowRight',
    action: 'navigation:right',
    description: 'Move cursor right'
  },
  
  // Selection
  {
    key: 'a',
    ctrlKey: true,
    action: 'selection:all',
    description: 'Select all',
    preventDefault: true
  },
  {
    key: 'ArrowUp',
    shiftKey: true,
    action: 'selection:extend-up',
    description: 'Extend selection up'
  },
  {
    key: 'ArrowDown',
    shiftKey: true,
    action: 'selection:extend-down',
    description: 'Extend selection down'
  },
  
  // History
  {
    key: 'z',
    ctrlKey: true,
    action: 'history:undo',
    description: 'Undo',
    preventDefault: true
  },
  {
    key: 'y',
    ctrlKey: true,
    action: 'history:redo',
    description: 'Redo',
    preventDefault: true
  },
  {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    action: 'history:redo',
    description: 'Redo (alternative)',
    preventDefault: true
  },
  
  // Copy/Paste
  {
    key: 'c',
    ctrlKey: true,
    action: 'clipboard:copy',
    description: 'Copy'
  },
  {
    key: 'x',
    ctrlKey: true,
    action: 'clipboard:cut',
    description: 'Cut'
  },
  {
    key: 'v',
    ctrlKey: true,
    action: 'clipboard:paste',
    description: 'Paste'
  },
  
  // Block types
  {
    key: '1',
    ctrlKey: true,
    action: 'block:heading-1',
    description: 'Heading 1',
    preventDefault: true
  },
  {
    key: '2',
    ctrlKey: true,
    action: 'block:heading-2',
    description: 'Heading 2',
    preventDefault: true
  },
  {
    key: '3',
    ctrlKey: true,
    action: 'block:heading-3',
    description: 'Heading 3',
    preventDefault: true
  },
  {
    key: '0',
    ctrlKey: true,
    action: 'block:paragraph',
    description: 'Paragraph',
    preventDefault: true
  },
  {
    key: '`',
    ctrlKey: true,
    action: 'block:code',
    description: 'Code block',
    preventDefault: true
  }
];

/**
 * Hook for handling keyboard interactions in the editor
 */
export function useEditorKeyboard(options: EditorKeyboardOptions) {
  const {
    onAction,
    getCurrentBlock,
    getSelectedBlocks,
    pluginRegistry,
    shortcuts = []
  } = options;

  // Combine default and custom shortcuts
  const allShortcuts = [...DEFAULT_SHORTCUTS, ...shortcuts];

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    
    // Use metaKey on Mac, ctrlKey on other platforms
    const cmdKey = navigator.platform.includes('Mac') ? metaKey : ctrlKey;
    
    // Find matching shortcut
    const shortcut = allShortcuts.find(s => {
      return (
        s.key === key &&
        (s.ctrlKey === undefined || s.ctrlKey === cmdKey) &&
        (s.metaKey === undefined || s.metaKey === metaKey) &&
        (s.shiftKey === undefined || s.shiftKey === shiftKey) &&
        (s.altKey === undefined || s.altKey === altKey)
      );
    });

    if (shortcut) {
      if (shortcut.preventDefault) {
        event.preventDefault();
      }

      if (typeof shortcut.action === 'function') {
        shortcut.action(event);
      } else {
        handleShortcutAction(shortcut.action, event);
      }
      return;
    }

    // Let plugins handle the key event
    const currentBlock = getCurrentBlock();
    if (currentBlock) {
      const plugin = pluginRegistry.getBlockPlugin(currentBlock.type);
      if (plugin && plugin.controller?.handleKeyPress) {
        const handled = plugin.controller.handleKeyPress({
          key,
          ctrlKey: cmdKey,
          metaKey,
          shiftKey,
          altKey
        }, currentBlock);
        
        if (handled) {
          event.preventDefault();
          return;
        }
      }
    }

    // Handle special keys
    switch (key) {
      case 'Enter':
        handleEnterKey(event);
        break;
      case 'Backspace':
        handleBackspaceKey(event);
        break;
      case 'Tab':
        handleTabKey(event);
        break;
    }
  }, [allShortcuts, onAction, getCurrentBlock, getSelectedBlocks, pluginRegistry]);

  /**
   * Handle shortcut actions
   */
  const handleShortcutAction = useCallback((action: string, event: KeyboardEvent) => {
    const [category, type] = action.split(':');
    
    switch (category) {
      case 'format':
        onAction({
          type: 'FORMAT_TEXT',
          id: getCurrentBlock()?.id || '',
          format: type
        });
        break;
        
      case 'block':
        handleBlockAction(type, event);
        break;
        
      case 'navigation':
        handleNavigationAction(type, event);
        break;
        
      case 'selection':
        handleSelectionAction(type, event);
        break;
        
      case 'history':
        onAction({
          type: type === 'undo' ? 'UNDO' : 'REDO'
        });
        break;
        
      case 'clipboard':
        handleClipboardAction(type, event);
        break;
    }
  }, [onAction]);

  /**
   * Handle block-related actions
   */
  const handleBlockAction = useCallback((type: string, event: KeyboardEvent) => {
    const currentBlock = getCurrentBlock();
    
    switch (type) {
      case 'new':
        onAction({
          type: 'ADD_BLOCK',
          block: {
            id: generateId(),
            type: 'paragraph',
            content: ''
          },
          index: undefined // Let the reducer determine the position
        });
        break;
        
      case 'break':
        onAction({
          type: 'INSERT_LINE_BREAK'
        });
        break;
        
      case 'backspace':
        onAction({
          type: 'DELETE_BACKWARD'
        });
        break;
        
      case 'delete':
        onAction({
          type: 'DELETE_FORWARD'
        });
        break;
        
      case 'indent':
        onAction({
          type: 'INDENT_BLOCK'
        });
        break;
        
      case 'outdent':
        onAction({
          type: 'OUTDENT_BLOCK'
        });
        break;
        
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
        if (currentBlock) {
          onAction({
            type: 'UPDATE_BLOCK',
            id: currentBlock.id,
            changes: {
              type: 'heading',
              meta: { level: parseInt(type.split('-')[1]) }
            }
          });
        }
        break;
        
      case 'paragraph':
        if (currentBlock) {
          onAction({
            type: 'UPDATE_BLOCK',
            id: currentBlock.id,
            changes: { type: 'paragraph' }
          });
        }
        break;
        
      case 'code':
        if (currentBlock) {
          onAction({
            type: 'UPDATE_BLOCK',
            id: currentBlock.id,
            changes: { type: 'code' }
          });
        }
        break;
    }
  }, [getCurrentBlock, onAction]);

  /**
   * Handle navigation actions
   */
  const handleNavigationAction = useCallback((type: string, event: KeyboardEvent) => {
    switch (type) {
      case 'up':
        onAction({ type: 'MOVE_CURSOR_UP' });
        break;
      case 'down':
        onAction({ type: 'MOVE_CURSOR_DOWN' });
        break;
      case 'left':
        onAction({ type: 'MOVE_CURSOR_LEFT' });
        break;
      case 'right':
        onAction({ type: 'MOVE_CURSOR_RIGHT' });
        break;
    }
  }, [onAction]);

  /**
   * Handle selection actions
   */
  const handleSelectionAction = useCallback((type: string, event: KeyboardEvent) => {
    switch (type) {
      case 'all':
        onAction({ type: 'SELECT_ALL' });
        break;
      case 'extend-up':
        onAction({ type: 'EXTEND_SELECTION_UP' });
        break;
      case 'extend-down':
        onAction({ type: 'EXTEND_SELECTION_DOWN' });
        break;
    }
  }, [onAction]);

  /**
   * Handle clipboard actions
   */
  const handleClipboardAction = useCallback((type: string, event: KeyboardEvent) => {
    const selectedBlocks = getSelectedBlocks();
    
    switch (type) {
      case 'copy':
        onAction({
          type: 'COPY_BLOCKS',
          blockIds: selectedBlocks.map(block => block.id)
        });
        break;
      case 'cut':
        onAction({
          type: 'CUT_BLOCKS',
          blockIds: selectedBlocks.map(block => block.id)
        });
        break;
      case 'paste':
        onAction({ type: 'PASTE_BLOCKS' });
        break;
    }
  }, [getSelectedBlocks, onAction]);

  /**
   * Handle Enter key
   */
  const handleEnterKey = useCallback((event: KeyboardEvent) => {
    const currentBlock = getCurrentBlock();
    if (!currentBlock) return;

    const plugin = pluginRegistry.getBlockPlugin(currentBlock.type);
    if (plugin && plugin.controller?.handleEnter) {
      const handled = plugin.controller.handleEnter(currentBlock);
      if (handled) {
        event.preventDefault();
        return;
      }
    }

    // Default behavior: create new paragraph
    if (!event.shiftKey) {
      event.preventDefault();
      onAction({
        type: 'ADD_BLOCK',
        block: {
          id: generateId(),
          type: 'paragraph',
          content: ''
        }
      });
    }
  }, [getCurrentBlock, pluginRegistry, onAction]);

  /**
   * Handle Backspace key
   */
  const handleBackspaceKey = useCallback((event: KeyboardEvent) => {
    const currentBlock = getCurrentBlock();
    if (!currentBlock) return;

    const plugin = pluginRegistry.getBlockPlugin(currentBlock.type);
    if (plugin && plugin.controller?.handleBackspace) {
      const handled = plugin.controller.handleBackspace(currentBlock);
      if (handled) {
        event.preventDefault();
        return;
      }
    }

    // Default behavior handled by browser
  }, [getCurrentBlock, pluginRegistry]);

  /**
   * Handle Tab key
   */
  const handleTabKey = useCallback((event: KeyboardEvent) => {
    event.preventDefault();
    
    if (event.shiftKey) {
      onAction({ type: 'OUTDENT_BLOCK' });
    } else {
      onAction({ type: 'INDENT_BLOCK' });
    }
  }, [onAction]);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: allShortcuts,
    handleKeyDown
  };
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get keyboard shortcut description
 */
export function getShortcutDescription(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  
  parts.push(shortcut.key);
  
  return parts.join(' + ');
}

/**
 * Create a custom keyboard shortcut
 */
export function createKeyboardShortcut(
  key: string,
  modifiers: {
    ctrl?: boolean;
    meta?: boolean;
    shift?: boolean;
    alt?: boolean;
  },
  action: string | ((event: KeyboardEvent) => void),
  description?: string
): KeyboardShortcut {
  return {
    key,
    ctrlKey: modifiers.ctrl,
    metaKey: modifiers.meta,
    shiftKey: modifiers.shift,
    altKey: modifiers.alt,
    action,
    description,
    preventDefault: true
  };
}