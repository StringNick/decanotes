import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, NativeModules, Platform } from 'react-native';

const hasKeyboardController = Boolean((NativeModules as any).KeyboardControllerModule);

type KeyboardEventsModule = {
  addListener?: (event: string, listener: (payload: { height: number }) => void) => { remove: () => void };
};

let KeyboardEventsModuleRef: KeyboardEventsModule | null = null;
if (hasKeyboardController) {
  try {
    KeyboardEventsModuleRef = require('react-native-keyboard-controller').KeyboardEvents;
  } catch (error) {
    KeyboardEventsModuleRef = null;
  }
}

/**
 * Returns the current visible keyboard height.
 * Normalises iOS keyboardWillShow/Hide and Android keyboardDidShow/Hide events.
 */
export const useKeyboardOffset = (): number => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const updateHeight = (event: KeyboardEvent) => {
      const height = event.endCoordinates?.height ?? 0;
      setKeyboardHeight(Math.max(0, height));
    };

    const resetHeight = () => {
      setKeyboardHeight(0);
    };

    const controllerSubscriptions: { remove: () => void }[] = [];

    if (KeyboardEventsModuleRef?.addListener) {
      const controllerShowEvents = [
        'keyboardWillShow',
        'keyboardDidShow',
        'keyboardWillChangeFrame',
        'keyboardDidChangeFrame',
      ];
      const controllerHideEvents = ['keyboardWillHide', 'keyboardDidHide'];

      controllerShowEvents.forEach(eventName => {
        const sub = KeyboardEventsModuleRef?.addListener?.(eventName, event => {
          setKeyboardHeight(Math.max(0, event.height ?? 0));
        });
        if (sub) {
          controllerSubscriptions.push(sub);
        }
      });

      controllerHideEvents.forEach(eventName => {
        const sub = KeyboardEventsModuleRef?.addListener?.(eventName, event => {
          const height = Math.max(0, event.height ?? 0);
          setKeyboardHeight(height);
          if (height === 0) {
            resetHeight();
          }
        });
        if (sub) {
          controllerSubscriptions.push(sub);
        }
      });
    }

    const showEvents = Platform.select({
      ios: ['keyboardWillShow', 'keyboardDidShow', 'keyboardWillChangeFrame', 'keyboardDidChangeFrame'],
      default: ['keyboardDidShow', 'keyboardDidChangeFrame'],
    }) as string[];

    const hideEvents = Platform.select({
      ios: ['keyboardWillHide', 'keyboardDidHide'],
      default: ['keyboardDidHide'],
    }) as string[];

    const subscriptions = [
      ...showEvents.map(event => Keyboard.addListener(event as any, updateHeight)),
      ...hideEvents.map(event => Keyboard.addListener(event as any, resetHeight)),
    ];

    return () => {
      controllerSubscriptions.forEach(sub => {
        try {
          sub.remove();
        } catch {
          // no-op
        }
      });
      subscriptions.forEach(sub => sub.remove());
    };
  }, []);

  return keyboardHeight;
};

export default useKeyboardOffset;
