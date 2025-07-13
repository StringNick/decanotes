import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ModeSwitcherProps {
  mode: 'live' | 'raw';
  onToggle: () => void;
}

const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, onToggle }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(mode === 'live' ? 0 : 28)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: mode === 'live' ? 0 : 28,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  }, [mode, translateX]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.wrapper}>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.track}>
          <Animated.View
            style={[styles.thumb, { transform: [{ translateX }] }]}
          />
          <View style={styles.labels}>
            <Text style={[styles.label, mode === 'live' && styles.labelActive]}>Live</Text>
            <Text style={[styles.label, mode === 'raw' && styles.labelActive]}>Raw</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 1000,
  },
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  track: {
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    position: 'absolute',
    left: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
  },
  labelActive: {
    color: '#ffffff',
  },
});

export default ModeSwitcher; 