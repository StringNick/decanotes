import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, LayoutChangeEvent, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { EditorBlock } from '../../../types/editor';
import { useEditor } from '../core/EditorContext';
import { getQuoteCursorState } from '../plugins/built-in/QuotePlugin';
import { getListSiblingIndices } from '../utils/listHelpers';

type KeyboardDockSection = ReactNode | null;

type ToolbarAction = {
  id: string;
  label: string;
  icon?: string;
  content?: string;
  disabled?: boolean;
  onPress: () => void;
};

interface EditorBottomBarProps {
  keyboardHeight: number;
  visible: boolean;
  readOnly?: boolean;
  // KeyboardDock sections
  blockSection?: KeyboardDockSection;
  formattingSection?: KeyboardDockSection;
  actionSection?: KeyboardDockSection;
  onHeightChange?: (height: number) => void;
}

const MIN_HEADING_LEVEL = 1;
const MAX_HEADING_LEVEL = 6;
const MIN_QUOTE_DEPTH = 1;
const MAX_QUOTE_DEPTH = 5;
const MIN_LIST_LEVEL = 0;
const MAX_LIST_LEVEL = 5;

const TOOLBAR_ANIMATION_DURATION = 200;

const normalizeQuoteDepths = (block: EditorBlock, lineCount: number): number[] => {
  const stored = (block.meta?.quoteLineDepths as number[] | undefined) || [];
  const fallback = block.meta?.depth ?? MIN_QUOTE_DEPTH;
  const depths: number[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    const value = stored[i] ?? fallback;
    const clamped = Math.min(MAX_QUOTE_DEPTH, Math.max(MIN_QUOTE_DEPTH, value));
    depths.push(clamped);
  }
  return depths;
};

/**
 * Unified bottom bar combining block action toolbar and keyboard dock.
 * Provides contextual block controls (when active) and keyboard shortcuts/tools.
 */
export const EditorBottomBar: React.FC<EditorBottomBarProps> = ({
  keyboardHeight,
  visible,
  readOnly,
  blockSection,
  formattingSection,
  actionSection,
  onHeightChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const toolbarOpacity = useRef(new Animated.Value(0)).current;
  const lastMeasuredHeight = useRef(0);

  const { state, updateBlock, deleteBlock } = useEditor();

  const styles = useMemo(() => getStyles(colorScheme ?? 'light', colors), [colorScheme, colors]);

  const activeBlock = useMemo(() => {
    if (!state.focusedBlockId) {
      return null;
    }
    return state.blocks.find(block => block.id === state.focusedBlockId) ?? null;
  }, [state.blocks, state.focusedBlockId]);

  const showToolbar = !!activeBlock && !readOnly && state.mode === 'edit';

  // Animate toolbar visibility
  useEffect(() => {
    Animated.timing(toolbarOpacity, {
      toValue: showToolbar ? 1 : 0,
      duration: TOOLBAR_ANIMATION_DURATION,
      useNativeDriver: true,
    }).start();
  }, [showToolbar, toolbarOpacity]);

  useEffect(() => {
    return () => {
      if (lastMeasuredHeight.current !== 0) {
        onHeightChange?.(0);
      }
      lastMeasuredHeight.current = 0;
    };
  }, [onHeightChange]);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const height = event.nativeEvent.layout.height;
      if (Math.abs(lastMeasuredHeight.current - height) > 1) {
        lastMeasuredHeight.current = height;
        onHeightChange?.(height);
      }
    },
    [onHeightChange]
  );

  // Keyboard dock positioning
  const translateY = visible ? 0 : 120;
  const basePadding = Platform.OS === 'ios' ? insets.bottom : insets.bottom + 6;

  // Always use app background color for seamless integration
  const backgroundStyle = {
    backgroundColor: colors.background,
  };

  // Block action handlers
  const handleHeadingLevelChange = useCallback(
    (delta: number) => {
      if (!activeBlock) return;
      const currentLevel = activeBlock.meta?.level ?? MIN_HEADING_LEVEL;
      const nextLevel = Math.min(MAX_HEADING_LEVEL, Math.max(MIN_HEADING_LEVEL, currentLevel + delta));
      if (nextLevel === currentLevel) return;

      const nextMeta: Record<string, any> = {
        ...(activeBlock.meta ?? {}),
        level: nextLevel,
      };
      updateBlock(activeBlock.id, { meta: nextMeta });
    },
    [activeBlock, updateBlock]
  );

  const handleQuoteDepthChange = useCallback(
    (delta: number) => {
      if (!activeBlock) return;

      const normalizedContent = (activeBlock.content ?? '').replace(/\r/g, '');
      const lineCount = normalizedContent.length > 0 ? normalizedContent.split('\n').length : 1;
      const lineDepths = normalizeQuoteDepths(activeBlock, lineCount);
      const cursorInfo = getQuoteCursorState(activeBlock.id);
      const targetIndex = Math.max(0, Math.min(cursorInfo?.lineIndex ?? 0, lineCount - 1));

      const currentDepth = lineDepths[targetIndex] ?? MIN_QUOTE_DEPTH;
      const nextDepth = Math.min(MAX_QUOTE_DEPTH, Math.max(MIN_QUOTE_DEPTH, currentDepth + delta));
      if (nextDepth === currentDepth) return;

      lineDepths[targetIndex] = nextDepth;

      const nextMeta: Record<string, any> = {
        ...(activeBlock.meta ?? {}),
        depth: lineDepths[0] ?? MIN_QUOTE_DEPTH,
        quoteLineDepths: lineDepths,
      };

      updateBlock(activeBlock.id, { meta: nextMeta });
    },
    [activeBlock, updateBlock]
  );

  const handleListLevelChange = useCallback(
    (delta: number) => {
      if (!activeBlock) return;
      const currentLevel = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
      const nextLevel = Math.min(MAX_LIST_LEVEL, Math.max(MIN_LIST_LEVEL, currentLevel + delta));
      if (nextLevel === currentLevel) return;

      const nextMeta: Record<string, any> = {
        ...(activeBlock.meta ?? {}),
        level: nextLevel,
      };

      const simulatedBlocks = state.blocks.map(block =>
        block.id === activeBlock.id ? { ...block, meta: nextMeta } : block
      );

      updateBlock(activeBlock.id, { meta: nextMeta });

      if ((nextMeta.listType ?? 'unordered') === 'ordered') {
        const counters: number[] = [];
        simulatedBlocks.forEach(block => {
          if (block.type !== 'list') return;
          const listMeta: Record<string, any> = { ...(block.meta ?? {}) };
          const level = listMeta.level ?? 0;
          const listType = listMeta.listType ?? 'unordered';

          if (listType === 'ordered') {
            counters[level] = (counters[level] ?? 0) + 1;
            counters.length = level + 1;
            const desiredIndex = counters[level];

            if (listMeta.index !== desiredIndex) {
              updateBlock(block.id, {
                meta: {
                  ...listMeta,
                  index: desiredIndex,
                },
              });
            }
          } else {
            counters.length = level;
          }
        });
      }
    },
    [activeBlock, state.blocks, updateBlock]
  );

  const previousListMetaRef = useRef<Map<string, Record<string, any>>>(new Map());

  const handleToggleListType = useCallback(() => {
    if (!activeBlock) return;
    const blockIndex = state.blocks.findIndex(b => b.id === activeBlock.id);
    if (blockIndex === -1) return;

    const currentType = activeBlock.meta?.listType ?? 'unordered';
    const nextType = currentType === 'ordered' ? 'unordered' : 'ordered';

    const siblingIndices = getListSiblingIndices(state.blocks, blockIndex);
    const targets = siblingIndices.length > 0 ? siblingIndices : [blockIndex];
    const store = previousListMetaRef.current;

    if (currentType === 'unordered') {
      targets.forEach(idx => {
        const block = state.blocks[idx];
        if (!block || block.type !== 'list') return;
        store.set(block.id, { ...(block.meta ?? {}) });
      });
    }

    targets.forEach((idx, order) => {
      const block = state.blocks[idx];
      if (!block || block.type !== 'list') return;

      if (nextType === 'unordered') {
        const previousMeta = store.get(block.id);
        if (previousMeta) {
          const restored = { ...previousMeta, listType: 'unordered' };
          updateBlock(block.id, { meta: restored });
          store.delete(block.id);
          return;
        }
      }

      const nextMeta: Record<string, any> = {
        ...(block.meta ?? {}),
        listType: nextType,
      };

      if (nextType === 'ordered') {
        nextMeta.index = order + 1;
      }

      updateBlock(block.id, { meta: nextMeta });
    });
  }, [activeBlock, state.blocks, updateBlock]);

  const handleChecklistLevelChange = useCallback(
    (delta: number) => {
      if (!activeBlock) return;
      const currentLevel = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
      const nextLevel = Math.min(MAX_LIST_LEVEL, Math.max(MIN_LIST_LEVEL, currentLevel + delta));
      if (nextLevel === currentLevel) return;

      const nextMeta: Record<string, any> = {
        ...(activeBlock.meta ?? {}),
        level: nextLevel,
      };
      updateBlock(activeBlock.id, { meta: nextMeta });
    },
    [activeBlock, updateBlock]
  );

  const handleDelete = useCallback(() => {
    if (!activeBlock) return;
    deleteBlock(activeBlock.id);
  }, [activeBlock, deleteBlock]);

  const toolbarActions: ToolbarAction[] = useMemo(() => {
    if (!activeBlock) return [];

    const actions: ToolbarAction[] = [];

    switch (activeBlock.type) {
      case 'heading': {
        const level = activeBlock.meta?.level ?? MIN_HEADING_LEVEL;
        actions.push({
          id: 'heading-level-up',
          label: 'Heading level up',
          icon: 'chevron-up',
          disabled: level <= MIN_HEADING_LEVEL,
          onPress: () => handleHeadingLevelChange(-1),
        });
        actions.push({
          id: 'heading-level-down',
          label: 'Heading level down',
          icon: 'chevron-down',
          disabled: level >= MAX_HEADING_LEVEL,
          onPress: () => handleHeadingLevelChange(1),
        });
        break;
      }
      case 'quote': {
        const normalizedContent = (activeBlock.content ?? '').replace(/\r/g, '');
        const lineCount = normalizedContent.length > 0 ? normalizedContent.split('\n').length : 1;
        const lineDepths = normalizeQuoteDepths(activeBlock, lineCount);
        const cursorInfo = getQuoteCursorState(activeBlock.id);
        const targetIndex = Math.max(0, Math.min(cursorInfo?.lineIndex ?? 0, lineCount - 1));
        const depth = lineDepths[targetIndex] ?? MIN_QUOTE_DEPTH;

        actions.push({
          id: 'quote-depth-decrease',
          label: 'Decrease quote depth',
          icon: 'chevron-back',
          disabled: depth <= MIN_QUOTE_DEPTH,
          onPress: () => handleQuoteDepthChange(-1),
        });
        actions.push({
          id: 'quote-depth-increase',
          label: 'Increase quote depth',
          icon: 'chevron-forward',
          disabled: depth >= MAX_QUOTE_DEPTH,
          onPress: () => handleQuoteDepthChange(1),
        });
        break;
      }
      case 'list': {
        const level = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
        actions.push({
          id: 'list-outdent',
          label: 'Outdent list item',
          icon: 'chevron-back',
          disabled: level <= MIN_LIST_LEVEL,
          onPress: () => handleListLevelChange(-1),
        });
        actions.push({
          id: 'list-indent',
          label: 'Indent list item',
          icon: 'chevron-forward',
          disabled: level >= MAX_LIST_LEVEL,
          onPress: () => handleListLevelChange(1),
        });
        actions.push({
          id: 'list-toggle-type',
          label: 'Toggle list style',
          icon: activeBlock.meta?.listType === 'ordered' ? 'list-outline' : 'list',
          onPress: handleToggleListType,
        });
        break;
      }
      case 'checklist': {
        const level = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
        actions.push({
          id: 'checklist-outdent',
          label: 'Outdent checklist item',
          icon: 'chevron-back',
          disabled: level <= MIN_LIST_LEVEL,
          onPress: () => handleChecklistLevelChange(-1),
        });
        actions.push({
          id: 'checklist-indent',
          label: 'Indent checklist item',
          icon: 'chevron-forward',
          disabled: level >= MAX_LIST_LEVEL,
          onPress: () => handleChecklistLevelChange(1),
        });
        break;
      }
      default:
        break;
    }

    actions.push({
      id: 'delete-block',
      label: 'Delete block',
      icon: 'trash-outline',
      onPress: handleDelete,
    });

    return actions;
  }, [
    activeBlock,
    handleChecklistLevelChange,
    handleDelete,
    handleHeadingLevelChange,
    handleListLevelChange,
    handleQuoteDepthChange,
    handleToggleListType,
  ]);

  // Get level/depth indicator
  const getLevelIndicator = () => {
    if (!activeBlock) return null;

    switch (activeBlock.type) {
      case 'heading':
        return `H${activeBlock.meta?.level ?? 1}`;
      case 'quote': {
        const normalizedContent = (activeBlock.content ?? '').replace(/\r/g, '');
        const lineCount = normalizedContent.length > 0 ? normalizedContent.split('\n').length : 1;
        const lineDepths = normalizeQuoteDepths(activeBlock, lineCount);
        const cursorInfo = getQuoteCursorState(activeBlock.id);
        const targetIndex = Math.max(0, Math.min(cursorInfo?.lineIndex ?? 0, lineCount - 1));
        const depth = lineDepths[targetIndex] ?? MIN_QUOTE_DEPTH;
        return `>${depth}`;
      }
      case 'list':
      case 'checklist':
        return `L${activeBlock.meta?.level ?? 0}`;
      default:
        return null;
    }
  };

  const levelIndicator = getLevelIndicator();
  const deleteAction = toolbarActions.find(a => a.id === 'delete-block');
  const otherActions = toolbarActions.filter(a => a.id !== 'delete-block');

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          bottom: keyboardHeight > 0 ? keyboardHeight : 0,
        },
      ]}
    >
      <View
        style={[
          styles.surface,
          backgroundStyle,
          {
            paddingBottom: keyboardHeight > 0 ? 8 : Math.max(8, basePadding),
            // Light shadow always visible to separate from content
            shadowOpacity: colorScheme === 'dark' ? 0.4 : 0.2,
            elevation: 4,
          },
        ]}
        onLayout={handleLayout}
      >
        {/* Block Action Toolbar Section - Fades in/out */}
        <Animated.View
          style={[
            styles.toolbarSection,
            {
              opacity: toolbarOpacity,
              // Reserve space even when invisible to prevent layout shift
              height: showToolbar ? 'auto' : 0,
              overflow: 'hidden',
            },
          ]}
          pointerEvents={showToolbar ? 'auto' : 'none'}
        >
          <View style={styles.toolbarInner}>
            {/* Level/Depth control buttons */}
            <View style={styles.controlGroup}>
              {otherActions.map(action => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.button, action.disabled && styles.buttonDisabled]}
                  onPress={action.onPress}
                  activeOpacity={0.7}
                  disabled={action.disabled}
                  accessibilityLabel={action.label}
                >
                  {action.icon ? (
                    <Ionicons
                      name={action.icon as any}
                      size={20}
                      color={colorScheme === 'dark' ? '#FFFFFF' : '#0F172A'}
                      style={{ opacity: action.disabled ? 0.4 : 1 }}
                    />
                  ) : (
                    <Text style={[styles.buttonText, action.disabled && styles.buttonTextDisabled]}>
                      {action.content}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Level indicator in the middle */}
            {levelIndicator && (
              <View style={styles.levelIndicator}>
                <Text style={styles.levelText}>{levelIndicator}</Text>
              </View>
            )}

            {/* Delete button separated */}
            {deleteAction && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={deleteAction.onPress}
                activeOpacity={0.7}
                accessibilityLabel={deleteAction.label}
              >
                <Ionicons name={deleteAction.icon as any} size={20} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Divider between toolbar and dock sections */}
        {showToolbar && <View style={styles.sectionDivider} />}

        {/* Keyboard Dock Sections */}
        {blockSection && <View style={styles.blockRow}>{blockSection}</View>}

        {formattingSection && <View style={styles.divider} />}

        {formattingSection && <View style={styles.formattingRow}>{formattingSection}</View>}

        {actionSection && (
          <>
            <View style={styles.divider} />
            <View style={styles.actionRow}>{actionSection}</View>
          </>
        )}
      </View>
    </Animated.View>
  );
};

const getStyles = (theme: 'light' | 'dark', colors: typeof Colors.light) => {
  const isDark = theme === 'dark';

  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 50,
    },
    surface: {
      // backgroundColor is dynamic - applied inline
      borderRadius: 0,
      paddingTop: 8, // Padding for visual separation
      paddingHorizontal: 8,
      // Top border for clear boundary
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
      // Shadow properties
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
      // shadowOpacity and elevation are dynamic - applied inline
      // paddingBottom is dynamic - applied inline
    },
    // Toolbar Section Styles
    toolbarSection: {
      width: '100%',
    },
    toolbarInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
    },
    controlGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    button: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.1)',
    },
    buttonDisabled: {
      opacity: 0.35,
    },
    levelIndicator: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(167, 139, 250, 0.2)' : 'rgba(139, 92, 246, 0.15)',
      marginHorizontal: 12,
    },
    levelText: {
      fontSize: 15,
      fontWeight: '700',
      color: isDark ? '#C4B5FD' : '#7C3AED',
      fontFamily: 'SpaceMono-Regular',
    },
    deleteButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
    },
    buttonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      opacity: 0.5,
    },
    sectionDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      marginVertical: 4,
      marginHorizontal: 8,
    },
    // Keyboard Dock Section Styles
    blockRow: {
      width: '100%',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 4,
    },
    formattingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 4,
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingTop: 4,
      paddingBottom: 4,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      marginVertical: 2,
    },
  });
};

export default EditorBottomBar;
