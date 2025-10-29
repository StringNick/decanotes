/**
 * Animated Block Wrapper
 * Provides smooth animations for block focus states without layout shifts
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { ANIMATION_CONFIG, getAnimatedFocusStyles } from '../styles/blockStyles';

interface AnimatedBlockWrapperProps {
  children: React.ReactNode;
  isFocused: boolean;
  isEditing: boolean;
  colorScheme: 'light' | 'dark';
  style?: ViewStyle | ViewStyle[];
  customAnimatedStyles?: {
    borderColor?: Animated.AnimatedInterpolation<string | number>;
    backgroundColor?: Animated.AnimatedInterpolation<string | number>;
  };
}

/**
 * Wrapper component that animates focus states for blocks
 * Uses React Native's Animated API for smooth transitions
 */
export const AnimatedBlockWrapper: React.FC<AnimatedBlockWrapperProps> = ({
  children,
  isFocused,
  isEditing,
  colorScheme,
  style,
  customAnimatedStyles,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Determine if block should show focused state
  const shouldFocus = isFocused || isEditing;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: shouldFocus ? 1 : 0,
      duration: ANIMATION_CONFIG.duration,
      useNativeDriver: ANIMATION_CONFIG.useNativeDriver,
    }).start();
  }, [shouldFocus, animatedValue]);

  // Get animated styles (either custom or default)
  const animatedStyles = customAnimatedStyles || getAnimatedFocusStyles(colorScheme, animatedValue);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        style,
        {
          borderLeftColor: animatedStyles.borderColor,
          backgroundColor: animatedStyles.backgroundColor,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    // No default styles that would cause layout shifts
    // All sizing/spacing should come from parent
  },
});
