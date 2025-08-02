import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const features = [
  {
    id: '1',
    title: 'Rich Text Editing',
    description: 'Create beautiful documents with markdown support, formatting tools, and real-time preview.',
    icon: 'document-text',
    color: '#bd44ff',
    comingSoon: false,
  },
  {
    id: '2',
    title: 'Smart Organization',
    description: 'Organize your notes with tags, folders, and intelligent search across all your content.',
    icon: 'folder',
    color: '#0bcdb6',
    comingSoon: false,
  },
  {
    id: '3',
    title: 'Real-time Sync',
    description: 'Access your notes anywhere with cloud sync across all your devices seamlessly.',
    icon: 'cloud',
    color: '#67d4fc',
    comingSoon: true,
  },
  {
    id: '4',
    title: 'Collaboration',
    description: 'Share and collaborate on documents with team members in real-time.',
    icon: 'people',
    color: '#bd44ff',
    comingSoon: true,
  },
  {
    id: '5',
    title: 'Templates',
    description: 'Get started quickly with pre-built templates for meetings, projects, and more.',
    icon: 'duplicate',
    color: '#0bcdb6',
    comingSoon: true,
  },
  {
    id: '6',
    title: 'Export & Share',
    description: 'Export your notes to PDF, markdown, or share them with anyone easily.',
    icon: 'share',
    color: '#67d4fc',
    comingSoon: false,
  },
];

export default function ExploreScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const styles = getStyles(colorScheme ?? 'light');

  const renderFeatureCard = (feature: typeof features[0], index: number) => {
    const isLocked = feature.comingSoon;
    
    return (
      <TouchableOpacity 
        key={feature.id}
        style={[styles.featureCard, isLocked && styles.featureCardLocked]}
        activeOpacity={isLocked ? 1 : 0.8}
      >
        {isLocked ? (
          <View style={styles.lockedCard}>
            <View style={styles.featureIcon}>
              <Ionicons name="lock-closed" size={24} color={colors.textTertiary} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </View>
        ) : (
          <View style={styles.activeCard}>
            <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
              <Ionicons name={feature.icon as any} size={24} color={colors.background} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDescription}>{feature.description}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar 
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      
      {/* Hero Section */}
      <LinearGradient
        colors={colors.gradientOnboarding}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Discover Wordsy</Text>
          <Text style={styles.heroSubtitle}>
            Powerful features to enhance your note-taking experience
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Features Grid */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => renderFeatureCard(feature, index))}
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Wordsy</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>
              Wordsy is a modern note-taking app designed for writers, thinkers, and creators. 
              With powerful markdown support, beautiful typography, and intuitive organization, 
              it's the perfect tool for capturing and developing your ideas.
            </Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>∞</Text>
                <Text style={styles.statLabel}>Notes</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>📱</Text>
                <Text style={styles.statLabel}>Cross-platform</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>⚡</Text>
                <Text style={styles.statLabel}>Fast & Reliable</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
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
    heroSection: {
      padding: 24,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    heroContent: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    heroTitle: {
      fontSize: 28,
      fontFamily: 'AlbertSans_700Bold',
      color: colors.background,
      textAlign: 'center',
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      color: colors.background,
      textAlign: 'center',
      opacity: 0.9,
    },
    scrollView: {
      flex: 1,
    },
    featuresSection: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
      justifyContent: 'space-between',
    },
    featureCard: {
      width: '48%',
      borderRadius: 12,
      marginBottom: 16,
    },
    featureCardLocked: {
      opacity: 0.7,
    },
    activeCard: {
      backgroundColor: colors.cardContent,
      padding: 16,
      borderRadius: 12,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    lockedCard: {
      backgroundColor: colors.cardLocked,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
      backgroundColor: colors.borderLight,
    },
    featureTitle: {
      fontSize: 14,
      fontFamily: 'AlbertSans_600SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    featureDescription: {
      fontSize: 12,
      fontFamily: 'AlbertSans_400Regular',
      color: colors.textSecondary,
      lineHeight: 16,
    },
    comingSoonBadge: {
      backgroundColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 8,
      alignSelf: 'flex-start',
    },
    comingSoonText: {
      fontSize: 10,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.textSecondary,
    },
    aboutSection: {
      padding: 20,
      paddingBottom: 100, // Extra padding for tab bar
    },
    aboutCard: {
      backgroundColor: colors.cardContent,
      borderRadius: 16,
      padding: 20,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    aboutText: {
      fontSize: 16,
      fontFamily: 'AlbertSans_400Regular',
      color: colors.text,
      lineHeight: 24,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statNumber: {
      fontSize: 24,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'AlbertSans_500Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
};
