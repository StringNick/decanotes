import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  Animated,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  TextStyle,
  TouchableOpacity,
  View
} from 'react-native';
import { BlockRegistry, defaultBlockRegistry } from '../blocks';
import UniversalBlock from '../blocks/UniversalBlock';
import defaultTheme from '../themes/defaultTheme';
import {
  Block,
  BlockProps,
  BlockType,
  EditorMode,
  EditorTheme,
  FormattedTextSegment,
  MarkdownEditorRef,
} from '../types/editor';
import {
  blocksToMarkdown,
  generateId,
  getDisplayValue,
  parseMarkdownToBlocks,
  parseRawText
} from '../utils/markdownParser';
import ModeSwitcher from './ModeSwitcher';

// (local UI-specific types that extend shared types continue below)
export interface MarkdownEditorProps {
  /* Controlled markdown string */
  value?: string;
  /* Default markdown string (uncontrolled) */
  defaultValue?: string;
  /* Legacy prop; kept for backward-compat */
  initialMarkdown?: string;

  onMarkdownChange?: (markdown: string) => void;
  onBlockChange?: (blocks: Block[]) => void;

  /* New unified mode prop */
  mode?: EditorMode;
  onModeChange?: (mode: EditorMode) => void;

  /* Deprecated – use mode='preview' instead */
  readOnly?: boolean;

  placeholder?: string;
  theme?: EditorTheme;
  customBlocks?: Record<string, React.ComponentType<BlockProps>>;
}

// BlockProps imported from shared types

// ModeSwitcher imported from separate component

// Parser helpers imported from utils/markdownParser.

// Component to render formatted text
const FormattedText: React.FC<{ 
  segments: FormattedTextSegment[]; 
  style?: TextStyle; 
  theme: Required<EditorTheme>;
}> = ({ segments, style, theme }) => {
  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        let segmentStyle: TextStyle = {};
        switch (segment.type) {
          case 'bold':
            segmentStyle = theme.bold;
            break;
          case 'italic':
            segmentStyle = theme.italic;
            break;
          case 'bold-italic':
            segmentStyle = { ...(theme.bold as any), ...(theme.italic as any) };
            break;
          case 'code':
            segmentStyle = theme.inlineCode;
            break;
          default:
            segmentStyle = {};
        }
        return (
          <Text key={index} style={segmentStyle}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

// defaultTheme imported from themes module

// Main Editor Component
const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ 
    value,
    defaultValue,
    initialMarkdown = '',
    onMarkdownChange, 
    onBlockChange,
    mode: controlledMode,
    onModeChange,
    readOnly = false,
    placeholder = 'Start typing...',
    theme = {},
    customBlocks = {}
  }, ref) => {
    // Use controlled or uncontrolled markdown value
    const initialText = value ?? defaultValue ?? initialMarkdown;

    const [blocks, setBlocks] = useState<Block[]>(() => parseMarkdownToBlocks(initialText));
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

    const isControlled = controlledMode !== undefined;
    const [uncontrolledMode, setUncontrolledMode] = useState<EditorMode>('edit');
    const mode = isControlled ? controlledMode! : uncontrolledMode;

    const [rawMarkdown, setRawMarkdown] = useState<string>('');
    const scrollViewRef = useRef<ScrollView>(null);
    
    // Merge themes
    const mergedTheme = {
      ...defaultTheme,
      ...theme,
    };
    
    // Drag and drop state - simplified with long press
    const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
    const [isDragReady, setIsDragReady] = useState<string | null>(null);
    const [originalDragIndex, setOriginalDragIndex] = useState<number | null>(null);
    
    // Visual animation values
    const dragScale = useRef(new Animated.Value(1)).current;
    const dragOpacity = useRef(new Animated.Value(1)).current;
    const dragY = useRef(new Animated.Value(0)).current;
    const dragShadow = 0; // placeholder kept for compatibility, no longer animated
    const pulseAnim = new Animated.Value(1); // kept but not animated (pulse disabled)
    
    // Auto-scroll state
    const [scrollViewLayout, setScrollViewLayout] = useState<{ height: number; y: number } | null>(null);
    const [currentScrollY, setCurrentScrollY] = useState(0);
    const [contentHeight, setContentHeight] = useState(0);
    const autoScrollTimer = useRef<number | null>(null);
    const longPressTimer = useRef<number | null>(null);
    const dragReadyTimer = useRef<number | null>(null);
    const pulseAnimation = useRef<Animated.CompositeAnimation | null>(null);

    // Internal toggle between edit and raw. Preview is handled externally via props.
    const toggleMode = useCallback(() => {
      let next: EditorMode;
      if (mode === 'edit') {
        setRawMarkdown(blocksToMarkdown(blocks));
        next = 'raw';
      } else if (mode === 'raw') {
        const newBlocks = parseMarkdownToBlocks(rawMarkdown);
        setBlocks(newBlocks);
        next = 'edit';
      } else {
        // if currently in preview, switch to edit first
        next = 'edit';
      }

      if (isControlled) {
        onModeChange?.(next);
      } else {
        setUncontrolledMode(next);
      }
    }, [mode, blocks, rawMarkdown, isControlled, onModeChange]);

    // Move block up in the list
    const moveBlockUp = useCallback((blockId: string) => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex <= 0) return false;
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(currentIndex, 1);
        newBlocks.splice(currentIndex - 1, 0, movedBlock);
        return newBlocks;
      });
      
      return true;
    }, [blocks]);

    // Move block down in the list
    const moveBlockDown = useCallback((blockId: string) => {
      const currentIndex = blocks.findIndex(b => b.id === blockId);
      if (currentIndex >= blocks.length - 1) return false;
      
      setBlocks(prev => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(currentIndex, 1);
        newBlocks.splice(currentIndex + 1, 0, movedBlock);
        return newBlocks;
      });
      
      return true;
    }, [blocks]);

    // Enhanced auto-scroll function with proper content boundary detection
    const handleAutoScroll = useCallback((gestureY: number) => {
      if (!scrollViewRef.current || !scrollViewLayout || !draggingBlockId) return;
      
      const edgeThreshold = 50;
      const scrollSpeed = 8;
      
      // Clear existing timer
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      
      const relativeY = gestureY - scrollViewLayout.y;
      
      // Only auto-scroll if we're dragging within the ScrollView bounds
      if (relativeY < 0 || relativeY > scrollViewLayout.height) return;
      
      const maxScrollY = Math.max(0, contentHeight - scrollViewLayout.height);
      
      // Check if dragging near top edge and can scroll up
      if (relativeY < edgeThreshold && currentScrollY > 0) {
        autoScrollTimer.current = setInterval(() => {
          const newScrollY = Math.max(0, currentScrollY - scrollSpeed);
          scrollViewRef.current?.scrollTo({ 
            y: newScrollY, 
            animated: false 
          });
          setCurrentScrollY(newScrollY);
        }, 16) as unknown as number;
      } 
      // Check if dragging near bottom edge and can scroll down
      else if (relativeY > (scrollViewLayout.height - edgeThreshold) && currentScrollY < maxScrollY) {
        autoScrollTimer.current = setInterval(() => {
          const newScrollY = Math.min(maxScrollY, currentScrollY + scrollSpeed);
          scrollViewRef.current?.scrollTo({ 
            y: newScrollY, 
            animated: false 
          });
          setCurrentScrollY(newScrollY);
        }, 16) as unknown as number;
      }
    }, [scrollViewLayout, currentScrollY, contentHeight, draggingBlockId]);

    // Enhanced drag functions with better feedback
    const prepareDrag = useCallback((blockId: string) => {
      if (draggingBlockId || isDragReady) {
        return;
      }
      
      setIsDragReady(blockId);
      
      // Medium haptic feedback to indicate drag is ready
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Visual feedback - simple scale up
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1.02,
          useNativeDriver: true,
          tension: 400,
          friction: 20,
        }),
      ]).start();
    }, [draggingBlockId, isDragReady, dragScale]);

    const startDrag = useCallback((blockId: string) => {
      if (draggingBlockId || isDragReady !== blockId) {
        return;
      }
      
      // Stop pulse animation
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
        pulseAnimation.current = null;
      }
      
      // Store original position for reference
      const originalIndex = blocks.findIndex(b => b.id === blockId);
      setOriginalDragIndex(originalIndex);
      
      dragY.setValue(0);
      setDraggingBlockId(blockId);
      setIsDragReady(null);
      
      // Strong haptic feedback for drag start
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Enhanced drag animation with shadow
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 300,
          friction: 15,
        }),
        Animated.timing(dragOpacity, {
          toValue: 0.85,
          useNativeDriver: true,
          duration: 200,
        }),
      ]).start();
    }, [draggingBlockId, isDragReady, dragScale, dragOpacity, blocks]);

    const updateDrag = useCallback((gestureY: number, blockId: string) => {
      if (!draggingBlockId || draggingBlockId !== blockId) {
        return;
      }
      
      // Handle auto-scroll first
      handleAutoScroll(gestureY);
      
      // Calculate current position in the (potentially reordered) blocks array
      const currentBlockIndex = blocks.findIndex(b => b.id === blockId);
      if (currentBlockIndex === -1) return;
      
      // More accurate block height calculation
      const blockHeight = 64; // minHeight 56 + marginBottom 4 + paddingVertical 4
      const contentPaddingTop = 24; // from contentContainer style
      const scrollViewY = scrollViewLayout?.y || 0;
      
      // Calculate gesture position relative to content area
      const absoluteGestureY = gestureY - scrollViewY + currentScrollY - contentPaddingTop;
      
      // Calculate target position based on block positions
      let targetIndex = Math.round(absoluteGestureY / blockHeight);
      
      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(blocks.length - 1, targetIndex));
      
      // Add debug logging temporarily
      console.log('Drag debug:', { 
        gestureY, 
        scrollViewY, 
        currentScrollY, 
        contentPaddingTop,
        absoluteGestureY, 
        targetIndex, 
        currentBlockIndex,
        blockHeight,
        calculatedPosition: absoluteGestureY / blockHeight
      });
      
      // Only reorder if we're moving to a different position and the difference is significant
      // This helps reduce jittery behavior
      if (Math.abs(targetIndex - currentBlockIndex) >= 1) {
        setBlocks(prev => {
          const newBlocks = [...prev];
          const [movedBlock] = newBlocks.splice(currentBlockIndex, 1);
          newBlocks.splice(targetIndex, 0, movedBlock);
          return newBlocks;
        });
        
        // Haptic feedback for position changes
        Haptics.selectionAsync();
      }
    }, [draggingBlockId, blocks, handleAutoScroll, scrollViewLayout, currentScrollY]);

    const endDrag = useCallback(() => {
      // Clear timers
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      if (dragReadyTimer.current) {
        clearTimeout(dragReadyTimer.current);
        dragReadyTimer.current = null;
      }
      if (pulseAnimation.current) {
        pulseAnimation.current.stop();
        pulseAnimation.current = null;
      }
      
      if (!draggingBlockId && !isDragReady) return;

      // Success haptic feedback when drag ends
      if (draggingBlockId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reset all states
      setDraggingBlockId(null);
      setIsDragReady(null);
      setOriginalDragIndex(null);
      
      // Smooth return animation
      Animated.parallel([
        Animated.spring(dragScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        Animated.spring(dragOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 20,
        }),
        // shadow & pulse reset animations removed
      ]).start();
    }, [draggingBlockId, isDragReady, blocks, dragScale, dragOpacity]);

    // Create PanResponder for drag gestures
    const createDragResponder = useCallback((blockId: string) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => {
          return isDragReady === blockId;
        },
        onMoveShouldSetPanResponder: () => {
          return draggingBlockId === blockId;
        },
        onPanResponderGrant: (evt, gestureState) => {
          if (isDragReady === blockId) {
            startDrag(blockId);
          }
        },
        onPanResponderMove: (evt, gestureState) => {
          if (draggingBlockId === blockId) {
            // Update drag position immediately for smooth animation
            dragY.setValue(gestureState.dy);
            // Throttle the updateDrag calls to reduce lag
            updateDrag(evt.nativeEvent.pageY, blockId);
          }
        },
        onPanResponderRelease: () => {
          endDrag();
        },
        onPanResponderTerminate: () => {
          endDrag();
        },
      });
    }, [isDragReady, draggingBlockId, startDrag, updateDrag, endDrag]);

    const handleBlockBlur = useCallback(() => {
      // Use timeout to prevent immediate blur when switching between blocks
      setTimeout(() => {
        setFocusedBlockId(null);
        
        // Stop pulse animation if running
        if (pulseAnimation.current) {
          pulseAnimation.current.stop();
          pulseAnimation.current = null;
        }
        
        // Reset animations
        Animated.parallel([
          Animated.spring(dragScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          Animated.spring(dragOpacity, {
            toValue: 1,
            useNativeDriver: true,
            tension: 300,
            friction: 20,
          }),
          // shadow & pulse reset animations removed
        ]).start();
      }, 100);
    }, [dragScale, dragOpacity]);

    const handleContainerPress = useCallback(() => {
      // Click outside to blur focused block
      if (focusedBlockId) {
        setFocusedBlockId(null);
      }
    }, [focusedBlockId]);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getMarkdown: () => blocksToMarkdown(blocks),
      focus: () => {
        if (blocks.length > 0) {
          setFocusedBlockId(blocks[0].id);
        }
      },
      insertBlock: (type: BlockType, index?: number) => {
        const newBlock: Block = {
          id: generateId(),
          type,
          content: '',
          meta: type === 'heading' ? { level: 1 } : undefined
        };
        
        const insertIndex = index ?? blocks.length;
        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks.splice(insertIndex, 0, newBlock);
          return newBlocks;
        });
        
        setTimeout(() => {
          setFocusedBlockId(newBlock.id);
        }, 0);
      },
      deleteBlock: (id: string) => {
        setBlocks(prev => prev.filter(block => block.id !== id));
        setFocusedBlockId(null);
      },
      moveBlockUp: (id: string) => moveBlockUp(id),
      moveBlockDown: (id: string) => moveBlockDown(id),
      toggleMode: () => toggleMode(),
      getCurrentMode: () => mode,
    }), [blocks, mode, toggleMode, moveBlockUp, moveBlockDown]);

    // Update blocks when markdown value changes (controlled)
    useEffect(() => {
      if (value !== undefined && value !== blocksToMarkdown(blocks)) {
        setBlocks(parseMarkdownToBlocks(value));
      }
    }, [value]);

    // support legacy initialMarkdown prop (uncontrolled)
    useEffect(() => {
      if (value === undefined && initialMarkdown !== blocksToMarkdown(blocks)) {
        setBlocks(parseMarkdownToBlocks(initialMarkdown));
      }
    }, [initialMarkdown, value]);

    // Notify parent of changes
    useEffect(() => {
      const markdown = blocksToMarkdown(blocks);
      if (!value) {
        // uncontrolled: internal state drives value
        onMarkdownChange?.(markdown);
      } else {
        // controlled: rely on external value change
        onMarkdownChange?.(markdown);
      }
      onBlockChange?.(blocks);
    }, [blocks, onMarkdownChange, onBlockChange]);

    // Update raw markdown when typing in raw mode
    const handleRawMarkdownChange = useCallback((text: string) => {
      setRawMarkdown(text);
    }, []);

    const handleRawTextChange = useCallback((blockId: string, text: string) => {
      const blockIndex = blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return;

      const currentBlock = blocks[blockIndex];
      const parsed = parseRawText(text, currentBlock);

      setBlocks(prev => 
        prev.map(block => 
          block.id === blockId 
            ? { ...block, type: parsed.type, content: parsed.content, meta: parsed.meta }
            : block
        )
      );
    }, [blocks]);

    const handleKeyPress = useCallback((
      e: NativeSyntheticEvent<TextInputKeyPressEventData>,
      blockId: string,
      blockIndex: number
    ) => {
      const { key } = e.nativeEvent;

      if (key === 'Enter') {
        const currentBlock = blocks[blockIndex];
        
        if (!currentBlock.content.trim()) {
          return;
        }

        const newBlock: Block = {
          id: generateId(),
          type: 'paragraph',
          content: ''
        };

        setBlocks(prev => {
          const newBlocks = [...prev];
          newBlocks.splice(blockIndex + 1, 0, newBlock);
          return newBlocks;
        });

        setTimeout(() => {
          setFocusedBlockId(newBlock.id);
        }, 0);
      }

      if (key === 'Backspace') {
        const currentBlock = blocks[blockIndex];
        
        if (currentBlock.type === 'quote') {
          if (!currentBlock.content.trim()) {
            e.preventDefault();
            setBlocks(prev => 
              prev.map(block => 
                block.id === blockId 
                  ? { ...block, type: 'paragraph', content: '', meta: undefined }
                  : block
              )
            );
            return;
          }
          
          if (currentBlock.content.trim().length <= 1) {
            e.preventDefault();
            setBlocks(prev => 
              prev.map(block => 
                block.id === blockId 
                  ? { ...block, type: 'paragraph', content: currentBlock.content.trim(), meta: undefined }
                  : block
              )
            );
            return;
          }
        }
        
        if (!currentBlock.content.trim() && blocks.length > 1) {
          e.preventDefault();
          
          setBlocks(prev => prev.filter(block => block.id !== blockId));
          
          if (blockIndex > 0) {
            setTimeout(() => {
              setFocusedBlockId(blocks[blockIndex - 1].id);
            }, 0);
          }
        }
      }
    }, [blocks]);

    const renderBlock = (block: Block, index: number) => {
      const isFocused = focusedBlockId === block.id;
      const displayValue = getDisplayValue(block, isFocused);
      
      const blockProps: BlockProps = {
        block,
        index,
        isActive: isFocused,
        isEditing: isFocused,
        displayValue,
        onRawTextChange: (text: string) => handleRawTextChange(block.id, text),
        onFocus: () => setFocusedBlockId(block.id),
        onEdit: () => setFocusedBlockId(block.id),
        onBlur: handleBlockBlur,
        onKeyPress: (e) => handleKeyPress(e, block.id, index),
        theme: mergedTheme,
        placeholder
      };

      const registry: BlockRegistry = { ...defaultBlockRegistry, ...customBlocks };
      const BlockComponent = registry[block.type] || UniversalBlock;

      const actionButtons = isFocused ? (
        <View style={styles.blockActions} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (index > 0) {
                moveBlockUp(block.id);
                Haptics.selectionAsync();
              }
            }}
            disabled={index === 0}
          >
            <Ionicons
              name="arrow-up"
              size={16}
              color={index === 0 ? '#cbd5e1' : '#4b5563'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (index < blocks.length - 1) {
                moveBlockDown(block.id);
                Haptics.selectionAsync();
              }
            }}
            disabled={index === blocks.length - 1}
          >
            <Ionicons
              name="arrow-down"
              size={16}
              color={index === blocks.length - 1 ? '#cbd5e1' : '#4b5563'}
            />
          </TouchableOpacity>
        </View>
      ) : null;

      const blockContent = (
        <View style={styles.blockContent} pointerEvents="box-none">
          <BlockComponent {...blockProps} />
        </View>
      );

      const blockAnimatedStyle = [
        styles.block,
        mergedTheme.block,
        isFocused && styles.focusedBlock,
        isFocused && mergedTheme.focusedBlock,
      ];

      return (
        <View key={block.id}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => {
              if (!isPreview) {
                setFocusedBlockId(block.id);
              }
            }}
            disabled={isPreview}
            style={styles.blockTouchWrapper}
          >
            <Animated.View style={blockAnimatedStyle}>
              {blockContent}
              {actionButtons}
            </Animated.View>
          </TouchableOpacity>
        </View>
      );
    };

    const isPreview = readOnly || mode === 'preview';

    if (isPreview) {
      return (
        <ScrollView style={[styles.container, mergedTheme.container]}>
          <View style={styles.contentContainer}>
            {blocks.map((block, index) => {
              const displayValue = getDisplayValue(block, false);
              return (
                <View key={block.id} style={[styles.block, mergedTheme.block]}>
                  <UniversalBlock
                    block={block}
                    index={index}
                    isActive={false}
                    isEditing={false}
                    displayValue={displayValue}
                    onRawTextChange={() => {}}
                    onFocus={() => {}}
                    onEdit={() => {}}
                    onBlur={() => {}}
                    onKeyPress={() => {}}
                    theme={mergedTheme}
                    placeholder={placeholder}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      );
    }

    return (
      <View style={[styles.container, mergedTheme.container]}>
        {mode === 'edit' ? (
          <TouchableOpacity 
            style={styles.scrollViewContainer}
            activeOpacity={1}
            onPress={handleContainerPress}
          >
            <ScrollView 
              ref={scrollViewRef}
              style={styles.scrollView}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              onLayout={(event) => {
                setScrollViewLayout({
                  height: event.nativeEvent.layout.height,
                  y: event.nativeEvent.layout.y,
                });
              }}
              onScroll={(event) => {
                setCurrentScrollY(event.nativeEvent.contentOffset.y);
              }}
              onContentSizeChange={(width, height) => {
                setContentHeight(height);
              }}
              scrollEventThrottle={16}
            >
              {blocks.map(renderBlock)}
            </ScrollView>
          </TouchableOpacity>
        ) : (
          <View style={styles.rawContainer}>
            <TextInput
              style={[styles.rawInput, mergedTheme.input]}
              value={rawMarkdown}
              onChangeText={handleRawMarkdownChange}
              placeholder={placeholder}
              placeholderTextColor="#a1a1aa"
              multiline
              textAlignVertical="top"
              autoCorrect={false}
              autoCapitalize="none"
              spellCheck={false}
              selectionColor="#3b82f6"
            />
          </View>
        )}

        <ModeSwitcher mode={mode} onToggle={toggleMode} />
      </View>
    );
  }
);

// Styles - Modern and minimalistic
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollViewContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 120,
  },
  block: {
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 2,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'transparent',
    minHeight: 56, // Increased minimum height for better touch target
  },
  focusedBlock: {
    borderColor: 'rgba(59, 130, 246, 0.15)',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
  },
  blockContent: {
    minHeight: 48,
  },
  blockTouchWrapper: {
    // Empty style, TouchableOpacity will handle the touch area
  },
  blockActions: {
    position: 'absolute',
    right: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 8,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionButton: {
    padding: 4,
  },
  input: {
    fontSize: 16,
    lineHeight: 26,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    minHeight: 48,
    paddingHorizontal: 0,
    paddingVertical: 10,
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'System',
    }),
    color: '#1a1a1a',
  },
  focusedInput: {
    backgroundColor: 'transparent',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#1a1a1a',
    paddingVertical: 10,
    minHeight: 48,
  },
  placeholderText: {
    color: '#a8a8a8',
    fontWeight: '300',
  },
  codeBlockContainer: {
    backgroundColor: '#f7f7f7',
    borderRadius: 12,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  codeInput: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    fontSize: 14,
    lineHeight: 22,
    backgroundColor: 'transparent',
    color: '#2d3748',
  },
  quoteContainer: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    paddingLeft: 20,
    marginVertical: 8,
  },
  quoteInput: {
    fontStyle: 'italic',
    color: '#4a5568',
    backgroundColor: 'transparent',
    fontWeight: '300',
  },
  listContainer: {
    marginVertical: 4,
  },
  checklistContainer: {
    marginVertical: 4,
  },
  dividerContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dropZoneIndicator: {
    height: 3,
    backgroundColor: '#3b82f6',
    borderRadius: 1.5,
    marginVertical: 8,
    marginHorizontal: 20,
    opacity: 0.8, // More visible
  },
  finalDropZone: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  rawContainer: {
    flex: 1,
    padding: 24,
  },
  rawInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'Monaco, Menlo, monospace',
    }),
    color: '#2d3748',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  // Mode Switcher Styles
  modeSwitcher: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modeSwitcherTrack: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  modeSwitcherThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    left: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  modeSwitcherLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  modeSwitcherLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  modeSwitcherLabelActive: {
    color: '#ffffff',
  },
});

export default MarkdownEditor;

// Re-export shared types for convenience so consumers can import from this module
export type { Block, EditorMode, EditorTheme, MarkdownEditorRef } from '../types/editor';

