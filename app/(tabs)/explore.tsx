import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { IconSymbol, IconSymbolName } from '@/components/ui/IconSymbol';
import DesignSystem from '@/constants/DesignSystem';
import { useTheme } from '@/contexts/ThemeContext';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface DiscoveryCardProps {
  title: string;
  description: string;
  icon: IconSymbolName;
  category: string;
  onPress: () => void;
  isDark: boolean;
}

function DiscoveryCard({ title, description, icon, category, onPress, isDark }: DiscoveryCardProps) {
  const colors = DesignSystem.getThemeColors(isDark);
  
  return (
    <TouchableOpacity
      style={[
        styles.discoveryCard,
        {
          backgroundColor: colors.background.primary,
          borderColor: isDark ? colors.neutral.gray800 : colors.neutral.gray200,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.cardIcon,
        { backgroundColor: DesignSystem.Colors.primary.teal + '20' }
      ]}>
        <IconSymbol
          name={icon}
          size={24}
          color={DesignSystem.Colors.primary.teal}
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardCategory, { color: colors.text.tertiary }]}>
          {category}
        </Text>
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {title}
        </Text>
        <Text style={[styles.cardDescription, { color: colors.text.secondary }]}>
          {description}
        </Text>
      </View>
      <IconSymbol
        name="chevron.right"
        size={16}
        color={colors.text.tertiary}
      />
    </TouchableOpacity>
  );
}

const discoveryData: { id: string; title: string; description: string; icon: IconSymbolName; category: string; }[] = [
  {
    id: '1',
    title: 'Note Templates',
    description: 'Pre-made templates for meetings, projects, and daily notes',
    icon: 'doc.text.fill',
    category: 'Templates',
  },
  {
    id: '2',
    title: 'Collaboration',
    description: 'Share notes securely through IPFS and collaborate in real-time',
    icon: 'person.2.fill',
    category: 'Sharing',
  },
  {
    id: '3',
    title: 'Backup & Sync',
    description: 'Keep your notes safe with decentralized backup solutions',
    icon: 'icloud.fill',
    category: 'Storage',
  },
  {
    id: '4',
    title: 'Markdown Support',
    description: 'Rich formatting with full markdown syntax support',
    icon: 'textformat',
    category: 'Formatting',
  },
  {
    id: '5',
    title: 'Privacy First',
    description: 'End-to-end encryption with your wallet as the key',
    icon: 'lock.shield.fill',
    category: 'Security',
  },
  {
    id: '6',
    title: 'Cross-Platform',
    description: 'Access your notes from any device, anywhere',
    icon: 'laptopcomputer.and.iphone',
    category: 'Accessibility',
  },
];

export default function ExploreScreen() {
  const { effectiveTheme } = useTheme();
  const isDark = effectiveTheme === 'dark';
  const colors = DesignSystem.getThemeColors(isDark);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Templates', 'Sharing', 'Storage', 'Security'];

  const filteredData = selectedCategory === 'All' 
    ? discoveryData 
    : discoveryData.filter(item => item.category === selectedCategory);

  const handleCardPress = (item: typeof discoveryData[0]) => {
    console.log('Pressed:', item.title);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Discover
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text.secondary }]}>
          Explore DecaNotes features
        </Text>
      </View>

      {/* Theme Switcher (Debug) */}
      <ThemeSwitcher />

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              {
                backgroundColor: selectedCategory === category 
                  ? DesignSystem.Colors.primary.teal 
                  : colors.background.secondary,
                borderColor: selectedCategory === category 
                  ? DesignSystem.Colors.primary.teal 
                  : colors.neutral.gray200,
              }
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              {
                color: selectedCategory === category 
                  ? colors.text.inverse 
                  : colors.text.secondary
              }
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Discovery Cards */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredData.map((item) => (
          <DiscoveryCard
            key={item.id}
            title={item.title}
            description={item.description}
            icon={item.icon}
            category={item.category}
            onPress={() => handleCardPress(item)}
            isDark={isDark}
          />
        ))}
        
        {/* Feature Highlight */}
        <View style={[
          styles.featureHighlight,
          {
            backgroundColor: isDark 
              ? DesignSystem.Colors.primary.purple + '20'
              : DesignSystem.Colors.primary.purple + '10',
            borderColor: DesignSystem.Colors.primary.purple + '30',
          }
        ]}>
          <IconSymbol
            name="star.fill"
            size={32}
            color={DesignSystem.Colors.primary.purple}
          />
          <Text style={[styles.highlightTitle, { color: colors.text.primary }]}>
            Coming Soon
          </Text>
          <Text style={[styles.highlightDescription, { color: colors.text.secondary }]}>
            AI-powered note organization and smart search features
          </Text>
        </View>
        
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.base,
  },
  headerTitle: {
    ...DesignSystem.createTextStyle('3xl', 'bold'),
    marginBottom: 4,
  },
  headerSubtitle: {
    ...DesignSystem.createTextStyle('md'),
  },
  categoriesContainer: {
    marginVertical: DesignSystem.Spacing.sm,
  },
  categoriesContent: {
    paddingHorizontal: DesignSystem.Spacing.base,
    gap: DesignSystem.Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.xl,
    borderWidth: 1,
  },
  categoryText: {
    ...DesignSystem.createTextStyle('sm', 'medium'),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: DesignSystem.Spacing.base,
    paddingTop: DesignSystem.Spacing.sm,
  },
  discoveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignSystem.Spacing.base,
    borderRadius: DesignSystem.BorderRadius.xl,
    marginBottom: DesignSystem.Spacing.md,
    borderWidth: 1,
    ...DesignSystem.Shadows.sm,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: DesignSystem.BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignSystem.Spacing.md,
  },
  cardContent: {
    flex: 1,
  },
  cardCategory: {
    ...DesignSystem.createTextStyle('xs', 'medium'),
    textTransform: 'uppercase',
    letterSpacing: DesignSystem.Typography.letterSpacing.wide,
    marginBottom: 2,
  },
  cardTitle: {
    ...DesignSystem.createTextStyle('lg', 'semibold'),
    marginBottom: 4,
  },
  cardDescription: {
    ...DesignSystem.createTextStyle('sm'),
    lineHeight: DesignSystem.Typography.sizes.sm * DesignSystem.Typography.lineHeights.relaxed,
  },
  featureHighlight: {
    alignItems: 'center',
    padding: DesignSystem.Spacing.xl,
    borderRadius: DesignSystem.BorderRadius.xl,
    marginTop: DesignSystem.Spacing.lg,
    borderWidth: 1,
  },
  highlightTitle: {
    ...DesignSystem.createTextStyle('xl', 'bold'),
    marginTop: DesignSystem.Spacing.sm,
    marginBottom: DesignSystem.Spacing.xs,
  },
  highlightDescription: {
    ...DesignSystem.createTextStyle('md'),
    textAlign: 'center',
    lineHeight: DesignSystem.Typography.sizes.md * DesignSystem.Typography.lineHeights.relaxed,
  },
  bottomSpacing: {
    height: DesignSystem.Spacing['6xl'],
  },
});