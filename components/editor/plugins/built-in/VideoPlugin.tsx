import React, { useState, memo } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { BlockPlugin } from '../../types/PluginTypes';
import { BlockComponentProps } from '../../types/PluginTypes';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

/**
 * Video block component with modern dark theme support
 */
const VideoComponent: React.FC<BlockComponentProps> = memo(({
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
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
            placeholderTextColor={colors.textMuted}
            autoFocus
            onSubmitEditing={handleUrlSubmit}
            onBlur={handleUrlSubmit}
          />
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Video title (optional)"
            placeholderTextColor={colors.textMuted}
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
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.content === nextProps.block.content &&
    prevProps.block.meta?.url === nextProps.block.meta?.url &&
    prevProps.block.meta?.title === nextProps.block.meta?.title &&
    prevProps.block.meta?.thumbnail === nextProps.block.meta?.thumbnail &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.readOnly === nextProps.readOnly
  );
});

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    videoContainer: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    selected: {
      borderColor: colors.accent,
      borderStyle: 'solid',
      backgroundColor: colors.accentLight,
    },
    editing: {
      borderColor: colors.accent,
      borderWidth: 2,
      borderStyle: 'solid',
      backgroundColor: colors.surface,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    placeholder: {
      padding: 48,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    placeholderText: {
      fontSize: 48,
      marginBottom: 12,
    },
    placeholderLabel: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
    videoPreview: {
      minHeight: 140,
      backgroundColor: colors.surface,
    },
    thumbnailContainer: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    thumbnailPlaceholder: {
      fontSize: 48,
      marginBottom: 12,
    },
    videoPlaceholder: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    videoIcon: {
      fontSize: 36,
      marginBottom: 12,
    },
    videoTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    videoUrl: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'monospace',
    },
    editContainer: {
      padding: 16,
      backgroundColor: colors.backgroundSecondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    urlInput: {
      fontSize: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      color: colors.text,
      marginBottom: 12,
    },
    titleInput: {
      fontSize: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    infoContainer: {
      padding: 12,
      backgroundColor: colors.backgroundSecondary,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      borderRadius: 8,
      marginTop: 8,
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
      fontFamily: 'monospace',
    },
  });
};

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