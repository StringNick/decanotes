# Plugin Architecture - Technical Documentation

## Overview

DecaNotes Editor uses a centralized, singleton-based plugin architecture that ensures:

- **Single instance**: Plugins are created once and reused across re-renders
- **Unified registry**: All plugins registered in a central `PluginRegistry` accessible via context
- **Proper serialization**: All export/import operations use `MarkdownRegistry` to preserve metadata
- **Meta preservation**: Block metadata is preserved through all operations (create, update, export, import)

## Architecture Components

### 1. PluginRegistry (Centralized)

**Location**: `components/editor/plugins/PluginRegistry.ts`

The `PluginRegistry` is the single source of truth for all plugins:

```typescript
// Created once in EditorProvider via useState
const [pluginRegistry] = React.useState(() => new PluginRegistry());

// Exposed through EditorContext
const contextValue: EditorContextInterface = {
  state,
  dispatch,
  pluginRegistry, // ← Available to all components
  // ...
};
```

**Key Features**:

- Idempotent registration: Tracks registered plugin IDs to prevent duplicates
- Type-specific access: `getAllBlockPlugins()`, `getMarkdownPlugins()`
- Block type lookup: `getBlockPlugin(blockType)`

### 2. Singleton Plugins

**Location**: `components/editor/MarkdownEditor.tsx`

All built-in plugins are created as singletons using `useMemo`:

```typescript
// Created once, never recreated
const builtInPlugins = useMemo(
  () => [
    new ParagraphPlugin(),
    new HeadingPlugin(),
    new CodePlugin(),
    new ImagePlugin(),
    new ListPlugin(),
    new QuotePlugin(),
    new DividerPlugin(),
    new VideoPlugin(),
    new CalloutPlugin(),
    new ChecklistPlugin(),
    new TablePlugin(),
  ],
  []
);

// Combined with custom plugins
const allPlugins = useMemo(() => [...builtInPlugins, ...plugins], [builtInPlugins, plugins]);
```

**Why this matters**:

- Prevents "Plugin already registered" errors
- Stable plugin references across re-renders
- Better performance (no unnecessary plugin recreation)

#### Focus & Scroll Contract

Block plugins participate in the editor's `FocusManager`. To ensure new plugins work with auto-focus and scroll-to-reveal:

- Wrap the rendered block component in `React.forwardRef`.
- Use `useImperativeHandle` to expose a `focus()` method that calls the primary input's `.focus()` (or opens any editing UI before focusing).
- For non-text blocks (image, video, divider, etc.) make sure `focus()` also triggers any state needed so that the block becomes editable before requesting focus.
- Always pass the received `onFocus`/`onBlur` callbacks to the underlying input so selection state stays in sync.

### 3. MarkdownRegistry (Serialization Engine)

**Location**: `components/editor/utils/MarkdownRegistry.ts`

All markdown export/import operations go through `MarkdownRegistry`:

```typescript
// Export: Blocks → Markdown
export function serializeBlocksToMarkdown(blocks: EditorBlock[]): string;

// Import: Markdown → Blocks
export function parseMarkdownToBlocks(markdown: string, plugins?: any[]): EditorBlock[];
```

**Supported Block Types**:

- ✅ `heading` (with `level` meta)
- ✅ `paragraph`
- ✅ `code` (with `language` meta)
- ✅ `quote`
- ✅ `list` (with `ordered`, `depth` meta)
- ✅ `checklist` (with `checked`, `level` meta)
- ✅ `divider`
- ✅ `image` (with `alt`, `url`, `caption` meta)
- ✅ `video` (with `url`, `caption` meta)
- ✅ `callout` (with `calloutType`, `emoji` meta)
- ✅ `table` (with `headers`, `rows`, `alignments` meta)

**Serialization Examples**:

```typescript
// Checklist
{ type: 'checklist', content: 'Task', meta: { checked: true, level: 0 } }
→ "- [x] Task"

// Image
{ type: 'image', content: 'https://...', meta: { alt: 'Logo', caption: 'Our logo' } }
→ '![Logo](https://... "Our logo")'

// Callout
{ type: 'callout', content: 'Important note', meta: { calloutType: 'warning', emoji: '⚠️' } }
→ "> [!warning] ⚠️\n> Important note"

// Table
{ type: 'table', content: '', meta: { headers: ['A', 'B'], rows: [['1', '2']], alignments: ['left', 'center'] } }
→ "| A | B |\n| --- | :---: |\n| 1 | 2 |"
```

### 4. Meta Preservation

**Problem (Before)**:

```typescript
// Lost meta when creating blocks
createBlock('image', 'url.jpg'); // ❌ No alt, caption
```

**Solution (After)**:

```typescript
// Signature updated to accept meta
createBlock(type: string, content: string, index?: number, meta?: Record<string, any>)

// Usage preserves meta
createBlock('image', 'url.jpg', undefined, {
  alt: 'Logo',
  url: 'url.jpg',
  caption: 'Our logo'
})
```

**Key Points**:

- `EditorProvider.createBlock` accepts `meta` parameter
- All `addBlock` calls pass `block.meta`
- Plugin `controller.onCreate` returns blocks with full meta
- No additional `updateBlock` needed after creation

### 5. Export/Import Flow

**Export Flow**:

```
User clicks Export
  → ref.exportContent('markdown')
    → serializeBlocksToMarkdown(state.blocks)
      → For each block:
        → Try custom serializer (plugin.serializer.serializeBlock)
        → Fallback to MarkdownRegistry.serializeBuiltInBlock
      → Join with '\n\n'
  → Return markdown string
```

**Import Flow**:

```
User provides markdown
  → ref.importContent(markdown, 'markdown')
    → parseMarkdownToBlocks(markdown, allPlugins)
      → Split into lines
      → For each line/block:
        → Try plugin parser (plugin.parseMarkdown)
        → Try parseBuiltInMarkdownLine
        → Create EditorBlock with full meta
      → Return blocks[]
    → dispatch({ type: 'SET_BLOCKS', blocks })
  → Blocks rendered with preserved meta
```

## How to Add a Custom Plugin

### 1. Define Your Plugin

```typescript
import { BlockPlugin } from '@/components/editor/types/PluginTypes';

class MyCustomPlugin implements BlockPlugin {
  id = 'my-custom-plugin';
  name = 'My Custom Block';
  version = '1.0.0';
  type = 'block' as const;
  blockType = 'mycustom';

  component = MyCustomBlockComponent; // React component

  controller = {
    onCreate: block => ({
      ...block,
      meta: { customProp: 'value' }, // Set initial meta
    }),
    // ... other lifecycle methods
  };

  // Optional: Custom markdown syntax
  parseMarkdown = (line: string): EditorBlock | null => {
    if (line.startsWith('!!')) {
      return {
        id: generateId(),
        type: 'mycustom',
        content: line.substring(2),
        meta: { customProp: 'value' },
      };
    }
    return null;
  };

  serializeToMarkdown = (block: EditorBlock): string => {
    if (block.type === 'mycustom') {
      return `!!${block.content}`;
    }
    return '';
  };
}
```

### 2. Register Your Plugin

```typescript
import { MarkdownEditor } from '@/components/editor/MarkdownEditor';
import { MyCustomPlugin } from './MyCustomPlugin';

<MarkdownEditor
  initialMarkdown="# Hello"
  plugins={[new MyCustomPlugin()]}
  onError={(error) => console.error(error)}
/>
```

**Important**:

- Create plugin instances **outside** the render function or use `useMemo`
- Never recreate plugin instances on every render

```typescript
// ❌ BAD: Creates new instance every render
<MarkdownEditor plugins={[new MyCustomPlugin()]} />

// ✅ GOOD: Stable reference
const myPlugins = useMemo(() => [new MyCustomPlugin()], []);
<MarkdownEditor plugins={myPlugins} />
```

### 3. Access Registry

```typescript
// In a component inside EditorProvider
import { useEditor } from '@/components/editor/core/EditorContext';

function MyEditorComponent() {
  const { pluginRegistry } = useEditor();

  // Get specific plugin
  const plugin = pluginRegistry.getPlugin('my-custom-plugin');

  // Get all block plugins
  const blockPlugins = pluginRegistry.getAllBlockPlugins();

  // Check if block type supported
  const supported = pluginRegistry.isBlockTypeSupported('mycustom');
}
```

## Common Patterns

### Pattern 1: Preserve Meta in onCreate

```typescript
controller: {
  onCreate: block => {
    return {
      ...block,
      meta: {
        ...block.meta, // Preserve existing
        timestamp: Date.now(), // Add new
        author: 'system',
      },
    };
  };
}
```

### Pattern 2: Update Block with Meta

```typescript
const { updateBlock } = useEditor();

updateBlock(blockId, {
  content: 'New content',
  meta: {
    ...existingBlock.meta,
    edited: true,
    editedAt: Date.now(),
  },
});
```

### Pattern 3: Export with Custom Serializer

```typescript
class MyPlugin extends BlockPlugin {
  serializer = {
    canSerialize: block => block.type === 'mycustom',
    serializeBlock: block => {
      const meta = block.meta || {};
      return `!!custom:${meta.variant}:${block.content}`;
    },
  };
}
```

## Testing Serialization

To test that your plugin correctly round-trips through markdown:

```typescript
import { serializeBlocksToMarkdown, parseMarkdownToBlocks } from '@/components/editor/utils/MarkdownRegistry';

const originalBlocks = [
  {
    id: 'test-1',
    type: 'mycustom',
    content: 'Test content',
    meta: { customProp: 'value' },
  },
];

// Serialize
const markdown = serializeBlocksToMarkdown(originalBlocks);
console.log(markdown); // "!!Test content"

// Parse
const parsedBlocks = parseMarkdownToBlocks(markdown, [new MyCustomPlugin()]);
console.log(parsedBlocks[0].meta); // { customProp: 'value' }

// Verify round-trip
assert.deepEqual(parsedBlocks[0].meta, originalBlocks[0].meta);
```

## Migration Guide

If you have existing code that creates plugins on every render:

### Before

```typescript
<MarkdownEditor
  plugins={[
    new CustomPlugin() // ❌ New instance every render
  ]}
/>
```

### After

```typescript
const customPlugins = useMemo(() => [
  new CustomPlugin() // ✅ Singleton
], []);

<MarkdownEditor plugins={customPlugins} />
```

### Before (Manual Registry)

```typescript
const registry = new PluginRegistry();
registry.register(new CustomPlugin());
// ❌ Registry not shared, not in context
```

### After (Use Context)

```typescript
import { useEditor } from '@/components/editor/core/EditorContext';

function MyComponent() {
  const { pluginRegistry } = useEditor();
  // ✅ Access shared registry
  const plugin = pluginRegistry.getPlugin('custom');
}
```

## API Reference

### EditorContextInterface

```typescript
interface EditorContextInterface {
  state: EditorState;
  dispatch: (action: EditorAction) => void;
  pluginRegistry: PluginRegistry; // ← New
  createBlock: (type: string, content: string, index?: number, meta?: Record<string, any>) => string;
  // ... other methods
}
```

### PluginRegistry

```typescript
class PluginRegistry {
  register(plugin: BlockPlugin | MarkdownPlugin): void;
  unregister(pluginId: string): void;
  getPlugin(pluginId: string): BlockPlugin | MarkdownPlugin | null;
  getBlockPlugin(blockType: string): BlockPlugin | null;
  getAllBlockPlugins(): BlockPlugin[];
  getMarkdownPlugins(): MarkdownPlugin[];
  getAllPlugins(): (BlockPlugin | MarkdownPlugin)[];
  isBlockTypeSupported(blockType: string): boolean;
}
```

### MarkdownRegistry

```typescript
function serializeBlocksToMarkdown(blocks: EditorBlock[]): string;
function parseMarkdownToBlocks(markdown: string, plugins?: any[]): EditorBlock[];
function registerMarkdownSyntax(
  id: string,
  syntax: MarkdownSyntax,
  parser?: MarkdownParser,
  serializer?: MarkdownSerializer
): void;
```

## Troubleshooting

### Issue: "Plugin already registered"

**Cause**: Plugin instances recreated on every render
**Fix**: Use `useMemo` to create stable plugin references

### Issue: Lost metadata after export/import

**Cause**: Using primitive `join('\n\n')` instead of `MarkdownRegistry`
**Fix**: All export/import now uses `serializeBlocksToMarkdown`/`parseMarkdownToBlocks`

### Issue: Empty plugin list from registry

**Cause**: Creating local `PluginRegistry` instead of using context
**Fix**: Access `pluginRegistry` from `useEditor()` context

### Issue: Block created without meta

**Cause**: Not passing `meta` to `createBlock`
**Fix**: `createBlock(type, content, index, meta)` now accepts meta parameter

## Performance Considerations

- **Plugin singletons**: Prevents unnecessary object creation
- **useMemo dependencies**: Only recreate when custom plugins change
- **Idempotent registration**: Prevents duplicate plugin registration overhead
- **Context-based registry**: Single shared instance, no prop drilling

## Security Notes

- Plugin IDs must be unique
- Plugins run with full access to editor state
- Validate plugin input before registration
- Sanitize markdown before parsing (especially from external sources)

## Future Enhancements

- Plugin versioning and compatibility checks
- Plugin dependencies/requirements
- Async plugin loading
- Plugin marketplace integration
- Sandboxed plugin execution
