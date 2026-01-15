import { useState, useEffect } from 'react';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { logger } from '../lib/logger';

/**
 * Hook to track keyboard visibility state
 * Hides navigation and adjusts UI when keyboard is visible
 * 
 * Platform support:
 * - iOS: Uses Capacitor Keyboard plugin events (keyboardWillShow/keyboardWillHide)
 * - Android: Uses Capacitor Keyboard plugin events (same event names)
 * - Web: Uses window focus/blur events on input elements (fallback)
 */
export function useKeyboard() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    let showListener: Awaited<ReturnType<typeof Keyboard.addListener>> | null = null;
    let hideListener: Awaited<ReturnType<typeof Keyboard.addListener>> | null = null;
    let blurTimeout: NodeJS.Timeout | null = null;

    // Native platforms (iOS & Android): Use Capacitor Keyboard plugin
    if (isNative) {
      const setupListeners = async () => {
        try {
          // Listen for keyboard show events (works on both iOS and Android)
          showListener = await Keyboard.addListener('keyboardWillShow', (info) => {
            logger.debug('Keyboard showing:', info);
            setKeyboardHeight(info.keyboardHeight);
            setIsKeyboardVisible(true);
          });

          // Listen for keyboard hide events (works on both iOS and Android)
          hideListener = await Keyboard.addListener('keyboardWillHide', () => {
            logger.debug('Keyboard hiding');
            setKeyboardHeight(0);
            setIsKeyboardVisible(false);
          });
        } catch (error) {
          logger.error('Error setting up keyboard listeners:', error);
        }
      };

      setupListeners();

      // Cleanup native listeners on unmount
      return () => {
        if (showListener) {
          showListener.remove().catch((error) => {
            logger.warn('Error removing keyboard show listener:', error);
          });
        }
        if (hideListener) {
          hideListener.remove().catch((error) => {
            logger.warn('Error removing keyboard hide listener:', error);
          });
        }
      };
    } else {
      // Web: Use focus/blur events on input elements as fallback
      // On web, keyboards don't typically cover fixed navigation, but we can still detect input focus
      const handleInputFocus = () => {
        setIsKeyboardVisible(true);
      };

      const handleInputBlur = () => {
        // Small delay to handle cases where user clicks another input
        blurTimeout = setTimeout(() => {
          const activeElement = document.activeElement;
          const isInputFocused = activeElement?.tagName === 'INPUT' || 
                                 activeElement?.tagName === 'TEXTAREA' ||
                                 activeElement?.getAttribute('contenteditable') === 'true';
          
          if (!isInputFocused) {
            setIsKeyboardVisible(false);
            setKeyboardHeight(0);
          }
        }, 100);
      };

      // Listen for focus/blur on all input elements
      document.addEventListener('focusin', handleInputFocus);
      document.addEventListener('focusout', handleInputBlur);

      // Cleanup web listeners on unmount
      return () => {
        if (blurTimeout) {
          clearTimeout(blurTimeout);
        }
        document.removeEventListener('focusin', handleInputFocus);
        document.removeEventListener('focusout', handleInputBlur);
      };
    }
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
  };
}
