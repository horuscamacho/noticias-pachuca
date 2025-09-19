import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Query } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  SUPER_ADMIN = 'super_admin', // Control total del sistema
  ADMIN = 'admin', // Administrador del proyecto
  MODERATOR = 'moderator', // Moderador/Editor de contenido
  PREMIUM_USER = 'premium_user', // Usuario con suscripción premium
  USER = 'user', // Usuario básico registrado
  GUEST = 'guest', // Usuario no registrado (para futuro)
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    transform: (doc: Document, ret: Record<string, unknown>) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, select: false }) // No incluir en queries por defecto
  password: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  phone?: string;

  @Prop({ default: null })
  dateOfBirth?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: null })
  emailVerifiedAt?: Date;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  // Información de suscripción
  @Prop({
    type: String,
    enum: SubscriptionStatus,
    default: SubscriptionStatus.INACTIVE,
  })
  subscriptionStatus: SubscriptionStatus;

  @Prop({ default: null })
  subscriptionStartDate?: Date;

  @Prop({ default: null })
  subscriptionEndDate?: Date;

  @Prop({ default: null })
  stripeCustomerId?: string;

  @Prop({ default: null })
  stripeSubscriptionId?: string;

  // Preferencias de notificaciones
  @Prop({
    type: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      marketing: { type: Boolean, default: true },
      updates: { type: Boolean, default: true },
      security: { type: Boolean, default: true },
    },
    default: {},
  })
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
    updates: boolean;
    security: boolean;
  };

  // Etiquetas de interés para contenido personalizado
  @Prop({ type: [String], default: [] })
  interests: string[];

  // Tracking y analytics
  @Prop({ default: null })
  lastLoginAt?: Date;

  @Prop({ default: null })
  lastActiveAt?: Date;

  @Prop({ default: 0 })
  loginCount: number;

  @Prop({ default: null })
  lastLoginIP?: string;

  @Prop({ default: null })
  lastLoginUserAgent?: string;

  // Configuraciones de privacidad
  @Prop({
    type: {
      profilePublic: { type: Boolean, default: false },
      showEmail: { type: Boolean, default: false },
      allowComments: { type: Boolean, default: true },
      allowFollowers: { type: Boolean, default: true },
    },
    default: {},
  })
  privacySettings: {
    profilePublic: boolean;
    showEmail: boolean;
    allowComments: boolean;
    allowFollowers: boolean;
  };

  // Soft delete
  @Prop({ default: null })
  deletedAt?: Date;

  // Timestamps automáticos de Mongoose
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Índices para performance (email y username ya son únicos por @Prop)
UserSchema.index({ subscriptionStatus: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastActiveAt: -1 });

// Middleware para soft delete
UserSchema.pre(/^find/, function (this: Query<UserDocument[], UserDocument>) {
  this.where({ deletedAt: null });
});

// Virtual para nombre completo
UserSchema.virtual('fullName').get(function (this: UserDocument) {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para verificar si es suscriptor activo
UserSchema.virtual('isActiveSubscriber').get(function (this: UserDocument) {
  return (
    this.subscriptionStatus === SubscriptionStatus.ACTIVE &&
    this.subscriptionEndDate &&
    this.subscriptionEndDate > new Date()
  );
});

// Virtual para verificar si puede ver contenido premium
UserSchema.virtual('canViewPremiumContent').get(function (this: UserDocument) {
  return (
    this.role === UserRole.SUPER_ADMIN ||
    this.role === UserRole.ADMIN ||
    this.role === UserRole.PREMIUM_USER ||
    (this as UserDocument & { isActiveSubscriber: boolean }).isActiveSubscriber
  );
});
