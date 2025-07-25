// Mock the entire Expo module to prevent winter runtime issues
jest.mock('expo', () => ({}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn()
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color, ...props }) => `Ionicons-${name}`,
  MaterialIcons: ({ name, size, color, ...props }) => `MaterialIcons-${name}`,
  FontAwesome: ({ name, size, color, ...props }) => `FontAwesome-${name}`,
}));



// Mock Expo modules core
jest.mock('expo-modules-core', () => ({
  EventEmitter: jest.fn(),
  NativeModule: jest.fn(),
  SharedObject: jest.fn(),
  SharedRef: jest.fn(),
}));

// Mock global Expo registry
global.__ExpoImportMetaRegistry = {};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native's TurboModuleRegistry
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: jest.fn(() => null),
  getEnforcing: jest.fn(() => ({
    show: jest.fn(),
    reload: jest.fn(),
  })),
}));

// Mock React Native - comprehensive approach
global.__DEV__ = true;
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock React Native completely without spreading actual RN
jest.mock('react-native', () => {
  const React = require('react');
  const mockComponent = (name) => {
    const Component = (props) => React.createElement(name, props, props.children);
    Component.displayName = name;
    return Component;
  };
  
  const mockPixelRatio = {
    get: () => 2,
    getFontScale: () => 1,
    getPixelSizeForLayoutSize: (size) => size * 2,
    roundToNearestPixel: (size) => size
  };
  
  const mockDimensions = {
    get: () => ({ width: 375, height: 667, scale: 2, fontScale: 1 }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
  
  const mockStyleSheet = {
    create: (styles) => styles,
    flatten: (style) => style,
    absoluteFill: {},
    absoluteFillObject: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    hairlineWidth: 1
  };
  
  return {
    // Core components
    View: mockComponent('View'),
    Text: mockComponent('Text'),
    ScrollView: mockComponent('ScrollView'),
    TouchableOpacity: mockComponent('TouchableOpacity'),
    TouchableHighlight: mockComponent('TouchableHighlight'),
    TouchableWithoutFeedback: mockComponent('TouchableWithoutFeedback'),
    TextInput: mockComponent('TextInput'),
    Image: mockComponent('Image'),
    FlatList: mockComponent('FlatList'),
    SectionList: mockComponent('SectionList'),
    ActivityIndicator: mockComponent('ActivityIndicator'),
    
    // APIs
    PixelRatio: mockPixelRatio,
    Dimensions: mockDimensions,
    StyleSheet: mockStyleSheet,
    Platform: {
      OS: 'ios',
      Version: '14.0',
      select: (obj) => obj.ios || obj.default,
      isPad: false,
      isTVOS: false
    },
    
    // Animated
    Animated: {
      View: mockComponent('Animated.View'),
      Text: mockComponent('Animated.Text'),
      ScrollView: mockComponent('Animated.ScrollView'),
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        interpolate: jest.fn(() => 'interpolated-value'),
        addListener: jest.fn(() => 'listener-id'),
        removeListener: jest.fn()
      })),
      timing: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn(), stop: jest.fn() })),
      event: jest.fn(() => jest.fn())
    }
  };
});

// Suppress React Native warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});