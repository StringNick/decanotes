import { useState, useCallback, useRef, useEffect } from 'react';
import { EditorBlock, EditorBlockType, EditorMode } from '../../../types/editor';
import { EditorConfig, EditorState, EditorAction } from '../types/EditorTypes';
import { MarkdownPlugin } from '../types/PluginTypes';

interface UseEditorStateProps {
  initialBlocks: EditorBlock[];
  onBlocksChange?: (blocks: EditorBlock[]) => void;
  config: EditorConfig;
}

interface UseEditorStateReturn {
  blocks: EditorBlock[];
  selectedBlockId: string | null;
  editingBlockId: string | null;
  editorState: EditorState;
  actions: {
    // Block operations
    setBlocks: (blocks: EditorBlock[]) => void;
    addBlock: (block: EditorBlock, index?: number) => void;
    updateBlock: (blockId: string, updates: Partial<EditorBlock>) => void;
    deleteBlock: (blockId: string) => void;
    moveBlock: (blockId: string, newIndex: number) => void;
    duplicateBlock: (blockId: string) => void;
    
    // Selection operations
    selectBlock: (blockId: string | null) => void;
    clearSelection: () => void;
    
    // Editing operations
    startEditing: (blockId: string) => void;
    stopEditing: () => void;
    
    // Content operations
    exportToMarkdown: (markdownPlugins: MarkdownPlugin[]) => string;
    importFromMarkdown: (markdown: string, markdownPlugins: MarkdownPlugin[]) => void;
    exportToPlainText: () => string;
    
    // History operations
    undo: () => void;
    redo: () => void;
    
    // Utility
    generateBlockId: () => string;
  };
}

interface HistoryState {
  past: EditorBlock[][];
  present: EditorBlock[];
  future: EditorBlock[][];
  canUndo: boolean;
  canRedo: boolean;
}

/**
 * Custom hook for managing editor state
 */
export function useEditorState({
  initialBlocks,
  onBlocksChange,
  config
}: UseEditorStateProps): UseEditorStateReturn {
  // Core state
  const [blocks, setBlocksState] = useState<EditorBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  
  // History state
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: initialBlocks,
    future: [],
    canUndo: false,
    canRedo: false
  });
  
  // Performance optimization
  const lastChangeTime = useRef<number>(0);
  const changeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Update blocks with history tracking
  const setBlocks = useCallback((newBlocks: EditorBlock[]) => {
    const now = Date.now();
    
    // Debounce rapid changes
    if (changeTimeout.current) {
      clearTimeout(changeTimeout.current);
    }
    
    changeTimeout.current = setTimeout(() => {
      setHistory(prev => ({
        past: [...prev.past, prev.present],
        present: newBlocks,
        future: [], // Clear future when new change is made
        canUndo: true,
        canRedo: false
      }));
      
      setBlocksState(newBlocks);
      onBlocksChange?.(newBlocks);
      lastChangeTime.current = now;
    }, config.historyDebounceMs || 300);
  }, [onBlocksChange, config.historyDebounceMs]);
  
  // Sync blocks with history present
  useEffect(() => {
    if (blocks !== history.present) {
      setBlocksState(history.present);
      onBlocksChange?.(history.present);
    }
  }, [history.present, onBlocksChange]);
  
  // Generate unique block ID
  const generateBlockId = useCallback(() => {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Block operations
  const addBlock = useCallback((block: EditorBlock, index?: number) => {
    const newBlock = {
      ...block,
      id: block.id || generateBlockId()
    };
    
    const newBlocks = [...blocks];
    if (index !== undefined && index >= 0 && index <= blocks.length) {
      newBlocks.splice(index, 0, newBlock);
    } else {
      newBlocks.push(newBlock);
    }
    
    setBlocks(newBlocks);
    
    // Auto-select and start editing new block
    setSelectedBlockId(newBlock.id);
    setEditingBlockId(newBlock.id);
  }, [blocks, setBlocks, generateBlockId]);
  
  const updateBlock = useCallback((blockId: string, updates: Partial<EditorBlock>) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId ? { ...block, ...updates } : block
    );
    setBlocks(newBlocks);
  }, [blocks, setBlocks]);
  
  const deleteBlock = useCallback((blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    
    // Update selection
    if (selectedBlockId === blockId) {
      const nextBlock = newBlocks[blockIndex] || newBlocks[blockIndex - 1];
      setSelectedBlockId(nextBlock?.id || null);
    }
    
    // Stop editing if this block was being edited
    if (editingBlockId === blockId) {
      setEditingBlockId(null);
    }
  }, [blocks, selectedBlockId, editingBlockId, setBlocks]);
  
  const moveBlock = useCallback((blockId: string, newIndex: number) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex === -1 || newIndex < 0 || newIndex >= blocks.length) return;
    
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(currentIndex, 1);
    newBlocks.splice(newIndex, 0, movedBlock);
    
    setBlocks(newBlocks);
  }, [blocks, setBlocks]);
  
  const duplicateBlock = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    const duplicatedBlock = {
      ...block,
      id: generateBlockId(),
      content: block.content,
      meta: { ...block.meta }
    };
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    addBlock(duplicatedBlock, blockIndex + 1);
  }, [blocks, addBlock, generateBlockId]);
  
  // Selection operations
  const selectBlock = useCallback((blockId: string | null) => {
    setSelectedBlockId(blockId);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedBlockId(null);
  }, []);
  
  // Editing operations
  const startEditing = useCallback((blockId: string) => {
    setEditingBlockId(blockId);
    setSelectedBlockId(blockId);
  }, []);
  
  const stopEditing = useCallback(() => {
    setEditingBlockId(null);
  }, []);
  
  // Content operations
  const exportToMarkdown = useCallback((markdownPlugins: MarkdownPlugin[]) => {
    return blocks.map((block: EditorBlock) => {
      // Try to find a markdown plugin that can serialize this block
      for (const plugin of markdownPlugins) {
        if (plugin.serializer.canSerialize(block)) {
          const markdown = plugin.serializer.serializeBlock(block);
          if (markdown) return markdown;
        }
      }
      
      // Fallback to basic markdown conversion
      switch (block.type as string) {
        case 'heading':
          const level = block.meta?.level || 1;
          return `${'#'.repeat(level)} ${block.content}`;
        case 'quote':
          return `> ${block.content}`;
        case 'code':
          const language = block.meta?.language || '';
          return `\`\`\`${language}\n${block.content}\n\`\`\``;
        case 'list':
          const listType = (block.meta as any)?.listType || 'unordered';
          const listLevel = block.meta?.level || 0;
          const indent = '  '.repeat(listLevel);
          const marker = listType === 'ordered' ? '1.' : '-';
          return `${indent}${marker} ${block.content}`;
        case 'checklist':
          const checked = block.meta?.checked ? 'x' : ' ';
          const checklistLevel = block.meta?.level || 0;
          const checklistIndent = '  '.repeat(checklistLevel);
          return `${checklistIndent}- [${checked}] ${block.content}`;
        case 'image':
          const alt = block.meta?.alt || 'Image';
          const caption = block.meta?.caption;
          const url = block.meta?.url || block.content;
          return caption ? `![${alt}](${url} "${caption}")` : `![${alt}](${url})`;
        case 'video':
          const videoUrl = block.meta?.url || block.content;
          const title = block.meta?.title;
          return title ? `![video](${videoUrl} "${title}")` : `![video](${videoUrl})`;
        case 'divider':
          return '---';
        default:
          return block.content;
      }
    }).join('\n\n');
  }, [blocks]);
  
  const importFromMarkdown = useCallback((markdown: string, markdownPlugins: MarkdownPlugin[]) => {
    const lines = markdown.split('\n');
    const newBlocks: EditorBlock[] = [];
    let currentBlock = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Try markdown plugins first
      let blockCreated = false;
      for (const plugin of markdownPlugins) {
        if (plugin.parser.canParse(line)) {
          if (currentBlock.trim()) {
            // Finish previous block
            newBlocks.push({
              id: generateBlockId(),
              type: 'paragraph',
              content: currentBlock.trim(),
              meta: {}
            });
            currentBlock = '';
          }
          
          const block = plugin.parser.parseBlock(line);
          if (block) {
            newBlocks.push({ ...block, id: generateBlockId() } as EditorBlock);
            blockCreated = true;
            break;
          }
        }
      }
      
      if (blockCreated) continue;
      
      // Built-in markdown parsing
      if (line.match(/^#{1,6}\s+/)) {
        // Heading
        if (currentBlock.trim()) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: currentBlock.trim(),
            meta: {}
          });
          currentBlock = '';
        }
        
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'heading',
            content: match[2],
            meta: { level: match[1].length }
          });
        }
      } else if (line.match(/^>\s+/)) {
        // Quote
        if (currentBlock.trim()) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: currentBlock.trim(),
            meta: {}
          });
          currentBlock = '';
        }
        
        newBlocks.push({
          id: generateBlockId(),
          type: 'quote',
          content: line.replace(/^>\s+/, ''),
          meta: {}
        });
      } else if (line.match(/^```/)) {
        // Code block
        if (currentBlock.trim()) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: currentBlock.trim(),
            meta: {}
          });
          currentBlock = '';
        }
        
        const language = line.replace(/^```/, '');
        const codeLines = [];
        i++; // Skip opening ```
        
        while (i < lines.length && !lines[i].match(/^```$/)) {
          codeLines.push(lines[i]);
          i++;
        }
        
        newBlocks.push({
          id: generateBlockId(),
          type: 'code',
          content: codeLines.join('\n'),
          meta: { language: language || 'text' }
        });
      } else if (line.match(/^(---|\*\*\*|___)\s*$/)) {
        // Divider
        if (currentBlock.trim()) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: currentBlock.trim(),
            meta: {}
          });
          currentBlock = '';
        }
        
        newBlocks.push({
          id: generateBlockId(),
          type: 'divider' as EditorBlockType,
          content: '',
          meta: { style: 'solid' }
        } as EditorBlock);
      } else if (line.trim() === '') {
        // Empty line - finish current block
        if (currentBlock.trim()) {
          newBlocks.push({
            id: generateBlockId(),
            type: 'paragraph',
            content: currentBlock.trim(),
            meta: {}
          });
          currentBlock = '';
        }
      } else {
        // Regular content
        currentBlock += (currentBlock ? '\n' : '') + line;
      }
    }
    
    // Finish last block
    if (currentBlock.trim()) {
      newBlocks.push({
        id: generateBlockId(),
        type: 'paragraph',
        content: currentBlock.trim(),
        meta: {}
      });
    }
    
    setBlocks(newBlocks);
  }, [setBlocks, generateBlockId]);
  
  const exportToPlainText = useCallback(() => {
    return blocks.map(block => block.content).join('\n\n');
  }, [blocks]);
  
  // History operations
  const undo = useCallback(() => {
    if (!history.canUndo) return;
    
    const previous = history.past[history.past.length - 1];
    const newPast = history.past.slice(0, history.past.length - 1);
    
    setHistory({
      past: newPast,
      present: previous,
      future: [history.present, ...history.future],
      canUndo: newPast.length > 0,
      canRedo: true
    });
  }, [history]);
  
  const redo = useCallback(() => {
    if (!history.canRedo) return;
    
    const next = history.future[0];
    const newFuture = history.future.slice(1);
    
    setHistory({
      past: [...history.past, history.present],
      present: next,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0
    });
  }, [history]);
  
  // Create editor state
  const editorState: EditorState = {
    blocks,
    focusedBlockId: editingBlockId,
    selectedBlocks: selectedBlockId ? [selectedBlockId] : [],
    mode: 'edit' as EditorMode,
    isDirty: false,
    isLoading: false,
    errors: [],
    history
  };
  
  return {
    blocks,
    selectedBlockId,
    editingBlockId,
    editorState,
    actions: {
      setBlocks,
      addBlock,
      updateBlock,
      deleteBlock,
      moveBlock,
      duplicateBlock,
      selectBlock,
      clearSelection,
      startEditing,
      stopEditing,
      exportToMarkdown,
      importFromMarkdown,
      exportToPlainText,
      undo,
      redo,
      generateBlockId
    }
  };
}