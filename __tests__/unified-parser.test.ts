/**
 * Tests to verify heading IDs and emoji work in both parsing paths
 * (with and without plugins)
 */
import { parseMarkdownToBlocks } from '../components/editor/utils/MarkdownRegistry';

describe('Unified Markdown Parser', () => {
  describe('Heading IDs support', () => {
    it('should parse heading IDs without plugins', () => {
      const markdown = `### Important Section {#important}`;
      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toBe('Important Section');
      expect(blocks[0].meta?.level).toBe(3);
      expect(blocks[0].meta?.headingId).toBe('important');
    });

    it('should parse heading IDs with plugins', () => {
      const markdown = `### Important Section {#important}`;
      const blocks = parseMarkdownToBlocks(markdown, []);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toBe('Important Section');
      expect(blocks[0].meta?.level).toBe(3);
      expect(blocks[0].meta?.headingId).toBe('important');
    });

    it('should produce identical results for heading IDs', () => {
      const markdown = `## Section {#test}

### Subsection {#sub-test}`;

      const withoutPlugins = parseMarkdownToBlocks(markdown);
      const withPlugins = parseMarkdownToBlocks(markdown, []);

      expect(withoutPlugins.length).toBe(withPlugins.length);

      expect(withoutPlugins[0].meta?.headingId).toBe('test');
      expect(withPlugins[0].meta?.headingId).toBe('test');

      expect(withoutPlugins[1].meta?.headingId).toBe('sub-test');
      expect(withPlugins[1].meta?.headingId).toBe('sub-test');
    });
  });

  describe('Emoji support', () => {
    it('should process emoji shortcodes without plugins', () => {
      const markdown = `# Hello :rocket: World :smile:`;
      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toContain('🚀');
      expect(blocks[0].content).toContain('😄');
    });

    it('should process emoji shortcodes with plugins', () => {
      const markdown = `# Hello :rocket: World :smile:`;
      const blocks = parseMarkdownToBlocks(markdown, []);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('heading');
      expect(blocks[0].content).toContain('🚀');
      expect(blocks[0].content).toContain('😄');
    });

    it('should produce identical emoji results', () => {
      const markdown = `## Testing :fire: and :star:`;

      const withoutPlugins = parseMarkdownToBlocks(markdown);
      const withPlugins = parseMarkdownToBlocks(markdown, []);

      expect(withoutPlugins[0].content).toBe(withPlugins[0].content);
      expect(withoutPlugins[0].content).toContain('🔥');
      expect(withoutPlugins[0].content).toContain('⭐');
    });
  });

  describe('Combined features', () => {
    it('should handle emoji + heading ID without plugins', () => {
      const markdown = `### Important :tada: Section {#important}`;
      const blocks = parseMarkdownToBlocks(markdown);

      expect(blocks[0].content).toContain('🎉');
      expect(blocks[0].meta?.headingId).toBe('important');
    });

    it('should handle emoji + heading ID with plugins', () => {
      const markdown = `### Important :tada: Section {#important}`;
      const blocks = parseMarkdownToBlocks(markdown, []);

      expect(blocks[0].content).toContain('🎉');
      expect(blocks[0].meta?.headingId).toBe('important');
    });

    it('should produce identical results for all features', () => {
      const markdown = `## Test :rocket: {#test}

Text with footnote[^1].

[^1]: Footnote text.

### Another :fire: {#another}`;

      const withoutPlugins = parseMarkdownToBlocks(markdown);
      const withPlugins = parseMarkdownToBlocks(markdown, []);

      // Should have same number of blocks
      expect(withoutPlugins.length).toBe(withPlugins.length);

      // Headings should match
      const heading1_no = withoutPlugins.find(b => b.meta?.headingId === 'test');
      const heading1_yes = withPlugins.find(b => b.meta?.headingId === 'test');
      expect(heading1_no?.content).toBe(heading1_yes?.content);
      expect(heading1_no?.content).toContain('🚀');

      const heading2_no = withoutPlugins.find(b => b.meta?.headingId === 'another');
      const heading2_yes = withPlugins.find(b => b.meta?.headingId === 'another');
      expect(heading2_no?.content).toBe(heading2_yes?.content);
      expect(heading2_no?.content).toContain('🔥');

      // Footnotes should match
      const footnote_no = withoutPlugins.find(b => b.type === 'footnote');
      const footnote_yes = withPlugins.find(b => b.type === 'footnote');
      expect(footnote_no?.meta?.footnoteId).toBe('1');
      expect(footnote_yes?.meta?.footnoteId).toBe('1');
      expect(footnote_no?.content).toBe(footnote_yes?.content);
    });
  });
});
