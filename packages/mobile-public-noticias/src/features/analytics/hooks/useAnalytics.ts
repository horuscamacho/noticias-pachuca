import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AnalyticsService } from '../services/AnalyticsService';
import { EventType, AnalyticsConfig } from '../types/analytics.types';

const defaultConfig: AnalyticsConfig = {
  apiBaseUrl: 'http://localhost:3000', // TODO: Move to environment config
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  enableDebugLogging: __DEV__,
  autoTrackScreenViews: true,
  autoTrackAppState: true,
};

export function useAnalytics(config?: Partial<AnalyticsConfig>) {
  const analyticsService = useRef<AnalyticsService | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;

    const initializeAnalytics = async () => {
      try {
        const mergedConfig = { ...defaultConfig, ...config };
        analyticsService.current = AnalyticsService.getInstance(mergedConfig);
        await analyticsService.current.initialize();
        isInitialized.current = true;
      } catch (error) {
        console.error('Failed to initialize analytics:', error);
      }
    };

    initializeAnalytics();

    // Cleanup function
    return () => {
      const cleanup = async () => {
        if (analyticsService.current && isInitialized.current) {
          await analyticsService.current.endSession();
          isInitialized.current = false;
        }
      };

      // Handle app termination
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          cleanup();
        }
      };

      AppState.addEventListener('change', handleAppStateChange);

      return () => {
        AppState.removeEventListener('change', handleAppStateChange);
        cleanup();
      };
    };
  }, [config]);

  const trackEvent = async (eventType: EventType, data: Record<string, unknown>) => {
    if (analyticsService.current && isInitialized.current) {
      await analyticsService.current.trackEvent(eventType, data);
    }
  };

  const trackScreenView = async (screenName: string, params?: Record<string, unknown>) => {
    if (analyticsService.current && isInitialized.current) {
      await analyticsService.current.trackScreenView(screenName, params);
    }
  };

  const trackUserAction = async (action: string, data?: Record<string, unknown>) => {
    if (analyticsService.current && isInitialized.current) {
      await analyticsService.current.trackUserAction(action, data);
    }
  };

  const trackError = async (error: Error, context?: Record<string, unknown>) => {
    if (analyticsService.current && isInitialized.current) {
      await analyticsService.current.trackError(error, context);
    }
  };

  return {
    trackEvent,
    trackScreenView,
    trackUserAction,
    trackError,
    isInitialized: isInitialized.current,
  };
}