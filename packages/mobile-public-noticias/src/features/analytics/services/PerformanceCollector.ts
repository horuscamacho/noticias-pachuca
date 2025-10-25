import * as Battery from 'expo-battery';
import { AppState } from 'react-native';

export interface PerformanceMetrics {
  appStartTime: number;
  memoryUsage: number;
  batteryLevel: number;
  isLowPowerMode: boolean;
  availableStorage: number;
  totalStorage: number;
}

export class PerformanceCollector {
  private static appStartTime = Date.now();

  static async collect(): Promise<PerformanceMetrics> {
    try {
      const batteryLevel = await Battery.getBatteryLevelAsync();
      const isLowPowerMode = await Battery.isLowPowerModeEnabledAsync();

      return {
        appStartTime: Date.now() - this.appStartTime,
        memoryUsage: 0, // React Native doesn't provide memory info directly
        batteryLevel: Math.round(batteryLevel * 100),
        isLowPowerMode,
        availableStorage: 0, // Would need additional native modules
        totalStorage: 0, // Would need additional native modules
      };
    } catch (error) {
      console.warn('Error collecting performance metrics:', error);
      return {
        appStartTime: Date.now() - this.appStartTime,
        memoryUsage: 0,
        batteryLevel: 100,
        isLowPowerMode: false,
        availableStorage: 0,
        totalStorage: 0,
      };
    }
  }

  static getAppState(): 'active' | 'background' | 'inactive' {
    return AppState.currentState;
  }
}