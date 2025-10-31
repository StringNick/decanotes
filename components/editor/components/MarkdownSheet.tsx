import { Colors } from '@/constants/Colors';
import { DesignSystem } from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Copy, Save, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type MarkdownSheetMode = 'view' | 'edit';

interface MarkdownSheetProps {
  visible: boolean;
  markdown: string;
  noteTitle: string;
  noteId?: string;
  onClose: () => void;
  onApply?: (markdown: string) => void;
  onCopy?: (markdown: string, includeLink: boolean) => void;
}

export const MarkdownSheet: React.FC<MarkdownSheetProps> = ({
  visible,
  markdown,
  noteTitle,
  noteId,
  onClose,
  onApply,
  onCopy,
}) => {
  const { effectiveTheme } = useTheme();
  const colorScheme = effectiveTheme;
  const colors = Colors[colorScheme ?? 'light'];

  const [mode, setMode] = useState<MarkdownSheetMode>('view');
  const [editedMarkdown, setEditedMarkdown] = useState(markdown);
  const [includeLink, setIncludeLink] = useState(false);

  // Reset state when sheet opens
  React.useEffect(() => {
    if (visible) {
      setEditedMarkdown(markdown);
      setMode('view');
      setIncludeLink(false);
    }
  }, [visible, markdown]);

  const handleCopy = async () => {
    const contentToCopy = mode === 'edit' ? editedMarkdown : markdown;

    let finalContent = contentToCopy;
    if (includeLink && noteId) {
      const wikiLink = `[[${noteTitle}]]`;
      const markdownLink = `[${noteTitle}](decanotes://note/${noteId})`;
      finalContent = `${contentToCopy}\n\n---\n\nSource: ${includeLink ? wikiLink : markdownLink}`;
    }

    await Clipboard.setStringAsync(finalContent);

    if (onCopy) {
      onCopy(finalContent, includeLink);
    }

    Alert.alert('✓ Copied', 'Markdown copied to clipboard');
    onClose();
  };

  const handleApply = () => {
    if (onApply && editedMarkdown !== markdown) {
      onApply(editedMarkdown);
      Alert.alert('✓ Applied', 'Markdown changes applied');
    }
    onClose();
  };

  const styles = getStyles(colorScheme ?? 'light');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          {/* Header with tabs */}
          <View style={styles.header}>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'view' && styles.tabActive]}
                onPress={() => setMode('view')}
              >
                <Ionicons name="eye-outline" size={18} color={mode === 'view' ? colors.tint : colors.textSecondary} />
                <Text style={[styles.tabText, { color: mode === 'view' ? colors.tint : colors.textSecondary }]}>
                  Preview
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, mode === 'edit' && styles.tabActive]}
                onPress={() => setMode('edit')}
              >
                <Ionicons
                  name="create-outline"
                  size={18}
                  color={mode === 'edit' ? colors.tint : colors.textSecondary}
                />
                <Text style={[styles.tabText, { color: mode === 'edit' ? colors.tint : colors.textSecondary }]}>
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {mode === 'view' ? (
              <ScrollView style={styles.scrollView}>
                <View
                  style={[
                    styles.markdownContainer,
                    {
                      backgroundColor:
                        colorScheme === 'dark'
                          ? DesignSystem.Colors.glass.dark.soft
                          : DesignSystem.Colors.glass.light.soft,
                      borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}
                >
                  <Text style={[styles.markdownText, { color: colors.text }]}>{markdown}</Text>
                </View>
              </ScrollView>
            ) : (
              <TextInput
                style={[
                  styles.markdownInput,
                  {
                    backgroundColor:
                      colorScheme === 'dark'
                        ? DesignSystem.Colors.glass.dark.soft
                        : DesignSystem.Colors.glass.light.soft,
                    borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    color: colors.text,
                  },
                ]}
                value={editedMarkdown}
                onChangeText={setEditedMarkdown}
                multiline
                textAlignVertical="top"
                placeholder="Enter your markdown here..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
              />
            )}
          </View>

          {/* Footer with actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <View style={styles.linkOption}>
              <Text style={[styles.linkLabel, { color: colors.text }]}>Add note link</Text>
              <Switch
                value={includeLink}
                onValueChange={setIncludeLink}
                trackColor={{
                  false: colors.surface,
                  true: colors.tint + '40',
                }}
                thumbColor={includeLink ? colors.tint : colors.icon}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.copyButton, { backgroundColor: colors.surface }]}
                onPress={handleCopy}
              >
                <Copy size={16} color={colors.text} />
                <Text style={[styles.actionText, { color: colors.text }]}>Copy & Close</Text>
              </TouchableOpacity>

              {mode === 'edit' && onApply && editedMarkdown !== markdown && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.applyButton, { backgroundColor: colors.tint }]}
                  onPress={handleApply}
                >
                  <Save size={16} color="#FFFFFF" />
                  <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Apply</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];

  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    backdrop: {
      flex: 1,
    },
    sheet: {
      borderTopLeftRadius: DesignSystem.BorderRadius['3xl'],
      borderTopRightRadius: DesignSystem.BorderRadius['3xl'],
      maxHeight: '75%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: DesignSystem.Spacing.lg,
      paddingTop: DesignSystem.Spacing.lg,
      paddingBottom: DesignSystem.Spacing.md,
    },
    tabs: {
      flexDirection: 'row',
      gap: DesignSystem.Spacing.sm,
      backgroundColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: DesignSystem.BorderRadius.lg,
      padding: 4,
    },
    tab: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: DesignSystem.Spacing.xs,
      paddingHorizontal: DesignSystem.Spacing.md,
      paddingVertical: DesignSystem.Spacing.sm,
      borderRadius: DesignSystem.BorderRadius.md,
    },
    tabActive: {
      backgroundColor: colorScheme === 'dark' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(20, 184, 166, 0.12)',
    },
    tabText: {
      fontSize: DesignSystem.Typography.sizes.sm,
      fontFamily: DesignSystem.Typography.fonts.medium,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: DesignSystem.BorderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    content: {
      flex: 1,
      paddingHorizontal: DesignSystem.Spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    markdownContainer: {
      borderWidth: 1,
      borderRadius: DesignSystem.BorderRadius.xl,
      padding: DesignSystem.Spacing.base,
      minHeight: 200,
    },
    markdownText: {
      fontSize: DesignSystem.Typography.sizes.sm,
      fontFamily: DesignSystem.Typography.fonts.mono,
      lineHeight: 20,
    },
    markdownInput: {
      borderWidth: 1,
      borderRadius: DesignSystem.BorderRadius.xl,
      padding: DesignSystem.Spacing.base,
      minHeight: 300,
      fontSize: DesignSystem.Typography.sizes.sm,
      fontFamily: DesignSystem.Typography.fonts.mono,
      lineHeight: 20,
    },
    footer: {
      borderTopWidth: 1,
      paddingHorizontal: DesignSystem.Spacing.lg,
      paddingVertical: DesignSystem.Spacing.base,
      gap: DesignSystem.Spacing.md,
    },
    linkOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    linkLabel: {
      fontSize: DesignSystem.Typography.sizes.base,
      fontFamily: DesignSystem.Typography.fonts.medium,
    },
    actions: {
      flexDirection: 'row',
      gap: DesignSystem.Spacing.md,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: DesignSystem.Spacing.xs,
      paddingVertical: DesignSystem.Spacing.md,
      paddingHorizontal: DesignSystem.Spacing.base,
      borderRadius: DesignSystem.BorderRadius.lg,
    },
    copyButton: {
      // Styles from surface background
    },
    applyButton: {
      // Styles from tint background
    },
    actionText: {
      fontSize: DesignSystem.Typography.sizes.base,
      fontFamily: DesignSystem.Typography.fonts.medium,
    },
  });
};
