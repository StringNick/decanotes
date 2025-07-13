import React from 'react';
import { BlockProps, BlockType } from '../types/editor';
import ImageBlock from './ImageBlock';
import UniversalBlock from './UniversalBlock';

export type BlockRegistry = Record<BlockType, React.ComponentType<BlockProps>>;

export const defaultBlockRegistry: BlockRegistry = {
  paragraph: UniversalBlock,
  heading: UniversalBlock,
  code: UniversalBlock,
  quote: UniversalBlock,
  list: UniversalBlock,
  checklist: UniversalBlock,
  divider: UniversalBlock,
  image: ImageBlock,
}; 