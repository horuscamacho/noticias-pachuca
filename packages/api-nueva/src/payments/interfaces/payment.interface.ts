import { Types } from 'mongoose';

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  userId: string;
  stripePaymentIntentId: string;
  clientSecret?: string;
  confirmationMethod?: string;
  nextAction?: StripeNextAction;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface StripeNextAction {
  type: string;
  redirectToUrl?: {
    url: string;
    returnUrl: string;
  };
  useStripeSdk?: Record<string, unknown>;
}

// Helper type para nextAction del schema
export type NextActionData = Record<string, unknown> | StripeNextAction;

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

export interface IdempotencyResult<T> {
  isFromCache: boolean;
  data: T;
  cacheKey: string;
}

export interface RefundResult {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: RefundStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export enum RefundStatus {
  PENDING = 'pending',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

export interface WebhookEventData {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
  created: number;
  livemode: boolean;
  pendingWebhooks: number;
  request: {
    id: string;
    idempotencyKey?: string;
  };
}

export interface PaymentAttempt {
  userId: string;
  amount: number;
  currency: string;
  paymentMethodId: string;
  description?: string;
  metadata?: Record<string, unknown>;
  clientIp?: string;
  userAgent?: string;
  timestamp: Date;
  result: PaymentStatus;
  errorCode?: string;
  errorMessage?: string;
}

export interface RiskAnalysis {
  score: number; // 0-100, higher = more risky
  factors: {
    amount: number;
    frequency: number;
    location: number;
    device: number;
    behavioral: number;
  };
  recommendation: 'approve' | 'review' | 'decline';
  reason?: string;
}