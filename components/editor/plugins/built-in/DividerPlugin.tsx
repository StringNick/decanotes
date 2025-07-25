import React, { useState, memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

type DividerStyle = 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient';

interface DividerConfig {
  label: string;
  style: any;
  preview: string;
}

const getDividerStyles = (colorScheme: 'light' | 'dark'): Record<DividerStyle, DividerConfig> => {
  const colors = Colors[colorScheme];
  const defaultColor = colors.border;
  
  return {
    solid: {
      label: 'Solid',
      style: { borderBottomWidth: 1, borderBottomColor: defaultColor },
      preview: '────────────'
    },
    dashed: {
      label: 'Dashed',
      style: { borderBottomWidth: 1, borderBottomColor: defaultColor, borderStyle: 'dashed' },
      preview: '- - - - - - -'
    },
    dotted: {
      label: 'Dotted',
      style: { borderBottomWidth: 1, borderBottomColor: defaultColor, borderStyle: 'dotted' },
      preview: '• • • • • • •'
    },
    double: {
      label: 'Double',
      style: { borderBottomWidth: 3, borderBottomColor: defaultColor },
      preview: '════════════'
    },
    gradient: {
      label: 'Gradient',
      style: { height: 2, backgroundColor: defaultColor },
      preview: '▓▓▓▓▓▓▓▓▓▓▓▓'
    }
  };
};

/**
 * Divider block component with modern dark theme support
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');
  const DIVIDER_STYLES = getDividerStyles(colorScheme ?? 'light');
  const [isStyleEditing, setIsStyleEditing] = useState(false);
  
  const dividerStyle = (block.meta?.dividerStyle as DividerStyle) || 'solid';
  const thickness = block.meta?.thickness || 1;
  const color = block.meta?.color || colors.border;
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
              {[colors.border, colors.textMuted, colors.textSecondary, colors.text, colors.accent, colors.success, colors.error].map((c) => (
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

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      marginVertical: 16,
    },
    styleSelector: {
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 12,
      padding: 20,
      marginBottom: 16,
      width: '100%',
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectorTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 16,
      textAlign: 'center',
      color: colors.text,
    },
    styleOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedStyle: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    stylePreview: {
      fontFamily: 'monospace',
      fontSize: 12,
      color: colors.textSecondary,
    },
    styleLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    controlGroup: {
      marginTop: 20,
    },
    controlLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 12,
      color: colors.text,
    },
    thicknessControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    thicknessOption: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedThickness: {
      borderColor: colors.accent,
      backgroundColor: colors.accentLight,
    },
    thicknessText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    colorControls: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    colorOption: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedColor: {
      borderColor: colors.accent,
    },
    dividerContainer: {
      width: '100%',
      alignItems: 'center',
      paddingVertical: 8,
    },
    selected: {
      backgroundColor: colors.accentLight,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.borderFocus,
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.accent,
      borderWidth: 2,
      borderRadius: 8,
      padding: 12,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    dividerWrapper: {
      width: '100%',
      alignItems: 'center',
    },
    divider: {
      width: '85%',
      minWidth: 120,
    },
    dividerInfo: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 6,
    },
    infoText: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      fontWeight: '500',
    },
  });
};

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
    const dividerStyles = getDividerStyles('light'); // Default to light theme for actions
    
    // Add divider-specific actions
    Object.entries(dividerStyles).forEach(([styleKey, styleConfig]) => {
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
    const dividerStyles = getDividerStyles('light'); // Default to light theme
    return Object.keys(dividerStyles) as DividerStyle[];
  }

  /**
   * Get divider style configuration
   */
  getDividerConfig(style: DividerStyle): DividerConfig {
    const dividerStyles = getDividerStyles('light'); // Default to light theme
    return dividerStyles[style];
  }
}