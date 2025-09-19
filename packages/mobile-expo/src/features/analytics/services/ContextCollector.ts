import * as ScreenOrientation from 'expo-screen-orientation';
import { Appearance, AccessibilityInfo } from 'react-native';

export interface ContextInfo {
  orientation: 'portrait' | 'landscape';
  isDarkMode: boolean;
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
}

export class ContextCollector {
  static async collect(): Promise<ContextInfo> {
    try {
      const orientation = await ScreenOrientation.getOrientationAsync();
      const isScreenReaderEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();

      return {
        orientation: orientation === ScreenOrientation.Orientation.PORTRAIT_UP ||
                    orientation === ScreenOrientation.Orientation.PORTRAIT_DOWN
          ? 'portrait'
          : 'landscape',
        isDarkMode: Appearance.getColorScheme() === 'dark',
        isScreenReaderEnabled,
        isReduceMotionEnabled,
      };
    } catch (error) {
      console.warn('Error collecting context info:', error);
      return {
        orientation: 'portrait',
        isDarkMode: false,
        isScreenReaderEnabled: false,
        isReduceMotionEnabled: false,
      };
    }
  }
}