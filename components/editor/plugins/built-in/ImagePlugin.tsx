import React, { useState, memo } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

/**
 * Image block component
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
            placeholderTextColor="#999"
            autoFocus
            onSubmitEditing={handleUrlSubmit}
            onBlur={handleUrlSubmit}
          />
          <TextInput
            style={styles.altInput}
            value={alt}
            onChangeText={handleAltChange}
            placeholder="Alt text (for accessibility)"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.captionInput}
            value={caption || ''}
            onChangeText={handleCaptionChange}
            placeholder="Caption (optional)"
            placeholderTextColor="#999"
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

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  imageWrapper: {
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
  errorContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffe6e6',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorUrl: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    maxHeight: 400,
    minHeight: 100,
  },
  imageCaption: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
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
  altInput: {
    fontSize: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  captionInput: {
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