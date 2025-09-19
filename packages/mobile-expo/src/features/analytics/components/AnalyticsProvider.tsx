import React, { createContext, useContext, ReactNode } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { EventType, AnalyticsConfig } from '../types/analytics.types';

interface AnalyticsContextType {
  trackEvent: (eventType: EventType, data: Record<string, unknown>) => Promise<void>;
  trackScreenView: (screenName: string, params?: Record<string, unknown>) => Promise<void>;
  trackUserAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  trackError: (error: Error, context?: Record<string, unknown>) => Promise<void>;
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
  config?: Partial<AnalyticsConfig>;
}

export function AnalyticsProvider({ children, config }: AnalyticsProviderProps) {
  const analytics = useAnalytics(config);

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}