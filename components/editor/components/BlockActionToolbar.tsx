import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { EditorBlock } from '../../../types/editor';
import { useEditor } from '../core/EditorContext';
import { getQuoteCursorState } from '../plugins/built-in/QuotePlugin';

type ToolbarAction = {
  id: string;
  label: string;
  icon?: string;
  content?: string;
  disabled?: boolean;
  onPress: () => void;
};

interface BlockActionToolbarProps {
  readOnly?: boolean;
}

const MIN_HEADING_LEVEL = 1;
const MAX_HEADING_LEVEL = 6;
const MIN_QUOTE_DEPTH = 1;
const MAX_QUOTE_DEPTH = 5;
const MIN_LIST_LEVEL = 0;
const MAX_LIST_LEVEL = 5;

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
 * Floating toolbar with contextual actions for the focused block.
 * Provides quick mobile-friendly controls for adjusting heading levels,
 * quote depth, list indentation, and common destructive actions.
 */
export const BlockActionToolbar: React.FC<BlockActionToolbarProps> = ({ readOnly }) => {
  const colorScheme = useColorScheme();
  const styles = useMemo(() => getStyles(colorScheme ?? 'light'), [colorScheme]);

  const {
    state,
    updateBlock,
    deleteBlock,
  } = useEditor();

  const activeBlock = useMemo(() => {
    if (!state.focusedBlockId) {
      return null;
    }
    return state.blocks.find((block) => block.id === state.focusedBlockId) ?? null;
  }, [state.blocks, state.focusedBlockId]);

  const isVisible = !!activeBlock && !readOnly && state.mode === 'edit';

  const handleHeadingLevelChange = useCallback((delta: number) => {
    if (!activeBlock) return;
    const currentLevel = activeBlock.meta?.level ?? MIN_HEADING_LEVEL;
    const nextLevel = Math.min(
      MAX_HEADING_LEVEL,
      Math.max(MIN_HEADING_LEVEL, currentLevel + delta)
    );
    if (nextLevel === currentLevel) return;

    const nextMeta: Record<string, any> = {
      ...(activeBlock.meta ?? {}),
      level: nextLevel,
    };
    updateBlock(activeBlock.id, { meta: nextMeta });
  }, [activeBlock, updateBlock]);

  const handleQuoteDepthChange = useCallback((delta: number) => {
    if (!activeBlock) return;

    const normalizedContent = (activeBlock.content ?? '').replace(/\r/g, '');
    const lineCount = normalizedContent.length > 0 ? normalizedContent.split('\n').length : 1;
    const lineDepths = normalizeQuoteDepths(activeBlock, lineCount);
    const cursorInfo = getQuoteCursorState(activeBlock.id);
    const targetIndex = Math.max(0, Math.min(cursorInfo?.lineIndex ?? 0, lineCount - 1));

    const currentDepth = lineDepths[targetIndex] ?? MIN_QUOTE_DEPTH;
    const nextDepth = Math.min(
      MAX_QUOTE_DEPTH,
      Math.max(MIN_QUOTE_DEPTH, currentDepth + delta)
    );
    if (nextDepth === currentDepth) return;

    lineDepths[targetIndex] = nextDepth;

    const nextMeta: Record<string, any> = {
      ...(activeBlock.meta ?? {}),
      depth: lineDepths[0] ?? MIN_QUOTE_DEPTH,
      quoteLineDepths: lineDepths,
    };

    updateBlock(activeBlock.id, { meta: nextMeta });
  }, [activeBlock, updateBlock]);

  const handleListLevelChange = useCallback((delta: number) => {
    if (!activeBlock) return;
    const currentLevel = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
    const nextLevel = Math.min(
      MAX_LIST_LEVEL,
      Math.max(MIN_LIST_LEVEL, currentLevel + delta)
    );
    if (nextLevel === currentLevel) return;

    const nextMeta: Record<string, any> = {
      ...(activeBlock.meta ?? {}),
      level: nextLevel,
    };

    const simulatedBlocks = state.blocks.map((block) =>
      block.id === activeBlock.id
        ? { ...block, meta: nextMeta }
        : block
    );

    updateBlock(activeBlock.id, { meta: nextMeta });

    if ((nextMeta.listType ?? 'unordered') === 'ordered') {
      const counters: number[] = [];
      simulatedBlocks.forEach((block) => {
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
  }, [activeBlock, state.blocks, updateBlock]);

  const handleToggleListType = useCallback(() => {
    if (!activeBlock) return;
    const currentType = activeBlock.meta?.listType ?? 'unordered';
    const nextType = currentType === 'ordered' ? 'unordered' : 'ordered';

    const nextMeta: Record<string, any> = {
      ...(activeBlock.meta ?? {}),
      listType: nextType,
    };

    if (nextType === 'ordered') {
      nextMeta.index = activeBlock.meta?.index ?? 1;
    } else if ('index' in nextMeta) {
      delete nextMeta.index;
    }

    updateBlock(activeBlock.id, { meta: nextMeta });
  }, [activeBlock, updateBlock]);

  const handleChecklistLevelChange = useCallback((delta: number) => {
    if (!activeBlock) return;
    const currentLevel = activeBlock.meta?.level ?? MIN_LIST_LEVEL;
    const nextLevel = Math.min(
      MAX_LIST_LEVEL,
      Math.max(MIN_LIST_LEVEL, currentLevel + delta)
    );
    if (nextLevel === currentLevel) return;

    const nextMeta: Record<string, any> = {
      ...(activeBlock.meta ?? {}),
      level: nextLevel,
    };
    updateBlock(activeBlock.id, { meta: nextMeta });
  }, [activeBlock, updateBlock]);

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
  ]);

  if (!isVisible || toolbarActions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.inner}>
        {toolbarActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.button,
              action.disabled && styles.buttonDisabled,
            ]}
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
              <Text
                style={[
                  styles.buttonText,
                  action.disabled && styles.buttonTextDisabled,
                ]}
              >
                {action.content}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 16,
      zIndex: 50,
    },
    inner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isDark
        ? 'rgba(15, 23, 42, 0.92)'
        : 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#000000',
      shadowOpacity: isDark ? 0.4 : 0.1,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 20,
      elevation: 8,
      gap: 8,
    },
    button: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(15, 23, 42, 0.06)',
    },
    buttonDisabled: {
      opacity: 0.4,
    },
    buttonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      opacity: 0.5,
    },
  });
};

export default BlockActionToolbar;
