// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'doc.text.fill': 'description',
  'doc.text': 'description',
  'person.2.fill': 'people',
  'icloud.fill': 'cloud',
  'textformat': 'text-format',
  'lock.shield.fill': 'security',
  'laptopcomputer.and.iphone': 'devices',
  'star.fill': 'star',
  'moon.fill': 'brightness-2',
  'sun.max.fill': 'wb-sunny',
  'square.and.arrow.up': 'upload',
  'shield.fill': 'shield',
  'bell.fill': 'notifications',
  'info.circle.fill': 'info',
  'questionmark.circle.fill': 'help',
  'power': 'power-settings-new',
  'plus': 'add',
  'minus': 'remove',
  'xmark': 'close',
  'checkmark': 'check',
  'pencil': 'edit',
  'trash': 'delete',
  'gear': 'settings',
  'gearshape.fill': 'settings',
  'magnifyingglass': 'search',
  'ellipsis': 'more-horiz',
  'paintbrush.pointed.fill': 'palette',
  'key.fill': 'vpn-key',
  'globe': 'public',
  'sparkles': 'auto-awesome',
  'person.crop.circle.fill': 'account-circle',
  'person.crop.circle': 'account-circle',
} as const;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
