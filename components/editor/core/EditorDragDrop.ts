import { useCallback, useRef, useState } from 'react';
import { EditorBlock } from '../../../types/editor';
import { EditorConfig } from '../types/EditorTypes';
import { BlockPlugin } from '../types/PluginTypes';

interface UseEditorDragDropProps {
  blocks: EditorBlock[];
  blockPlugins: BlockPlugin[];
  config: EditorConfig;
  actions: {
    moveBlock: (blockId: string, newIndex: number) => void;
    updateBlock: (blockId: string, updates: Partial<EditorBlock>) => void;
    selectBlock: (blockId: string | null) => void;
  };
}

interface DragState {
  isDragging: boolean;
  draggedBlockId: string | null;
  draggedBlockIndex: number | null;
  dropTargetIndex: number | null;
  dragOffset: { x: number; y: number };
  dragStartPosition: { x: number; y: number };
}

interface DropZone {
  index: number;
  rect: DOMRect;
  isActive: boolean;
}

/**
 * Custom hook for handling drag and drop functionality in the editor
 */
export function useEditorDragDrop({
  blocks,
  blockPlugins,
  config,
  actions
}: UseEditorDragDropProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedBlockId: null,
    draggedBlockIndex: null,
    dropTargetIndex: null,
    dragOffset: { x: 0, y: 0 },
    dragStartPosition: { x: 0, y: 0 }
  });
  
  const [dropZones, setDropZones] = useState<DropZone[]>([]);
  const dragElementRef = useRef<HTMLElement | null>(null);
  const dropIndicatorRef = useRef<HTMLElement | null>(null);
  
  // Check if a block can be dragged
  const canDragBlock = useCallback((blockId: string) => {
    if (!config.dragAndDrop?.enabled) return false;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;
    
    const plugin = blockPlugins.find(p => p.blockType === block.type);
    return plugin?.controller?.canDrag?.(block) !== false;
  }, [blocks, blockPlugins, config.dragAndDrop?.enabled]);
  
  // Check if a block can be dropped at a specific position
  const canDropBlock = useCallback((blockId: string, targetIndex: number) => {
    if (!config.dragAndDrop?.enabled) return false;
    
    const block = blocks.find(b => b.id === blockId);
    if (!block) return false;
    
    const plugin = blockPlugins.find(p => p.blockType === block.type);
    
    // Check plugin-specific drop rules
    if (plugin?.controller?.canDrop) {
      return plugin.controller.canDrop(block, targetIndex, blocks);
    }
    
    return true;
  }, [blocks, blockPlugins, config.dragAndDrop?.enabled]);
  
  // Start dragging a block
  const startDrag = useCallback((blockId: string, event: React.MouseEvent | React.TouchEvent) => {
    if (!canDragBlock(blockId)) return;
    
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    setDragState({
      isDragging: true,
      draggedBlockId: blockId,
      draggedBlockIndex: blockIndex,
      dropTargetIndex: null,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: clientX, y: clientY }
    });
    
    // Create drop zones
    const zones: DropZone[] = [];
    for (let i = 0; i <= blocks.length; i++) {
      if (i !== blockIndex && i !== blockIndex + 1) {
        zones.push({
          index: i,
          rect: new DOMRect(), // Will be updated during drag
          isActive: false
        });
      }
    }
    setDropZones(zones);
    
    // Select the dragged block
    actions.selectBlock(blockId);
    
    // Prevent default to avoid text selection
    event.preventDefault();
  }, [blocks, canDragBlock, actions]);
  
  // Handle drag movement
  const handleDrag = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedBlockId) return;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;
    
    const dragOffset = {
      x: clientX - dragState.dragStartPosition.x,
      y: clientY - dragState.dragStartPosition.y
    };
    
    setDragState(prev => ({
      ...prev,
      dragOffset
    }));
    
    // Find the closest drop zone
    let closestZone: DropZone | null = null;
    let closestDistance = Infinity;
    
    for (const zone of dropZones) {
      const zoneCenterY = zone.rect.top + zone.rect.height / 2;
      const distance = Math.abs(clientY - zoneCenterY);
      
      if (distance < closestDistance && distance < 50) { // 50px threshold
        closestDistance = distance;
        closestZone = zone;
      }
    }
    
    // Update drop target
    const newDropTargetIndex = closestZone?.index || null;
    if (newDropTargetIndex !== dragState.dropTargetIndex) {
      setDragState(prev => ({
        ...prev,
        dropTargetIndex: newDropTargetIndex
      }));
      
      // Update drop zones active state
      setDropZones(prev => prev.map(zone => ({
        ...zone,
        isActive: zone.index === newDropTargetIndex
      })));
    }
  }, [dragState, dropZones]);
  
  // End dragging
  const endDrag = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedBlockId) return;
    
    const { draggedBlockId, draggedBlockIndex, dropTargetIndex } = dragState;
    
    // Perform the drop if valid
    if (
      dropTargetIndex !== null &&
      draggedBlockIndex !== null &&
      dropTargetIndex !== draggedBlockIndex &&
      canDropBlock(draggedBlockId, dropTargetIndex)
    ) {
      // Calculate the actual new index (accounting for the removed item)
      let newIndex = dropTargetIndex;
      if (dropTargetIndex > draggedBlockIndex) {
        newIndex = dropTargetIndex - 1;
      }
      
      actions.moveBlock(draggedBlockId, newIndex);
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedBlockId: null,
      draggedBlockIndex: null,
      dropTargetIndex: null,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: 0, y: 0 }
    });
    
    setDropZones([]);
  }, [dragState, canDropBlock, actions]);
  
  // Cancel dragging
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedBlockId: null,
      draggedBlockIndex: null,
      dropTargetIndex: null,
      dragOffset: { x: 0, y: 0 },
      dragStartPosition: { x: 0, y: 0 }
    });
    
    setDropZones([]);
  }, []);
  
  // Get drag handle props for a block
  const getDragHandleProps = useCallback((blockId: string) => {
    if (!canDragBlock(blockId)) {
      return {};
    }
    
    return {
      draggable: true,
      onMouseDown: (event: React.MouseEvent) => startDrag(blockId, event),
      onTouchStart: (event: React.TouchEvent) => startDrag(blockId, event),
      style: {
        cursor: dragState.isDragging ? 'grabbing' : 'grab',
        userSelect: 'none' as const
      }
    };
  }, [canDragBlock, startDrag, dragState.isDragging]);
  
  // Get drag overlay props for the dragged block
  const getDragOverlayProps = useCallback(() => {
    if (!dragState.isDragging || !dragState.draggedBlockId) {
      return { style: { display: 'none' as 'none' } };
    }
    
    return {
      style: {
        position: 'absolute' as 'absolute',
        top: dragState.dragOffset.y,
        left: dragState.dragOffset.x,
        zIndex: 1000,
        opacity: 0.8,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#007AFF',
        borderRadius: 8,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8
      }
    };
  }, [dragState]);
  
  // Get drop indicator props
  const getDropIndicatorProps = useCallback((index: number) => {
    const isActive = dragState.dropTargetIndex === index;
    
    return {
      style: {
        height: isActive ? 4 : 2,
        backgroundColor: isActive ? '#007AFF' : 'transparent',
        borderRadius: 2,
        marginVertical: 4,
        opacity: isActive ? 1 : 0
      }
    };
  }, [dragState.dropTargetIndex]);
  
  // Get block props for drag and drop
  const getBlockProps = useCallback((blockId: string, index: number) => {
    const isDragged = dragState.draggedBlockId === blockId;
    
    return {
      style: {
        opacity: isDragged ? 0.5 : 1,
        transition: isDragged ? 'none' : 'opacity 0.2s ease',
        transform: isDragged ? 'scale(0.95)' : 'scale(1)'
      },
      onMouseMove: handleDrag,
      onTouchMove: handleDrag,
      onMouseUp: endDrag,
      onTouchEnd: endDrag,
      onMouseLeave: () => {
        // Cancel drag if mouse leaves the editor area
        if (dragState.isDragging) {
          cancelDrag();
        }
      }
    };
  }, [dragState, handleDrag, endDrag, cancelDrag]);
  
  // Handle drag events from external sources (e.g., file drops)
  const handleExternalDrop = useCallback((event: React.DragEvent, targetIndex: number) => {
    event.preventDefault();
    
    const files = Array.from(event.dataTransfer.files);
    const text = event.dataTransfer.getData('text/plain');
    const html = event.dataTransfer.getData('text/html');
    
    // Handle file drops
    if (files.length > 0) {
      files.forEach((file, fileIndex) => {
        if (file.type.startsWith('image/')) {
          // Create image block
          // Note: URL.createObjectURL is not available in React Native
          // In React Native, you would typically use a different approach for file handling
          const imageUrl = typeof URL !== 'undefined' && URL.createObjectURL ? 
            URL.createObjectURL(file) : 
            `file://${file.name}`; // Fallback for React Native
          
          const imageBlock: EditorBlock = {
            id: `block_${Date.now()}_${fileIndex}`,
            type: 'image',
            content: '',
            meta: {
              url: imageUrl,
              alt: file.name,
              caption: ''
            }
          };
          
          actions.updateBlock(imageBlock.id, imageBlock);
        } else if (file.type.startsWith('video/')) {
          // Create video block
          // Note: URL.createObjectURL is not available in React Native
          const videoUrl = typeof URL !== 'undefined' && URL.createObjectURL ? 
            URL.createObjectURL(file) : 
            `file://${file.name}`; // Fallback for React Native
          
          const videoBlock: EditorBlock = {
            id: `block_${Date.now()}_${fileIndex}`,
            type: 'video' as any,
            content: '',
            meta: {
              url: videoUrl,
              title: file.name
            }
          };
          
          actions.updateBlock(videoBlock.id, videoBlock);
        }
      });
    }
    
    // Handle text drops
    else if (text) {
      const textBlock: EditorBlock = {
        id: `block_${Date.now()}`,
        type: 'paragraph',
        content: text,
        meta: {}
      };
      
      actions.updateBlock(textBlock.id, textBlock);
    }
    
    // Handle HTML drops
    else if (html) {
      // Basic HTML to block conversion - simplified for React Native
      // Remove HTML tags using regex since we don't have DOM
      const textContent = html.replace(/<[^>]*>/g, '').trim();
      const htmlBlock: EditorBlock = {
        id: `block_${Date.now()}`,
        type: 'paragraph',
        content: textContent,
        meta: {}
      };
      
      actions.updateBlock(htmlBlock.id, htmlBlock);
    }
  }, [actions]);
  
  // Get drop zone props for external drops
  const getDropZoneProps = useCallback((index: number) => {
    return {
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
      },
      onDrop: (event: React.DragEvent) => handleExternalDrop(event, index)
    };
  }, [handleExternalDrop]);
  
  return {
    dragState,
    dropZones,
    canDragBlock,
    canDropBlock,
    startDrag,
    handleDrag,
    endDrag,
    cancelDrag,
    getDragHandleProps,
    getDragOverlayProps,
    getDropIndicatorProps,
    getBlockProps,
    getDropZoneProps,
    handleExternalDrop
  };
}

/**
 * Utility function to check if drag and drop is supported
 */
export function isDragDropSupported(): boolean {
  // In React Native, we can simulate drag and drop with touch events
  return true;
}

/**
 * Utility function to get drag and drop configuration
 */
export function getDragDropConfig() {
  return {
    enabled: isDragDropSupported(),
    threshold: 5, // Minimum distance to start drag
    dropZoneHeight: 4, // Height of drop indicator
    animationDuration: 200, // Animation duration in ms
    dragOpacity: 0.5, // Opacity of dragged element
    dragScale: 0.95 // Scale of dragged element
  };
}