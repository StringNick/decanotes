import { EditorBlock } from '../../../types/editor';
import { MarkdownPlugin } from '../plugins/MarkdownPlugin';
import { MarkdownSyntax, MarkdownParser, MarkdownSerializer } from '../types/PluginTypes';

/**
 * Registry for custom markdown syntax extensions
 */
class MarkdownRegistry {
  private syntaxRules: Map<string, MarkdownSyntax> = new Map();
  private parsers: Map<string, MarkdownParser> = new Map();
  private serializers: Map<string, MarkdownSerializer> = new Map();

  /**
   * Register a new markdown syntax rule
   */
  registerSyntax(id: string, syntax: MarkdownSyntax): void {
    if (this.syntaxRules.has(id)) {
      console.warn(`Markdown syntax '${id}' is already registered. Overriding.`);
    }
    this.syntaxRules.set(id, syntax);
  }

  /**
   * Register a markdown parser
   */
  registerParser(id: string, parser: MarkdownParser): void {
    this.parsers.set(id, parser);
  }

  /**
   * Register a markdown serializer
   */
  registerSerializer(id: string, serializer: MarkdownSerializer): void {
    this.serializers.set(id, serializer);
  }

  /**
   * Get all registered syntax rules sorted by priority
   */
  getSyntaxRules(): MarkdownSyntax[] {
    return Array.from(this.syntaxRules.values())
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get parser by ID
   */
  getParser(id: string): MarkdownParser | undefined {
    return this.parsers.get(id);
  }

  /**
   * Get serializer by ID
   */
  getSerializer(id: string): MarkdownSerializer | undefined {
    return this.serializers.get(id);
  }

  /**
   * Parse markdown text using registered parsers
   */
  parseMarkdown(text: string): EditorBlock[] {
    const blocks: EditorBlock[] = [];
    const lines = text.split('\n');
    let currentBlock = '';
    let inCodeBlock = false;
    let codeBlockLanguage = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Handle code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End of code block
          blocks.push({
            id: this.generateId(),
            type: 'code',
            content: currentBlock.trim(),
            meta: { language: codeBlockLanguage }
          });
          currentBlock = '';
          inCodeBlock = false;
          codeBlockLanguage = '';
        } else {
          // Start of code block
          if (currentBlock.trim()) {
            blocks.push(this.parseTextBlock(currentBlock.trim()));
            currentBlock = '';
          }
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        currentBlock += (currentBlock ? '\n' : '') + line;
        continue;
      }

      // Try to parse with registered parsers
      let parsed = false;
      for (const parser of this.parsers.values()) {
        if (parser.canParse(line)) {
          if (currentBlock.trim()) {
            blocks.push(this.parseTextBlock(currentBlock.trim()));
            currentBlock = '';
          }
          const block = parser.parseBlock(line);
          if (block) {
            blocks.push(block);
            parsed = true;
            break;
          }
        }
      }

      if (!parsed) {
        // Check for built-in markdown patterns
        const block = this.parseBuiltInMarkdown(line);
        if (block) {
          if (currentBlock.trim()) {
            blocks.push(this.parseTextBlock(currentBlock.trim()));
            currentBlock = '';
          }
          blocks.push(block);
        } else {
          // Accumulate text for paragraph
          if (line.trim()) {
            currentBlock += (currentBlock ? '\n' : '') + line;
          } else if (currentBlock.trim()) {
            blocks.push(this.parseTextBlock(currentBlock.trim()));
            currentBlock = '';
          }
        }
      }
    }

    // Handle remaining content
    if (currentBlock.trim()) {
      if (inCodeBlock) {
        blocks.push({
          id: this.generateId(),
          type: 'code',
          content: currentBlock.trim(),
          meta: { language: codeBlockLanguage }
        });
      } else {
        blocks.push(this.parseTextBlock(currentBlock.trim()));
      }
    }

    return blocks;
  }

  /**
   * Serialize blocks to markdown using registered serializers
   */
  serializeToMarkdown(blocks: EditorBlock[]): string {
    return blocks.map(block => {
      // Try custom serializers first
      for (const serializer of this.serializers.values()) {
        if (serializer.canSerialize(block)) {
          const result = serializer.serializeBlock(block);
          if (result) return result;
        }
      }

      // Fall back to built-in serialization
      return this.serializeBuiltInBlock(block);
    }).join('\n\n');
  }

  /**
   * Parse built-in markdown patterns
   */
  private parseBuiltInMarkdown(line: string): EditorBlock | null {
    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      return {
        id: this.generateId(),
        type: 'heading',
        content: headingMatch[2],
        meta: { level: headingMatch[1].length }
      };
    }

    // Quotes
    if (line.startsWith('> ')) {
      return {
        id: this.generateId(),
        type: 'quote',
        content: line.substring(2)
      };
    }

    // Lists
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const isOrdered = /\d+\./.test(listMatch[2]);
      return {
        id: this.generateId(),
        type: 'list',
        content: listMatch[3],
        meta: {
          ordered: isOrdered,
          depth: Math.floor(listMatch[1].length / 2)
        }
      };
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      return {
        id: this.generateId(),
        type: 'divider',
        content: ''
      };
    }

    return null;
  }

  /**
   * Parse text block (paragraph)
   */
  private parseTextBlock(content: string): EditorBlock {
    return {
      id: this.generateId(),
      type: 'paragraph',
      content
    };
  }

  /**
   * Serialize built-in block types
   */
  private serializeBuiltInBlock(block: EditorBlock): string {
    switch (block.type) {
      case 'heading':
        const level = block.meta?.level || 1;
        return `${'#'.repeat(level)} ${block.content}`;
      
      case 'quote':
        return `> ${block.content}`;
      
      case 'code':
        const language = block.meta?.language || '';
        return `\`\`\`${language}\n${block.content}\n\`\`\``;
      
      case 'list':
        const indent = '  '.repeat(block.meta?.depth || 0);
        const marker = block.meta?.ordered ? '1.' : '-';
        return `${indent}${marker} ${block.content}`;
      
      case 'divider':
        return '---';
      
      case 'paragraph':
      default:
        return block.content;
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all registered syntax rules
   */
  clear(): void {
    this.syntaxRules.clear();
    this.parsers.clear();
    this.serializers.clear();
  }
}

// Global registry instance
const globalMarkdownRegistry = new MarkdownRegistry();

/**
 * Register a new markdown syntax rule
 */
export function registerMarkdownSyntax(
  id: string,
  syntax: MarkdownSyntax,
  parser?: MarkdownParser,
  serializer?: MarkdownSerializer
): void {
  globalMarkdownRegistry.registerSyntax(id, syntax);
  
  if (parser) {
    globalMarkdownRegistry.registerParser(id, parser);
  }
  
  if (serializer) {
    globalMarkdownRegistry.registerSerializer(id, serializer);
  }
}

/**
 * Parse markdown text to blocks
 */
export function parseMarkdownToBlocks(markdown: string): EditorBlock[] {
  return globalMarkdownRegistry.parseMarkdown(markdown);
}

/**
 * Serialize blocks to markdown
 */
export function serializeBlocksToMarkdown(blocks: EditorBlock[]): string {
  return globalMarkdownRegistry.serializeToMarkdown(blocks);
}

/**
 * Get the global markdown registry
 */
export function getMarkdownRegistry(): MarkdownRegistry {
  return globalMarkdownRegistry;
}

/**
 * Create a simple markdown plugin
 */
export function createSimpleMarkdownPlugin({
  id,
  name,
  pattern,
  blockType,
  priority = 50,
  parseContent,
  serializeContent
}: {
  id: string;
  name: string;
  pattern: RegExp;
  blockType: string;
  priority?: number;
  parseContent: (match: RegExpMatchArray) => { content: string; meta?: any };
  serializeContent: (block: EditorBlock) => string;
}): MarkdownPlugin {
  class SimpleMarkdownPlugin extends MarkdownPlugin {
    readonly id = id;
    readonly name = name;
    readonly version = '1.0.0';
    readonly syntax = {
      patterns: { block: pattern },
      priority
    };

    protected parseInline(text: string): string | null {
      return null; // Simple plugins only handle blocks
    }

    protected parseBlock(text: string): EditorBlock | null {
      const match = text.match(pattern);
      if (match) {
        const { content, meta } = parseContent(match);
        return {
          id: this.generateId(),
          type: blockType as any,
          content,
          meta
        };
      }
      return null;
    }

    protected canParse(text: string): boolean {
      return pattern.test(text);
    }

    protected serializeInline(content: any): string | null {
      return null;
    }

    protected serializeBlock(block: EditorBlock): string | null {
      if (block.type === blockType) {
        return serializeContent(block);
      }
      return null;
    }

    protected canSerialize(content: any): boolean {
      return content?.type === blockType;
    }
  }

  return new SimpleMarkdownPlugin();
}