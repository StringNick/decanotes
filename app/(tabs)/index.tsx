import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Mock pages data - in real app this would come from a database
const mockPages = [
  { 
    id: '1', 
    title: 'Meeting Notes', 
    lastModified: '2 hours ago', 
    preview: 'Discussed project timeline and deliverables for the upcoming sprint...',
    completed: 3,
    total: 5,
    priority: 'high'
  },
  { 
    id: '2', 
    title: 'Project Ideas', 
    lastModified: '1 day ago', 
    preview: 'New app concept for productivity and task management...',
    completed: 1,
    total: 8,
    priority: 'medium'
  },
  { 
    id: '3', 
    title: 'Shopping List', 
    lastModified: '3 days ago', 
    preview: 'Groceries for this week including organic vegetables...',
    completed: 7,
    total: 10,
    priority: 'low'
  },
  { 
    id: '4', 
    title: 'Travel Planning', 
    lastModified: '1 week ago', 
    preview: 'Trip to Japan - research hotels, flights, and activities...',
    completed: 2,
    total: 12,
    priority: 'medium'
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // Get theme colors and styles
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  const handlePagePress = (pageId: string) => {
    // Navigate to editor with page data
    router.push('/editor');
  };

  const handleNewPage = () => {
    // Create new page and navigate to editor
    router.push('/editor');
  };

  const renderPageItem = ({ item }: { item: typeof mockPages[0] }) => (
    <TouchableOpacity 
      style={styles.pageCard}
      onPress={() => handlePagePress(item.id)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[colors.blue, colors.blue]}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.lastModified}</Text>
          </View>
          <TouchableOpacity style={styles.cardActionButton}>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          <View style={styles.todoItem}>
            <Text style={styles.cardPreview} numberOfLines={2}>
              {item.preview}
            </Text>
          </View>
          
          {/* Progress Section */}
          <View style={styles.progressSection}>
            <View style={styles.progressInfo}>
              <View style={styles.checkboxContainer}>
                <View style={[
                  styles.checkbox,
                  item.completed > 0 && styles.checkboxChecked
                ]}>
                  {item.completed > 0 && (
                    <Ionicons name="checkmark" size={12} color={colors.background} />
                  )}
                </View>
                <Text style={styles.progressText}>
                  {item.completed}/{item.total} completed
                </Text>
              </View>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wordsy</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={20} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        {['All', 'Recent', 'Favorites'].map((filter, index) => (
          <TouchableOpacity 
            key={filter} 
            style={[styles.filterTab, index === 0 && styles.filterTabActive]}
          >
            <Text style={[
              styles.filterTabText, 
              index === 0 && styles.filterTabTextActive
            ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pages List */}
      <FlatList
        data={mockPages}
        renderItem={renderPageItem}
        keyExtractor={(item) => item.id}
        style={styles.pagesList}
        contentContainerStyle={styles.pagesListContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.floatingActionButton}
        onPress={handleNewPage}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[colors.teal, colors.teal]}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={24} color={colors.background} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'AlbertSans_700Bold',
      color: colors.text,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 12,
    },
    searchButton: {
      padding: 8,
    },
    filterButton: {
      padding: 8,
    },
    filterTabs: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 12,
      gap: 12,
    },
    filterTab: {
      backgroundColor: colors.borderLight,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    filterTabActive: {
      backgroundColor: colors.dark,
    },
    filterTabText: {
      fontSize: 14,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.textSecondary,
    },
    filterTabTextActive: {
      color: colors.background,
    },
    pagesList: {
      flex: 1,
    },
    pagesListContent: {
      paddingHorizontal: 20,
      paddingBottom: 100, // Extra padding for floating button
    },
    pageCard: {
      borderRadius: 16,
      marginBottom: 16,
      shadowColor: colors.blue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 4,
    },
    cardGradient: {
      borderRadius: 16,
      padding: 20,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    cardHeaderLeft: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 18,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      fontFamily: 'AlbertSans_400Regular',
      color: colors.text,
      opacity: 0.7,
    },
    cardActionButton: {
      backgroundColor: colors.dark,
      borderRadius: 16,
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardContent: {
      gap: 12,
    },
    todoItem: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
    },
    cardPreview: {
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      color: colors.text,
      lineHeight: 22,
    },
    progressSection: {
      paddingTop: 8,
    },
    progressInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    checkbox: {
      width: 16,
      height: 16,
      borderRadius: 4,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.teal,
      borderColor: colors.teal,
    },
    progressText: {
      fontSize: 14,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.text,
    },
    separator: {
      height: 16,
    },
    floatingActionButton: {
      position: 'absolute',
      bottom: 100, // Above tab bar
      right: 20,
      borderRadius: 28,
      shadowColor: colors.teal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    fabGradient: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};