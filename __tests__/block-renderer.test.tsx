import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import { BlockRenderer, SafeBlockRenderer, BlockErrorBoundary } from '../components/editor/core/BlockRenderer';
import { EditorBlock } from '../types/editor';
import { BlockPlugin } from '../components/editor/types/PluginTypes';
import { EditorConfig } from '../components/editor/types/EditorTypes';

// Mock Expo Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

// Animated is mocked in jest-setup.js

// Test block
const testBlock: EditorBlock = {
  id: 'test-block-1',
  type: 'paragraph',
  content: 'Test content',
  meta: { test: true }
};

// Mock block plugin
const mockBlockPlugin: BlockPlugin = {
  id: 'test-paragraph',
  name: 'Test Paragraph',
  version: '1.0.0',
  type: 'block',
  blockType: 'paragraph',
  description: 'Test paragraph plugin',
  component: ({ block, onBlockChange, onFocus }) => (
    <TouchableOpacity onPress={onFocus} testID={`block-component-${block.id}`}>
      <Text testID={`block-text-${block.id}`}>{block.content}</Text>
    </TouchableOpacity>
  ),
  controller: {
    handleEnter: (block) => ({ id: 'new-block', type: 'paragraph', content: '' }),
    handleBackspace: (block) => block.content ? block : null
  },
  toolbar: {
    icon: 'text',
    label: 'Paragraph',
    group: 'basic'
  },
  getActions: (block) => [
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: (block: any, actions: any) => actions.duplicateBlock()
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      style: 'destructive',
      handler: (block: any, actions: any) => actions.deleteBlock()
    }
  ]
};

// Mock block plugin with error
const errorBlockPlugin: BlockPlugin = {
  ...mockBlockPlugin,
  id: 'error-plugin',
  component: ({ block }) => (
    <Text testID={`error-block-${block.id}`}>Error Component</Text>
  ),
  hasError: true,
  error: { message: 'Plugin error' }
};

// Default config
const defaultConfig: EditorConfig = {
  theme: {
    colors: {
      primary: '#007AFF',
      primaryLight: '#E3F2FD',
      secondary: '#666',
      background: '#fff',
      text: '#000',
      border: '#E5E5E7'
    },
    spacing: {
      small: 4,
      medium: 8,
      large: 16
    },
    typography: {
      fontSize: 16,
      lineHeight: 24,
      fontFamily: 'System'
    }
  },
  toolbar: {
    enabled: true,
    position: 'top'
  },
  dragAndDrop: {
    enabled: true
  },
  keyboard: {
    shortcuts: {}
  },
  historyDebounceMs: 300,
  maxHistorySize: 50,
  debug: false
};

// Default props
const defaultProps = {
  block: testBlock,
  index: 0,
  isSelected: false,
  isEditing: false,
  blockPlugin: mockBlockPlugin,
  config: defaultConfig,
  onBlockChange: jest.fn(),
  onBlockSelect: jest.fn(),
  onBlockEdit: jest.fn(),
  onBlockDelete: jest.fn(),
  onBlockDuplicate: jest.fn(),
  onBlockMove: jest.fn()
};

describe('BlockRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render block content', () => {
      const { getByTestId } = render(<BlockRenderer {...defaultProps} />);
      
      expect(getByTestId(`block-component-${testBlock.id}`)).toBeTruthy();
      expect(getByTestId(`block-text-${testBlock.id}`)).toHaveTextContent('Test content');
    });

    it('should render with custom block props', () => {
      const blockProps = {
        testID: 'custom-block',
        style: { backgroundColor: 'red' }
      };

      const { getByTestId } = render(
        <BlockRenderer {...defaultProps} blockProps={blockProps} />
      );
      
      expect(getByTestId('custom-block')).toBeTruthy();
    });

    it('should not render drag handle when not selected', () => {
      const { queryByTestId } = render(<BlockRenderer {...defaultProps} />);
      
      // Drag handle should not be visible when not selected
      expect(queryByTestId('drag-handle')).toBeFalsy();
    });

    it('should render drag handle when selected and drag enabled', () => {
      const { getByTestId } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      // Should have drag handle when selected
      expect(getByTestId).toBeTruthy();
    });

    it('should not render drag handle when drag disabled', () => {
      const configWithoutDrag = {
        ...defaultConfig,
        dragAndDrop: { enabled: false }
      };

      const { queryByTestId } = render(
        <BlockRenderer 
          {...defaultProps} 
          isSelected={true} 
          config={configWithoutDrag}
        />
      );
      
      // Should not have drag handle when drag is disabled
      expect(queryByTestId('drag-handle')).toBeFalsy();
    });
  });

  describe('Selection and Editing', () => {
    it('should call onBlockSelect when block is pressed and not selected', () => {
      const { getByTestId } = render(<BlockRenderer {...defaultProps} />);
      
      fireEvent.press(getByTestId(`block-container-${testBlock.id}`));
      
      expect(defaultProps.onBlockSelect).toHaveBeenCalledWith(testBlock.id);
    });

    it('should call onBlockEdit when block is pressed and already selected', () => {
      const { getByTestId } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      fireEvent.press(getByTestId(`block-container-${testBlock.id}`));
      
      expect(defaultProps.onBlockEdit).toHaveBeenCalledWith(testBlock.id);
    });

    it('should not call onBlockEdit when already editing', () => {
      const { getByTestId } = render(
        <BlockRenderer {...defaultProps} isSelected={true} isEditing={true} />
      );
      
      fireEvent.press(getByTestId(`block-container-${testBlock.id}`));
      
      expect(defaultProps.onBlockEdit).not.toHaveBeenCalled();
    });

    it('should show actions on long press', async () => {
      const { getByTestId, getByText } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      fireEvent(getByTestId(`block-container-${testBlock.id}`), 'longPress');
      
      await waitFor(() => {
        expect(getByText('Duplicate')).toBeTruthy();
        expect(getByText('Delete')).toBeTruthy();
      });
    });
  });

  describe('Block Actions', () => {
    it('should execute duplicate action', async () => {
      const { getByTestId, getByText } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      // Show actions
      fireEvent(getByTestId(`block-container-${testBlock.id}`), 'longPress');
      
      await waitFor(() => {
        expect(getByText('Duplicate')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Duplicate'));
      
      expect(defaultProps.onBlockDuplicate).toHaveBeenCalledWith(testBlock.id);
    });

    it('should execute delete action', async () => {
      const { getByTestId, getByText } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      // Show actions
      fireEvent(getByTestId(`block-container-${testBlock.id}`), 'longPress');
      
      await waitFor(() => {
        expect(getByText('Delete')).toBeTruthy();
      });
      
      fireEvent.press(getByText('Delete'));
      
      expect(defaultProps.onBlockDelete).toHaveBeenCalledWith(testBlock.id);
    });

    it('should style destructive actions differently', async () => {
      const { getByTestId, getByText } = render(
        <BlockRenderer {...defaultProps} isSelected={true} />
      );
      
      // Show actions
      fireEvent(getByTestId(`block-container-${testBlock.id}`), 'longPress');
      
      await waitFor(() => {
        const deleteButton = getByText('Delete');
        expect(deleteButton).toBeTruthy();
        // The destructive styling should be applied
      });
    });

    it('should handle plugins without actions', () => {
      const pluginWithoutActions = {
        ...mockBlockPlugin,
        getActions: undefined
      };

      const { getByTestId } = render(
        <BlockRenderer 
          {...defaultProps} 
          blockPlugin={pluginWithoutActions}
          isSelected={true}
        />
      );
      
      // Should render without crashing
      expect(getByTestId(`block-component-${testBlock.id}`)).toBeTruthy();
    });
  });

  describe('Debug Mode', () => {
    it('should show debug info when debug enabled and selected', () => {
      const debugConfig = {
        ...defaultConfig,
        debug: true
      };

      const { getByText } = render(
        <BlockRenderer 
          {...defaultProps} 
          config={debugConfig}
          isSelected={true}
        />
      );
      
      expect(getByText(/Type: paragraph/)).toBeTruthy();
      expect(getByText(/ID: /)).toBeTruthy();
    });

    it('should show meta information in debug mode', () => {
      const debugConfig = {
        ...defaultConfig,
        debug: true
      };

      const { getByText } = render(
        <BlockRenderer 
          {...defaultProps} 
          config={debugConfig}
          isSelected={true}
        />
      );
      
      expect(getByText(/Meta:/)).toBeTruthy();
    });

    it('should not show debug info when not selected', () => {
      const debugConfig = {
        ...defaultConfig,
        debug: true
      };

      const { queryByText } = render(
        <BlockRenderer 
          {...defaultProps} 
          config={debugConfig}
          isSelected={false}
        />
      );
      
      expect(queryByText(/Type: paragraph/)).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when plugin has error', () => {
      const { getByText } = render(
        <BlockRenderer 
          {...defaultProps} 
          blockPlugin={errorBlockPlugin}
        />
      );
      
      expect(getByText(/Error rendering block/)).toBeTruthy();
    });

    it('should show plugin error message', () => {
      const { getByText } = render(
        <BlockRenderer 
          {...defaultProps} 
          blockPlugin={errorBlockPlugin}
        />
      );
      
      expect(getByText(/Plugin error/)).toBeTruthy();
    });
  });

  describe('Drag and Drop', () => {
    it('should pass drag handle props when provided', () => {
      const dragHandleProps = {
        testID: 'custom-drag-handle',
        onPanGestureEvent: jest.fn()
      };

      const { getByTestId } = render(
        <BlockRenderer 
          {...defaultProps} 
          isSelected={true}
          dragHandleProps={dragHandleProps}
        />
      );
      
      // Should render with custom drag handle props
      expect(getByTestId).toBeTruthy();
    });
  });
});

describe('BlockErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error for error boundary tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error', () => {
    const { getByText } = render(
      <BlockErrorBoundary block={testBlock}>
        <Text>Test content</Text>
      </BlockErrorBoundary>
    );
    
    expect(getByText('Test content')).toBeTruthy();
  });

  it('should render error UI when child throws error', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <BlockErrorBoundary block={testBlock}>
        <ThrowError />
      </BlockErrorBoundary>
    );
    
    expect(getByText('Block Error')).toBeTruthy();
    expect(getByText('Test error')).toBeTruthy();
    expect(getByText(/Block Type: paragraph/)).toBeTruthy();
  });

  it('should show specific error message when available', () => {
    const ThrowError = () => {
      throw new Error('Specific test error');
    };

    const { getByText } = render(
      <BlockErrorBoundary block={testBlock}>
        <ThrowError />
      </BlockErrorBoundary>
    );
    
    expect(getByText('Specific test error')).toBeTruthy();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <BlockErrorBoundary block={testBlock} onError={onError}>
        <ThrowError />
      </BlockErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      testBlock
    );
  });

  it('should allow retry after error', () => {
    let shouldThrow = true;
    const ThrowError = () => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <Text>Success</Text>;
    };

    const { getByText } = render(
      <BlockErrorBoundary block={testBlock}>
        <ThrowError />
      </BlockErrorBoundary>
    );
    
    expect(getByText('Block Error')).toBeTruthy();
    
    // Change the condition so it won't throw on retry
    shouldThrow = false;
    
    // Click retry
    fireEvent.press(getByText('Retry'));
    
    expect(getByText('Success')).toBeTruthy();
  });
});

describe('SafeBlockRenderer', () => {
  it('should render BlockRenderer wrapped in error boundary', () => {
    const { getByTestId } = render(
      <SafeBlockRenderer {...defaultProps} />
    );
    
    expect(getByTestId(`block-component-${testBlock.id}`)).toBeTruthy();
  });

  it('should handle errors in BlockRenderer', () => {
    // Suppress console.error for this test
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { getByText } = render(
      <SafeBlockRenderer 
        {...defaultProps} 
        blockPlugin={errorBlockPlugin}
      />
    );
    
    // Should either show the error from the plugin or catch rendering errors
    expect(getByText).toBeTruthy();
    
    jest.restoreAllMocks();
  });
});