export interface SubscriptionResult {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  planId: string;
  priceId: string;
  quantity: number;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, unknown>;
  latestInvoice?: InvoiceData;
  createdAt: Date;
}

export enum SubscriptionStatus {
  INCOMPLETE = 'incomplete',
  INCOMPLETE_EXPIRED = 'incomplete_expired',
  TRIALING = 'trialing',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  UNPAID = 'unpaid',
}

export interface InvoiceData {
  id: string;
  amountDue: number;
  amountPaid: number;
  currency: string;
  status: InvoiceStatus;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    status: string;
  };
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void',
}

export interface SubscriptionPlanData {
  id: string;
  name: string;
  description: string;
  currency: string;
  amount: number;
  interval: PricingInterval;
  intervalCount: number;
  trialPeriodDays?: number;
  features: string[];
  metadata?: Record<string, unknown>;
  active: boolean;
}

export enum PricingInterval {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export interface CustomerData {
  id: string;
  email: string;
  name?: string;
  description?: string;
  phone?: string;
  address?: CustomerAddress;
  defaultPaymentMethod?: string;
  metadata?: Record<string, unknown>;
  created: Date;
}

export interface CustomerAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}