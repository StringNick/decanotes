import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants/Colors';
import { useColorScheme } from '../../../hooks/useColorScheme';
import { EditorBlock } from '../../../types/editor';
import { EditorConfig } from '../types/EditorTypes';
import { BlockComponentProps, BlockPlugin } from '../types/PluginTypes';
import { FocusManager } from '../utils/FocusManager';

interface BlockRendererProps {
  block: EditorBlock;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  blockPlugin: BlockPlugin;
  config: EditorConfig;
  onBlockChange: (blockId: string, updates: Partial<EditorBlock>) => void;
  onBlockSelect: (blockId: string) => void;
  onBlockEdit: (blockId: string) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockDuplicate: (blockId: string) => void;
  onBlockMove: (blockId: string, direction: 'up' | 'down') => void;
  dragHandleProps?: any;
  blockProps?: any;
  onBlockRefReady?: (ref: any) => void;
  focusManager?: FocusManager; // NEW: for focus management
  onBlockHeightChange?: (blockId: string, height: number) => void; // NEW: for getItemLayout
}

/**
 * Component for rendering individual blocks in the editor
 */
export function BlockRenderer({
  block,
  index,
  isSelected,
  isEditing,
  blockPlugin,
  config,
  onBlockChange,
  onBlockSelect,
  onBlockEdit,
  onBlockDelete,
  onBlockDuplicate,
  onBlockMove,
  dragHandleProps,
  blockProps,
  onBlockRefReady,
  focusManager,
  onBlockHeightChange,
}: BlockRendererProps) {
  const blockRef = useRef<View>(null);
  const blockComponentRef = useRef<any>(null);
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme ?? 'light');

  // Track block height for getItemLayout optimization
  const [blockHeight, setBlockHeight] = useState(0);

  // Effect to register block ref (legacy support)
  useEffect(() => {
    if (onBlockRefReady) {
      onBlockRefReady({
        container: blockRef.current,
        focusable: blockComponentRef.current,
      });
    }
    return () => {
      onBlockRefReady?.(null);
    };
  }, [onBlockRefReady]);

  const measureBlock = useCallback(() => {
    return new Promise<{ x: number; y: number; width: number; height: number }>((resolve, reject) => {
      const node = blockRef.current;
      if (!node) {
        reject(new Error('Block view is not mounted'));
        return;
      }

      node.measureInWindow((x, y, width, height) => {
        if (__DEV__) {
          console.log('[BlockRenderer] measureInWindow result', { blockId: block.id, x, y, width, height });
        }
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(width) && Number.isFinite(height)) {
          resolve({ x, y, width, height });
        } else {
          reject(new Error('Invalid measurement result'));
        }
      });
    });
  }, [block.id]);

  // NEW: Register block with FocusManager
  useEffect(() => {
    if (!focusManager) return;

    focusManager.registerBlock(block.id, {
      focus: () => {
        // Try to focus the block component (usually a TextInput)
        if (blockComponentRef.current && typeof blockComponentRef.current.focus === 'function') {
          blockComponentRef.current.focus();
        }
      },
      getHeight: () => blockHeight,
      measure: measureBlock,
    });

    return () => {
      focusManager.unregisterBlock(block.id);
    };
  }, [block.id, focusManager, measureBlock]);

  // NEW: Handle layout changes to track height
  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { height } = event.nativeEvent.layout;

      if (Math.abs(height - blockHeight) > 1) {
        setBlockHeight(height);
        onBlockHeightChange?.(block.id, height);
      }
    },
    [block.id, blockHeight, onBlockHeightChange]
  );

  // Get block component props (memoized to prevent unnecessary re-renders)
  const blockComponentProps: BlockComponentProps = useMemo(
    () => ({
      block,
      isSelected,
      isEditing,
      isFocused: isEditing,
      onBlockChange: updates => onBlockChange(block.id, updates),
      onAction: () => {},
      config,
      onFocus: () => {
        // Call both select and edit to synchronize the focus systems
        onBlockSelect(block.id);
        onBlockEdit(block.id);
      },
      onBlur: () => {},
    }),
    [block, isSelected, isEditing, config, onBlockChange, onBlockSelect, onBlockEdit]
  );

  // Render the block component
  const BlockComponent = blockPlugin.component;

  return (
    <View ref={blockRef} style={[styles.blockContainer, blockProps?.style]} onLayout={handleLayout} {...blockProps}>
      {/* Block Content */}
      <View style={styles.blockContent}>
        {React.createElement(BlockComponent as any, { ...blockComponentProps, ref: blockComponentRef })}
      </View>

      {/* Block Info */}
      {config.debug && isSelected && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Type: {block.type} | ID: {block.id.slice(-8)}
          </Text>
          {block.meta && Object.keys(block.meta).length > 0 && (
            <Text style={styles.debugText}>Meta: {JSON.stringify(block.meta, null, 2)}</Text>
          )}
        </View>
      )}

      {/* Error Boundary */}
      {blockPlugin.hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>Error rendering block: {blockPlugin.error?.message || 'Unknown error'}</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Error boundary component for block rendering
 */
interface BlockErrorBoundaryProps {
  children: React.ReactNode;
  block: EditorBlock;
  onError?: (error: Error, block: EditorBlock) => void;
}

interface BlockErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class BlockErrorBoundary extends React.Component<BlockErrorBoundaryProps, BlockErrorBoundaryState> {
  constructor(props: BlockErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BlockErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Block rendering error:', error, errorInfo);
    this.props.onError?.(error, this.props.block);
  }

  render() {
    if (this.state.hasError) {
      // Use light theme as fallback for error boundary
      const styles = getStyles('light');

      return (
        <View style={styles.errorBoundary}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.errorBoundaryTitle}>Block Error</Text>
          <Text style={styles.errorBoundaryMessage}>
            {this.state.error?.message || 'An error occurred while rendering this block'}
          </Text>
          <Text style={styles.errorBoundaryDetails}>Block Type: {this.props.block.type}</Text>
          <TouchableOpacity
            style={styles.errorBoundaryButton}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.errorBoundaryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that includes error boundary
 */
export function SafeBlockRenderer(props: BlockRendererProps) {
  return (
    <BlockErrorBoundary
      block={props.block}
      onError={error => {
        console.error(`Error in block ${props.block.id}:`, error);
      }}
    >
      <BlockRenderer {...props} />
    </BlockErrorBoundary>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    blockContainer: {
      marginVertical: 2,
      backgroundColor: 'transparent',
    },

    blockContent: {
      flex: 1,
    },

    debugInfo: {
      position: 'absolute',
      bottom: -60,
      left: 0,
      right: 0,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      padding: 8,
      borderRadius: 4,
      zIndex: 15,
    },

    debugText: {
      fontSize: 10,
      color: colorScheme === 'dark' ? colors.text : 'white',
      fontFamily: 'monospace',
    },

    errorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.error + '10',
      borderRadius: 4,
      margin: 4,
    },

    errorText: {
      fontSize: 12,
      color: colors.error,
      marginLeft: 8,
      flex: 1,
    },

    errorBoundary: {
      padding: 16,
      backgroundColor: colors.error + '10',
      borderRadius: 8,
      alignItems: 'center',
      margin: 8,
    },

    errorBoundaryTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.error,
      marginTop: 8,
    },

    errorBoundaryMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },

    errorBoundaryDetails: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      fontFamily: 'monospace',
    },

    errorBoundaryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      marginTop: 12,
    },

    errorBoundaryButtonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
  });
};
