# 🚀 GUÍA DEFINITIVA: NestJS + Mongoose 2025

## 📋 MEJORES PRÁCTICAS PARA MONGODB CON NESTJS

### **Investigación actualizada:** Enero 2025
**Fuente:** Documentación oficial NestJS + Mongoose + mejores prácticas de la comunidad

---

## 🎯 **CONFIGURACIÓN BÁSICA**

### **1. Instalación**

```bash
# Paquetes necesarios
yarn add @nestjs/mongoose mongoose
yarn add -D @types/mongoose

# Para validación (si no están instalados)
yarn add class-validator class-transformer
```

### **2. Configuración en AppModule**

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppConfigService } from './config/config.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 🔥 CONFIGURACIÓN MONGOOSE 2025
    MongooseModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => ({
        uri: configService.mongoUrl,

        // 🚀 OPCIONES RECOMENDADAS 2025
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10, // Máximo 10 conexiones concurrentes
        serverSelectionTimeoutMS: 5000, // Timeout de conexión
        socketTimeoutMS: 45000, // Timeout de socket

        // 🔧 Configuraciones avanzadas
        retryWrites: true,
        w: 'majority',
        readPreference: 'primary',

        // 🛡️ Configuraciones de seguridad
        authSource: 'admin',
        ssl: configService.isProduction,

        // 📊 Configuraciones de performance
        bufferCommands: false,
        bufferMaxEntries: 0,

        // 🔍 Debug en desarrollo
        ...(configService.isDevelopment && {
          debug: true,
          logger: console,
        }),
      }),
      inject: [AppConfigService],
    }),
  ],
})
export class AppModule {}
```

---

## 🏗️ **ESTRUCTURA DE ESQUEMAS TIPADOS**

### **3. Esquema Base Reutilizable**

```typescript
// src/common/schemas/base.schema.ts
import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({
  timestamps: true,  // Agrega createdAt y updatedAt automáticamente
  versionKey: false, // Elimina __v
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret._id;
      return ret;
    },
  },
})
export abstract class BaseSchema extends Document {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'ID único del documento'
  })
  id: string;

  @ApiProperty({
    example: '2025-01-15T09:00:00Z',
    description: 'Fecha de creación'
  })
  createdAt: Date;

  @ApiProperty({
    example: '2025-01-15T10:00:00Z',
    description: 'Fecha de última actualización'
  })
  updatedAt: Date;
}
```

### **4. Esquema de Usuario Completo**

```typescript
// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { BaseSchema } from '../../common/schemas/base.schema';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  AUTHOR = 'author',
  SUBSCRIBER = 'subscriber',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

@Schema({
  timestamps: true,
  collection: 'users',

  // 🔍 Índices para performance
  indexes: [
    { email: 1 }, // Índice único automático
    { username: 1 }, // Índice único automático
    { role: 1 },
    { status: 1 },
    { createdAt: -1 },
    { 'profile.firstName': 'text', 'profile.lastName': 'text' }, // Búsqueda de texto
  ],
})
export class User extends BaseSchema {
  @Prop({
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [255, 'El email no puede exceder 255 caracteres'],
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'El formato del email no es válido',
    },
  })
  @ApiProperty({
    example: 'juan.perez@noticiaspachuca.com',
    description: 'Email único del usuario',
    format: 'email',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @Prop({
    required: [true, 'El username es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El username debe tener al menos 3 caracteres'],
    maxlength: [50, 'El username no puede exceder 50 caracteres'],
    validate: {
      validator: function(username: string) {
        return /^[a-zA-Z0-9_.-]+$/.test(username);
      },
      message: 'El username solo puede contener letras, números, guiones y puntos',
    },
  })
  @ApiProperty({
    example: 'juan_perez',
    description: 'Nombre de usuario único',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  username: string;

  @Prop({
    required: [true, 'La contraseña es requerida'],
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false, // No incluir en consultas por defecto
  })
  @ApiProperty({
    example: 'password123',
    description: 'Contraseña del usuario',
    minLength: 8,
    writeOnly: true,
  })
  @IsString()
  password: string;

  @Prop({
    type: {
      firstName: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
      },
      lastName: {
        type: String,
        required: [true, 'El apellido es requerido'],
        trim: true,
        maxlength: [100, 'El apellido no puede exceder 100 caracteres'],
      },
      avatar: {
        type: String,
        default: null,
        validate: {
          validator: function(url: string) {
            return !url || /^https?:\/\/.+/.test(url);
          },
          message: 'La URL del avatar debe ser válida',
        },
      },
      bio: {
        type: String,
        maxlength: [500, 'La biografía no puede exceder 500 caracteres'],
        default: '',
      },
      phoneNumber: {
        type: String,
        validate: {
          validator: function(phone: string) {
            return !phone || /^\+?[1-9]\d{1,14}$/.test(phone);
          },
          message: 'El número de teléfono no es válido',
        },
      },
      dateOfBirth: {
        type: Date,
        validate: {
          validator: function(date: Date) {
            return !date || date < new Date();
          },
          message: 'La fecha de nacimiento debe ser anterior a hoy',
        },
      },
    },
    required: true,
  })
  @ApiProperty({
    description: 'Información del perfil del usuario',
    type: 'object',
    properties: {
      firstName: { type: 'string', example: 'Juan' },
      lastName: { type: 'string', example: 'Pérez' },
      avatar: { type: 'string', example: 'https://example.com/avatar.jpg' },
      bio: { type: 'string', example: 'Periodista especializado en deportes' },
      phoneNumber: { type: 'string', example: '+521234567890' },
      dateOfBirth: { type: 'string', format: 'date', example: '1990-05-15' },
    },
  })
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
  };

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.SUBSCRIBER,
  })
  @ApiProperty({
    example: UserRole.EDITOR,
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING_VERIFICATION,
  })
  @ApiProperty({
    example: UserStatus.ACTIVE,
    description: 'Estado actual del usuario',
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  status: UserStatus;

  @Prop({ default: false })
  @ApiProperty({
    example: true,
    description: 'Si el email del usuario ha sido verificado',
  })
  @IsBoolean()
  emailVerified: boolean;

  @Prop({ default: null })
  @ApiPropertyOptional({
    example: '2025-01-15T10:30:00Z',
    description: 'Fecha de último acceso',
  })
  lastLoginAt?: Date;

  @Prop({
    type: [String],
    default: [],
    validate: {
      validator: function(preferences: string[]) {
        const validPreferences = ['email_notifications', 'push_notifications', 'newsletter'];
        return preferences.every(pref => validPreferences.includes(pref));
      },
      message: 'Preferencia no válida',
    },
  })
  @ApiProperty({
    example: ['email_notifications', 'newsletter'],
    description: 'Preferencias de notificación del usuario',
    type: [String],
  })
  preferences: string[];

  @Prop({
    type: Object,
    default: {},
    validate: {
      validator: function(metadata: any) {
        return typeof metadata === 'object' && !Array.isArray(metadata);
      },
      message: 'Los metadatos deben ser un objeto',
    },
  })
  @ApiPropertyOptional({
    example: { source: 'web', referrer: 'google' },
    description: 'Metadatos adicionales del usuario',
  })
  metadata?: Record<string, any>;

  // 🎯 VIRTUAL FIELDS
  get fullName(): string {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  // 🔧 MÉTODOS DE INSTANCIA
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && this.emailVerified;
  }

  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  canManageContent(): boolean {
    return [UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR].includes(this.role);
  }
}

// 🏭 FACTORY DEL ESQUEMA
export const UserSchema = SchemaFactory.createForClass(User);

// 🎯 VIRTUAL FIELDS
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// 🔒 MIDDLEWARE PRE-SAVE
UserSchema.pre<UserDocument>('save', async function(next) {
  // Solo hashear la contraseña si ha sido modificada
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 📧 MIDDLEWARE PRE-SAVE PARA EMAIL
UserSchema.pre<UserDocument>('save', function(next) {
  if (this.isModified('email')) {
    this.emailVerified = false;
    this.status = UserStatus.PENDING_VERIFICATION;
  }
  next();
});

// 🔍 ÍNDICES ADICIONALES
UserSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
UserSchema.index({ role: 1, status: 1 });
UserSchema.index({ createdAt: -1 });

// 🎯 MÉTODOS ESTÁTICOS
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ status: UserStatus.ACTIVE, emailVerified: true });
};

UserSchema.statics.findByRole = function(role: UserRole) {
  return this.find({ role });
};
```

---

## 🏪 **PATRÓN REPOSITORY GENÉRICO**

### **5. Repository Base Reutilizable**

```typescript
// src/common/repositories/base.repository.ts
import { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { Injectable } from '@nestjs/common';

export interface IBaseRepository<T extends Document> {
  create(createDto: Partial<T>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: FilterQuery<T>): Promise<T | null>;
  findMany(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
  findManyWithPagination(filter: FilterQuery<T>, page: number, limit: number): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  updateById(id: string, updateDto: UpdateQuery<T>): Promise<T | null>;
  updateOne(filter: FilterQuery<T>, updateDto: UpdateQuery<T>): Promise<T | null>;
  updateMany(filter: FilterQuery<T>, updateDto: UpdateQuery<T>): Promise<number>;
  deleteById(id: string): Promise<boolean>;
  deleteOne(filter: FilterQuery<T>): Promise<boolean>;
  deleteMany(filter: FilterQuery<T>): Promise<number>;
  count(filter: FilterQuery<T>): Promise<number>;
  exists(filter: FilterQuery<T>): Promise<boolean>;
}

@Injectable()
export abstract class BaseRepository<T extends Document> implements IBaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(createDto: Partial<T>): Promise<T> {
    const createdDocument = new this.model(createDto);
    return createdDocument.save();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async findMany(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    return this.model.find(filter, null, options).exec();
  }

  async findManyWithPagination(
    filter: FilterQuery<T> = {},
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.find(filter).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async updateById(id: string, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async updateOne(filter: FilterQuery<T>, updateDto: UpdateQuery<T>): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, updateDto, { new: true }).exec();
  }

  async updateMany(filter: FilterQuery<T>, updateDto: UpdateQuery<T>): Promise<number> {
    const result = await this.model.updateMany(filter, updateDto).exec();
    return result.modifiedCount;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.model.findByIdAndDelete(id).exec();
    return !!result;
  }

  async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
    const result = await this.model.findOneAndDelete(filter).exec();
    return !!result;
  }

  async deleteMany(filter: FilterQuery<T>): Promise<number> {
    const result = await this.model.deleteMany(filter).exec();
    return result.deletedCount;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const document = await this.model.findOne(filter).select('_id').exec();
    return !!document;
  }
}
```

### **6. Repository Específico de Usuario**

```typescript
// src/users/repositories/user.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  // 🔍 MÉTODOS ESPECÍFICOS DE USUARIO
  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).select('+password').exec();
  }

  async findActiveUsers(): Promise<UserDocument[]> {
    return this.userModel.find({
      status: UserStatus.ACTIVE,
      emailVerified: true
    }).exec();
  }

  async findByRole(role: UserRole): Promise<UserDocument[]> {
    return this.userModel.find({ role }).exec();
  }

  async searchUsers(query: string, limit: number = 10): Promise<UserDocument[]> {
    return this.userModel
      .find({
        $or: [
          { 'profile.firstName': { $regex: query, $options: 'i' } },
          { 'profile.lastName': { $regex: query, $options: 'i' } },
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      })
      .limit(limit)
      .exec();
  }

  async updateLastLogin(userId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { lastLoginAt: new Date() },
      { new: true }
    ).exec();
  }

  async verifyEmail(userId: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        emailVerified: true,
        status: UserStatus.ACTIVE
      },
      { new: true }
    ).exec();
  }

  async changeUserStatus(userId: string, status: UserStatus): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).exec();
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, pending, roleStats] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ status: UserStatus.ACTIVE }).exec(),
      this.userModel.countDocuments({ status: UserStatus.PENDING_VERIFICATION }).exec(),
      this.userModel.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]).exec(),
    ]);

    const byRole = Object.values(UserRole).reduce((acc, role) => {
      acc[role] = roleStats.find(stat => stat._id === role)?.count || 0;
      return acc;
    }, {} as Record<UserRole, number>);

    return { total, active, pending, byRole };
  }
}
```

---

## 🎛️ **SERVICIOS CON LÓGICA DE NEGOCIO**

### **7. Servicio de Usuario Completo**

```typescript
// src/users/services/user.service.ts
import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { User, UserDocument, UserRole, UserStatus } from '../schemas/user.schema';
import { plainToClass } from 'class-transformer';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verificar email único
    const existingUserByEmail = await this.userRepository.findByEmail(createUserDto.email);
    if (existingUserByEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    // Verificar username único
    const existingUserByUsername = await this.userRepository.findByUsername(createUserDto.username);
    if (existingUserByUsername) {
      throw new ConflictException('El username ya está en uso');
    }

    const user = await this.userRepository.create(createUserDto);
    return plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true });
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{
    data: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await this.userRepository.findManyWithPagination({}, page, limit);

    return {
      ...result,
      data: result.data.map(user =>
        plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true })
      ),
    };
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true });
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmailWithPassword(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Si se actualiza el email, verificar que sea único
    if (updateUserDto.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Si se actualiza el username, verificar que sea único
    if (updateUserDto.username) {
      const existingUser = await this.userRepository.findByUsername(updateUserDto.username);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('El username ya está en uso');
      }
    }

    const user = await this.userRepository.updateById(id, updateUserDto);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true });
  }

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.userRepository.deleteById(id);
    if (!deleted) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return {
      success: true,
      message: 'Usuario eliminado exitosamente',
    };
  }

  async verifyEmail(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.verifyEmail(userId);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true });
  }

  async changeStatus(userId: string, status: UserStatus): Promise<UserResponseDto> {
    const user = await this.userRepository.changeUserStatus(userId, status);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    return plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true });
  }

  async searchUsers(query: string, limit: number = 10): Promise<UserResponseDto[]> {
    const users = await this.userRepository.searchUsers(query, limit);
    return users.map(user =>
      plainToClass(UserResponseDto, user.toObject(), { excludeExtraneousValues: true })
    );
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    byRole: Record<UserRole, number>;
  }> {
    return this.userRepository.getUserStats();
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.updateLastLogin(userId);
  }
}
```

---

## 📦 **CONFIGURACIÓN DE MÓDULOS**

### **8. Módulo de Usuario Completo**

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UsersController } from './controllers/users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [UsersController],
  providers: [UserRepository, UserService],
  exports: [UserService, UserRepository], // Exportar para otros módulos
})
export class UsersModule {}
```

---

## ⚡ **MEJORES PRÁCTICAS 2025**

### **✅ DO (Hacer)**

1. **Usar esquemas tipados** con decoradores @Schema() y @Prop()
2. **Implementar validación** a nivel de esquema y DTO
3. **Crear repositorios genéricos** reutilizables
4. **Usar middleware** para lógica común (hash password, etc.)
5. **Implementar índices** para consultas frecuentes
6. **Manejar conexiones** con configuración optimizada
7. **Usar transformaciones** para ocultar campos sensibles
8. **Implementar paginación** en consultas grandes
9. **Crear métodos estáticos** para consultas comunes
10. **Usar transacciones** para operaciones críticas

### **❌ DON'T (No hacer)**

1. **NO hardcodear** configuraciones de conexión
2. **NO exponer passwords** en responses
3. **NO crear esquemas** sin validación
4. **NO omitir índices** en campos de búsqueda
5. **NO mezclar lógica** de negocio en repositorios
6. **NO usar select: false** sin necesidad
7. **NO crear N+1 queries**
8. **NO olvidar manejar errores** de validación

---

## 🔒 **TRANSACCIONES Y OPERACIONES AVANZADAS**

### **9. Ejemplo de Transacciones**

```typescript
// src/common/services/transaction.service.ts
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';

@Injectable()
export class TransactionService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async executeTransaction<T>(
    operation: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await this.connection.startSession();

    try {
      session.startTransaction();
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
```

---

## 🎯 **RESULTADO FINAL**

**Con esta guía obtienes:**

✅ **Configuración optimizada** de Mongoose
✅ **Esquemas tipados** y validados
✅ **Repositorios genéricos** reutilizables
✅ **Servicios** con lógica de negocio clara
✅ **Middleware** para operaciones comunes
✅ **Índices** para performance óptima
✅ **Transacciones** para operaciones críticas
✅ **Validación** completa en múltiples niveles
✅ **Patrones** escalables y mantenibles

**Esta guía está basada en las mejores prácticas de 2025 y documentación oficial de NestJS + Mongoose.**