import { AppState, AppStateStatus } from 'react-native';
import { SessionManager } from './SessionManager';
import { DeviceInfoCollector } from './DeviceInfoCollector';
import { TelemetryEvent, EventType, BatchTelemetryRequest, AnalyticsConfig } from '../types/analytics.types';

export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private config: AnalyticsConfig;
  private eventQueue: TelemetryEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  static getInstance(config?: AnalyticsConfig): AnalyticsService {
    if (!AnalyticsService.instance) {
      if (!config) {
        throw new Error('AnalyticsService requires config on first initialization');
      }
      AnalyticsService.instance = new AnalyticsService(config);
    }
    return AnalyticsService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize session
      const session = await SessionManager.initializeSession();

      // Track session start
      await this.trackEvent(EventType.SESSION_START, {
        sessionData: session,
      });

      // Track app start
      await this.trackEvent(EventType.APP_START, {
        timestamp: new Date().toISOString(),
      });

      // Set up app state listeners
      if (this.config.autoTrackAppState) {
        AppState.addEventListener('change', this.handleAppStateChange.bind(this));
      }

      // Start flush timer
      this.startFlushTimer();

      this.isInitialized = true;

      if (this.config.enableDebugLogging) {
        console.log('AnalyticsService initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing AnalyticsService:', error);
      throw error;
    }
  }

  async trackEvent(eventType: EventType, data: Record<string, unknown>): Promise<void> {
    try {
      const session = await SessionManager.getCurrentSession();
      if (!session) {
        console.warn('No active session found, cannot track event');
        return;
      }

      const deviceInfo = await DeviceInfoCollector.collect();

      const event: TelemetryEvent = {
        sessionId: session.sessionId,
        deviceId: session.deviceId,
        userId: session.userId,
        eventType,
        data,
        metadata: {
          appVersion: deviceInfo.appVersion,
          buildNumber: deviceInfo.buildNumber,
          platform: deviceInfo.platform,
          osVersion: deviceInfo.osVersion,
          locale: deviceInfo.locale,
          timezone: deviceInfo.timezone,
        },
        timestamp: new Date(),
      };

      this.eventQueue.push(event);

      if (this.config.enableDebugLogging) {
        console.log('Event tracked:', eventType, data);
      }

      // Flush if batch size reached
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  async trackScreenView(screenName: string, params?: Record<string, unknown>): Promise<void> {
    await this.trackEvent(EventType.SCREEN_VIEW, {
      screenName,
      params: params || {},
      timestamp: new Date().toISOString(),
    });
  }

  async trackUserAction(action: string, data?: Record<string, unknown>): Promise<void> {
    await this.trackEvent(EventType.USER_ACTION, {
      action,
      data: data || {},
      timestamp: new Date().toISOString(),
    });
  }

  async trackError(error: Error, context?: Record<string, unknown>): Promise<void> {
    await this.trackEvent(EventType.ERROR, {
      message: error.message,
      stack: error.stack,
      context: context || {},
      timestamp: new Date().toISOString(),
    });
  }

  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      const batchRequest: BatchTelemetryRequest = { events };

      // TODO: Send to API
      if (this.config.enableDebugLogging) {
        console.log('Flushing events batch:', events.length);
      }

      // For now, just log the events
      // In next phase, we'll implement the API client
      console.log('Events to send:', JSON.stringify(batchRequest, null, 2));

    } catch (error) {
      console.error('Error flushing events:', error);
      // Re-add events to queue on failure
      this.eventQueue.unshift(...this.eventQueue);
    }
  }

  async endSession(): Promise<void> {
    try {
      await this.trackEvent(EventType.SESSION_END, {
        timestamp: new Date().toISOString(),
      });

      // Flush remaining events
      await this.flush();

      // Stop flush timer
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
        this.flushTimer = null;
      }

      // End session
      await SessionManager.endSession();

      this.isInitialized = false;

      if (this.config.enableDebugLogging) {
        console.log('AnalyticsService session ended');
      }
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    try {
      if (nextAppState === 'active') {
        await SessionManager.updateSessionContext();
        await this.trackEvent(EventType.USER_ACTION, {
          action: 'app_foreground',
          timestamp: new Date().toISOString(),
        });
      } else if (nextAppState === 'background') {
        await this.trackEvent(EventType.USER_ACTION, {
          action: 'app_background',
          timestamp: new Date().toISOString(),
        });
        await this.flush(); // Ensure events are sent before app goes to background
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  }
}