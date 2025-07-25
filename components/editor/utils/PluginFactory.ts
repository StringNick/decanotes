import { ComponentType } from 'react';
import { Block, BlockType, EditorBlock, EditorBlockType } from '../../../types/editor';
import { BlockPlugin } from '../plugins/BlockPlugin';
import { MarkdownPlugin } from '../plugins/MarkdownPlugin';
import {
  BlockComponentProps,
  CustomPluginOptions,
  MarkdownSyntax,
  ToolbarConfig,
  BlockSettings
} from '../types/PluginTypes';

/**
 * Factory function to create custom block plugins easily
 */
export function createCustomPlugin(options: CustomPluginOptions): BlockPlugin {
  const {
    blockType,
    displayName,
    component,
    markdownPattern,
    parser,
    serializer,
    controller = {},
    toolbar = {},
    settings = {}
  } = options;

  // Create a dynamic plugin class
  class CustomBlockPlugin extends BlockPlugin {
    readonly id = `custom-${blockType}`;
    readonly name = displayName;
    readonly version = '1.0.0';
    readonly description = `Custom ${displayName} block`;
    readonly blockType = blockType;
    readonly component = component;

    readonly markdownSyntax = markdownPattern ? {
      patterns: {
        block: markdownPattern
      },
      priority: 50
    } : undefined;

    readonly toolbar = {
      icon: 'extension',
      label: displayName,
      group: 'custom',
      ...toolbar
    };

    readonly settings = {
      allowedParents: ['root'] as EditorBlockType[],
      ...settings
    };

    // Override controller methods if provided
    protected validateContent(content: string): boolean {
      if (controller.validateContent) {
        return controller.validateContent(content);
      }
      return super.validateContent(content);
    }

    protected transformContent(content: string): string {
      if (controller.transformContent) {
        return controller.transformContent(content);
      }
      return super.transformContent(content);
    }

    protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
      if (controller.handleKeyPress) {
        return controller.handleKeyPress(event, block);
      }
      return super.handleKeyPress(event, block);
    }

    protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
      if (controller.handleEnter) {
        return controller.handleEnter(block);
      }
      return super.handleEnter(block);
    }

    protected handleBackspace(block: EditorBlock): EditorBlock | null {
      if (controller.handleBackspace) {
        return controller.handleBackspace(block);
      }
      return super.handleBackspace(block);
    }

    public getActions(block: EditorBlock) {
      if (controller.getActions) {
        return controller.getActions(block);
      }
      return super.getActions(block);
    }

    protected onCreate(block: EditorBlock): EditorBlock {
      if (controller.onCreate) {
        return controller.onCreate(block);
      }
      return super.onCreate(block);
    }

    protected onUpdate(oldBlock: EditorBlock, newBlock: EditorBlock): EditorBlock {
      if (controller.onUpdate) {
        return controller.onUpdate(oldBlock, newBlock);
      }
      return super.onUpdate(oldBlock, newBlock);
    }

    protected onDelete(block: Block): void {
      if (controller.onDelete) {
        controller.onDelete(block);
      } else {
        super.onDelete(block);
      }
    }



    protected canDrag(block: Block): boolean {
      if (controller.canDrag) {
        return controller.canDrag(block);
      }
      return super.canDrag(block);
    }

    protected canDrop(block: EditorBlock, targetIndex: number, blocks: EditorBlock[]): boolean {
      if (controller.canDrop) {
        return controller.canDrop(block, targetIndex, blocks);
      }
      return super.canDrop(block, targetIndex, blocks);
    }

    protected onDrop(sourceBlock: Block, targetBlock: Block): void {
      if (controller.onDrop) {
        controller.onDrop(sourceBlock, targetBlock);
      } else {
        super.onDrop(sourceBlock, targetBlock);
      }
    }
  }

  return new CustomBlockPlugin();
}

/**
 * Create a simple text-based block plugin
 */
export function createSimpleTextPlugin({
  blockType,
  displayName,
  placeholder = 'Type something...',
  multiline = true,
  markdownPattern,
  icon = 'text'
}: {
  blockType: string;
  displayName: string;
  placeholder?: string;
  multiline?: boolean;
  markdownPattern?: RegExp;
  icon?: string;
}): BlockPlugin {
  // Create a simple text component
  const SimpleTextComponent: React.FC<BlockComponentProps> = ({
    block,
    onBlockChange,
    onFocus,
    onBlur,
    isSelected,
    isEditing,
    style
  }) => {
    const React = require('react');
    const { View, TextInput, StyleSheet } = require('react-native');

    const styles = StyleSheet.create({
      container: {
        marginVertical: 4,
      },
      textInput: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
        padding: 8,
        minHeight: multiline ? 40 : 32,
        borderRadius: 4,
        backgroundColor: 'transparent',
      },
      selected: {
        backgroundColor: '#f0f8ff',
        borderColor: '#007AFF',
        borderWidth: 1,
      },
      editing: {
        backgroundColor: '#fff',
        borderColor: '#007AFF',
        borderWidth: 2,
      },
    });

    return React.createElement(View, { style: [styles.container, style] },
      React.createElement(TextInput, {
        style: [
          styles.textInput,
          isSelected && styles.selected,
          isEditing && styles.editing
        ],
        value: block.content,
        onChangeText: (text: string) => onBlockChange({ content: text }),
        onFocus,
        onBlur,
        placeholder,
        placeholderTextColor: '#999',
        multiline,
        textAlignVertical: multiline ? 'top' : 'center',
        scrollEnabled: false
      })
    );
  };

  return createCustomPlugin({
    blockType,
    displayName,
    component: SimpleTextComponent,
    markdownPattern,
    toolbar: {
      icon,
      label: displayName
    }
  });
}

/**
 * Create a plugin from a React component with minimal configuration
 */
export function createComponentPlugin({
  blockType,
  displayName,
  component,
  defaultContent = '',
  icon = 'extension'
}: {
  blockType: string;
  displayName: string;
  component: ComponentType<BlockComponentProps>;
  defaultContent?: string;
  icon?: string;
}): BlockPlugin {
  return createCustomPlugin({
    blockType,
    displayName,
    component,
    toolbar: {
      icon,
      label: displayName
    },
    settings: {
      defaultMeta: {
        content: defaultContent
      }
    }
  });
}

/**
 * Utility to validate plugin configuration
 */
export function validatePluginConfig(options: CustomPluginOptions): string[] {
  const errors: string[] = [];

  if (!options.blockType) {
    errors.push('blockType is required');
  }

  if (!options.displayName) {
    errors.push('displayName is required');
  }

  if (!options.component) {
    errors.push('component is required');
  }

  if (options.blockType && !/^[a-z][a-z0-9-]*$/.test(options.blockType)) {
    errors.push('blockType must be lowercase and contain only letters, numbers, and hyphens');
  }

  return errors;
}