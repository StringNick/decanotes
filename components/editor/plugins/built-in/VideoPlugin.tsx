import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { BlockPlugin } from '../../types/PluginTypes';
import { BlockComponentProps } from '../../types/PluginTypes';
import { Block, EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';

/**
 * Video block component
 */
const VideoComponent: React.FC<BlockComponentProps> = ({
  block,
  isSelected,
  isFocused,
  isDragging,
  onBlockChange,
  onFocus,
  onBlur,
  onKeyPress,
  theme,
  readOnly
}) => {
  const [isUrlEditing, setIsUrlEditing] = useState(false);
  const videoUrl = block.meta?.url || block.content;
  const title = block.meta?.title || 'Video';
  const thumbnail = block.meta?.thumbnail;

  const handleUrlChange = (url: string) => {
    onBlockChange({ content: url });
  };

  const handleTitleChange = (newTitle: string) => {
    onBlockChange?.({
      meta: {
        ...block.meta,
        title: newTitle
      }
    });
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.includes('.mp4') || 
             url.includes('.webm') || 
             url.includes('.ogg') ||
             url.includes('youtube.com') ||
             url.includes('vimeo.com') ||
             url.includes('youtu.be');
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (videoUrl && !validateUrl(videoUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid video URL');
      return;
    }
    setIsUrlEditing(false);
  };

  const renderVideoPreview = () => {
    if (!videoUrl) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>📹</Text>
          <Text style={styles.placeholderLabel}>Click to add video URL</Text>
        </View>
      );
    }

    return (
      <View style={styles.videoPreview}>
        {thumbnail ? (
          <View style={styles.thumbnailContainer}>
            <Text style={styles.thumbnailPlaceholder}>🎬</Text>
            <Text style={styles.videoTitle}>{title}</Text>
          </View>
        ) : (
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoIcon}>▶️</Text>
            <Text style={styles.videoTitle}>{title}</Text>
            <Text style={styles.videoUrl} numberOfLines={1}>{videoUrl}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.videoContainer,
          isSelected && styles.selected,
          isFocused && styles.editing
        ]}
        onPress={() => !readOnly && setIsUrlEditing(true)}
        onFocus={onFocus}
        onBlur={onBlur}
        disabled={readOnly}
      >
        {renderVideoPreview()}
      </TouchableOpacity>

      {isUrlEditing && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.urlInput}
            value={videoUrl}
            onChangeText={handleUrlChange}
            placeholder="Enter video URL (YouTube, Vimeo, or direct link)"
            placeholderTextColor="#999"
            autoFocus
            onSubmitEditing={handleUrlSubmit}
            onBlur={handleUrlSubmit}
          />
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Video title (optional)"
            placeholderTextColor="#999"
          />
        </View>
      )}

      {videoUrl && !isUrlEditing && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>URL: {videoUrl}</Text>
          {title && <Text style={styles.infoText}>Title: {title}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  videoContainer: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  selected: {
    borderColor: '#007AFF',
    borderStyle: 'solid',
  },
  editing: {
    borderColor: '#007AFF',
    borderWidth: 3,
    borderStyle: 'solid',
  },
  placeholder: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  placeholderLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  videoPreview: {
    minHeight: 120,
  },
  thumbnailContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  thumbnailPlaceholder: {
    fontSize: 48,
    marginBottom: 8,
  },
  videoPlaceholder: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  videoIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  videoUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  editContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  urlInput: {
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  titleInput: {
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  infoContainer: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
});

/**
 * Video plugin implementation
 */
export class VideoPlugin implements BlockPlugin {
  readonly type = 'block' as const;
  readonly id = 'video';
  readonly name = 'Video';
  readonly version = '1.0.0';
  readonly description = 'Embed videos from URLs or upload video files';
  readonly blockType: EditorBlockType = 'video';
  readonly component = VideoComponent;
  readonly controller: any;

  constructor() {
    this.controller = this.createController();
  }

  readonly markdownSyntax = {
    patterns: {
      block: /^!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)$/
    },
    priority: 70
  };

  readonly toolbar = {
    icon: 'video',
    label: 'Video',
    shortcut: 'Ctrl+Alt+V',
    group: 'media'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout'] as EditorBlockType[],
    validation: {
      required: ['content'] as string[]
    },
    defaultMeta: {
      autoplay: false,
      controls: true
    }
  };

  /**
   * Generate a unique ID for blocks
   */
  generateId(): string {
    return generateId();
  }

  /**
   * Create a new block
   */
  createBlock(content: string = '', meta: any = {}): EditorBlock {
    return {
      id: this.generateId(),
      type: 'video' as EditorBlockType,
      content,
      meta
    };
  }

  /**
   * Create the block controller
   */
  protected createController(): any {
    return {
      validate: this.validateContent.bind(this),
      transform: this.transformContent.bind(this),
      keyPress: this.handleKeyPress.bind(this),
      enter: this.handleEnter.bind(this),
      backspace: this.handleBackspace.bind(this),
      create: this.onCreate.bind(this),
      update: this.onUpdate.bind(this),
      delete: this.onDelete.bind(this),
      actions: this.getActions.bind(this)
    };
  }

  /**
   * Handle key press
   */
  protected handleKeyPress(event: any, block: EditorBlock): boolean | void {
    // Default implementation
  }

  /**
   * Handle backspace
   */
  protected handleBackspace(block: EditorBlock): EditorBlock | null {
    return null;
  }

  /**
   * Handle update
   */
  protected onUpdate(oldBlock: EditorBlock, newBlock: EditorBlock): EditorBlock {
    return newBlock;
  }

  /**
   * Handle delete
   */
  protected onDelete(block: EditorBlock): void {
    // Default implementation
  }

  /**
   * Check if plugin can handle block type
   */
  canHandle(blockType: string): boolean {
    return blockType === this.blockType;
  }

  /**
   * Get plugin metadata
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      type: this.type,
      description: this.description,
      blockType: this.blockType
    };
  }

  protected validateContent(content: string): boolean {
    if (!content.trim()) return true; // Empty is allowed
    
    try {
      new URL(content);
      return content.includes('.mp4') || 
             content.includes('.webm') || 
             content.includes('.ogg') ||
             content.includes('youtube.com') ||
             content.includes('vimeo.com') ||
             content.includes('youtu.be');
    } catch {
      return false;
    }
  }

  protected transformContent(content: string): string {
    // Extract URL from markdown syntax if present
    const match = content.match(/^!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)$/);
    if (match) {
      return match[1]; // Return just the URL
    }
    return content.trim();
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    // Parse markdown syntax if present
    const match = block.content.match(/^!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)$/);
    if (match) {
      return {
        ...block,
        content: match[1],
        meta: {
          ...block.meta,
          url: match[1],
          title: match[2] || 'Video'
        }
      };
    }
    
    // Ensure meta is set
    if (!block.meta?.type) {
      return {
        ...block,
        meta: {
          ...block.meta,
          url: block.content,
          title: block.meta?.title || 'Video'
        }
      };
    }
    
    return block;
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after video
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    
    // Add video-specific actions
    actions.unshift({
      id: 'edit-url',
      label: 'Edit URL',
      icon: 'edit',
      handler: (block: EditorBlock) => {
        console.log('Edit video URL:', block.id);
      }
    });
    
    if (block.meta?.url) {
      actions.unshift({
        id: 'open-video',
        label: 'Open Video',
        icon: 'external-link',
        handler: (block: EditorBlock) => {
          console.log('Open video:', block.meta?.url);
        }
      });
    }
    
    return actions;
  }
}

// Helper functions

/**
 * Create video block with URL and title
 */
export function createVideoBlock(url: string, title?: string): EditorBlock {
  const plugin = new VideoPlugin();
  return plugin.createBlock(url, {
    url,
    title: title || 'Video',
    controls: true,
    autoplay: false
  });
}

/**
 * Parse markdown video syntax
 */
export function parseMarkdown(text: string): EditorBlock | null {
  const match = text.match(/^!\[video\]\(([^)]+)(?:\s+"([^"]+)")?\)$/);
  if (!match) return null;
  
  const url = match[1];
  const title = match[2] || 'Video';
  
  return createVideoBlock(url, title);
}

/**
 * Convert block to markdown
 */
export function toMarkdown(block: EditorBlock): string {
  const url = block.meta?.url || block.content;
  const title = block.meta?.title;
  
  if (title && title !== 'Video') {
    return `![video](${url} "${title}")`;
  }
  
  return `![video](${url})`;
}

/**
 * Extract video ID from YouTube/Vimeo URLs
 */
export function extractVideoId(url: string): { platform: string; id: string } | null {
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  if (youtubeMatch) {
    return { platform: 'youtube', id: youtubeMatch[1] };
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { platform: 'vimeo', id: vimeoMatch[1] };
  }
  return null;
}

/**
 * Get video thumbnail URL
 */
export function getThumbnailUrl(url: string): string | null {
  const videoInfo = extractVideoId(url);
  if (!videoInfo) return null;
  
  switch (videoInfo.platform) {
    case 'youtube':
      return `https://img.youtube.com/vi/${videoInfo.id}/maxresdefault.jpg`;
    case 'vimeo':
      // Vimeo thumbnails require API call
      return null;
    default:
      return null;
  }
}