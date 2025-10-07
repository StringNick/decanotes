import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { EditorBlock, EditorBlockType } from '../../../../types/editor';
import { generateId } from '../../../../utils/markdownParser';
import { BlockComponentProps, BlockPlugin } from '../../types/PluginTypes';

/**
 * Table block component with support for headers, alignment, and cell editing
 */
const TableComponent: React.FC<BlockComponentProps> = ({
  block,
  onBlockChange,
  onFocus,
  onBlur,
  isSelected,
  isEditing,
  style
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  const headers = block.meta?.headers || [];
  const rows = block.meta?.rows || [];
  const alignments = block.meta?.alignments || [];

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[index] = value;
    onBlockChange({
      meta: {
        ...block.meta,
        headers: newHeaders
      }
    });
  };

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...rows];
    if (!newRows[rowIndex]) {
      newRows[rowIndex] = [];
    }
    newRows[rowIndex][cellIndex] = value;
    onBlockChange({
      meta: {
        ...block.meta,
        rows: newRows
      }
    });
  };

  const addRow = () => {
    const newRow = new Array(headers.length).fill('');
    onBlockChange({
      meta: {
        ...block.meta,
        rows: [...rows, newRow]
      }
    });
  };

  const removeRow = (rowIndex: number) => {
    const newRows = rows.filter((_, idx) => idx !== rowIndex);
    onBlockChange({
      meta: {
        ...block.meta,
        rows: newRows
      }
    });
  };

  const addColumn = () => {
    const newHeaders = [...headers, `Column ${headers.length + 1}`];
    const newRows = rows.map(row => [...row, '']);
    const newAlignments = [...alignments, 'left' as const];

    onBlockChange({
      meta: {
        ...block.meta,
        headers: newHeaders,
        rows: newRows,
        alignments: newAlignments
      }
    });
  };

  const removeColumn = (colIndex: number) => {
    if (headers.length <= 1) return; // Keep at least one column

    const newHeaders = headers.filter((_, idx) => idx !== colIndex);
    const newRows = rows.map(row => row.filter((_, idx) => idx !== colIndex));
    const newAlignments = alignments.filter((_, idx) => idx !== colIndex);

    onBlockChange({
      meta: {
        ...block.meta,
        headers: newHeaders,
        rows: newRows,
        alignments: newAlignments
      }
    });
  };

  const getAlignment = (index: number): 'left' | 'center' | 'right' => {
    return alignments[index] || 'left';
  };

  const getAlignmentStyle = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'center':
        return { textAlign: 'center' as const };
      case 'right':
        return { textAlign: 'right' as const };
      default:
        return { textAlign: 'left' as const };
    }
  };

  return (
    <View style={[styles.container, style, isSelected && styles.selected, isEditing && styles.editing]}>
      {/* Table Controls - always show to make table visible and interactive */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={addRow}>
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={styles.controlButtonText}>Add Row</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton} onPress={addColumn}>
          <Ionicons name="add" size={16} color={colors.text} />
          <Text style={styles.controlButtonText}>Add Column</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onFocus}
        style={styles.tableWrapper}
      >
        <View style={styles.table}>
        {/* Header Row */}
        {headers.length > 0 && (
          <View style={styles.row}>
            {headers.map((header, index) => (
              <View key={`header-${index}`} style={styles.headerCell}>
                {isEditing ? (
                  <TextInput
                    value={header}
                    onChangeText={(value) => handleHeaderChange(index, value)}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    placeholder={`Column ${index + 1}`}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.cellInput, styles.headerText, getAlignmentStyle(getAlignment(index))]}
                  />
                ) : (
                  <Text style={[styles.headerText, getAlignmentStyle(getAlignment(index))]}>
                    {header}
                  </Text>
                )}

                {/* Column delete button - only show when editing and more than 1 column */}
                {isEditing && headers.length > 1 && (
                  <TouchableOpacity
                    style={styles.deleteColumnButton}
                    onPress={() => removeColumn(index)}
                  >
                    <Ionicons name="close-circle" size={16} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Data Rows */}
        {rows.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.rowContainer}>
            <View style={styles.row}>
              {headers.map((_, cellIndex) => (
                <View key={`cell-${rowIndex}-${cellIndex}`} style={styles.cell}>
                  {isEditing ? (
                    <TextInput
                      value={row[cellIndex] || ''}
                      onChangeText={(value) => handleCellChange(rowIndex, cellIndex, value)}
                      onFocus={onFocus}
                      onBlur={onBlur}
                      placeholder=""
                      placeholderTextColor={colors.textSecondary}
                      style={[styles.cellInput, styles.cellText, getAlignmentStyle(getAlignment(cellIndex))]}
                    />
                  ) : (
                    <Text style={[styles.cellText, getAlignmentStyle(getAlignment(cellIndex))]}>
                      {row[cellIndex] || ''}
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Row delete button - only show when editing */}
            {isEditing && (
              <TouchableOpacity
                style={styles.deleteRowButton}
                onPress={() => removeRow(rowIndex)}
              >
                <Ionicons name="trash-outline" size={16} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        ))}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    container: {
      marginVertical: 8,
      paddingVertical: 4,
    },
    selected: {
      // borderWidth: 1,
      // borderColor: colors.teal,
    },
    editing: {
      backgroundColor: colors.surface,
      borderColor: colors.teal,
      borderWidth: 1,
      borderRadius: 8,
      padding: 8,
      shadowColor: colors.teal,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 1,
    },
    controls: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
      paddingHorizontal: 4,
    },
    controlButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.teal + '20',
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.teal + '40',
    },
    controlButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    tableWrapper: {
      flex: 1,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
      minHeight: 60,
    },
    rowContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    row: {
      flex: 1,
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerCell: {
      flex: 1,
      padding: 12,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
      position: 'relative',
    },
    cell: {
      flex: 1,
      padding: 12,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    headerText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    cellText: {
      fontSize: 14,
      color: colors.text,
    },
    cellInput: {
      fontSize: 14,
      color: colors.text,
      padding: 0,
      margin: 0,
    },
    deleteColumnButton: {
      position: 'absolute',
      top: 2,
      right: 2,
      padding: 2,
      backgroundColor: colors.background,
      borderRadius: 10,
    },
    deleteRowButton: {
      padding: 8,
      marginLeft: 4,
    },
  });
};

/**
 * Table block plugin
 */
export class TablePlugin implements BlockPlugin {
  readonly type = 'block';
  readonly id = 'table';
  readonly name = 'Table';
  readonly version = '1.0.0';
  readonly description = 'Markdown tables with column alignment support';
  readonly blockType = 'table';
  readonly component = TableComponent;
  readonly controller = {
    transformContent: this.transformContent.bind(this),
    handleEnter: this.handleEnter.bind(this),
    onCreate: this.onCreate.bind(this),
    getActions: this.getActions.bind(this)
  };

  readonly markdownSyntax = {
    patterns: {
      block: /^\|(.+)\|$/
    },
    priority: 85
  };

  readonly toolbar = {
    icon: 'table',
    label: 'Table',
    shortcut: 'Ctrl+Shift+T',
    group: 'text'
  };

  readonly settings = {
    allowedParents: ['root'] as EditorBlockType[],
    validation: {},
    defaultMeta: {
      headers: ['Column 1', 'Column 2'],
      rows: [['', '']],
      alignments: ['left' as const, 'left' as const]
    }
  };

  /**
   * Create a new table block with default structure
   */
  createBlock(content: string = '', meta: any = {}): EditorBlock {
    return {
      id: generateId(),
      type: 'table',
      content: '',
      meta: {
        headers: meta.headers || this.settings.defaultMeta.headers,
        rows: meta.rows || this.settings.defaultMeta.rows,
        alignments: meta.alignments || this.settings.defaultMeta.alignments,
        ...meta
      }
    };
  }

  protected transformContent(content: string): string {
    return content;
  }

  protected handleEnter(block: EditorBlock): EditorBlock | EditorBlock[] | null {
    // Create a new paragraph after the table
    return [
      block,
      {
        id: generateId(),
        type: 'paragraph',
        content: ''
      }
    ];
  }

  protected onCreate(block: EditorBlock): EditorBlock {
    const newBlock = { ...block };

    // Parse markdown table if content looks like table syntax
    const lines = newBlock.content.split('\n').filter(line => line.trim().startsWith('|'));

    if (lines.length >= 2) {
      // Helper function to parse table row
      const parseTableRow = (line: string): string[] => {
        return line
          .split('|')
          .slice(1, -1)  // Remove first and last empty elements
          .map(cell => cell.trim());
      };

      // Parse header row
      const headers = parseTableRow(lines[0]);

      // Parse alignment row
      const alignmentCells = parseTableRow(lines[1]);
      const alignments = alignmentCells.map(cell => {
        const startsWithColon = cell.startsWith(':');
        const endsWithColon = cell.endsWith(':');

        if (startsWithColon && endsWithColon) return 'center';
        if (endsWithColon) return 'right';
        if (startsWithColon) return 'left';
        return 'left';  // default
      }) as ('left' | 'center' | 'right')[];

      // Parse data rows
      const rows = lines.slice(2).map(line => parseTableRow(line));

      newBlock.content = '';
      newBlock.meta = {
        ...newBlock.meta,
        headers,
        rows,
        alignments
      };
    } else if (!newBlock.meta?.headers) {
      // Set default values if not already set
      newBlock.meta = {
        ...newBlock.meta,
        ...this.settings.defaultMeta
      };
    }

    return newBlock;
  }

  public getActions(block: EditorBlock) {
    const actions: any[] = [];
    
    actions.push({
      id: 'add-row',
      label: 'Add Row',
      icon: 'plus',
      handler: (block: EditorBlock, context: any) => {
        const headers = block.meta?.headers || [];
        const rows = block.meta?.rows || [];
        const newRow = new Array(headers.length).fill('');
        context.updateBlock({
          meta: {
            ...block.meta,
            rows: [...rows, newRow]
          }
        });
      }
    });

    actions.push({
      id: 'add-column',
      label: 'Add Column',
      icon: 'plus',
      handler: (block: EditorBlock, context: any) => {
        const headers = block.meta?.headers || [];
        const rows = block.meta?.rows || [];
        const alignments = block.meta?.alignments || [];
        
        context.updateBlock({
          meta: {
            ...block.meta,
            headers: [...headers, `Column ${headers.length + 1}`],
            rows: rows.map(row => [...row, '']),
            alignments: [...alignments, 'left']
          }
        });
      }
    });
    
    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      handler: (block: EditorBlock, context: any) => {
        context.duplicateBlock();
      }
    });
    
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: 'trash',
      style: 'destructive',
      handler: (block: EditorBlock, context: any) => {
        context.deleteBlock();
      }
    });
    
    return actions;
  }

  /**
   * Parse markdown table syntax
   */
  parseMarkdown(text: string): EditorBlock | null {
    const lines = text.split('\n').filter(line => line.trim().startsWith('|'));

    if (lines.length < 2) return null;

    // Helper function to parse table row
    const parseTableRow = (line: string): string[] => {
      return line
        .split('|')
        .slice(1, -1)  // Remove first and last empty elements
        .map(cell => cell.trim());
    };

    // Parse header row
    const headers = parseTableRow(lines[0]);

    // Parse alignment row
    const alignmentCells = parseTableRow(lines[1]);

    // Validate that second row is an alignment row
    const isValidAlignmentRow = alignmentCells.every(cell =>
      /^:?-+:?$/.test(cell)
    );

    if (!isValidAlignmentRow || headers.length === 0) return null;

    const alignments = alignmentCells.map(cell => {
      const startsWithColon = cell.startsWith(':');
      const endsWithColon = cell.endsWith(':');

      if (startsWithColon && endsWithColon) return 'center';
      if (endsWithColon) return 'right';
      if (startsWithColon) return 'left';
      return 'left';  // default
    }) as ('left' | 'center' | 'right')[];

    // Parse data rows
    const rows = lines.slice(2).map(line => parseTableRow(line));

    return {
      id: generateId(),
      type: 'table',
      content: '',
      meta: {
        headers,
        rows,
        alignments
      }
    };
  }

  /**
   * Convert block to markdown
   */
  toMarkdown(block: EditorBlock): string {
    const headers = block.meta?.headers || [];
    const rows = block.meta?.rows || [];
    const alignments = block.meta?.alignments || [];

    if (headers.length === 0) return '';

    const lines: string[] = [];

    // Header row
    lines.push(`| ${headers.join(' | ')} |`);

    // Alignment row
    const alignmentRow = headers.map((_, index) => {
      const alignment = alignments[index] || 'left';
      switch (alignment) {
        case 'center':
          return ':---:';
        case 'right':
          return '---:';
        default:
          return '---';
      }
    });
    lines.push(`| ${alignmentRow.join(' | ')} |`);

    // Data rows
    rows.forEach(row => {
      const cells = headers.map((_, index) => row[index] || '');
      lines.push(`| ${cells.join(' | ')} |`);
    });

    return lines.join('\n');
  }
}
