import { ComponentType } from 'react';
import { Block, BlockType, EditorBlock, EditorBlockType } from '../../../types/editor';
import {
  BlockPlugin as IBlockPlugin,
  BlockController,
  BlockComponentProps,
  MarkdownSyntax,
  ToolbarConfig,
  BlockSettings,
  BlockAction
} from '../types/PluginTypes';

/**
 * Abstract base class for creating block plugins
 * Provides default implementations and helper methods
 */
export abstract class BlockPlugin implements IBlockPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly blockType: EditorBlockType | string;
  abstract readonly component: ComponentType<BlockComponentProps>;
  
  readonly type = 'block' as const;
  readonly description?: string;
  readonly controller: BlockController;
  readonly markdownSyntax?: MarkdownSyntax;
  readonly toolbar?: ToolbarConfig;
  readonly settings?: BlockSettings;

  constructor(config: Partial<IBlockPlugin> = {}) {
    // Apply configuration
    Object.assign(this, config);
    
    // Initialize controller with defaults
    this.controller = this.createController();
    
    // Set up markdown syntax if provided
    if (this.markdownSyntax) {
      this.markdownSyntax = {
        ...this.markdownSyntax,
        priority: this.markdownSyntax.priority ?? 50 // Default priority if not set
      };
    }
  }

  /**
   * Create the block controller with default implementations
   */
  protected createController(): BlockController {
    return {
      // Content validation
      validateContent: this.validateContent.bind(this),
      transformContent: this.transformContent.bind(this),
      
      // Keyboard handling
      handleKeyPress: this.handleKeyPress.bind(this),
      handleEnter: this.handleEnter.bind(this),
      handleBackspace: this.handleBackspace.bind(this),
      
      // Lifecycle
      onCreate: this.onCreate.bind(this),
      onUpdate: this.onUpdate.bind(this),
      onDelete: this.onDelete.bind(this),
      
      // Actions
      getActions: this.getActions.bind(this),
      
      // Drag and drop
      canDrag: this.canDrag.bind(this),
      canDrop: this.canDrop.bind(this),
      onDrop: this.onDrop.bind(this)
    };
  }

  // Default implementations (can be overridden)
  
  /**
   * Validate block content
   */
  protected validateContent(content: string): boolean {
    if (this.settings?.validation) {
      const { required, pattern, minLength, maxLength } = this.settings.validation;
      
      if (required && required.length > 0 && !content.trim()) {
        return false;
      }
      
      if (pattern && !pattern.test(content)) {
        return false;
      }
      
      if (minLength && content.length < minLength) {
        return false;
      }
      
      if (maxLength && content.length > maxLength) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Transform content before saving
   */
  protected transformContent(content: string): string {
    return content;
  }

  /**
   * Handle key press events
   */
  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Return true if handled, false/void if not
    return false;
  }

  /**
   * Handle Enter key press
   */
  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Return new block(s) to create, or null for default behavior
    return null;
  }

  /**
   * Handle Backspace key press
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    // Return modified block or null for default behavior
    return null;
  }

  /**
   * Called when block is created
   */
  protected onCreate(block: EditorBlock): EditorBlock {
    // Apply default meta if configured
    if (this.settings?.defaultMeta) {
      return {
        ...block,
        meta: {
          ...this.settings.defaultMeta,
          ...block.meta
        }
      };
    }
    
    return block;
  }

  /**
   * Called when block is updated
   */
  protected onUpdate(oldBlock: EditorBlock, newBlock: EditorBlock): EditorBlock {
    return newBlock;
  }

  /**
   * Called when block is deleted
   */
  protected onDelete(block: EditorBlock): void {
    // Override for cleanup logic
  }

  /**
   * Get available actions for this block
   */
  public getActions(block: EditorBlock): BlockAction[] {
    const actions: BlockAction[] = [];
    
    // Add default actions
    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: (block, context) => {
        context.duplicateBlock();
      }
    });
    
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      style: 'destructive',
      handler: (block, context) => {
        context.deleteBlock();
      }
    });
    
    return actions;
  }

  /**
   * Check if block can be dragged
   */
  protected canDrag(block: EditorBlock): boolean {
    return true;
  }

  /**
   * Check if source block can be dropped on target
   */
  protected canDrop(block: EditorBlock, targetIndex: number, blocks: EditorBlock[]): boolean {
    // Check parent/child restrictions
    if (this.settings?.allowedParents && targetIndex < blocks.length) {
      const targetBlock = blocks[targetIndex];
      return this.settings.allowedParents.includes(targetBlock.type as EditorBlockType);
    }
    
    return true;
  }

  /**
   * Handle drop operation
   */
  protected onDrop(sourceBlock: EditorBlock, targetBlock: EditorBlock): void {
    // Override for custom drop logic
  }

  /**
   * Create a new block instance
   */
  createBlock(content: string = '', meta: Record<string, any> = {}): EditorBlock {
    const block: EditorBlock = {
      id: this.generateId(),
      type: this.blockType as EditorBlockType,
      content,
      meta: {
        ...this.settings?.defaultMeta,
        ...meta
      }
    };
    
    return this.onCreate(block);
  }

  /**
   * Generate unique ID for blocks
   */
  protected generateId(): string {
    return `${this.blockType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if this plugin can handle a block type
   */
  canHandle(blockType: string): boolean {
    return this.blockType === blockType;
  }

  /**
   * Get plugin metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      blockType: this.blockType,
      hasMarkdownSyntax: !!this.markdownSyntax,
      hasToolbar: !!this.toolbar,
      settings: this.settings
    };
  }
}

/**
 * Simple block plugin factory for quick plugin creation
 */
export function createSimpleBlockPlugin(config: {
  id: string;
  name: string;
  version: string;
  blockType: string;
  component: ComponentType<BlockComponentProps>;
  description?: string;
  markdownPattern?: RegExp;
  toolbar?: Partial<ToolbarConfig>;
  settings?: Partial<BlockSettings>;
}): BlockPlugin {
  return new (class extends BlockPlugin {
    readonly id = config.id;
    readonly name = config.name;
    readonly version = config.version;
    readonly blockType = config.blockType;
    readonly component = config.component;
    readonly description = config.description;
    readonly toolbar = config.toolbar;
    readonly settings = config.settings;
    readonly markdownSyntax = config.markdownPattern ? {
      patterns: { block: config.markdownPattern },
      priority: 50
    } : undefined;
  })();
}