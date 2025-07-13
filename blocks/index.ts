import React from 'react';
import { BlockProps, BlockType } from '../types/editor';
import ChecklistBlock from './ChecklistBlock';
import ImageBlock from './ImageBlock';
import UniversalBlock from './UniversalBlock';

export type BlockRegistry = Record<BlockType, React.ComponentType<BlockProps>>;

export const defaultBlockRegistry: BlockRegistry = {
  paragraph: UniversalBlock,
  heading: UniversalBlock,
  code: UniversalBlock,
  quote: UniversalBlock,
  list: UniversalBlock,
  checklist: ChecklistBlock,
  divider: UniversalBlock,
  image: ImageBlock,
}; 