import {
  MarkdownPlugin as IMarkdownPlugin,
  MarkdownSyntax,
  MarkdownParser,
  MarkdownSerializer
} from '../types/PluginTypes';
import { EditorBlock } from '../../../types/editor';

/**
 * Abstract base class for creating markdown plugins
 * Handles custom markdown syntax parsing and serialization
 */
export abstract class MarkdownPlugin implements IMarkdownPlugin {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly syntax: MarkdownSyntax;
  
  readonly type = 'markdown' as const;
  readonly description?: string;
  readonly parser: MarkdownParser;
  readonly serializer: MarkdownSerializer;

  constructor(config: Partial<IMarkdownPlugin> = {}) {
    // Apply configuration
    Object.assign(this, config);
    
    // Initialize parser and serializer
    this.parser = this.createParser();
    this.serializer = this.createSerializer();
  }

  /**
   * Create the markdown parser
   */
  protected createParser(): MarkdownParser {
    return {
      parseInline: this.parseInline.bind(this),
      parseBlock: this.parseBlock.bind(this),
      canParse: this.canParse.bind(this)
    };
  }

  /**
   * Create the markdown serializer
   */
  protected createSerializer(): MarkdownSerializer {
    return {
      serializeInline: this.serializeInline.bind(this),
      serializeBlock: this.serializeBlock.bind(this),
      canSerialize: this.canSerialize.bind(this)
    };
  }

  // Abstract methods that must be implemented
  
  /**
   * Parse inline markdown syntax
   */
  protected abstract parseInline(text: string): string | null;

  /**
   * Parse block-level markdown syntax
   */
  protected abstract parseBlock(text: string): EditorBlock | null;

  /**
   * Check if this plugin can parse the given text
   */
  protected abstract canParse(text: string): boolean;

  /**
   * Serialize inline content to markdown
   */
  protected abstract serializeInline(content: any): string | null;

  /**
   * Serialize block to markdown
   */
  protected abstract serializeBlock(block: EditorBlock): string | null;

  /**
   * Check if this plugin can serialize the given content
   */
  protected abstract canSerialize(content: any): boolean;

  /**
   * Get plugin metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      description: this.description,
      syntax: this.syntax,
      priority: this.syntax.priority
    };
  }

  /**
   * Test if text matches any of the plugin's patterns
   */
  protected matchesPattern(text: string, type: 'inline' | 'block'): RegExpMatchArray | null {
    const patterns = this.syntax.patterns;
    const pattern = type === 'inline' ? patterns.inline : patterns.block;
    
    if (!pattern) return null;
    
    return text.match(pattern);
  }

  /**
   * Extract content from matched pattern
   */
  protected extractContent(match: RegExpMatchArray, groupIndex: number = 1): string {
    return match[groupIndex] || '';
  }

  /**
   * Generate unique ID
   */
  protected generateId(): string {
    return `${this.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Video markdown plugin implementation
 * Supports syntax like: ![video](url "title")
 */
export class VideoMarkdownPlugin extends MarkdownPlugin {
  readonly id = 'video-markdown';
  readonly name = 'Video Markdown';
  readonly version = '1.0.0';
  readonly description = 'Support for video embeds in markdown';
  
  readonly syntax: MarkdownSyntax = {
    patterns: {
      inline: /!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)/g,
      block: /^!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)$/
    },
    priority: 60
  };

  protected parseInline(text: string): string | null {
    const match = this.matchesPattern(text, 'inline');
    if (!match) return null;
    
    const url = this.extractContent(match, 1);
    const title = this.extractContent(match, 2) || 'Video';
    
    // Return HTML for inline video
    return `<video controls title="${title}"><source src="${url}" /></video>`;
  }

  protected parseBlock(text: string): EditorBlock | null {
    const match = this.matchesPattern(text, 'block');
    if (!match) return null;
    
    const url = this.extractContent(match, 1);
    const title = this.extractContent(match, 2) || 'Video';
    
    return {
      id: this.generateId(),
      type: 'video',
      content: url,
      meta: {
        title,
        url,
        type: 'video'
      }
    };
  }

  protected canParse(text: string): boolean {
    return this.syntax.patterns.inline?.test(text) || this.syntax.patterns.block?.test(text) || false;
  }

  protected serializeInline(content: any): string | null {
    if (typeof content === 'object' && content.type === 'video') {
      const title = content.title ? ` "${content.title}"` : '';
      return `![video](${content.url}${title})`;
    }
    return null;
  }

  protected serializeBlock(block: EditorBlock): string | null {
    if (block.type === 'video' && block.meta?.url) {
      const title = block.meta.title ? ` "${block.meta.title}"` : '';
      return `![video](${block.meta.url}${title})`;
    }
    return null;
  }

  protected canSerialize(content: any): boolean {
    return (typeof content === 'object' && content.type === 'video') ||
           (content.type === 'video' && content.meta?.url);
  }
}

/**
 * Callout markdown plugin implementation
 * Supports syntax like: > [!NOTE] Title\n> Content
 */
export class CalloutMarkdownPlugin extends MarkdownPlugin {
  readonly id = 'callout-markdown';
  readonly name = 'Callout Markdown';
  readonly version = '1.0.0';
  readonly description = 'Support for callout blocks in markdown';
  
  readonly syntax: MarkdownSyntax = {
    patterns: {
      block: /^>\s*\[!(NOTE|TIP|WARNING|DANGER|INFO)\]\s*(.*)$/m
    },
    priority: 70
  };

  protected parseInline(text: string): string | null {
    // Callouts are block-level only
    return null;
  }

  protected parseBlock(text: string): EditorBlock | null {
    const match = this.matchesPattern(text, 'block');
    if (!match) return null;
    
    const type = this.extractContent(match, 1).toLowerCase();
    const title = this.extractContent(match, 2) || type.toUpperCase();
    
    // Extract content after the callout header
    const lines = text.split('\n');
    const contentLines = lines.slice(1).map(line => line.replace(/^>\s*/, ''));
    const content = contentLines.join('\n').trim();
    
    return {
      id: this.generateId(),
      type: 'callout',
      content,
      meta: {
        calloutType: type.toLowerCase() as 'note' | 'tip' | 'warning' | 'danger' | 'info',
        title,
        variant: type
      }
    };
  }

  protected canParse(text: string): boolean {
    return this.syntax.patterns.block?.test(text) || false;
  }

  protected serializeInline(content: any): string | null {
    return null;
  }

  protected serializeBlock(block: EditorBlock): string | null {
    if (block.type === 'callout' && block.meta?.calloutType) {
      const type = block.meta.calloutType.toUpperCase();
      const title = block.meta.title || type;
      const content = block.content.split('\n').map(line => `> ${line}`).join('\n');
      
      return `> [!${type}] ${title}\n${content}`;
    }
    return null;
  }

  protected canSerialize(content: any): boolean {
    return content.type === 'callout' && content.meta?.calloutType;
  }
}

/**
 * Simple markdown plugin factory for quick plugin creation
 */
export function createSimpleMarkdownPlugin(config: {
  id: string;
  name: string;
  version: string;
  description?: string;
  inlinePattern?: RegExp;
  blockPattern?: RegExp;
  priority?: number;
  parseInline?: (text: string, match: RegExpMatchArray) => string | null;
  parseBlock?: (text: string, match: RegExpMatchArray) => EditorBlock | null;
  serializeInline?: (content: any) => string | null;
  serializeBlock?: (block: EditorBlock) => string | null;
}): MarkdownPlugin {
  return new (class extends MarkdownPlugin {
    readonly id = config.id;
    readonly name = config.name;
    readonly version = config.version;
    readonly description = config.description;
    
    readonly syntax: MarkdownSyntax = {
      patterns: {
        inline: config.inlinePattern,
        block: config.blockPattern
      },
      priority: config.priority || 50
    };

    protected parseInline(text: string): string | null {
      if (!config.parseInline || !this.syntax.patterns.inline) return null;
      const match = this.matchesPattern(text, 'inline');
      return match ? config.parseInline(text, match) : null;
    }

    protected parseBlock(text: string): EditorBlock | null {
      if (!config.parseBlock || !this.syntax.patterns.block) return null;
      const match = this.matchesPattern(text, 'block');
      return match ? config.parseBlock(text, match) : null;
    }

    protected canParse(text: string): boolean {
      return this.matchesPattern(text, 'inline') !== null || 
             this.matchesPattern(text, 'block') !== null;
    }

    protected serializeInline(content: any): string | null {
      return config.serializeInline ? config.serializeInline(content) : null;
    }

    protected serializeBlock(block: EditorBlock): string | null {
      return config.serializeBlock ? config.serializeBlock(block) : null;
    }

    protected canSerialize(content: any): boolean {
      return !!(config.serializeInline && config.serializeInline(content) !== null) ||
             !!(config.serializeBlock && config.serializeBlock(content) !== null);
    }
  })();
}