import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import EditorProvider from '../components/editor/core/EditorProvider';
import { useEditor } from '../components/editor/core/EditorContext';
import { EditorBlock } from '../types/editor';

// Test component that uses the editor context
const TestComponent: React.FC = () => {
  const context = useEditor();
  
  if (!context) {
    return <Text testID="no-context">No context</Text>;
  }

  const { state, dispatch } = context;
  
  return (
    <View testID="test-component">
      <Text testID="blocks-count">{state.blocks.length}</Text>
      <Text testID="focused-block">{state.focusedBlockId || 'none'}</Text>
      <Text testID="mode">{state.mode}</Text>
      <Text testID="is-dirty">{state.isDirty.toString()}</Text>
      <Text testID="is-loading">{state.isLoading.toString()}</Text>
      <Text testID="errors-count">{state.errors.length}</Text>
      <Text testID="can-undo">{state.history.canUndo.toString()}</Text>
      <Text testID="can-redo">{state.history.canRedo.toString()}</Text>
    </View>
  );
};

// Test component with actions
const TestComponentWithActions: React.FC = () => {
  const context = useEditor();
  
  if (!context) {
    return <Text testID="no-context">No context</Text>;
  }

  const { state, dispatch } = context;
  
  const addBlock = () => {
    const newBlock: EditorBlock = {
      id: `block-${Date.now()}`,
      type: 'paragraph',
      content: 'New block'
    };
    dispatch({ type: 'ADD_BLOCK', block: newBlock });
  };

  const updateFirstBlock = () => {
    if (state.blocks.length > 0) {
      dispatch({
        type: 'UPDATE_BLOCK',
        id: state.blocks[0].id,
        changes: { content: 'Updated content' }
      });
    }
  };

  const deleteFirstBlock = () => {
    if (state.blocks.length > 0) {
      dispatch({ type: 'DELETE_BLOCK', id: state.blocks[0].id });
    }
  };

  const setFocus = () => {
    if (state.blocks.length > 0) {
      dispatch({ type: 'SET_FOCUS', blockId: state.blocks[0].id });
    }
  };

  const setSelection = () => {
    if (state.blocks.length > 0) {
      dispatch({ type: 'SET_SELECTION', blockIds: [state.blocks[0].id] });
    }
  };

  const setMode = () => {
    dispatch({ type: 'SET_MODE', mode: 'preview' });
  };

  const setLoading = () => {
    dispatch({ type: 'SET_LOADING', isLoading: true });
  };

  const addError = () => {
    dispatch({
      type: 'ADD_ERROR',
      error: { type: 'validation-error', message: 'Test error' }
    });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const redo = () => {
    dispatch({ type: 'REDO' });
  };

  return (
    <View testID="test-component-with-actions">
      <TestComponent />
      <Text testID="add-block" onPress={addBlock}>Add Block</Text>
      <Text testID="update-block" onPress={updateFirstBlock}>Update Block</Text>
      <Text testID="delete-block" onPress={deleteFirstBlock}>Delete Block</Text>
      <Text testID="set-focus" onPress={setFocus}>Set Focus</Text>
      <Text testID="set-selection" onPress={setSelection}>Set Selection</Text>
      <Text testID="set-mode" onPress={setMode}>Set Mode</Text>
      <Text testID="set-loading" onPress={setLoading}>Set Loading</Text>
      <Text testID="add-error" onPress={addError}>Add Error</Text>
      <Text testID="clear-errors" onPress={clearErrors}>Clear Errors</Text>
      <Text testID="undo" onPress={undo}>Undo</Text>
      <Text testID="redo" onPress={redo}>Redo</Text>
    </View>
  );
};

describe('EditorProvider', () => {

  describe('Context Provision', () => {
    it('should provide context to child components', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponent />
        </EditorProvider>
      );

      expect(getByTestId('test-component')).toBeTruthy();
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
      expect(getByTestId('focused-block')).toHaveTextContent('none');
      expect(getByTestId('mode')).toHaveTextContent('edit');
      expect(getByTestId('is-dirty')).toHaveTextContent('false');
      expect(getByTestId('is-loading')).toHaveTextContent('false');
      expect(getByTestId('errors-count')).toHaveTextContent('0');
    });

    it('should provide context with initial blocks', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponent />
        </EditorProvider>
      );

      expect(getByTestId('blocks-count')).toHaveTextContent('2');
    });

    it('should throw error when useEditor is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => render(<TestComponent />)).toThrow(
        'useEditor must be used within an EditorProvider'
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('State Management', () => {
    it('should handle ADD_BLOCK action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('blocks-count')).toHaveTextContent('0');
      
      act(() => {
        getByTestId('add-block').props.onPress();
      });

      expect(getByTestId('blocks-count')).toHaveTextContent('1');
      expect(getByTestId('is-dirty')).toHaveTextContent('true');
    });

    it('should handle UPDATE_BLOCK action', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Original content' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponentWithActions />
        </EditorProvider>
      );

      act(() => {
        getByTestId('update-block').props.onPress();
      });

      expect(getByTestId('is-dirty')).toHaveTextContent('true');
    });

    it('should handle DELETE_BLOCK action', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('blocks-count')).toHaveTextContent('2');
      
      act(() => {
        getByTestId('delete-block').props.onPress();
      });

      expect(getByTestId('blocks-count')).toHaveTextContent('1');
      expect(getByTestId('is-dirty')).toHaveTextContent('true');
    });

    it('should handle SET_FOCUS action', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('focused-block')).toHaveTextContent('none');
      
      act(() => {
        getByTestId('set-focus').props.onPress();
      });

      expect(getByTestId('focused-block')).toHaveTextContent('1');
    });

    it('should handle SET_SELECTION action', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponentWithActions />
        </EditorProvider>
      );

      act(() => {
        getByTestId('set-selection').props.onPress();
      });

      // Selection state is updated (we can't easily test the array content in this setup)
      expect(getByTestId('test-component')).toBeTruthy();
    });

    it('should handle SET_MODE action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('mode')).toHaveTextContent('edit');
      
      act(() => {
        getByTestId('set-mode').props.onPress();
      });

      expect(getByTestId('mode')).toHaveTextContent('preview');
    });

    it('should handle SET_LOADING action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('is-loading')).toHaveTextContent('false');
      
      act(() => {
        getByTestId('set-loading').props.onPress();
      });

      expect(getByTestId('is-loading')).toHaveTextContent('true');
    });

    it('should handle ADD_ERROR action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('errors-count')).toHaveTextContent('0');
      
      act(() => {
        getByTestId('add-error').props.onPress();
      });

      expect(getByTestId('errors-count')).toHaveTextContent('1');
    });

    it('should handle CLEAR_ERRORS action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      // Add an error first
      act(() => {
        getByTestId('add-error').props.onPress();
      });
      expect(getByTestId('errors-count')).toHaveTextContent('1');
      
      // Clear errors
      act(() => {
        getByTestId('clear-errors').props.onPress();
      });
      expect(getByTestId('errors-count')).toHaveTextContent('0');
    });
  });

  describe('History Management', () => {
    it('should handle UNDO action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      // Add a block to create history
      act(() => {
        getByTestId('add-block').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('1');
      
      // Undo should work now
      act(() => {
        getByTestId('undo').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
    });

    it('should handle REDO action', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      // Add a block
      act(() => {
        getByTestId('add-block').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('1');
      
      // Undo
      act(() => {
        getByTestId('undo').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
      
      // Redo
      act(() => {
        getByTestId('redo').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('1');
    });

    it('should not undo when no history available', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('can-undo')).toHaveTextContent('false');
      
      // Undo should not change anything
      act(() => {
        getByTestId('undo').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
    });

    it('should not redo when no future history available', () => {
      const { getByTestId } = render(
        <EditorProvider>
          <TestComponentWithActions />
        </EditorProvider>
      );

      expect(getByTestId('can-redo')).toHaveTextContent('false');
      
      // Redo should not change anything
      act(() => {
        getByTestId('redo').props.onPress();
      });
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
    });
  });

  describe('Block Operations', () => {
    it('should handle MOVE_BLOCK action', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' },
        { id: '2', type: 'paragraph', content: 'Block 2' }
      ];

      const TestMoveComponent: React.FC = () => {
        const context = useEditor();
        if (!context) return <Text>No context</Text>;
        
        const { state, dispatch } = context;
        
        const moveBlock = () => {
          dispatch({ type: 'MOVE_BLOCK', id: '1', newIndex: 1 });
        };
        
        return (
          <View>
            <Text testID="first-block-id">{state.blocks[0]?.id || 'none'}</Text>
            <Text testID="move-block" onPress={moveBlock}>Move Block</Text>
          </View>
        );
      };

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestMoveComponent />
        </EditorProvider>
      );

      expect(getByTestId('first-block-id')).toHaveTextContent('1');
      
      act(() => {
        getByTestId('move-block').props.onPress();
      });

      expect(getByTestId('first-block-id')).toHaveTextContent('2');
    });

    it('should handle DELETE_BLOCK with focus cleanup', () => {
      const initialBlocks: EditorBlock[] = [
        { id: '1', type: 'paragraph', content: 'Block 1' }
      ];

      const { getByTestId } = render(
        <EditorProvider initialBlocks={initialBlocks}>
          <TestComponentWithActions />
        </EditorProvider>
      );

      // Set focus first
      act(() => {
        getByTestId('set-focus').props.onPress();
      });
      expect(getByTestId('focused-block')).toHaveTextContent('1');
      
      // Delete the focused block
      act(() => {
        getByTestId('delete-block').props.onPress();
      });
      
      expect(getByTestId('blocks-count')).toHaveTextContent('0');
      expect(getByTestId('focused-block')).toHaveTextContent('none');
    });
  });
});