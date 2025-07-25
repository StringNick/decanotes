import React, { useState, memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient';

interface DividerConfig {
  label: string;
  style: any;
  preview: string;
}

const DIVIDER_STYLES: Record<DividerStyle, DividerConfig> = {
  solid: {
    label: 'Solid',
    style: { borderBottomWidth: 1, borderBottomColor: '#ddd' },
    preview: '────────────'
  },
  dashed: {
    label: 'Dashed',
    style: { borderBottomWidth: 1, borderBottomColor: '#ddd', borderStyle: 'dashed' },
    preview: '- - - - - - -'
  },
  dotted: {
    label: 'Dotted',
    style: { borderBottomWidth: 1, borderBottomColor: '#ddd', borderStyle: 'dotted' },
    preview: '• • • • • • •'
  },
  double: {
    label: 'Double',
    style: { borderBottomWidth: 3, borderBottomColor: '#ddd' },
    preview: '════════════'
  },
  gradient: {
    label: 'Gradient',
    style: { height: 2, backgroundColor: '#ddd' },
    preview: '▓▓▓▓▓▓▓▓▓▓▓▓'
  }
};

/**
 * Divider block component
 */
const DividerComponent: React.FC<BlockComponentProps> = memo(({
  block,
  onUpdate,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const [isStyleEditing, setIsStyleEditing] = useState(false);
  
  const dividerStyle = (block.meta?.dividerStyle as DividerStyle) || 'solid';
  const thickness = block.meta?.thickness || 1;
  const color = block.meta?.color || '#ddd';
  const spacing = block.meta?.spacing || 'medium';
  
  const config = DIVIDER_STYLES[dividerStyle];

  const handleStyleChange = (newStyle: DividerStyle) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        dividerStyle: newStyle
      }
    });
    setIsStyleEditing(false);
  };

  const handleThicknessChange = (newThickness: number) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        thickness: newThickness
      }
    });
  };

  const handleColorChange = (newColor: string) => {
    onUpdate?.({
      ...block,
      meta: {
        ...block.meta,
        color: newColor
      }
    });
  };

  const getSpacingStyle = () => {
    switch (spacing) {
      case 'small':
        return { marginVertical: 8 };
      case 'medium':
        return { marginVertical: 16 };
      case 'large':
        return { marginVertical: 24 };
      default:
        return { marginVertical: 16 };
    }
  };

  const getDividerStyle = () => {
    const baseStyle = {
      ...config.style,
      borderBottomColor: color,
      backgroundColor: dividerStyle === 'gradient' ? color : 'transparent'
    };

    if (dividerStyle !== 'gradient') {
      baseStyle.borderBottomWidth = thickness;
    } else {
      baseStyle.height = thickness;
    }

    return baseStyle;
  };

  return (
    <View style={[styles.container, getSpacingStyle(), style]}>
      {/* Style selector */}
      {isStyleEditing && (
        <View style={styles.styleSelector}>
          <Text style={styles.selectorTitle}>Divider Style</Text>
          {Object.entries(DIVIDER_STYLES).map(([styleKey, styleConfig]) => (
            <TouchableOpacity
              key={styleKey}
              style={[
                styles.styleOption,
                dividerStyle === styleKey && styles.selectedStyle
              ]}
              onPress={() => handleStyleChange(styleKey as DividerStyle)}
            >
              <Text style={styles.stylePreview}>{styleConfig.preview}</Text>
              <Text style={styles.styleLabel}>{styleConfig.label}</Text>
            </TouchableOpacity>
          ))}
          
          {/* Thickness controls */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Thickness</Text>
            <View style={styles.thicknessControls}>
              {[1, 2, 3, 4, 5].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.thicknessOption,
                    thickness === t && styles.selectedThickness
                  ]}
                  onPress={() => handleThicknessChange(t)}
                >
                  <Text style={styles.thicknessText}>{t}px</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Color controls */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Color</Text>
            <View style={styles.colorControls}>
              {['#ddd', '#999', '#666', '#333', '#007AFF', '#34C759', '#FF3B30'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.selectedColor
                  ]}
                  onPress={() => handleColorChange(c)}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Divider */}
      <TouchableOpacity
        style={[
          styles.dividerContainer,
          isSelected && styles.selected,
          isEditing && styles.editing
        ]}
        onPress={() => setIsStyleEditing(!isStyleEditing)}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        <View style={styles.dividerWrapper}>
          <View style={[styles.divider, getDividerStyle()]} />
        </View>
        
        {isSelected && (
          <View style={styles.dividerInfo}>
            <Text style={styles.infoText}>
              {config.label} • {thickness}px • {color}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.block.id === nextProps.block.id &&
    prevProps.block.meta?.style === nextProps.block.meta?.style &&
    prevProps.block.meta?.thickness === nextProps.block.meta?.thickness &&
    prevProps.block.meta?.color === nextProps.block.meta?.color &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  styleSelector: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  styleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedStyle: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  stylePreview: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#666',
  },
  styleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  controlGroup: {
    marginTop: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  thicknessControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  thicknessOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedThickness: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  thicknessText: {
    fontSize: 12,
    fontWeight: '500',
  },
  colorControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  colorOption: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#007AFF',
  },
  dividerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#f0f8ff',
    borderRadius: 4,
    padding: 8,
  },
  editing: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
    borderWidth: 2,
    borderRadius: 4,
    padding: 8,
  },
  dividerWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  divider: {
    width: '80%',
    minWidth: 100,
  },
  dividerInfo: {
    marginTop: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

/**
 * Divider block plugin
 */
export class DividerPlugin implements BlockPlugin {
  readonly id = 'divider';
  readonly name = 'Divider';
  readonly version = '1.0.0';
  readonly description = 'Horizontal divider with customizable styles';
  readonly blockType = 'divider';
  readonly component = DividerComponent;
  readonly type = 'block' as const;

  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    onCreate: this.onCreate.bind(this),
    getActions: (block: EditorBlock) => this.getActions(block)
  };

  readonly markdownSyntax = {
    patterns: {
      block: /^(---|\*\*\*|___)\s*$/
    },
    priority: 60
  };

  readonly toolbar = {
    icon: 'minus',
    label: 'Divider',
    shortcut: 'Ctrl+Alt+D',
    group: 'layout',
    variants: [
      { label: 'Solid Line', meta: { dividerStyle: 'solid' } },
      { label: 'Dashed Line', meta: { dividerStyle: 'dashed' } },
      { label: 'Dotted Line', meta: { dividerStyle: 'dotted' } },
      { label: 'Double Line', meta: { dividerStyle: 'double' } },
      { label: 'Gradient', meta: { dividerStyle: 'gradient' } },
    ]
  };

  readonly settings = {
    allowedParents: ['root'] as EditorBlockType[],
    validation: {
      required: []
    },
    defaultMeta: {
      dividerStyle: 'solid',
      thickness: 1,
      color: '#ddd',
      spacing: 'medium'
    }
  };

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create new paragraph after divider
    return {
      id: generateId(),
      type: 'paragraph',
      content: '',
      meta: {}
    };
  }

  protected transformContent(content: string): string {
    // Dividers don't have content
    return '';
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = block;
    
    // Parse markdown syntax if present
    const match = newBlock.content.match(/^(---|\*\*\*|___)\s*$/);
    if (match) {
      const marker = match[1];
      let dividerStyle: DividerStyle = 'solid';
      
      if (marker === '***') {
        dividerStyle = 'double';
      } else if (marker === '___') {
        dividerStyle = 'dashed';
      }
      
      newBlock.content = '';
      newBlock.meta = {
        ...newBlock.meta,
        dividerStyle
      };
    }
    
    // Ensure divider properties are set
    if (!newBlock.meta?.dividerStyle) {
      newBlock.meta = {
        ...newBlock.meta,
        dividerStyle: 'solid',
        thickness: 1,
        color: '#ddd',
        spacing: 'medium'
      };
    }
    
    // Always clear content for dividers
    newBlock.content = '';
    
    return newBlock;
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    const dividerStyle = (block.meta as any)?.dividerStyle || 'solid';
    
    // Add divider-specific actions
    Object.entries(DIVIDER_STYLES).forEach(([styleKey, styleConfig]) => {
      if (styleKey !== dividerStyle) {
        actions.unshift({
          id: `divider-${styleKey}`,
          label: `Change to ${styleConfig.label}`,
          icon: 'minus',
          handler: (block: EditorBlock) => {
            console.log(`Change divider to ${styleKey}:`, block.id);
          }
        });
      }
    });
    
    return actions;
  }

  /**
   * Create divider block with specific style
   */
  createDividerBlock(
    dividerStyle: DividerStyle = 'solid',
    thickness: number = 1,
    color: string = '#ddd',
    spacing: string = 'medium'
  ): EditorBlock {
    return {
      id: generateId(),
      type: 'divider',
      content: '',
      meta: {
        dividerStyle,
        thickness: Math.max(1, Math.min(5, thickness)),
        color,
        spacing
      }
    };
  }

  /**
   * Parse markdown divider syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const match = text.match(this.markdownSyntax!.patterns.block!);
    if (!match) return null;
    
    const marker = match[1];
    let dividerStyle: DividerStyle = 'solid';
    
    if (marker === '***') {
      dividerStyle = 'double';
    } else if (marker === '___') {
      dividerStyle = 'dashed';
    }
    
    return this.createDividerBlock(dividerStyle);
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const dividerStyle = (block.meta as any)?.dividerStyle || 'solid';
    
    switch (dividerStyle) {
      case 'double':
        return '***';
      case 'dashed':
        return '___';
      default:
        return '---';
    }
  }

  /**
   * Get available divider styles
   */
  getDividerStyles(): DividerStyle[] {
    return Object.keys(DIVIDER_STYLES) as DividerStyle[];
  }

  /**
   * Get divider style configuration
   */
  getDividerConfig(style: DividerStyle): DividerConfig {
    return DIVIDER_STYLES[style];
  }
}