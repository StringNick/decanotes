import React, { useCallback } from 'react';
import { Platform } from 'react-native';
import { EditorBlock } from '../../../types/editor';
import { BlockController } from '../types/PluginTypes';
import { useEditor, useEditorState } from './EditorContext';

interface KeyboardHandlerProps {
  block: EditorBlock;
  controller?: BlockController;
  cursorPosition?: number;
  blockIndex?: number;
  children: (props: {
    onKeyPress: (event: any) => void;
    preventNewlines?: boolean;
  }) => React.ReactNode;
}

/**
 * Reusable keyboard handler that works for both web and React Native
 * Handles keyboard events and delegates to plugin controllers
 */
export const KeyboardHandler: React.FC<KeyboardHandlerProps> = ({
  block,
  controller,
  cursorPosition = 0,
  blockIndex,
  children
}) => {
  const editor = useEditor();
  const { blocks } = useEditorState();
  
  const currentBlockIndex = blockIndex ?? blocks.findIndex(b => b.id === block.id);

  // Check if the controller handles Enter key
  const shouldPreventNewlines = !!controller?.handleEnter;

  const handleKeyPress = useCallback((event: any) => {
    const key = Platform.OS === 'web' 
      ? event.key 
      : event.nativeEvent?.key;

    // Handle Enter key
    if (key === 'Enter') {
      if (controller?.handleEnter) {
        const result = controller.handleEnter(block);
        
        if (result) {
          // Prevent default behavior
          if (event.preventDefault) event.preventDefault();
          
          if (Array.isArray(result)) {
            // Handle multiple blocks (e.g., split block)
            
            // Delete current block
            editor.deleteBlock(block.id);
            
            // Add new blocks with preserved metadata
            result.forEach((newBlock, index) => {
              // Use dispatch directly to preserve metadata
              editor.dispatch({ 
                type: 'ADD_BLOCK', 
                block: newBlock, 
                index: currentBlockIndex + index 
              });
            });
            
            // Focus on the second block (usually where cursor should go)
            if (result.length > 1) {
              // Focus on the new block (second in array) directly
              const newBlock = result[1];
              setTimeout(() => {
                editor.focusBlock(newBlock.id);
              }, 0);
            }
          } else {
            // Handle single block update
            editor.updateBlock(block.id, result);
          }
          
          return;
        }
      }
      
      // Default Enter behavior: create new paragraph block after current
      editor.createBlock('paragraph', '', currentBlockIndex + 1);
      
      // Focus new block
      setTimeout(() => {
        const newBlocks = editor.state.blocks;
        const newBlock = newBlocks[currentBlockIndex + 1];
        if (newBlock) {
          editor.focusBlock(newBlock.id);
        }
      }, 0);
      
      if (event.preventDefault) event.preventDefault();
      return;
    }

    // Handle Backspace key
    if (key === 'Backspace' && cursorPosition === 0) {
      if (controller?.handleBackspace) {
        const result = controller.handleBackspace(block);
        
        if (result) {
          if (event.preventDefault) event.preventDefault();
          
          if (typeof result === 'object' && result !== null) {
            // Update the block
            editor.updateBlock(block.id, result);
          } else {
            // Delete the block
            editor.deleteBlock(block.id);
            
            // Focus previous block
            if (currentBlockIndex > 0) {
              const prevBlock = blocks[currentBlockIndex - 1];
              if (prevBlock) {
                editor.focusBlock(prevBlock.id);
              }
            }
          }
          
          return;
        }
      }
    }

    // Handle Tab key
    if (key === 'Tab') {
      if (controller?.handleTab) {
        const result = controller.handleTab(block, event, editor);
        
        if (result) {
          if (event.preventDefault) event.preventDefault();
          return;
        }
      }
    }

    // Handle other keys through general key handler
    if (controller?.handleKeyPress) {
      const keyEvent = {
        key,
        ctrlKey: event.ctrlKey || false,
        metaKey: event.metaKey || false,
        shiftKey: event.shiftKey || false,
        altKey: event.altKey || false
      };
      
      const result = controller.handleKeyPress(keyEvent, block);
      if (result && typeof result === 'object') {
        if (event.preventDefault) event.preventDefault();
        editor.updateBlock(block.id, result);
      }
    }
  }, [block, controller, cursorPosition, currentBlockIndex, editor, blocks]);

  return <>{children({ onKeyPress: handleKeyPress, preventNewlines: shouldPreventNewlines })}</>;
}; 