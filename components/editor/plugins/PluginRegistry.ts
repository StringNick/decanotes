import { BlockPlugin, MarkdownPlugin, PluginRegistryInterface } from '../types/PluginTypes';

/**
 * Central registry for managing editor plugins
 * Supports both block plugins and markdown syntax plugins
 */
export class PluginRegistry implements PluginRegistryInterface {
  private plugins = new Map<string, BlockPlugin | MarkdownPlugin>();
  private blockPlugins = new Map<string, BlockPlugin>();
  private markdownPlugins: MarkdownPlugin[] = [];

  /**
   * Register a new plugin
   */
  register(plugin: BlockPlugin | MarkdownPlugin): void {
    // Validate plugin
    this.validatePlugin(plugin);

    // Check for conflicts
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin with id '${plugin.id}' is already registered`);
    }

    // Register plugin
    this.plugins.set(plugin.id, plugin);

    if (plugin.type === 'block') {
      const blockPlugin = plugin as BlockPlugin;
      
      // Check for block type conflicts
      if (this.blockPlugins.has(blockPlugin.blockType)) {
        console.warn(`Block type '${blockPlugin.blockType}' is already registered. Overriding.`);
      }
      
      this.blockPlugins.set(blockPlugin.blockType, blockPlugin);
    } else if (plugin.type === 'markdown') {
      const markdownPlugin = plugin as MarkdownPlugin;
      
      // Insert in priority order (higher priority first)
      const insertIndex = this.markdownPlugins.findIndex(
        p => p.syntax.priority < markdownPlugin.syntax.priority
      );
      
      if (insertIndex === -1) {
        this.markdownPlugins.push(markdownPlugin);
      } else {
        this.markdownPlugins.splice(insertIndex, 0, markdownPlugin);
      }
    }

    // Plugin registered successfully
  }

  /**
   * Unregister a plugin
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    
    if (!plugin) {
      console.warn(`Plugin '${pluginId}' not found`);
      return;
    }

    // Remove from main registry
    this.plugins.delete(pluginId);

    // Remove from type-specific registries
    if (plugin.type === 'block') {
      const blockPlugin = plugin as BlockPlugin;
      this.blockPlugins.delete(blockPlugin.blockType);
    } else if (plugin.type === 'markdown') {
      const index = this.markdownPlugins.findIndex(p => p.id === pluginId);
      if (index !== -1) {
        this.markdownPlugins.splice(index, 1);
      }
    }

    // Plugin unregistered successfully
  }

  /**
   * Get a specific plugin by ID
   */
  getPlugin(pluginId: string): BlockPlugin | MarkdownPlugin | null {
    return this.plugins.get(pluginId) || null;
  }

  /**
   * Get a block plugin by block type
   */
  getBlockPlugin(blockType: string): BlockPlugin | null {
    return this.blockPlugins.get(blockType) || null;
  }

  /**
   * Get all markdown plugins (sorted by priority)
   */
  getMarkdownPlugins(): MarkdownPlugin[] {
    return [...this.markdownPlugins];
  }

  /**
   * Get all registered plugins
   */
  getAllPlugins(): (BlockPlugin | MarkdownPlugin)[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get all block plugins
   */
  getAllBlockPlugins(): BlockPlugin[] {
    return Array.from(this.blockPlugins.values());
  }

  /**
   * Get available block types
   */
  getAvailableBlockTypes(): string[] {
    return Array.from(this.blockPlugins.keys());
  }

  /**
   * Check if a block type is supported
   */
  isBlockTypeSupported(blockType: string): boolean {
    return this.blockPlugins.has(blockType);
  }

  /**
   * Get plugins by category/group
   */
  getPluginsByGroup(group: string): (BlockPlugin | MarkdownPlugin)[] {
    return this.getAllPlugins().filter(plugin => {
      if (plugin.type === 'block') {
        return (plugin as BlockPlugin).toolbar?.group === group;
      }
      return false;
    });
  }

  /**
   * Search plugins by name or description
   */
  searchPlugins(query: string): (BlockPlugin | MarkdownPlugin)[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllPlugins().filter(plugin => 
      plugin.name.toLowerCase().includes(lowerQuery) ||
      plugin.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const allPlugins = this.getAllPlugins();
    return {
      total: allPlugins.length,
      blockPlugins: this.blockPlugins.size,
      markdownPlugins: this.markdownPlugins.length,
      byVersion: this.groupBy(allPlugins, 'version'),
      byType: {
        block: allPlugins.filter(p => p.type === 'block').length,
        markdown: allPlugins.filter(p => p.type === 'markdown').length
      }
    };
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear();
    this.blockPlugins.clear();
    this.markdownPlugins.length = 0;
    console.log('All plugins cleared');
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: BlockPlugin | MarkdownPlugin): void {
    if (!plugin.id || typeof plugin.id !== 'string') {
      throw new Error('Plugin must have a valid string id');
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      throw new Error('Plugin must have a valid string name');
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      throw new Error('Plugin must have a valid string version');
    }

    if (!plugin.type || !['block', 'markdown'].includes(plugin.type)) {
      throw new Error('Plugin type must be either "block" or "markdown"');
    }

    if (plugin.type === 'block') {
      const blockPlugin = plugin as BlockPlugin;
      
      if (!blockPlugin.blockType || typeof blockPlugin.blockType !== 'string') {
        throw new Error('Block plugin must have a valid blockType');
      }

      if (!blockPlugin.component) {
        throw new Error('Block plugin must have a component');
      }

      if (!blockPlugin.controller) {
        throw new Error('Block plugin must have a controller');
      }
    } else if (plugin.type === 'markdown') {
      const markdownPlugin = plugin as MarkdownPlugin;
      
      if (!markdownPlugin.syntax || typeof markdownPlugin.syntax.priority !== 'number') {
        throw new Error('Markdown plugin must have syntax with priority');
      }

      if (!markdownPlugin.parser || typeof markdownPlugin.parser.parseBlock !== 'function') {
        throw new Error('Markdown plugin must have a valid parser');
      }

      if (!markdownPlugin.serializer || typeof markdownPlugin.serializer.serializeBlock !== 'function') {
        throw new Error('Markdown plugin must have a valid serializer');
      }
    }
  }

  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = String(item[property]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }
}

// Global registry instance
export const globalPluginRegistry = new PluginRegistry();