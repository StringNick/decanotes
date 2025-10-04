import { NoteCard } from '@/components/NoteCard';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Mock notes data - in real app this would come from a database
const mockNotes = [
  { 
    id: '1', 
    title: 'Meeting Notes', 
    lastModified: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    preview: 'Discussed project timeline and deliverables for the upcoming sprint. Key points include...',
    color: 'cream' as const,
  },
  { 
    id: '2', 
    title: 'Project Ideas', 
    lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    preview: 'New app concept for productivity and task management. Features should include...',
    color: 'sage' as const,
  },
  { 
    id: '3', 
    title: 'Shopping List', 
    lastModified: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    preview: 'Groceries for this week including organic vegetables, fruits, and proteins...',
    color: 'sky' as const,
  },
  { 
    id: '4', 
    title: 'Travel Planning', 
    lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    preview: 'Trip to Japan - research hotels, flights, and activities. Don\'t forget to check visa requirements...',
    color: 'lavender' as const,
  },
  { 
    id: '5', 
    title: 'Book Notes', 
    lastModified: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    preview: 'Key insights from "Atomic Habits" by James Clear. The power of small changes...',
    color: 'peach' as const,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { effectiveTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const isDark = effectiveTheme === 'dark';
  const colors = DesignSystem.getThemeColors(isDark);

  const handleNotePress = (noteId: string) => {
    // Navigate to editor with note data
    router.push('/editor');
  };

  const handleNewNote = () => {
    // Create new note and navigate to editor
    router.push('/editor');
  };

  const handleOptionsPress = (noteId: string) => {
    // Show note options (share, delete, etc.)
    console.log('Options for note:', noteId);
  };

  const filteredNotes = mockNotes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.preview.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeFilter === 'Recent') {
      const isRecent = Date.now() - note.lastModified.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
      return matchesSearch && isRecent;
    }
    
    return matchesSearch;
  });

  const renderNoteItem = ({ item }: { item: typeof mockNotes[0] }) => (
    <NoteCard
      key={item.id}
      id={item.id}
      title={item.title}
      preview={item.preview}
      lastModified={item.lastModified}
      color={item.color as keyof typeof DesignSystem.Colors.notes.light}
      onPress={() => handleNotePress(item.id)}
      onOptionsPress={() => handleOptionsPress(item.id)}
    />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            DecaNotes
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.text.primary }]}
            onPress={handleNewNote}
            activeOpacity={0.8}
          >
            <IconSymbol 
              name="plus" 
              size={20} 
              color={colors.text.inverse} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <IconSymbol 
              name="gearshape.fill" 
              size={20} 
              color={colors.text.secondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Theme Switcher (Debug) */}
      <ThemeSwitcher />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.neutral.gray200,
          }
        ]}>
          <IconSymbol 
            name="magnifyingglass" 
            size={16} 
            color={colors.text.tertiary} 
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text.primary }]}
            placeholder="Search notes..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['All', 'Recent', 'Favorites'].map((filter) => (
          <TouchableOpacity 
            key={filter} 
            style={[
              styles.filterTab,
              {
                backgroundColor: activeFilter === filter 
                  ? DesignSystem.Colors.primary.dark 
                  : colors.background.secondary,
                borderColor: activeFilter === filter 
                  ? DesignSystem.Colors.primary.dark 
                  : colors.neutral.gray200,
              },
              activeFilter === filter && styles.filterTabActive
            ]}
            onPress={() => setActiveFilter(filter)}
          >
            <Text style={[
              styles.filterTabText,
              {
                color: activeFilter === filter 
                  ? DesignSystem.Colors.text.light.inverse 
                  : colors.text.secondary
              }
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
        
        {/* Quick Add when searching */}
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            style={[
              styles.quickAddTab,
              { 
                backgroundColor: DesignSystem.Colors.primary.teal + '20',
                borderColor: DesignSystem.Colors.primary.teal,
              }
            ]}
            onPress={handleNewNote}
          >
            <IconSymbol 
              name="plus" 
              size={12} 
              color={DesignSystem.Colors.primary.teal} 
            />
            <Text style={[
              styles.quickAddText,
              { color: DesignSystem.Colors.primary.teal }
            ]}>
              Create "{searchQuery}"
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        contentContainerStyle={styles.notesListContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="doc.text"
              size={48}
              color={colors.text.tertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text.secondary }]}>
              No notes yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
              Tap the + button to create your first note
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.lg,
    paddingVertical: DesignSystem.Spacing.lg,
    paddingTop: DesignSystem.Spacing.xl,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...DesignSystem.createTextStyle('3xl', 'bold'),
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.md,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: DesignSystem.BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingsButton: {
    padding: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.lg,
  },
  searchContainer: {
    paddingHorizontal: DesignSystem.Spacing.lg,
    marginBottom: DesignSystem.Spacing.lg,
  },
  searchBar: {
    ...DesignSystem.Components.input.default,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.md,
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.xl,
    borderWidth: 0,
  },
  searchInput: {
    flex: 1,
    ...DesignSystem.createTextStyle('md'),
    padding: 0,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingBottom: DesignSystem.Spacing.base,
    gap: DesignSystem.Spacing.sm,
  },
  filterTab: {
    borderRadius: DesignSystem.BorderRadius.xl,
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.sm,
    borderWidth: 1,
  },
  filterTabActive: {
    backgroundColor: DesignSystem.Colors.primary.dark,
    borderColor: DesignSystem.Colors.primary.dark,
  },
  filterTabText: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  quickAddTab: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: DesignSystem.BorderRadius.xl,
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    borderWidth: 1,
    gap: DesignSystem.Spacing.xs,
    maxWidth: 200,
  },
  quickAddText: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
    flex: 1,
  },
  notesList: {
    flex: 1,
  },
  notesListContent: {
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingBottom: DesignSystem.Spacing['5xl'], // Padding for tab bar
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing['4xl'],
    paddingHorizontal: DesignSystem.Spacing.xl,
  },
  emptyTitle: {
    ...DesignSystem.createTextStyle('lg', 'semibold'),
    marginTop: DesignSystem.Spacing.base,
    marginBottom: DesignSystem.Spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...DesignSystem.createTextStyle('md'),
    textAlign: 'center',
    lineHeight: DesignSystem.Typography.sizes.md * DesignSystem.Typography.lineHeights.relaxed,
  },
});