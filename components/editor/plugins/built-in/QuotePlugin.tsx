import React, { forwardRef, useImperativeHandle, useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Animated, StyleSheet, Text, TextInput, View, NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { FormattedTextInput } from '../../components/FormattedTextInput';
import { BlockComponentProps } from '../../types/PluginTypes';
import { BlockPlugin } from '../BlockPlugin';
import { ANIMATION_CONFIG, BLOCK_SPACING, getQuoteFocusColors } from '../../styles/blockStyles';

export const DEFAULT_QUOTE_DEPTH = 1;
const MAX_QUOTE_DEPTH = 5;

type QuoteCursorInfo = {
  position: number;
  lineIndex: number;
};

const quoteCursorState: Record<string, QuoteCursorInfo> = {};

export const setQuoteCursorState = (blockId: string, info: QuoteCursorInfo) => {
  quoteCursorState[blockId] = info;
};

export const clearQuoteCursorState = (blockId: string) => {
  delete quoteCursorState[blockId];
};

export const getQuoteCursorState = (blockId: string): QuoteCursorInfo | undefined => {
  return quoteCursorState[blockId];
};

const SPACES_PER_DEPTH = 2;
const LINE_HEIGHT = 24;
const DEPTH_BAR_WIDTH = 4;
const DEPTH_BAR_GAP = 4;
const OVERLAY_WIDTH = MAX_QUOTE_DEPTH * (DEPTH_BAR_WIDTH + DEPTH_BAR_GAP);

const clampDepth = (value: number) => {
  return Math.min(MAX_QUOTE_DEPTH, Math.max(DEFAULT_QUOTE_DEPTH, value));
};

const ensureLineDepths = (
  lineCount: number,
  storedDepths?: number[],
  fallbackDepth: number = DEFAULT_QUOTE_DEPTH
): number[] => {
  const depths: number[] = [];
  for (let i = 0; i < lineCount; i += 1) {
    const depth = storedDepths && storedDepths[i] !== undefined
      ? storedDepths[i]
      : fallbackDepth;
    depths.push(clampDepth(depth));
  }
  return depths;
};

const buildDisplayValue = (lines: string[], depths: number[]): string => {
  return lines
    .map((line, index) => {
      const depth = clampDepth(depths[index] ?? DEFAULT_QUOTE_DEPTH);
      const indentLevel = Math.max(depth - 1, 0);
      const indent = indentLevel > 0 ? ' '.repeat(indentLevel * SPACES_PER_DEPTH) : '';
      return `${indent}${line}`;
    })
    .join('\n');
};

const parseQuoteInput = (
  text: string,
  previousDepths: number[]
): { lines: string[]; depths: number[] } => {
  const normalizedText = text.replace(/\r/g, '');
  const rawLines = normalizedText.split('\n');
  const resultLines: string[] = [];
  const lineDepths: number[] = [];

  rawLines.forEach((rawLine, index) => {
    let workingLine = rawLine;
    let depth = previousDepths[index] ?? DEFAULT_QUOTE_DEPTH;

    const chevronMatch = workingLine.match(/^>+\s*/);
    if (chevronMatch) {
      const markers = (chevronMatch[0].match(/>/g) || []).length;
      depth = clampDepth(markers);
      workingLine = workingLine.slice(chevronMatch[0].length);
    } else {
      const leadingSpacesMatch = workingLine.match(/^ +/);
      if (leadingSpacesMatch) {
        const spaceCount = leadingSpacesMatch[0].length;
        if (spaceCount >= SPACES_PER_DEPTH) {
          const indentLevel = Math.floor(spaceCount / SPACES_PER_DEPTH);
          depth = clampDepth(indentLevel + 1);
          workingLine = workingLine.slice(indentLevel * SPACES_PER_DEPTH);
        }
      }
    }

    resultLines.push(workingLine);
    lineDepths.push(depth);
  });

  return { lines: resultLines, depths: lineDepths };
};

const getLineIndexFromPosition = (text: string, position: number): number => {
  const clamped = Math.max(0, Math.min(position, text.length));
  const substring = text.slice(0, clamped);
  const lines = substring.split('\n');
  return Math.max(lines.length - 1, 0);
};

const getLineStartPosition = (text: string, lineIndex: number): number => {
  if (lineIndex <= 0) {
    return 0;
  }

  const lines = text.split('\n');
  let offset = 0;
  for (let i = 0; i < lineIndex && i < lines.length; i += 1) {
    offset += lines[i].length + 1;
  }
  return offset;
};

/**
 * Quote block component with multi-line and per-line depth support
 */
const QuoteComponent = forwardRef<TextInput, BlockComponentProps>(({
  block,
  onBlockChange,
  onUpdate,
  onFocus,
  onBlur,
  onKeyPress,
  isSelected,
  isFocused,
  isEditing,
  style
}, ref) => {
  const inputRef = useRef<TextInput>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';
  const [inputValue, setInputValue] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const latestValueRef = useRef('');

  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const shouldFocus = isFocused || isEditing;

  const contentLines = useMemo(() => {
    const raw = (block.content ?? '').replace(/\r/g, '');
    return raw.length > 0 ? raw.split('\n') : [''];
  }, [block.content]);

  const storedDepths = (block.meta?.quoteLineDepths as number[] | undefined)
    || (block.meta?.depth !== undefined ? [block.meta.depth] : undefined);

  const lineDepths = useMemo(
    () => ensureLineDepths(contentLines.length, storedDepths, block.meta?.depth ?? DEFAULT_QUOTE_DEPTH),
    [contentLines.length, storedDepths, block.meta?.depth]
  );

  const primaryDepth = lineDepths[0] ?? DEFAULT_QUOTE_DEPTH;

  const displayValue = useMemo(
    () => buildDisplayValue(contentLines, lineDepths),
    [contentLines, lineDepths]
  );

  useEffect(() => {
    if (inputValue !== displayValue) {
      setInputValue(displayValue);
      latestValueRef.current = displayValue;
    }
  }, [displayValue]);

  useEffect(() => {
    latestValueRef.current = inputValue;
  }, [inputValue]);

  useEffect(() => {
    const persistedCursor = getQuoteCursorState(block.id);
    if (persistedCursor) {
      const lineIndex = Math.max(0, Math.min(persistedCursor.lineIndex, lineDepths.length - 1));
      const position = Math.max(0, Math.min(persistedCursor.position, latestValueRef.current.length));
      setActiveLineIndex(lineIndex);
      setCursorPosition(position);
    } else {
      const defaultLineIndex = Math.max(lineDepths.length - 1, 0);
      const position = latestValueRef.current.length;
      setActiveLineIndex(defaultLineIndex);
      setCursorPosition(position);
    }
  }, [block.id]);

  useEffect(() => {
    if (activeLineIndex >= lineDepths.length) {
      setActiveLineIndex(Math.max(lineDepths.length - 1, 0));
    }
  }, [lineDepths.length, activeLineIndex]);

  useEffect(() => {
    return () => {
      clearQuoteCursorState(block.id);
    };
  }, [block.id]);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: shouldFocus ? 1 : 0,
      duration: ANIMATION_CONFIG.duration,
      useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
    }).start();
  }, [shouldFocus, animatedValue]);

  const handleTextChange = (text: string) => {
    setInputValue(text);
    latestValueRef.current = text;

    const { lines, depths } = parseQuoteInput(text, lineDepths);
    const normalizedLines = lines.length > 0 ? lines : [''];
    const normalizedDepths = ensureLineDepths(
      normalizedLines.length,
      depths,
      depths[0] ?? lineDepths[0] ?? DEFAULT_QUOTE_DEPTH
    );

    const previousLineCount = contentLines.length;
    const newLineCount = normalizedLines.length;
    if (newLineCount !== previousLineCount) {
      let targetIndex = activeLineIndex;
      const delta = newLineCount - previousLineCount;
      if (delta > 0) {
        targetIndex = Math.min(newLineCount - 1, activeLineIndex + delta);
      } else if (targetIndex >= newLineCount) {
        targetIndex = Math.max(newLineCount - 1, 0);
      }
      const newPosition = text.length;
      setActiveLineIndex(targetIndex);
      setCursorPosition(newPosition);
      setQuoteCursorState(block.id, { position: newPosition, lineIndex: targetIndex });
    }

    const updatedMeta = {
      ...(block.meta ?? {}),
      depth: normalizedDepths[0] ?? DEFAULT_QUOTE_DEPTH,
      quoteLineDepths: normalizedDepths,
    };

    if (onBlockChange) {
      onBlockChange({
        content: normalizedLines.join('\n'),
        meta: updatedMeta,
      });
    } else if (onUpdate) {
      onUpdate({
        ...block,
        content: normalizedLines.join('\n'),
        meta: updatedMeta,
      });
    }
  };

  const handleSelectionChange = (event: any) => {
    const position = event.nativeEvent.selection.start;
    setCursorPosition(position);

    const currentValue = latestValueRef.current;
    const lineIndex = getLineIndexFromPosition(currentValue, position);
    setActiveLineIndex(lineIndex);

    setQuoteCursorState(block.id, { position, lineIndex });
  };

  const handleKeyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    const key = event.nativeEvent.key;

    if (key === 'Backspace') {
      const lineStart = getLineStartPosition(inputValue, activeLineIndex);
      const offsetInLine = cursorPosition - lineStart;
      const currentDepth = lineDepths[activeLineIndex] ?? DEFAULT_QUOTE_DEPTH;
      const indentBoundary = Math.max((currentDepth - 1) * SPACES_PER_DEPTH, 0);

      if (offsetInLine <= indentBoundary && currentDepth > DEFAULT_QUOTE_DEPTH) {
        event.preventDefault();
        const nextDepths = [...lineDepths];
        nextDepths[activeLineIndex] = clampDepth(currentDepth - 1);

        const updatedMeta = {
          ...(block.meta ?? {}),
          depth: nextDepths[0] ?? DEFAULT_QUOTE_DEPTH,
          quoteLineDepths: nextDepths,
        };

        if (onBlockChange) {
          onBlockChange({ meta: updatedMeta });
        } else if (onUpdate) {
          onUpdate({
            ...block,
            meta: updatedMeta,
          });
        }
        return;
      }

      const isSingleLine = contentLines.length <= 1;
      const lineContent = contentLines[activeLineIndex] ?? '';

      if (offsetInLine === 0 && currentDepth === DEFAULT_QUOTE_DEPTH && isSingleLine && lineContent.length > 0) {
        const markdownPrefix = '>'.repeat(currentDepth);
        const paragraphContent = `${markdownPrefix}${lineContent}`;

        if (onBlockChange) {
          onBlockChange({
            type: 'paragraph' as EditorBlockType,
            content: paragraphContent,
            meta: {},
          });
        } else if (onUpdate) {
          onUpdate({
            ...block,
            type: 'paragraph',
            content: paragraphContent,
            meta: {},
          });
        }

        event.preventDefault();
        return;
      }
    }

    onKeyPress?.(event);
  };

  const handleBlur = () => {
    clearQuoteCursorState(block.id);
    onBlur?.();
  };

  const handleFocus = () => {
    const persisted = getQuoteCursorState(block.id);
    if (persisted) {
      const lineIndex = Math.max(0, Math.min(persisted.lineIndex, lineDepths.length - 1));
      const position = Math.max(0, Math.min(persisted.position, latestValueRef.current.length));
      setActiveLineIndex(lineIndex);
      setCursorPosition(position);
      setQuoteCursorState(block.id, { position, lineIndex });
    } else {
      const defaultLineIndex = Math.max(lineDepths.length - 1, 0);
      const position = latestValueRef.current.length;
      setActiveLineIndex(defaultLineIndex);
      setCursorPosition(position);
      setQuoteCursorState(block.id, { position, lineIndex: defaultLineIndex });
    }
    onFocus?.();
  };

const styles = useMemo(() => getStyles(colorScheme ?? 'light', primaryDepth), [colorScheme, primaryDepth]);
const focusColors = getQuoteFocusColors(colorScheme ?? 'light', shouldFocus || false);
const activeRowColor = colorScheme === 'dark'
  ? 'rgba(148, 193, 255, 0.12)'
  : 'rgba(37, 99, 235, 0.08)';
const getDepthColor = useCallback((level: number) => {
  const baseColors = colorScheme === 'dark'
    ? ['rgba(148, 193, 255, 0.35)', 'rgba(56, 189, 248, 0.4)', 'rgba(16, 185, 129, 0.35)', 'rgba(249, 115, 22, 0.35)', 'rgba(241, 171, 255, 0.4)']
    : ['rgba(37, 99, 235, 0.25)', 'rgba(14, 165, 233, 0.25)', 'rgba(34, 197, 94, 0.25)', 'rgba(249, 115, 22, 0.2)', 'rgba(168, 85, 247, 0.2)'];
  return baseColors[level % baseColors.length];
}, [colorScheme]);

  const depthOverlay = useMemo(() => {
    return (
      <View style={styles.depthOverlay} pointerEvents="none">
        {lineDepths.map((depth, index) => {
          const isActive = index === activeLineIndex;
          return (
            <View
              key={`depth-row-${index}`}
              style={[
                styles.depthRow,
                {
                  top: index * LINE_HEIGHT,
                  backgroundColor: isActive ? activeRowColor : 'transparent',
                }
              ]}
            >
              {Array.from({ length: depth }).map((_, depthIndex) => (
                <View
                  key={`depth-bar-${index}-${depthIndex}`}
                  style={[
                    styles.depthBar,
                    {
                      left: depthIndex * (DEPTH_BAR_WIDTH + DEPTH_BAR_GAP),
                      backgroundColor: getDepthColor(depthIndex),
                    }
                  ]}
                />
              ))}
            </View>
          );
        })}
      </View>
    );
  }, [lineDepths, activeLineIndex, activeRowColor, getDepthColor, styles.depthOverlay, styles.depthRow, styles.depthBar]);

  const animatedBarColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
      focusColors.barColor,
    ],
  });

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0, 0, 0, 0)', focusColors.backgroundColor],
  });

  const author = block.meta?.author;
  const source = block.meta?.source;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[styles.quoteContainer, { backgroundColor: animatedBackgroundColor }]}
      >
        <View style={styles.quoteMarkMinimal}>
          <Animated.View
            style={[styles.quoteBarMinimal, { backgroundColor: animatedBarColor }]}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.inputWrapper}>
            {depthOverlay}
            <FormattedTextInput
              ref={inputRef}
              value={inputValue}
              onChangeText={handleTextChange}
              onSelectionChange={handleSelectionChange}
              onKeyPress={handleKeyPress}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Quote..."
              placeholderTextColor={colors.textSecondary}
              isSelected={isSelected}
              isEditing={isEditing}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              style={styles.textInput}
            />
          </View>

          {(author || source) && (
            <View style={styles.attribution}>
              {author && <Text style={styles.author}>— {author}</Text>}
              {source && <Text style={styles.source}>{source}</Text>}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
});

QuoteComponent.displayName = 'QuoteComponent';

const getStyles = (colorScheme: 'light' | 'dark', depth: number = 1) => {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return StyleSheet.create({
    container: {
      marginVertical: BLOCK_SPACING.marginVertical,
    },
    quoteContainer: {
      flexDirection: 'row',
      backgroundColor: 'transparent', // Will be overridden by animated value
      paddingVertical: BLOCK_SPACING.paddingVertical,
      paddingLeft: BLOCK_SPACING.paddingLeft,
      paddingRight: BLOCK_SPACING.paddingRight,
    },
    quoteMarkMinimal: {
      marginRight: 8,
      alignItems: 'center',
      justifyContent: 'center',
      width: 2,
    },
    quoteBarMinimal: {
      width: 2,
      height: '100%',
      minHeight: 24,
    },
    content: {
      flex: 1,
    },
    inputWrapper: {
      position: 'relative',
      paddingLeft: OVERLAY_WIDTH + 12,
      minHeight: LINE_HEIGHT,
    },
    textInput: {
      fontSize: 16,
      lineHeight: LINE_HEIGHT,
      color: colors.text,
      fontStyle: 'normal',
      minHeight: 24,
      // NO padding - container handles all spacing
      paddingHorizontal: 0,
      paddingVertical: 0,
      opacity: 0.9,
    },
    depthOverlay: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: OVERLAY_WIDTH,
    },
    depthRow: {
      position: 'absolute',
      left: 0,
      height: LINE_HEIGHT,
      width: OVERLAY_WIDTH,
      borderRadius: 6,
    },
    depthBar: {
      position: 'absolute',
      top: (LINE_HEIGHT - 14) / 2,
      width: DEPTH_BAR_WIDTH,
      height: 14,
      borderRadius: DEPTH_BAR_WIDTH,
    },
    attribution: {
      marginTop: 12,
      alignItems: 'flex-end',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    author: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
      fontStyle: 'normal',
    },
    source: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 4,
      fontStyle: 'normal',
    },
  });
};

/**
 * Quote block plugin
 */
export class QuotePlugin extends BlockPlugin {
  readonly id = 'quote';
  readonly name = 'Quote';
  readonly version = '1.0.0';
  readonly description = 'Quote blocks for highlighting important text';
  readonly blockType = 'quote';
  readonly component = QuoteComponent;

  readonly markdownSyntax = {
    patterns: {
      block: /^(>+)\s*(.*)$/  // Match one or more '>' followed by optional content
    },
    priority: 75
  };

  readonly toolbar = {
    icon: 'quote-left',
    label: 'Quote',
    shortcut: 'Ctrl+Shift+.',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root', 'callout'] as EditorBlockType[],
    validation: {
      maxLength: 10000
    },
    defaultMeta: {
      depth: DEFAULT_QUOTE_DEPTH,
      quoteLineDepths: [DEFAULT_QUOTE_DEPTH]
    }
  };

  // constructor() {
  //   super();
  // }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );
    const currentDepth = lineDepths[lineDepths.length - 1] ?? DEFAULT_QUOTE_DEPTH;

    if (normalizedContent.trim() === '') {
      return {
        id: generateId(),
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }
    
    return [
      block,
      {
        id: generateId(),
        type: 'quote',
        content: '',
        meta: {
          depth: currentDepth,
          quoteLineDepths: [currentDepth]
        }
      }
    ];
  }

  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );

    const hasContent = normalizedContent.trim().length > 0;
    const allDepthOne = lineDepths.every(depth => depth === DEFAULT_QUOTE_DEPTH);

    if (!hasContent && allDepthOne) {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }
    
    return {
      ...block,
      meta: {
        ...(block.meta ?? {}),
        depth: lineDepths[0] ?? DEFAULT_QUOTE_DEPTH,
        quoteLineDepths: lineDepths
      }
    };
  }

  protected transformContent(content: string): string {
    const normalized = content.replace(/\r/g, '');
    const lines = normalized.split('\n');
    const cleanLines = lines.map((line) => line.replace(/^>+\s*/, ''));
    return cleanLines.join('\n');
  }

  public getActions(block: EditorBlock) {
    // Return only the default actions (duplicate and delete)
    return super.getActions(block);
  }

  /**
   * Create quote block with author, source, and depth
   */
  createQuoteBlock(
    content: string = '',
    depth: number = DEFAULT_QUOTE_DEPTH,
    author?: string,
    source?: string,
    lineDepths?: number[]
  ): EditorBlock {
    const normalizedContent = content.replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const resolvedDepths = ensureLineDepths(
      lines.length,
      lineDepths,
      depth
    );

    const meta: Record<string, any> = {
      depth: resolvedDepths[0] ?? DEFAULT_QUOTE_DEPTH,
      quoteLineDepths: resolvedDepths
    };
    if (author) meta.author = author;
    if (source) meta.source = source;
    
    return {
      id: generateId(),
      type: 'quote',
      content: normalizedContent,
      meta
    };
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );

    return {
      ...block,
      content: normalizedContent,
      meta: {
        ...(block.meta ?? {}),
        depth: lineDepths[0] ?? DEFAULT_QUOTE_DEPTH,
        quoteLineDepths: lineDepths,
      }
    };
  }

  protected onUpdate(oldBlock: EditorBlock, newBlock: EditorBlock): EditorBlock {
    const normalizedContent = (newBlock.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      newBlock.meta?.quoteLineDepths as number[] | undefined,
      newBlock.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );

    return {
      ...newBlock,
      content: normalizedContent,
      meta: {
        ...(newBlock.meta ?? {}),
        depth: lineDepths[0] ?? DEFAULT_QUOTE_DEPTH,
        quoteLineDepths: lineDepths,
      }
    };
  }

  /**
   * Parse markdown quote syntax with depth support
   * Examples:
   * > depth 1
   * >> depth 2
   * >>> depth 3
   * 
   * Multi-line quotes with same depth are combined:
   * > line 1
   * > line 2
   * becomes one block with content "line 1\nline 2"
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const quoteMarkers = match[1]; // The '>' characters
    const content = match[2]; // The actual content
    const depth = quoteMarkers.length; // Count the number of '>'
    
    return this.createQuoteBlock(content, depth);
  }

  /**
   * Convert block to markdown with depth support
   * Handles multi-line content properly
   */
  toMarkdown(block: EditorBlock): string {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );

    const serialized = lines.map((line, index) => {
      const depth = lineDepths[index] ?? DEFAULT_QUOTE_DEPTH;
      const prefix = '>'.repeat(depth);
      if (line.trim().length === 0) {
        return prefix;
      }
      return `${prefix} ${line}`;
    });

    return serialized.join('\n');
  }

  /**
   * Increase quote depth
   */
  increaseDepth(block: EditorBlock): EditorBlock {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    ).map(depth => clampDepth(depth + 1));

    return {
      ...block,
      meta: {
        ...(block.meta ?? {}),
        depth: lineDepths[0] ?? DEFAULT_QUOTE_DEPTH,
        quoteLineDepths: lineDepths
      }
    };
  }

  /**
   * Decrease quote depth
   */
  decreaseDepth(block: EditorBlock): EditorBlock {
    const normalizedContent = (block.content ?? '').replace(/\r/g, '');
    const lines = normalizedContent.length > 0 ? normalizedContent.split('\n') : [''];
    const lineDepths = ensureLineDepths(
      lines.length,
      block.meta?.quoteLineDepths as number[] | undefined,
      block.meta?.depth ?? DEFAULT_QUOTE_DEPTH
    );

    const updatedDepths = lineDepths.map((depth) => clampDepth(depth - 1));
    const allDepthOne = updatedDepths.every(depth => depth === DEFAULT_QUOTE_DEPTH);

    if (allDepthOne && normalizedContent.trim().length === 0) {
      return {
        ...block,
        type: 'paragraph',
        content: '',
        meta: {}
      };
    }

    return {
      ...block,
      meta: {
        ...(block.meta ?? {}),
        depth: updatedDepths[0] ?? DEFAULT_QUOTE_DEPTH,
        quoteLineDepths: updatedDepths
      }
    };
  }
}
