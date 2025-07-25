import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Mock pages data - in real app this would come from a database
const mockPages = [
  { id: '1', title: 'Meeting Notes', lastModified: '2 hours ago', preview: 'Discussed project timeline and deliverables...' },
  { id: '2', title: 'Project Ideas', lastModified: '1 day ago', preview: 'New app concept for productivity...' },
  { id: '3', title: 'Shopping List', lastModified: '3 days ago', preview: 'Groceries for this week...' },
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  // Get theme colors and styles
  const theme = Colors[colorScheme ?? 'light'];
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
      style={styles.pageItem}
      onPress={() => handlePagePress(item.id)}
    >
      <View style={styles.pageContent}>
        <Text style={styles.pageTitle}>{item.title}</Text>
        <Text style={styles.pagePreview} numberOfLines={2}>{item.preview}</Text>
        <Text style={styles.pageDate}>{item.lastModified}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={theme.icon} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <TouchableOpacity 
          style={styles.newPageButton}
          onPress={handleNewPage}
        >
          <Ionicons name="add" size={24} color={theme.tint} />
        </TouchableOpacity>
      </View>

      {/* Pages List */}
      <FlatList
        data={mockPages}
        renderItem={renderPageItem}
        keyExtractor={(item) => item.id}
        style={styles.pagesList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
      borderBottomWidth: 1,
      borderBottomColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0',
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
    },
    newPageButton: {
      padding: 8,
    },
    pagesList: {
      flex: 1,
    },
    pageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.background,
    },
    pageContent: {
      flex: 1,
    },
    pageTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    pagePreview: {
      fontSize: 14,
      color: colors.icon,
      lineHeight: 20,
      marginBottom: 4,
    },
    pageDate: {
      fontSize: 12,
      color: colors.icon,
    },
    separator: {
      height: 1,
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#f0f0f0',
      marginLeft: 20,
    },
  });
};