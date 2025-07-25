import { EditorBlock, EditorBlockType, FormattedTextSegment } from '../types/editor';

// Unique id generator for blocks
export const generateId = (): string => {
  return `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Convert raw markdown string into editor blocks.
 */
export const parseMarkdownToBlocks = (markdown: string): EditorBlock[] => {
  if (!markdown.trim()) {
    return [{ id: generateId(), type: 'paragraph', content: '' }];
  }

  const blocks: EditorBlock[] = [];
  const lines = markdown.split('\n');
  let currentBlock: EditorBlock | null = null;
  let codeBlockContent: string[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // skip blank lines (unless inside code block)
    if (!trimmedLine && !inCodeBlock) {
      if (currentBlock) {
        blocks.push(currentBlock);
        currentBlock = null;
      }
      continue;
    }

    // code fences
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // end of fence
        if (currentBlock) {
          currentBlock.content = codeBlockContent.join('\n');
          blocks.push(currentBlock);
          currentBlock = null;
        }
        inCodeBlock = false;
        codeBlockContent = [];
      } else {
        inCodeBlock = true;
        codeBlockLanguage = trimmedLine.substring(3).trim();
        currentBlock = {
          id: generateId(),
          type: 'code',
          content: '',
          meta: { language: codeBlockLanguage || 'plaintext' },
        };
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // headings
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (currentBlock) blocks.push(currentBlock);
      blocks.push({
        id: generateId(),
        type: 'heading',
        content: headingMatch[2].trim(),
        meta: { level: Math.min(headingMatch[1].length, 6) },
      });
      currentBlock = null;
      continue;
    }

    // quotes (> or >> etc.)
    const quoteMatch = trimmedLine.match(/^(>+)\s+(.*)$/);
    if (quoteMatch) {
      if (currentBlock) blocks.push(currentBlock);
      const [, markers, content] = quoteMatch;
      blocks.push({
        id: generateId(),
        type: 'quote',
        content,
        meta: { depth: markers.length - 1 },
      });
      currentBlock = null;
      continue;
    }

    // empty quote line " > "
    const emptyQuoteMatch = trimmedLine.match(/^(>+)\s*$/);
    if (emptyQuoteMatch) {
      if (currentBlock) blocks.push(currentBlock);
      const [, markers] = emptyQuoteMatch;
      blocks.push({
        id: generateId(),
        type: 'quote',
        content: '',
        meta: { depth: markers.length - 1 },
      });
      currentBlock = null;
      continue;
    }

    // checklist (must come before generic list detection)
    const checklistMatch = trimmedLine.match(/^\s*[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checklistMatch) {
      const [, checked, content] = checklistMatch;
      if (!currentBlock || currentBlock.type !== 'checklist' || currentBlock.meta?.checked !== (checked.toLowerCase() === 'x')) {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'checklist',
          content,
          meta: { checked: checked.toLowerCase() === 'x' },
        };
      } else {
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // lists (unordered / ordered) incl. nesting by 2-space indent
    const listMatch = trimmedLine.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (listMatch) {
      const [, indent, marker, content] = listMatch;
      const isOrdered = /\d+\./.test(marker);
      const depth = Math.floor(indent.length / 2);
      if (!currentBlock || currentBlock.type !== 'list') {
        if (currentBlock) blocks.push(currentBlock);
        currentBlock = {
          id: generateId(),
          type: 'list',
          content,
          meta: { ordered: isOrdered, depth },
        };
      } else {
        currentBlock.content += '\n' + content;
      }
      continue;
    }

    // plain paragraph (default)
    if (!currentBlock) {
      currentBlock = { id: generateId(), type: 'paragraph', content: line };
    } else if (currentBlock.type === 'paragraph') {
      currentBlock.content += '\n' + line;
    } else {
      blocks.push(currentBlock);
      currentBlock = { id: generateId(), type: 'paragraph', content: line };
    }
  }

  if (currentBlock) blocks.push(currentBlock);
  return blocks.length ? blocks : [{ id: generateId(), type: 'paragraph', content: '' }];
};

/**
 * Turn blocks back into markdown.
 */
export const blocksToMarkdown = (blocks: EditorBlock[]): string => {
  const out: string[] = [];
  blocks.forEach((block, i) => {
    const next = blocks[i + 1];
    let md = '';
    switch (block.type) {
      case 'heading':
        md = `${'#'.repeat(block.meta?.level || 1)} ${block.content}`;
        break;
      case 'code':
        md = `\`\`\`${block.meta?.language || ''}\n${block.content}\n\`\`\``;
        break;
      case 'quote': {
        const depth = block.meta?.depth || 0;
        const prefix = '>'.repeat(depth + 1);
        md = block.content.trim()
          ? block.content.split('\n').map(l => `${prefix} ${l}`).join('\n')
          : `${prefix} `;
        break;
      }
      case 'list': {
        const items = block.content.split('\n');
        const depth = block.meta?.depth || 0;
        const indent = '  '.repeat(depth);
        md = block.meta?.ordered
          ? items.map((it, idx) => `${indent}${idx + 1}. ${it}`).join('\n')
          : items.map(it => `${indent}- ${it}`).join('\n');
        break;
      }
      case 'checklist': {
        const checked = block.meta?.checked ? 'x' : ' ';
        const depth = block.meta?.depth || 0;
        const indent = '  '.repeat(depth);
        md = block.content.split('\n').map(it => `${indent}- [${checked}] ${it}`).join('\n');
        break;
      }
      case 'divider':
        md = '---';
        break;
      case 'image': {
        const title = block.meta?.title ? ` "${block.meta.title}"` : '';
        md = `![${block.content}](${block.meta?.url || ''}${title})`;
        break;
      }
      default:
        md = block.content;
    }
    out.push(md);

    if (next) {
      if (block.type === 'quote' && next.type === 'quote' && block.meta?.depth === next.meta?.depth) {
        out.push('\n');
      } else if (block.type === 'list' && next.type === 'list' && block.meta?.ordered === next.meta?.ordered && block.meta?.depth === next.meta?.depth) {
        out.push('\n');
      } else if (block.type === 'checklist' && next.type === 'checklist') {
        out.push('\n');
      } else {
        out.push('\n\n');
      }
    }
  });
  return out.join('');
};

/**
 * Parse raw text inside a block to infer new block type / meta as user edits.
 */
export const parseRawText = (
  text: string,
  currentBlock: EditorBlock,
): { type: EditorBlockType; content: string; meta?: EditorBlock['meta'] } => {
  // empty – keep quote/list/checklist types so user can continue editing
  if (!text.trim()) {
    if (currentBlock.type === 'quote' || currentBlock.type === 'list' || currentBlock.type === 'checklist') {
      return { type: currentBlock.type, content: '', meta: currentBlock.meta };
    }
  }

  // heading
  const headingMatch = text.match(/^(#{1,6})\s+(.*)$/);
  if (headingMatch) {
    return {
      type: 'heading',
      content: headingMatch[2],
      meta: { level: headingMatch[1].length },
    };
  }

  // code fence start – only convert after newline
  if (text.startsWith('```')) {
    const nl = text.indexOf('\n');
    if (nl > 0) {
      const language = text.substring(3, nl).trim();
      const content = text.substring(nl + 1).replace(/\n?```$/, '');
      return { type: 'code', content, meta: { language: language || 'plaintext' } };
    }
    return { type: 'paragraph', content: text };
  }

  // back from code block
  if (currentBlock.type === 'code' && !text.startsWith('```')) {
    return { type: 'paragraph', content: text };
  }

  // image ![alt](url "title")
  const imgMatch = text.match(/^!\[([^\]]*)\]\(([^)]+)(?:\s+"([^"]*)")?\)$/);
  if (imgMatch) {
    return {
      type: 'image',
      content: imgMatch[1],
      meta: { url: imgMatch[2], alt: imgMatch[1], title: imgMatch[3] || '' },
    };
  }

  // quote
  const quoteMatch = text.match(/^(>+)\s+(.*)$/);
  if (quoteMatch) {
    const [, markers, content] = quoteMatch;
    return { type: 'quote', content, meta: { depth: markers.length - 1 } };
  }

  const quoteMarkersOnly = text.match(/^(>+)\s*$/);
  if (quoteMarkersOnly && currentBlock.type === 'quote') {
    return { type: 'quote', content: '', meta: { depth: quoteMarkersOnly[1].length - 1 } };
  }

  const malformedQuote = text.match(/^>+\S/);
  if (malformedQuote && currentBlock.type === 'quote') {
    return { type: 'paragraph', content: text };
  }

  if (currentBlock.type === 'quote' && !text.startsWith('>')) {
    return { type: 'paragraph', content: text };
  }

  // checklist
  const checkMatch = text.match(/^[-*+]\s+\[([ xX])\]\s+(.*)$/);
  if (checkMatch) {
    return { type: 'checklist', content: checkMatch[2], meta: { checked: checkMatch[1].toLowerCase() === 'x' } };
  }

  // list bullets / ordered
  if (text.match(/^(\*|\-|\+)\s+/)) {
    return { type: 'list', content: text.substring(2), meta: { ordered: false } };
  }
  if (text.match(/^\d+\.\s+/)) {
    return { type: 'list', content: text.replace(/^\d+\.\s+/, ''), meta: { ordered: true } };
  }

  // divider
  if (text === '---' || text === '***' || text === '___') {
    return { type: 'divider', content: '' };
  }

  return { type: 'paragraph', content: text };
};

/**
 * Convert inline markdown formatting to segment array.
 */
export const processInlineFormatting = (text: string): FormattedTextSegment[] => {
  const segments: FormattedTextSegment[] = [];
  let i = 0;
  while (i < text.length) {
    let handled = false;

    // code span
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        segments.push({ text: text.slice(i + 1, end), type: 'code' });
        i = end + 1;
        handled = true;
      }
    }

    // bold ** or __
    if (!handled && (text.slice(i).startsWith('**') || text.slice(i).startsWith('__'))) {
      const marker = text.slice(i).startsWith('**') ? '**' : '__';
      const end = text.indexOf(marker, i + marker.length);
      if (end !== -1) {
        const inner = processInlineFormatting(text.slice(i + marker.length, end));
        inner.forEach(seg => {
          if (seg.type === 'italic') segments.push({ ...seg, type: 'bold-italic' });
          else if (seg.type === 'normal') segments.push({ ...seg, type: 'bold' });
          else segments.push(seg);
        });
        i = end + marker.length;
        handled = true;
      }
    }

    // italic * or _ (single)
    if (!handled && ((text[i] === '*' && text[i + 1] !== '*') || (text[i] === '_' && text[i + 1] !== '_'))) {
      const marker = text[i];
      const end = text.indexOf(marker, i + 1);
      if (end !== -1) {
        const inner = processInlineFormatting(text.slice(i + 1, end));
        inner.forEach(seg => {
          if (seg.type === 'bold') segments.push({ ...seg, type: 'bold-italic' });
          else if (seg.type === 'normal') segments.push({ ...seg, type: 'italic' });
          else segments.push(seg);
        });
        i = end + 1;
        handled = true;
      }
    }

    if (!handled) {
      let normal = '';
      while (i < text.length && text[i] !== '`' && !text.slice(i).startsWith('**') && !text.slice(i).startsWith('__') && !(text[i] === '*' && text[i + 1] !== '*') && !(text[i] === '_' && text[i + 1] !== '_')) {
        normal += text[i];
        i++;
      }
      if (!normal) {
        normal = text[i];
        i++;
      }
      segments.push({ text: normal, type: 'normal' });
    }
  }
  return segments.length ? segments : [{ text, type: 'normal' }];
};

/**
 * Utility used by the editor to compute display value for a block when editing (adds quote/list markers etc.).
 */
export const getDisplayValue = (block: EditorBlock, isActive: boolean): string => {
  if (!isActive) return block.content;
  const indent = (d = 0) => '  '.repeat(d);
  switch (block.type) {
    case 'heading':
      return `${'#'.repeat(block.meta?.level || 1)} ${block.content}`;
    case 'code': {
      const lang = block.meta?.language ? ` ${block.meta.language}` : '';
      return `\`\`\`${lang}${block.content ? '\n' + block.content : ''}`;
    }
    case 'quote': {
      const depth = block.meta?.depth || 0;
      const prefix = '>'.repeat(depth + 1);
      if (!block.content.trim()) return `${prefix} `;
      return block.content.split('\n').map(l => `${prefix} ${l}`).join('\n');
    }
    case 'list': {
      const depth = block.meta?.depth || 0;
      const ordered = block.meta?.ordered;
      return block.content.split('\n').map((item, idx) => {
        const pre = ordered ? `${idx + 1}. ` : `${indent(depth)}- `;
        return `${pre}${item}`;
      }).join('\n');
    }
    case 'checklist': {
      const depth = block.meta?.depth || 0;
      const check = block.meta?.checked ? 'x' : ' ';
      return block.content.split('\n').map(i => `${indent(depth)}- [${check}] ${i}`).join('\n');
    }
    case 'divider':
      return '---';
    case 'image': {
      const title = block.meta?.title ? ` "${block.meta.title}"` : '';
      return `![${block.content}](${block.meta?.url || ''}${title})`;
    }
    default:
      return block.content;
  }
};