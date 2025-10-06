import { useCallback, useEffect, useRef } from 'react';
import { EditorBlock } from '../../../types/editor';
import { EditorConfig } from '../types/EditorTypes';
import { BlockPlugin } from '../types/PluginTypes';

interface UseEditorKeyboardProps {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  editingBlockId: string | null;
  blockPlugins: BlockPlugin[];
  config: EditorConfig;
  actions: {
    addBlock: (block: EditorBlock, index?: number) => void;
    updateBlock: (blockId: string, updates: Partial<EditorBlock>) => void;
    deleteBlock: (blockId: string) => void;
    selectBlock: (blockId: string | null) => void;
    startEditing: (blockId: string) => void;
    stopEditing: () => void;
    undo: () => void;
    redo: () => void;
    generateBlockId: () => string;
  };
}

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
  category: 'editing' | 'navigation' | 'formatting' | 'blocks';
}

/**
 * Custom hook for handling keyboard interactions in the editor
 */
export function useEditorKeyboard({
  blocks,
  selectedBlockId,
  editingBlockId,
  blockPlugins,
  config,
  actions
}: UseEditorKeyboardProps) {
  const keyboardRef = useRef<any>(null);
  const lastKeyTime = useRef<number>(0);
  
  // Get the currently selected block
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  const editingBlock = blocks.find(b => b.id === editingBlockId);
  
  // Get the plugin for the current block
  const getBlockPlugin = useCallback((blockType: string) => {
    return blockPlugins.find(plugin => plugin.blockType === blockType);
  }, [blockPlugins]);
  
  // Handle Enter key
  const handleEnter = useCallback((event: KeyboardEvent) => {
    if (!editingBlock) return false;
    
    const plugin = getBlockPlugin(editingBlock.type);
    if (plugin?.controller?.handleEnter) {
      const result = plugin.controller.handleEnter(editingBlock);
      if (result) {
        event.preventDefault();
        // Apply the changes returned by the plugin
        if (Array.isArray(result)) {
          // Handle array of blocks (e.g., split into multiple blocks)
          const blockIndex = blocks.findIndex(b => b.id === editingBlock.id);
          actions.deleteBlock(editingBlock.id);
          result.forEach((block, index) => {
            actions.addBlock(block, blockIndex + index);
          });
        } else if (typeof result === 'object') {
          // Check if it's an EnhancedKeyboardResult
          if ('newBlocks' in result || 'updates' in result || 'focusBlockId' in result) {
            // Handle EnhancedKeyboardResult
            if (result.newBlocks) {
              const blockIndex = blocks.findIndex(b => b.id === editingBlock.id);
              actions.deleteBlock(editingBlock.id);
              result.newBlocks.forEach((block, index) => {
                actions.addBlock(block, blockIndex + index);
              });
            }
            if (result.updates) {
              result.updates.forEach(({ blockId, updates }) => {
                actions.updateBlock(blockId, updates);
              });
            }
            if (result.focusBlockId) {
              actions.selectBlock(result.focusBlockId);
            }
          } else {
            // Handle single block update
            actions.updateBlock(editingBlock.id, result as Partial<EditorBlock>);
          }
        }
        return true;
      }
    }
    
    // Default behavior: create new paragraph
    if (!event.shiftKey) {
      event.preventDefault();
      const blockIndex = blocks.findIndex(b => b.id === editingBlock.id);
      actions.addBlock({
        id: actions.generateBlockId(),
        type: 'paragraph',
        content: '',
        meta: {}
      }, blockIndex + 1);
      return true;
    }
    
    return false;
  }, [editingBlock, blocks, getBlockPlugin, actions]);
  
  // Handle Backspace key
  const handleBackspace = useCallback((event: KeyboardEvent) => {
    if (!editingBlock) return false;
    
    const plugin = getBlockPlugin(editingBlock.type);
    if (plugin?.controller?.handleBackspace) {
      const result = plugin.controller.handleBackspace(editingBlock);
      if (result) {
        event.preventDefault();
        // Apply the changes returned by the plugin
        if (typeof result === 'object') {
          actions.updateBlock(editingBlock.id, result);
        }
        return true;
      }
    }
    
    // Default behavior: merge with previous block if at start
    // Note: window.getSelection() is not available in React Native
    // This logic is kept for web compatibility
    if (typeof window !== 'undefined' && window.getSelection) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.startOffset === 0 && range.endOffset === 0) {
          const blockIndex = blocks.findIndex(b => b.id === editingBlock.id);
          const previousBlock = blocks[blockIndex - 1];
          
          if (previousBlock && editingBlock.content === '') {
            event.preventDefault();
            actions.deleteBlock(editingBlock.id);
            actions.startEditing(previousBlock.id);
            return true;
          }
        }
      }
    }
    
    return false;
  }, [editingBlock, blocks, getBlockPlugin, actions]);
  
  // Handle Tab key
  const handleTab = useCallback((event: KeyboardEvent) => {
    if (!editingBlock) return false;
    
    const plugin = getBlockPlugin(editingBlock.type);
    if (plugin?.controller?.handleTab) {
      const result = plugin.controller.handleTab(editingBlock, event, actions);
      if (result) {
        event.preventDefault();
        // Apply the changes returned by the plugin
        if (typeof result === 'object') {
          actions.updateBlock(editingBlock.id, result);
        }
        return true;
      }
    }
    
    return false;
  }, [editingBlock, getBlockPlugin, actions]);
  
  // Handle Arrow keys
  const handleArrowKeys = useCallback((event: KeyboardEvent) => {
    if (!selectedBlockId) return false;
    
    const blockIndex = blocks.findIndex(b => b.id === selectedBlockId);
    if (blockIndex === -1) return false;
    
    switch (event.key) {
      case 'ArrowUp':
        if (blockIndex > 0) {
          event.preventDefault();
          actions.selectBlock(blocks[blockIndex - 1].id);
          return true;
        }
        break;
        
      case 'ArrowDown':
        if (blockIndex < blocks.length - 1) {
          event.preventDefault();
          actions.selectBlock(blocks[blockIndex + 1].id);
          return true;
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowRight':
        // Let the browser handle horizontal navigation within text
        return false;
    }
    
    return false;
  }, [selectedBlockId, blocks, actions]);
  
  // Handle general key press
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!editingBlock) return false;
    
    const plugin = getBlockPlugin(editingBlock.type);
    if (plugin?.controller?.handleKeyPress) {
      const result = plugin.controller.handleKeyPress(event, editingBlock);
      if (result) {
        event.preventDefault();
        return true;
      }
    }
    
    return false;
  }, [editingBlock, getBlockPlugin, actions]);
  
  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    // Editing shortcuts
    {
      key: 'z',
      ctrlKey: true,
      action: actions.undo,
      description: 'Undo',
      category: 'editing'
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: actions.redo,
      description: 'Redo',
      category: 'editing'
    },
    {
      key: 'z',
      metaKey: true,
      action: actions.undo,
      description: 'Undo (Mac)',
      category: 'editing'
    },
    {
      key: 'z',
      metaKey: true,
      shiftKey: true,
      action: actions.redo,
      description: 'Redo (Mac)',
      category: 'editing'
    },
    
    // Block shortcuts
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          const blockIndex = blocks.findIndex(b => b.id === selectedBlockId);
          actions.addBlock({
            id: actions.generateBlockId(),
            type: 'paragraph',
            content: '',
            meta: {}
          }, blockIndex + 1);
        }
      },
      description: 'Insert new block',
      category: 'blocks'
    },
    {
      key: 'Backspace',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          actions.deleteBlock(selectedBlockId);
        }
      },
      description: 'Delete block',
      category: 'blocks'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          const block = blocks.find(b => b.id === selectedBlockId);
          if (block) {
            const blockIndex = blocks.findIndex(b => b.id === selectedBlockId);
            actions.addBlock({
              ...block,
              id: actions.generateBlockId(),
              content: block.content,
              meta: { ...block.meta }
            }, blockIndex + 1);
          }
        }
      },
      description: 'Duplicate block',
      category: 'blocks'
    },
    
    // Navigation shortcuts
    {
      key: 'Escape',
      action: () => {
        actions.stopEditing();
        actions.selectBlock(null);
      },
      description: 'Exit editing mode',
      category: 'navigation'
    },
    
    // Formatting shortcuts (handled by block plugins)
    {
      key: '1',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          actions.updateBlock(selectedBlockId, {
            type: 'heading',
            meta: { level: 1 }
          });
        }
      },
      description: 'Convert to Heading 1',
      category: 'formatting'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          actions.updateBlock(selectedBlockId, {
            type: 'heading',
            meta: { level: 2 }
          });
        }
      },
      description: 'Convert to Heading 2',
      category: 'formatting'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          actions.updateBlock(selectedBlockId, {
            type: 'heading',
            meta: { level: 3 }
          });
        }
      },
      description: 'Convert to Heading 3',
      category: 'formatting'
    },
    {
      key: '0',
      ctrlKey: true,
      action: () => {
        if (selectedBlockId) {
          actions.updateBlock(selectedBlockId, {
            type: 'paragraph',
            meta: {}
          });
        }
      },
      description: 'Convert to Paragraph',
      category: 'formatting'
    }
  ];
  
  // Handle keyboard shortcuts
  const handleShortcuts = useCallback((event: KeyboardEvent) => {
    const now = Date.now();
    
    // Prevent rapid key events
    if (now - lastKeyTime.current < 50) {
      return;
    }
    lastKeyTime.current = now;
    
    for (const shortcut of shortcuts) {
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey;
      
      if (
        event.key === shortcut.key &&
        ctrlMatch &&
        metaMatch &&
        shiftMatch &&
        altMatch
      ) {
        event.preventDefault();
        shortcut.action();
        return true;
      }
    }
    
    return false;
  }, [shortcuts]);
  
  // Main keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle shortcuts first
    if (handleShortcuts(event)) {
      return;
    }
    
    // Handle special keys
    switch (event.key) {
      case 'Enter':
        if (handleEnter(event)) return;
        break;
        
      case 'Backspace':
        if (handleBackspace(event)) return;
        break;
        
      case 'Tab':
        if (handleTab(event)) return;
        break;
        
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (handleArrowKeys(event)) return;
        break;
        
      default:
        if (handleKeyPress(event)) return;
        break;
    }
  }, [handleShortcuts, handleEnter, handleBackspace, handleTab, handleArrowKeys, handleKeyPress]);
  
  // Set up keyboard event listeners
  useEffect(() => {
    const element = keyboardRef.current;
    if (!element) return;
    
    // Check if we're in a web environment and element has addEventListener
    if (typeof element.addEventListener === 'function') {
      element.addEventListener('keydown', handleKeyDown);
      
      return () => {
        if (typeof element.removeEventListener === 'function') {
          element.removeEventListener('keydown', handleKeyDown);
        }
      };
    }
  }, [handleKeyDown]);
  
  // Focus management
  const focusEditor = useCallback(() => {
    if (keyboardRef.current) {
      keyboardRef.current.focus();
    }
  }, []);
  
  const blurEditor = useCallback(() => {
    if (keyboardRef.current) {
      keyboardRef.current.blur();
    }
  }, []);
  
  return {
    keyboardRef,
    shortcuts,
    focusEditor,
    blurEditor,
    handleKeyDown
  };
}

/**
 * Get keyboard shortcuts grouped by category
 */
export function getKeyboardShortcuts(): Record<string, KeyboardShortcut[]> {
  const shortcuts: KeyboardShortcut[] = [
    // This would be populated from the hook, but we'll define them here for reference
    {
      key: 'z',
      ctrlKey: true,
      action: () => {},
      description: 'Undo',
      category: 'editing'
    },
    {
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
      action: () => {},
      description: 'Redo',
      category: 'editing'
    },
    {
      key: 'Enter',
      ctrlKey: true,
      action: () => {},
      description: 'Insert new block',
      category: 'blocks'
    },
    {
      key: 'Backspace',
      ctrlKey: true,
      action: () => {},
      description: 'Delete block',
      category: 'blocks'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: () => {},
      description: 'Duplicate block',
      category: 'blocks'
    },
    {
      key: 'Escape',
      action: () => {},
      description: 'Exit editing mode',
      category: 'navigation'
    },
    {
      key: '1',
      ctrlKey: true,
      action: () => {},
      description: 'Convert to Heading 1',
      category: 'formatting'
    },
    {
      key: '2',
      ctrlKey: true,
      action: () => {},
      description: 'Convert to Heading 2',
      category: 'formatting'
    },
    {
      key: '3',
      ctrlKey: true,
      action: () => {},
      description: 'Convert to Heading 3',
      category: 'formatting'
    },
    {
      key: '0',
      ctrlKey: true,
      action: () => {},
      description: 'Convert to Paragraph',
      category: 'formatting'
    }
  ];
  
  return shortcuts.reduce((groups, shortcut) => {
    if (!groups[shortcut.category]) {
      groups[shortcut.category] = [];
    }
    groups[shortcut.category].push(shortcut);
    return groups;
  }, {} as Record<string, KeyboardShortcut[]>);
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}