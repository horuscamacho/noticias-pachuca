import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceInfoCollector } from './DeviceInfoCollector';
import { NetworkInfoCollector } from './NetworkInfoCollector';
import { PerformanceCollector } from './PerformanceCollector';
import { ContextCollector } from './ContextCollector';
import { DeviceSessionData } from '../types/analytics.types';

export class SessionManager {
  private static readonly SESSION_KEY = '@analytics/session';
  private static readonly DEVICE_ID_KEY = '@analytics/device_id';
  private static readonly INSTALLATION_ID_KEY = '@analytics/installation_id';
  private static readonly LAUNCH_COUNT_KEY = '@analytics/launch_count';
  private static readonly FIRST_LAUNCH_KEY = '@analytics/first_launch';

  private static currentSession: DeviceSessionData | null = null;

  static async initializeSession(): Promise<DeviceSessionData> {
    try {
      const deviceId = await this.getOrCreateDeviceId();
      const installationId = await this.getOrCreateInstallationId();
      const launchCount = await this.incrementLaunchCount();
      const isFirstLaunch = await this.isFirstLaunch();

      const sessionId = this.generateSessionId();

      const [deviceInfo, networkInfo, performanceMetrics, contextInfo] = await Promise.all([
        DeviceInfoCollector.collect(),
        NetworkInfoCollector.collect(),
        PerformanceCollector.collect(),
        ContextCollector.collect(),
      ]);

      const sessionData: DeviceSessionData = {
        sessionId,
        deviceId,
        deviceInfo,
        networkInfo,
        performanceMetrics,
        contextInfo,
        appState: {
          isFirstLaunch,
          launchCount,
          installationId,
          lastActiveDate: new Date(),
          referralSource: undefined, // Could be implemented later
        },
      };

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
      this.currentSession = sessionData;

      return sessionData;
    } catch (error) {
      console.error('Error initializing session:', error);
      throw error;
    }
  }

  static async getCurrentSession(): Promise<DeviceSessionData | null> {
    if (this.currentSession) {
      return this.currentSession;
    }

    try {
      const sessionData = await AsyncStorage.getItem(this.SESSION_KEY);
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData);
        return this.currentSession;
      }
    } catch (error) {
      console.error('Error retrieving current session:', error);
    }

    return null;
  }

  static async updateSessionContext(): Promise<void> {
    if (!this.currentSession) return;

    try {
      const [networkInfo, performanceMetrics, contextInfo] = await Promise.all([
        NetworkInfoCollector.collect(),
        PerformanceCollector.collect(),
        ContextCollector.collect(),
      ]);

      this.currentSession.networkInfo = networkInfo;
      this.currentSession.performanceMetrics = performanceMetrics;
      this.currentSession.contextInfo = contextInfo;
      this.currentSession.appState.lastActiveDate = new Date();

      await AsyncStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentSession));
    } catch (error) {
      console.error('Error updating session context:', error);
    }
  }

  static async endSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.SESSION_KEY);
      this.currentSession = null;
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  private static async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(this.DEVICE_ID_KEY);
      if (!deviceId) {
        deviceId = this.generateDeviceId();
        await AsyncStorage.setItem(this.DEVICE_ID_KEY, deviceId);
      }
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return this.generateDeviceId();
    }
  }

  private static async getOrCreateInstallationId(): Promise<string> {
    try {
      let installationId = await AsyncStorage.getItem(this.INSTALLATION_ID_KEY);
      if (!installationId) {
        installationId = this.generateInstallationId();
        await AsyncStorage.setItem(this.INSTALLATION_ID_KEY, installationId);
      }
      return installationId;
    } catch (error) {
      console.error('Error getting installation ID:', error);
      return this.generateInstallationId();
    }
  }

  private static async incrementLaunchCount(): Promise<number> {
    try {
      const currentCount = await AsyncStorage.getItem(this.LAUNCH_COUNT_KEY);
      const newCount = currentCount ? parseInt(currentCount, 10) + 1 : 1;
      await AsyncStorage.setItem(this.LAUNCH_COUNT_KEY, newCount.toString());
      return newCount;
    } catch (error) {
      console.error('Error incrementing launch count:', error);
      return 1;
    }
  }

  private static async isFirstLaunch(): Promise<boolean> {
    try {
      const firstLaunch = await AsyncStorage.getItem(this.FIRST_LAUNCH_KEY);
      if (firstLaunch === null) {
        await AsyncStorage.setItem(this.FIRST_LAUNCH_KEY, 'false');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return false;
    }
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateInstallationId(): string {
    return `install_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}