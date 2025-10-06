/**
 * Animation Utilities
 * Reusable animation helpers for consistent micro-interactions throughout the app
 */

import { Animated, Easing } from 'react-native';
import DesignSystem from '@/constants/DesignSystem';

/**
 * Spring animation presets
 */
export const SpringPresets = {
  gentle: DesignSystem.Animations.spring.gentle,
  bouncy: DesignSystem.Animations.spring.bouncy,
  stiff: DesignSystem.Animations.spring.stiff,
};

/**
 * Timing animation presets
 */
export const TimingPresets = {
  instant: DesignSystem.Animations.timing.instant,
  fast: DesignSystem.Animations.timing.fast,
  normal: DesignSystem.Animations.timing.normal,
  slow: DesignSystem.Animations.timing.slow,
  slower: DesignSystem.Animations.timing.slower,
};

/**
 * Scale animation for press interactions
 */
export const createPressAnimation = (
  scaleValue: Animated.Value,
  options?: {
    pressScale?: number;
    springConfig?: typeof SpringPresets.gentle;
  }
) => {
  const pressScale = options?.pressScale ?? DesignSystem.Animations.scale.press;
  const springConfig = options?.springConfig ?? SpringPresets.gentle;

  return {
    onPressIn: () => {
      Animated.spring(scaleValue, {
        toValue: pressScale,
        ...springConfig,
      }).start();
    },
    onPressOut: () => {
      Animated.spring(scaleValue, {
        toValue: 1,
        ...SpringPresets.bouncy,
      }).start();
    },
  };
};

/**
 * Fade in animation
 */
export const fadeIn = (
  opacityValue: Animated.Value,
  duration: number = TimingPresets.normal,
  delay: number = 0
) => {
  return Animated.timing(opacityValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Fade out animation
 */
export const fadeOut = (
  opacityValue: Animated.Value,
  duration: number = TimingPresets.normal,
  delay: number = 0
) => {
  return Animated.timing(opacityValue, {
    toValue: 0,
    duration,
    delay,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Slide in from bottom animation
 */
export const slideInFromBottom = (
  translateYValue: Animated.Value,
  distance: number = 50,
  duration: number = TimingPresets.normal
) => {
  return Animated.spring(translateYValue, {
    toValue: 0,
    ...SpringPresets.bouncy,
  });
};

/**
 * Slide out to bottom animation
 */
export const slideOutToBottom = (
  translateYValue: Animated.Value,
  distance: number = 50,
  duration: number = TimingPresets.fast
) => {
  return Animated.timing(translateYValue, {
    toValue: distance,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

/**
 * Scale in animation (pop in effect)
 */
export const scaleIn = (
  scaleValue: Animated.Value,
  duration: number = TimingPresets.normal
) => {
  return Animated.spring(scaleValue, {
    toValue: 1,
    ...SpringPresets.bouncy,
  });
};

/**
 * Scale out animation (pop out effect)
 */
export const scaleOut = (
  scaleValue: Animated.Value,
  duration: number = TimingPresets.fast
) => {
  return Animated.spring(scaleValue, {
    toValue: 0,
    ...SpringPresets.stiff,
  });
};

/**
 * Staggered animation for lists
 */
export const createStaggeredAnimation = (
  animations: Animated.CompositeAnimation[],
  staggerDelay: number = 50
) => {
  return Animated.stagger(staggerDelay, animations);
};

/**
 * Parallax scroll animation
 */
export const createParallaxAnimation = (
  scrollY: Animated.Value,
  inputRange: number[],
  outputRange: number[]
) => {
  return scrollY.interpolate({
    inputRange,
    outputRange,
    extrapolate: 'clamp',
  });
};

/**
 * Shake animation for error states
 */
export const shakeAnimation = (translateXValue: Animated.Value) => {
  return Animated.sequence([
    Animated.timing(translateXValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(translateXValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(translateXValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(translateXValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(translateXValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Pulse animation (for attention-grabbing elements)
 */
export const pulseAnimation = (
  scaleValue: Animated.Value,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.05,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Rotate animation
 */
export const rotateAnimation = (
  rotateValue: Animated.Value,
  duration: number = TimingPresets.normal,
  rotations: number = 1
) => {
  return Animated.timing(rotateValue, {
    toValue: rotations,
    duration,
    easing: Easing.linear,
    useNativeDriver: true,
  });
};

/**
 * Continuous rotate animation (for loading spinners)
 */
export const continuousRotateAnimation = (
  rotateValue: Animated.Value,
  duration: number = 1000
) => {
  return Animated.loop(
    Animated.timing(rotateValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Bounce animation
 */
export const bounceAnimation = (
  translateYValue: Animated.Value,
  bounceHeight: number = -20
) => {
  return Animated.sequence([
    Animated.timing(translateYValue, {
      toValue: bounceHeight,
      duration: TimingPresets.fast,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(translateYValue, {
      toValue: 0,
      duration: TimingPresets.fast,
      easing: Easing.bounce,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Entrance animation combining multiple effects
 */
export const entranceAnimation = (
  opacityValue: Animated.Value,
  translateYValue: Animated.Value,
  scaleValue: Animated.Value,
  delay: number = 0
) => {
  return Animated.parallel([
    fadeIn(opacityValue, TimingPresets.normal, delay),
    slideInFromBottom(translateYValue, 30, TimingPresets.normal),
    scaleIn(scaleValue, TimingPresets.normal),
  ]);
};

/**
 * Exit animation combining multiple effects
 */
export const exitAnimation = (
  opacityValue: Animated.Value,
  translateYValue: Animated.Value,
  scaleValue: Animated.Value
) => {
  return Animated.parallel([
    fadeOut(opacityValue, TimingPresets.fast),
    slideOutToBottom(translateYValue, 30, TimingPresets.fast),
    scaleOut(scaleValue, TimingPresets.fast),
  ]);
};

/**
 * Create animated value with initial value
 */
export const createAnimatedValue = (initialValue: number = 0) => {
  return new Animated.Value(initialValue);
};

/**
 * Create XY animated value for gestures
 */
export const createAnimatedXY = (initialX: number = 0, initialY: number = 0) => {
  return new Animated.ValueXY({ x: initialX, y: initialY });
};

/**
 * Interpolate for rotation
 */
export const interpolateRotation = (
  rotateValue: Animated.Value,
  inputRange: number[] = [0, 1],
  outputRange: string[] = ['0deg', '360deg']
) => {
  return rotateValue.interpolate({
    inputRange,
    outputRange,
  });
};

/**
 * Hook-like function for common animations
 */
export const useButtonAnimation = () => {
  const scaleValue = createAnimatedValue(1);
  const { onPressIn, onPressOut } = createPressAnimation(scaleValue);

  return {
    animatedStyle: {
      transform: [{ scale: scaleValue }],
    },
    onPressIn,
    onPressOut,
  };
};

export default {
  SpringPresets,
  TimingPresets,
  createPressAnimation,
  fadeIn,
  fadeOut,
  slideInFromBottom,
  slideOutToBottom,
  scaleIn,
  scaleOut,
  createStaggeredAnimation,
  createParallaxAnimation,
  shakeAnimation,
  pulseAnimation,
  rotateAnimation,
  continuousRotateAnimation,
  bounceAnimation,
  entranceAnimation,
  exitAnimation,
  createAnimatedValue,
  createAnimatedXY,
  interpolateRotation,
  useButtonAnimation,
};
