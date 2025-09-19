import * as Device from 'expo-device';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Dimensions } from 'react-native';
import { Platform } from 'react-native';

export interface DeviceInfo {
  brand: string;
  model: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  buildNumber: string;
  platform: 'ios' | 'android' | 'web';
  locale: string;
  timezone: string;
  screenWidth: number;
  screenHeight: number;
  screenScale: number;
  isTablet: boolean;
}

export class DeviceInfoCollector {
  static async collect(): Promise<DeviceInfo> {
    const { width, height, scale } = Dimensions.get('screen');

    return {
      brand: Device.brand || 'unknown',
      model: Device.modelName || 'unknown',
      osName: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web',
      osVersion: Device.osVersion || 'unknown',
      appVersion: Application.nativeApplicationVersion || '1.0.0',
      buildNumber: Application.nativeBuildVersion || '1',
      platform: Platform.OS as 'ios' | 'android' | 'web',
      locale: Constants.locale || 'es-MX',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Mexico_City',
      screenWidth: width,
      screenHeight: height,
      screenScale: scale,
      isTablet: Device.deviceType === Device.DeviceType.TABLET,
    };
  }
}