import { PluginRegistry } from '../components/editor/plugins/PluginRegistry';
import { BlockPlugin, MarkdownPlugin } from '../components/editor/types/PluginTypes';
import { Text } from 'react-native';
import React from 'react';

// Mock block plugin for testing
const mockBlockPlugin: BlockPlugin = {
  id: 'test-paragraph',
  name: 'Test Paragraph',
  version: '1.0.0',
  type: 'block',
  blockType: 'paragraph',
  description: 'A test paragraph plugin',
  component: ({ block }) => React.createElement(Text, {}, block.content),
  controller: {
    handleEnter: () => null,
    handleBackspace: () => null
  },
  toolbar: {
    icon: 'text',
    label: 'Paragraph',
    group: 'basic'
  }
};

// Mock markdown plugin for testing
const mockMarkdownPlugin: MarkdownPlugin = {
  id: 'test-bold',
  name: 'Test Bold',
  version: '1.0.0',
  type: 'markdown',
  description: 'A test bold markdown plugin',
  syntax: {
    patterns: {
      inline: /\*\*(.*?)\*\*/g
    },
    priority: 100
  },
  parser: {
    parseInline: (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
    parseBlock: () => null,
    canParse: (text: string) => /\*\*(.*?)\*\*/g.test(text)
  },
  serializer: {
    serializeInline: (content: any) => `**${content}**`,
    serializeBlock: () => null,
    canSerialize: () => true
  }
};

// High priority markdown plugin for testing
const highPriorityMarkdownPlugin: MarkdownPlugin = {
  id: 'test-italic',
  name: 'Test Italic',
  version: '1.0.0',
  type: 'markdown',
  description: 'A test italic markdown plugin',
  syntax: {
    patterns: {
      inline: /\*(.*?)\*/g
    },
    priority: 200 // Higher priority
  },
  parser: {
    parseInline: (text: string) => text.replace(/\*(.*?)\*/g, '<em>$1</em>'),
    parseBlock: () => null,
    canParse: (text: string) => /\*(.*?)\*/g.test(text)
  },
  serializer: {
    serializeInline: (content: any) => `*${content}*`,
    serializeBlock: () => null,
    canSerialize: () => true
  }
};

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
    // Suppress console.log for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Plugin Registration', () => {
    it('should register a block plugin successfully', () => {
      expect(() => registry.register(mockBlockPlugin)).not.toThrow();
      expect(registry.getPlugin('test-paragraph')).toBe(mockBlockPlugin);
      expect(registry.getBlockPlugin('paragraph')).toBe(mockBlockPlugin);
    });

    it('should register a markdown plugin successfully', () => {
      expect(() => registry.register(mockMarkdownPlugin)).not.toThrow();
      expect(registry.getPlugin('test-bold')).toBe(mockMarkdownPlugin);
      expect(registry.getMarkdownPlugins()).toContain(mockMarkdownPlugin);
    });

    it('should throw error when registering plugin with duplicate ID', () => {
      registry.register(mockBlockPlugin);
      expect(() => registry.register(mockBlockPlugin)).toThrow(
        "Plugin with id 'test-paragraph' is already registered"
      );
    });

    it('should warn when registering duplicate block type', () => {
      const duplicateBlockPlugin: BlockPlugin = {
        ...mockBlockPlugin,
        id: 'different-id',
        name: 'Different Name'
      };

      registry.register(mockBlockPlugin);
      registry.register(duplicateBlockPlugin);

      expect(console.warn).toHaveBeenCalledWith(
        "Block type 'paragraph' is already registered. Overriding."
      );
      expect(registry.getBlockPlugin('paragraph')).toBe(duplicateBlockPlugin);
    });

    it('should order markdown plugins by priority', () => {
      registry.register(mockMarkdownPlugin); // Priority 100
      registry.register(highPriorityMarkdownPlugin); // Priority 200

      const plugins = registry.getMarkdownPlugins();
      expect(plugins[0]).toBe(highPriorityMarkdownPlugin);
      expect(plugins[1]).toBe(mockMarkdownPlugin);
    });
  });

  describe('Plugin Validation', () => {
    it('should throw error for plugin without ID', () => {
      const invalidPlugin = { ...mockBlockPlugin, id: '' };
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Plugin must have a valid string id'
      );
    });

    it('should throw error for plugin without name', () => {
      const invalidPlugin = { ...mockBlockPlugin, name: '' };
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Plugin must have a valid string name'
      );
    });

    it('should throw error for plugin without version', () => {
      const invalidPlugin = { ...mockBlockPlugin, version: '' };
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Plugin must have a valid string version'
      );
    });

    it('should throw error for plugin with invalid type', () => {
      const invalidPlugin = { ...mockBlockPlugin, type: 'invalid' as any };
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Plugin type must be either "block" or "markdown"'
      );
    });

    it('should throw error for block plugin without blockType', () => {
      const invalidPlugin = { ...mockBlockPlugin };
      delete (invalidPlugin as any).blockType;
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Block plugin must have a valid blockType'
      );
    });

    it('should throw error for block plugin without component', () => {
      const invalidPlugin = { ...mockBlockPlugin };
      delete (invalidPlugin as any).component;
      expect(() => registry.register(invalidPlugin as BlockPlugin)).toThrow(
        'Block plugin must have a component'
      );
    });

    it('should throw error for markdown plugin without syntax', () => {
      const invalidPlugin = { ...mockMarkdownPlugin };
      delete (invalidPlugin as any).syntax;
      expect(() => registry.register(invalidPlugin as MarkdownPlugin)).toThrow(
        'Markdown plugin must have syntax with priority'
      );
    });
  });

  describe('Plugin Retrieval', () => {
    beforeEach(() => {
      registry.register(mockBlockPlugin);
      registry.register(mockMarkdownPlugin);
      registry.register(highPriorityMarkdownPlugin);
    });

    it('should get plugin by ID', () => {
      expect(registry.getPlugin('test-paragraph')).toBe(mockBlockPlugin);
      expect(registry.getPlugin('test-bold')).toBe(mockMarkdownPlugin);
      expect(registry.getPlugin('nonexistent')).toBeNull();
    });

    it('should get block plugin by block type', () => {
      expect(registry.getBlockPlugin('paragraph')).toBe(mockBlockPlugin);
      expect(registry.getBlockPlugin('nonexistent')).toBeNull();
    });

    it('should get all markdown plugins sorted by priority', () => {
      const plugins = registry.getMarkdownPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins[0]).toBe(highPriorityMarkdownPlugin);
      expect(plugins[1]).toBe(mockMarkdownPlugin);
    });

    it('should get all plugins', () => {
      const plugins = registry.getAllPlugins();
      expect(plugins).toHaveLength(3);
      expect(plugins).toContain(mockBlockPlugin);
      expect(plugins).toContain(mockMarkdownPlugin);
      expect(plugins).toContain(highPriorityMarkdownPlugin);
    });

    it('should get all block plugins', () => {
      const plugins = registry.getAllBlockPlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0]).toBe(mockBlockPlugin);
    });

    it('should get available block types', () => {
      const blockTypes = registry.getAvailableBlockTypes();
      expect(blockTypes).toContain('paragraph');
      expect(blockTypes).toHaveLength(1);
    });

    it('should check if block type is supported', () => {
      expect(registry.isBlockTypeSupported('paragraph')).toBe(true);
      expect(registry.isBlockTypeSupported('nonexistent')).toBe(false);
    });
  });

  describe('Plugin Unregistration', () => {
    beforeEach(() => {
      registry.register(mockBlockPlugin);
      registry.register(mockMarkdownPlugin);
    });

    it('should unregister block plugin', () => {
      registry.unregister('test-paragraph');
      expect(registry.getPlugin('test-paragraph')).toBeNull();
      expect(registry.getBlockPlugin('paragraph')).toBeNull();
    });

    it('should unregister markdown plugin', () => {
      registry.unregister('test-bold');
      expect(registry.getPlugin('test-bold')).toBeNull();
      expect(registry.getMarkdownPlugins()).not.toContain(mockMarkdownPlugin);
    });

    it('should warn when unregistering nonexistent plugin', () => {
      registry.unregister('nonexistent');
      expect(console.warn).toHaveBeenCalledWith("Plugin 'nonexistent' not found");
    });
  });

  describe('Plugin Search and Grouping', () => {
    beforeEach(() => {
      registry.register(mockBlockPlugin);
      registry.register(mockMarkdownPlugin);
    });

    it('should get plugins by group', () => {
      const basicPlugins = registry.getPluginsByGroup('basic');
      expect(basicPlugins).toContain(mockBlockPlugin);
      expect(basicPlugins).toHaveLength(1);
    });

    it('should search plugins by name', () => {
      const results = registry.searchPlugins('paragraph');
      expect(results).toContain(mockBlockPlugin);
    });

    it('should search plugins by description', () => {
      const results = registry.searchPlugins('test paragraph');
      expect(results).toContain(mockBlockPlugin);
    });

    it('should return empty array for no search matches', () => {
      const results = registry.searchPlugins('nonexistent');
      expect(results).toHaveLength(0);
    });
  });

  describe('Plugin Statistics', () => {
    beforeEach(() => {
      registry.register(mockBlockPlugin);
      registry.register(mockMarkdownPlugin);
      registry.register(highPriorityMarkdownPlugin);
    });

    it('should return correct statistics', () => {
      const stats = registry.getStats();
      expect(stats.total).toBe(3);
      expect(stats.blockPlugins).toBe(1);
      expect(stats.markdownPlugins).toBe(2);
      expect(stats.byType.block).toBe(1);
      expect(stats.byType.markdown).toBe(2);
    });

    it('should group plugins by version', () => {
      const stats = registry.getStats();
      expect(stats.byVersion['1.0.0']).toHaveLength(3);
    });
  });

  describe('Registry Management', () => {
    beforeEach(() => {
      registry.register(mockBlockPlugin);
      registry.register(mockMarkdownPlugin);
    });

    it('should clear all plugins', () => {
      registry.clear();
      expect(registry.getAllPlugins()).toHaveLength(0);
      expect(registry.getAllBlockPlugins()).toHaveLength(0);
      expect(registry.getMarkdownPlugins()).toHaveLength(0);
    });

    it('should handle multiple registrations and unregistrations', () => {
      // Register more plugins
      const anotherBlockPlugin: BlockPlugin = {
        ...mockBlockPlugin,
        id: 'test-heading',
        blockType: 'heading',
        name: 'Test Heading',
        controller: {
          handleEnter: () => null,
          handleBackspace: () => null
        }
      };
      
      registry.register(anotherBlockPlugin);
      expect(registry.getAllPlugins()).toHaveLength(3);
      
      // Unregister some
      registry.unregister('test-paragraph');
      registry.unregister('test-bold');
      expect(registry.getAllPlugins()).toHaveLength(1);
      expect(registry.getPlugin('test-heading')).toBe(anotherBlockPlugin);
    });
  });
});