jest.mock('../components/editor/core/KeyboardHandler', () => ({
  KeyboardHandler: ({ children }: { children: (props: { onKeyPress: () => void; preventNewlines?: boolean }) => any }) =>
    children({ onKeyPress: () => {}, preventNewlines: false }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => null),
    clear: jest.fn(async () => null),
  },
}));

jest.mock('../hooks/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { ParagraphPlugin } from '../components/editor/plugins/built-in/ParagraphPlugin';
import { HeadingPlugin } from '../components/editor/plugins/built-in/HeadingPlugin';
import { ListPlugin } from '../components/editor/plugins/built-in/ListPlugin';
import { ChecklistPlugin } from '../components/editor/plugins/built-in/ChecklistPlugin';
import { CodePlugin } from '../components/editor/plugins/built-in/CodePlugin';
import { CalloutPlugin } from '../components/editor/plugins/built-in/CalloutPlugin';
import { TablePlugin } from '../components/editor/plugins/built-in/TablePlugin';
import { ImagePlugin } from '../components/editor/plugins/built-in/ImagePlugin';
import { VideoPlugin } from '../components/editor/plugins/built-in/VideoPlugin';
import { DividerPlugin } from '../components/editor/plugins/built-in/DividerPlugin';
import { EditorBlock } from '../types/editor';

type PluginUnderTest = {
  name: string;
  plugin: any;
  block: EditorBlock;
  extraProps?: Record<string, unknown>;
};

const noop = () => {};

const baseProps = {
  onBlockChange: noop,
  onUpdate: noop,
  onFocus: noop,
  onBlur: noop,
  onAction: noop,
  config: {},
  readOnly: false,
  isSelected: false,
  isEditing: true,
  isFocused: true,
  style: undefined,
};

const plugins: PluginUnderTest[] = [
  {
    name: 'Paragraph',
    plugin: new ParagraphPlugin(),
    block: { id: 'paragraph-1', type: 'paragraph', content: 'Hello', meta: {} },
  },
  {
    name: 'Heading',
    plugin: new HeadingPlugin(),
    block: { id: 'heading-1', type: 'heading', content: 'Title', meta: { level: 1 } },
  },
  {
    name: 'List',
    plugin: new ListPlugin(),
    block: { id: 'list-1', type: 'list', content: 'Item', meta: { listType: 'unordered', level: 0 } },
  },
  {
    name: 'Checklist',
    plugin: ChecklistPlugin.getInstance(),
    block: { id: 'checklist-1', type: 'checklist', content: 'Task', meta: { checked: false } },
  },
  {
    name: 'Code',
    plugin: new CodePlugin(),
    block: { id: 'code-1', type: 'code', content: 'console.log(1);', meta: { language: 'javascript' } },
  },
  {
    name: 'Callout',
    plugin: new CalloutPlugin(),
    block: {
      id: 'callout-1',
      type: 'callout',
      content: 'Callout text',
      meta: { calloutType: 'note', title: 'Note', showTitle: true },
    },
  },
  {
    name: 'Table',
    plugin: new TablePlugin(),
    block: {
      id: 'table-1',
      type: 'table',
      content: '',
      meta: { headers: ['Column 1'], rows: [['']], alignments: ['left'] },
    },
  },
  {
    name: 'Image',
    plugin: new ImagePlugin(),
    block: {
      id: 'image-1',
      type: 'image',
      content: 'https://example.com/image.png',
      meta: { url: 'https://example.com/image.png', alt: 'Image' },
    },
  },
  {
    name: 'Video',
    plugin: new VideoPlugin(),
    block: {
      id: 'video-1',
      type: 'video',
      content: 'https://example.com/video.mp4',
      meta: { url: 'https://example.com/video.mp4', title: 'Video' },
    },
  },
  {
    name: 'Divider',
    plugin: new DividerPlugin(),
    block: {
      id: 'divider-1',
      type: 'divider',
      content: '',
      meta: { dividerStyle: 'solid' },
    },
  },
];

describe('Built-in plugins expose focus handles', () => {
  plugins.forEach(({ name, plugin, block, extraProps }) => {
    it(`${name} plugin provides focus handle`, async () => {
      const Component = plugin.component as React.ComponentType<any>;
      const ref = React.createRef<TextInput | { focus: () => void }>();

      let renderer: TestRenderer.ReactTestRenderer;
      act(() => {
        renderer = TestRenderer.create(
          <Component
            ref={ref}
            block={block}
            {...baseProps}
            {...extraProps}
          />
        );
      });

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current?.focus).toBe('function');

      renderer.unmount();
    });
  });
}
);
