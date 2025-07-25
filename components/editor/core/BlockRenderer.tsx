import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { EditorBlock } from '../../../types/editor';
import { BlockPlugin, BlockComponentProps } from '../types/PluginTypes';
import { EditorConfig } from '../types/EditorTypes';
import { Ionicons } from '@expo/vector-icons';

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
  blockProps
}: BlockRendererProps) {
  const [showActions, setShowActions] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const blockRef = useRef<View>(null);
  
  // Animation for selection
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false
    }).start();
  }, [isSelected, animatedValue]);
  
  // Handle block selection
  const handleBlockPress = useCallback(() => {
    if (!isSelected) {
      onBlockSelect(block.id);
    } else if (!isEditing) {
      onBlockEdit(block.id);
    }
  }, [block.id, isSelected, isEditing, onBlockSelect, onBlockEdit]);
  

  
  // Handle block actions
  const handleAction = useCallback((actionId: string) => {
    const actions = blockPlugin.getActions?.(block) || [];
    const action = actions.find((a: any) => a.id === actionId);
    
    if (action) {
      action.handler(block, {
        updateBlock: (updates: any) => onBlockChange(block.id, updates),
        deleteBlock: () => onBlockDelete(block.id),
        duplicateBlock: () => onBlockDuplicate(block.id),
        moveBlock: (direction: any) => onBlockMove(block.id, direction)
      });
    }
  }, [block, blockPlugin, onBlockChange, onBlockDelete, onBlockDuplicate, onBlockMove]);
  
  // Get block component props
  const blockComponentProps: BlockComponentProps = {
    block,
    isSelected,
    isEditing,
    onBlockChange: (updates) => onBlockChange(block.id, updates),
    onAction: handleAction,
    config,
    onFocus: () => onBlockSelect(block.id),
    onBlur: () => {},
  };
  
  // Render the block component
  const BlockComponent = blockPlugin.component;
  
  // Get block actions
  const blockActions = blockPlugin.getActions?.(block) || [];
  
  // Calculate styles
  const borderColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', config.theme?.colors?.primary || '#007AFF']
  });
  
  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', config.theme?.colors?.primaryLight || '#E3F2FD']
  });
  
  return (
    <Animated.View
      ref={blockRef}
      style={[
        styles.blockContainer,
        {
          borderColor,
          backgroundColor
        },
        blockProps?.style
      ]}
      {...blockProps}
    >
      {/* Drag Handle */}
      {config.dragAndDrop?.enabled && isSelected && (
        <TouchableOpacity
          style={styles.dragHandle}
          {...dragHandleProps}
        >
          <Ionicons
            name="reorder-two"
            size={16}
            color={config.theme?.colors?.secondary || '#666'}
          />
        </TouchableOpacity>
      )}
      
      {/* Block Content */}
      <TouchableOpacity
        style={styles.blockContent}
        onPress={handleBlockPress}
        onLongPress={() => setShowActions(true)}
        activeOpacity={0.7}
        testID={`block-container-${block.id}`}
      >
        <BlockComponent {...blockComponentProps} />
      </TouchableOpacity>
      
      {/* Block Actions */}
      {isSelected && (showActions || isHovered) && blockActions.length > 0 && (
        <View style={styles.actionsContainer}>
          {blockActions.map((action: any) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                action.style === 'destructive' && styles.destructiveAction
              ]}
              onPress={() => handleAction(action.id)}
            >
              {action.icon && (
                <Ionicons
                  name={action.icon as any}
                  size={14}
                  color={
                    action.style === 'destructive'
                      ? '#FF3B30'
                      : config.theme?.colors?.primary || '#007AFF'
                  }
                />
              )}
              <Text
                style={[
                  styles.actionText,
                  action.style === 'destructive' && styles.destructiveActionText
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Block Info */}
      {config.debug && isSelected && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Type: {block.type} | ID: {block.id.slice(-8)}
          </Text>
          {block.meta && Object.keys(block.meta).length > 0 && (
            <Text style={styles.debugText}>
              Meta: {JSON.stringify(block.meta, null, 2)}
            </Text>
          )}
        </View>
      )}
      
      {/* Error Boundary */}
      {blockPlugin.hasError && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>
            Error rendering block: {blockPlugin.error?.message || 'Unknown error'}
          </Text>
        </View>
      )}
    </Animated.View>
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

export class BlockErrorBoundary extends React.Component<
  BlockErrorBoundaryProps,
  BlockErrorBoundaryState
> {
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
      return (
        <View style={styles.errorBoundary}>
          <Ionicons name="warning" size={24} color="#FF3B30" />
          <Text style={styles.errorBoundaryTitle}>Block Error</Text>
          <Text style={styles.errorBoundaryMessage}>
            {this.state.error?.message || 'An error occurred while rendering this block'}
          </Text>
          <Text style={styles.errorBoundaryDetails}>
            Block Type: {this.props.block.type}
          </Text>
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
      onError={(error) => {
        console.error(`Error in block ${props.block.id}:`, error);
      }}
    >
      <BlockRenderer {...props} />
    </BlockErrorBoundary>
  );
}

const styles = StyleSheet.create({
  blockContainer: {
    marginVertical: 4,
    borderWidth: 2,
    borderRadius: 8,
    position: 'relative',
    minHeight: 40
  },
  
  dragHandle: {
    position: 'absolute',
    left: -30,
    top: '50%',
    transform: [{ translateY: -8 }],
    width: 20,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  
  blockContent: {
    flex: 1,
    padding: 8
  },
  
  actionsContainer: {
    position: 'absolute',
    top: -40,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4
  },
  
  destructiveAction: {
    backgroundColor: '#FFF5F5'
  },
  
  actionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#007AFF'
  },
  
  destructiveActionText: {
    color: '#FF3B30'
  },
  
  debugInfo: {
    position: 'absolute',
    bottom: -60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 8,
    borderRadius: 4,
    zIndex: 15
  },
  
  debugText: {
    fontSize: 10,
    color: 'white',
    fontFamily: 'monospace'
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 4,
    margin: 4
  },
  
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 8,
    flex: 1
  },
  
  errorBoundary: {
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    alignItems: 'center',
    margin: 8
  },
  
  errorBoundaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginTop: 8
  },
  
  errorBoundaryMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4
  },
  
  errorBoundaryDetails: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontFamily: 'monospace'
  },
  
  errorBoundaryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12
  },
  
  errorBoundaryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  }
});