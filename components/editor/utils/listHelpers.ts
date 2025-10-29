import { EditorBlock } from '../../../types/editor';

/**
 * Collect contiguous list block indices that share the same indentation level
 * as the block at `startIndex`.
 */
export function getListSiblingIndices(blocks: EditorBlock[], startIndex: number): number[] {
  if (startIndex < 0 || startIndex >= blocks.length) {
    return [];
  }

  const target = blocks[startIndex];
  if (!target || target.type !== 'list') {
    return [];
  }

  const targetLevel = target.meta?.level ?? 0;
  const indices: number[] = [startIndex];

  // Look backwards
  for (let i = startIndex - 1; i >= 0; i -= 1) {
    const block = blocks[i];
    if (!block || block.type !== 'list') {
      break;
    }
    const level = block.meta?.level ?? 0;
    if (level !== targetLevel) {
      break;
    }
    indices.unshift(i);
  }

  // Look forwards
  for (let i = startIndex + 1; i < blocks.length; i += 1) {
    const block = blocks[i];
    if (!block || block.type !== 'list') {
      break;
    }
    const level = block.meta?.level ?? 0;
    if (level !== targetLevel) {
      break;
    }
    indices.push(i);
  }

  return indices;
}
