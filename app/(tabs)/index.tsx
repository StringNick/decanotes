import { NoteCard } from '@/components/NoteCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// Create Animated FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

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
  
  // Animation values
  const fabScale = useRef(new Animated.Value(1)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleNotePress = (noteId: string) => {
    // Navigate to editor with note data
    router.push('/editor');
  };

  const handleNewNote = () => {
    // Animate FAB press
    Animated.sequence([
      Animated.spring(fabScale, {
        toValue: 0.9,
        ...DesignSystem.Animations.spring.stiff,
      }),
      Animated.spring(fabScale, {
        toValue: 1,
        ...DesignSystem.Animations.spring.bouncy,
      }),
    ]).start();
    
    // Create new note and navigate to editor
    setTimeout(() => router.push('/editor'), 100);
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
          <Text style={[styles.headerSubtitle, { color: colors.text.tertiary }]}>
            {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <IconSymbol 
            name="gearshape" 
            size={22} 
            color={colors.text.tertiary} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar - Minimal */}
      <View style={styles.searchContainer}>
        <View style={[
          styles.searchBar,
          {
            backgroundColor: isDark 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.03)',
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
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <IconSymbol 
                name="xmark.circle.fill" 
                size={16} 
                color={colors.text.tertiary} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs - Minimal */}
      <View style={styles.filterTabs}>
        {['All', 'Recent', 'Favorites'].map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <TouchableOpacity 
              key={filter} 
              style={[
                styles.filterTab,
                {
                  backgroundColor: isActive
                    ? (isDark ? colors.text.primary : colors.text.primary)
                    : 'transparent',
                }
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                {
                  color: isActive 
                    ? (isDark ? colors.background.primary : colors.background.primary)
                    : colors.text.tertiary
                }
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
        
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
      <AnimatedFlatList
        data={filteredNotes}
        renderItem={renderNoteItem}
        keyExtractor={(item) => item.id}
        style={styles.notesList}
        contentContainerStyle={styles.notesListContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <IconSymbol
              name="doc.text"
              size={48}
              color={colors.text.tertiary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text.primary }]}>
              No notes yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.text.tertiary }]}>
              Tap the + button to create your first note
            </Text>
          </View>
        )}
      />
      
      {/* Floating Action Button - Minimal */}
      <Animated.View 
        style={[
          styles.fabContainer,
          {
            transform: [
              { scale: fabScale },
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, 80],
                  extrapolate: 'clamp',
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.fab,
            { backgroundColor: colors.text.primary }
          ]}
          onPress={handleNewNote}
          activeOpacity={0.8}
        >
          <IconSymbol 
            name="plus" 
            size={24} 
            color={colors.background.primary} 
          />
        </TouchableOpacity>
      </Animated.View>
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
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingTop: DesignSystem.Spacing.xl,
    paddingBottom: DesignSystem.Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...DesignSystem.createTextStyle('3xl', 'bold'),
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
  },
  settingsButton: {
    padding: DesignSystem.Spacing.sm,
  },
  searchContainer: {
    paddingHorizontal: DesignSystem.Spacing.xl,
    marginBottom: DesignSystem.Spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.md,
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.md,
    borderRadius: DesignSystem.BorderRadius.lg,
  },
  searchInput: {
    flex: 1,
    ...DesignSystem.createTextStyle('base', 'primary'),
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingBottom: DesignSystem.Spacing.base,
    gap: DesignSystem.Spacing.sm,
  },
  filterTab: {
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.xs,
    borderRadius: DesignSystem.BorderRadius.lg,
  },
  filterTabText: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
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
    paddingHorizontal: DesignSystem.Spacing.xl,
    paddingBottom: DesignSystem.Spacing['6xl'], // Padding for tab bar + FAB
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DesignSystem.Spacing['4xl'],
    paddingHorizontal: DesignSystem.Spacing['2xl'],
    gap: DesignSystem.Spacing.base,
  },
  emptyTitle: {
    ...DesignSystem.createTextStyle('xl', 'bold'),
    marginBottom: DesignSystem.Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...DesignSystem.createTextStyle('md', 'medium'),
    textAlign: 'center',
    lineHeight: DesignSystem.Typography.sizes.md * DesignSystem.Typography.lineHeights.relaxed,
    opacity: 0.7,
  },
  fabContainer: {
    position: 'absolute',
    right: DesignSystem.Spacing.xl,
    bottom: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: DesignSystem.BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...DesignSystem.Shadows.lg,
  },
});
