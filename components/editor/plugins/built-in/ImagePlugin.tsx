import React, { useState, useRef, memo } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Image, Alert, Dimensions } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

/**
 * Image block component with modern dark theme support
 */
const ImageComponent: React.FC<BlockComponentProps> = memo(({
  block,
  onUpdate,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const [isUrlEditing, setIsUrlEditing] = useState(false);
  const [imageError, setImageError] = useState(false);

  console.log('imageUrl', block.meta?.url, 'alt', block.meta?.alt, 'caption', block.meta?.caption);
  
  const imageUrl = block.meta?.url || block.content;
  const alt = block.meta?.alt || 'Image';
  const caption = block.meta?.caption;
  const width = block.meta?.width;
  const height = block.meta?.height;

  const handleUrlChange = (url: string) => {
    setImageError(false);
    onUpdate?.({
      ...block,
      content: url,
      meta: {
        ...block.meta,
        url
      }
    });
  };

  const handleAltChange = (newAlt: string) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        alt: newAlt
      }
    });
  };

  const handleCaptionChange = (newCaption: string) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        caption: newCaption
      }
    });
  };

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      // More flexible validation - allow URLs that might have query parameters
      return url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) !== null || 
             url.includes('image') || 
             url.includes('img') ||
             url.startsWith('data:image/');
    } catch {
      return false;
    }
  };

  const handleUrlSubmit = () => {
    if (imageUrl && !validateUrl(imageUrl)) {
      Alert.alert('Invalid URL', 'Please enter a valid image URL');
      return;
    }
    setIsUrlEditing(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const renderImagePreview = () => {
    if (!imageUrl) {
      return (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🖼️</Text>
          <Text style={styles.placeholderLabel}>Click to add image URL</Text>
        </View>
      );
    }

    if (imageError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>Failed to load image</Text>
          <Text style={styles.errorUrl} numberOfLines={1}>{imageUrl}</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            width && { width },
            height && { height }
          ]}
          resizeMode="contain"
          onError={handleImageError}
        />
        {caption && (
          <Text style={styles.imageCaption}>{caption}</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.imageWrapper,
          isSelected && styles.selected,
          isEditing && styles.editing
        ]}
        onPress={() => setIsUrlEditing(true)}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {renderImagePreview()}
      </TouchableOpacity>

      {isUrlEditing && (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.urlInput}
            value={imageUrl}
            onChangeText={handleUrlChange}
            placeholder="Enter image URL (jpg, png, gif, webp, svg)"
            placeholderTextColor={colors.textMuted}
            autoFocus
            onSubmitEditing={handleUrlSubmit}
            onBlur={handleUrlSubmit}
          />
          <TextInput
            style={styles.altInput}
            value={alt}
            onChangeText={handleAltChange}
            placeholder="Alt text (for accessibility)"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={styles.captionInput}
            value={caption || ''}
            onChangeText={handleCaptionChange}
            placeholder="Caption (optional)"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      )}

      {imageUrl && !isUrlEditing && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>URL: {imageUrl}</Text>
          {alt && <Text style={styles.infoText}>Alt: {alt}</Text>}
          {caption && <Text style={styles.infoText}>Caption: {caption}</Text>}
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
    prevProps.block.meta?.alt === nextProps.block.meta?.alt &&
    prevProps.block.meta?.caption === nextProps.block.meta?.caption &&
    prevProps.block.meta?.width === nextProps.block.meta?.width &&
    prevProps.block.meta?.height === nextProps.block.meta?.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.style === nextProps.style
  );
});

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    imageWrapper: {
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
    errorContainer: {
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorLight,
    },
    errorIcon: {
      fontSize: 32,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 16,
      color: colors.error,
      fontWeight: '600',
      marginBottom: 8,
      textAlign: 'center',
    },
    errorUrl: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
      fontFamily: 'monospace',
    },
    imageContainer: {
      alignItems: 'center',
      backgroundColor: colors.surface,
    },
    image: {
      width: '100%',
      height: 200,
      maxHeight: 400,
      minHeight: 120,
    },
    imageCaption: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 12,
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 6,
      marginHorizontal: 16,
      marginBottom: 8,
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
    altInput: {
      fontSize: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      color: colors.text,
      marginBottom: 12,
    },
    captionInput: {
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
 * Image block plugin
 */
export class ImagePlugin implements BlockPlugin {
  readonly type = 'block';
  readonly id = 'image';
  readonly name = 'Image';
  readonly version = '1.0.0';
  readonly description = 'Embed images from URLs with captions and alt text';
  readonly blockType = 'image';
  readonly component = ImageComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    getActions: (block: EditorBlock) => this.getActions(block)
  };

  readonly markdownSyntax = {
    patterns: {
      block: /^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]+)")?\)$/
    },
    priority: 75
  };

  readonly toolbar = {
    icon: 'image',
    label: 'Image',
    shortcut: 'Ctrl+Alt+I',
    group: 'media'
  };

  readonly settings = {
    allowedParents: ['root', 'quote', 'callout'] as EditorBlockType[],
    validation: {
      pattern: /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)$/i,
      required: []
    },
    defaultMeta: {
      alt: 'Image',
      loading: 'lazy'
    }
  };

  protected transformContent(content: string): string {
    // Extract URL from markdown syntax if present
    const match = content.match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]+)")?\)$/);
    if (match) {
      return match[2]; // Return just the URL
    }
    return content.trim();
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    console.log('onCreate', block)
     return block;
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after image
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    
    // Add image-specific actions
    actions.unshift({
      id: 'edit-image',
      label: 'Edit Image',
      icon: 'edit',
      handler: (block: EditorBlock) => {
        console.log('Edit image:', block.id);
      }
    });
    
    if (block.meta?.url) {
      actions.unshift({
        id: 'open-image',
        label: 'Open Image',
        icon: 'external-link',
        handler: (block: EditorBlock) => {
          console.log('Open image:', block.meta?.url);
        }
      });
    }
    
    actions.unshift({
      id: 'add-caption',
      label: 'Add Caption',
      icon: 'comment',
      handler: (block: EditorBlock) => {
        console.log('Add/edit caption:', block.id);
      }
    });
    
    return actions;
  }

  /**
   * Create image block with URL and metadata
   */
  createImageBlock(
    url: string,
    alt?: string,
    caption?: string,
    width?: number,
    height?: number
  ): EditorBlock {
    console.log('create image block')
    return {
      id: generateId(),
      type: 'image',
      content: url,
      meta: {
        url,
        alt: alt || 'Image',
        caption,
        width,
        height,
        loading: 'lazy'
      }
    };
  }

  /**
   * Parse markdown image syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
     const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const alt = match[1] || 'Image';
    const url = match[2];
    const caption = match[3];
    
    return {
      id: generateId(),
      type: 'image',
      content: url,
      meta: {
         url,
         alt: alt || 'Image',
         caption: caption || ''
       }
    };
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const url = block.meta?.url || block.content;
    const alt = block.meta?.alt || 'Image';
    const caption = block.meta?.caption;
    
    if (caption) {
      return `![${alt}](${url} "${caption}")`;;
    }
    
    return `![${alt}](${url})`;
  }
}