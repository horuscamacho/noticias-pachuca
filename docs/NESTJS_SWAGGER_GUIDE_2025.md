# 🚀 GUÍA DEFINITIVA: NestJS Swagger/OpenAPI 2025

## 📋 MEJORES PRÁCTICAS PARA DOCUMENTACIÓN DE API

### **Investigación actualizada:** Enero 2025
**Fuente:** Documentación oficial NestJS + mejores prácticas de la comunidad

---

## 🎯 **CONFIGURACIÓN BÁSICA**

### **1. Instalación**

```bash
# Paquetes necesarios
yarn add @nestjs/swagger swagger-ui-express
yarn add class-validator class-transformer  # Para DTOs
yarn add -D @types/swagger-ui-express
```

### **2. Configuración en main.ts**

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Obtener configuración
  const configService = app.get(AppConfigService);

  // Global prefix
  app.setGlobalPrefix(configService.apiPrefix);

  // Validation pipe global
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // 🔥 CONFIGURACIÓN SWAGGER 2025
  const config = new DocumentBuilder()
    .setTitle('Noticias Pachuca API')
    .setDescription(`
      API completa para la plataforma de noticias de Pachuca.

      ## Características
      - 🔐 Autenticación JWT
      - 📰 Gestión de noticias y artículos
      - 👥 Sistema de usuarios y roles
      - 🏷️ Categorías y etiquetas
      - 💬 Sistema de comentarios
      - 📱 Compatible con aplicación móvil

      ## Autenticación
      Para acceder a endpoints protegidos, incluye el token JWT en el header:
      \`Authorization: Bearer <tu-token-jwt>\`
    `)
    .setVersion('1.0.0')
    .setContact(
      'Equipo Noticias Pachuca',
      'https://noticiaspachuca.com',
      'dev@noticiaspachuca.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3001', 'Desarrollo')
    .addServer('https://api.noticiaspachuca.com', 'Producción')

    // 🔐 JWT Authentication
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth' // Nombre del esquema de seguridad
    )

    // 🏷️ Tags para organización
    .addTag('Auth', 'Autenticación y registro de usuarios')
    .addTag('Articles', 'Gestión de artículos y noticias')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Categories', 'Gestión de categorías')
    .addTag('Comments', 'Sistema de comentarios')
    .addTag('Media', 'Gestión de imágenes y archivos')
    .addTag('Admin', 'Funciones administrativas')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // 🚀 MEJORES PRÁCTICAS 2025
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // 🎨 Configuración UI avanzada
  SwaggerModule.setup('docs', app, document, {
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,  // Persiste el token en el browser
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      docExpansion: 'none',  // Colapsar por defecto
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  await app.listen(configService.port);

  console.log(`🚀 API ejecutándose en: http://localhost:${configService.port}/${configService.apiPrefix}`);
  console.log(`📚 Documentación Swagger: http://localhost:${configService.port}/docs`);
  console.log(`📄 OpenAPI JSON: http://localhost:${configService.port}/docs-json`);
  console.log(`📄 OpenAPI YAML: http://localhost:${configService.port}/docs-yaml`);
}

bootstrap();
```

---

## 🏗️ **ESTRUCTURA DE DTOs TIPADOS**

### **3. DTOs con Decoradores Avanzados**

```typescript
// src/articles/dto/create-article.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsArray, IsOptional, IsUUID, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateArticleDto {
  @ApiProperty({
    description: 'Título del artículo',
    example: 'Nueva victoria de los Tuzos del Pachuca',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede exceder 200 caracteres' })
  title: string;

  @ApiProperty({
    description: 'Contenido completo del artículo en formato Markdown',
    example: '# Victoria histórica\n\nLos Tuzos del Pachuca...',
  })
  @IsString()
  @MinLength(50, { message: 'El contenido debe tener al menos 50 caracteres' })
  content: string;

  @ApiPropertyOptional({
    description: 'Resumen o excerpt del artículo',
    example: 'Los Tuzos del Pachuca lograron una victoria contundente...',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({
    description: 'Array de IDs de categorías',
    example: ['550e8400-e29b-41d4-a716-446655440000'],
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];

  @ApiPropertyOptional({
    description: 'Etiquetas del artículo',
    example: ['fútbol', 'pachuca', 'liga-mx'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((tag: string) => tag.toLowerCase().trim()))
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Si el artículo debe ser publicado inmediatamente',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  published?: boolean = false;
}
```

### **4. Response DTOs**

```typescript
// src/articles/dto/article-response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class AuthorDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'juan.perez@noticiaspachuca.com' })
  @Expose()
  email: string;
}

export class CategoryDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Deportes' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'deportes' })
  @Expose()
  slug: string;

  @ApiProperty({ example: '#1f7a1f' })
  @Expose()
  color: string;
}

export class ArticleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Nueva victoria de los Tuzos del Pachuca' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'nueva-victoria-de-los-tuzos-del-pachuca' })
  @Expose()
  slug: string;

  @ApiProperty({ example: 'Los Tuzos del Pachuca lograron una victoria contundente...' })
  @Expose()
  excerpt: string;

  @ApiProperty({ example: '# Victoria histórica...' })
  @Expose()
  content: string;

  @ApiProperty({ example: true })
  @Expose()
  published: boolean;

  @ApiPropertyOptional({ example: '2025-01-15T10:30:00Z' })
  @Expose()
  publishedAt?: Date;

  @ApiProperty({ type: AuthorDto })
  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @ApiProperty({ type: [CategoryDto] })
  @Expose()
  @Type(() => CategoryDto)
  categories: CategoryDto[];

  @ApiProperty({ example: ['fútbol', 'pachuca', 'liga-mx'] })
  @Expose()
  tags: string[];

  @ApiProperty({ example: '2025-01-15T09:00:00Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2025-01-15T10:00:00Z' })
  @Expose()
  updatedAt: Date;
}
```

---

## 🎮 **CONTROLADORES CON DOCUMENTACIÓN AVANZADA**

### **5. Controlador con Todos los Decoradores**

```typescript
// src/articles/articles.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleResponseDto } from './dto/article-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un nuevo artículo',
    description: 'Crea un nuevo artículo de noticia. Requiere permisos de editor o administrador.',
  })
  @ApiBody({
    type: CreateArticleDto,
    description: 'Datos del artículo a crear',
    examples: {
      example1: {
        summary: 'Artículo de deportes',
        description: 'Ejemplo de un artículo deportivo',
        value: {
          title: 'Nueva victoria de los Tuzos del Pachuca',
          content: '# Victoria histórica\n\nLos Tuzos del Pachuca lograron...',
          excerpt: 'Los Tuzos del Pachuca lograron una victoria contundente...',
          categoryIds: ['550e8400-e29b-41d4-a716-446655440000'],
          tags: ['fútbol', 'pachuca', 'liga-mx'],
          published: false,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Artículo creado exitosamente',
    type: ArticleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
    schema: {
      example: {
        statusCode: 400,
        message: ['El título debe tener al menos 5 caracteres'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiForbiddenResponse({
    description: 'Permisos insuficientes para crear artículos',
  })
  create(@Body() createArticleDto: CreateArticleDto): Promise<ArticleResponseDto> {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener lista de artículos',
    description: 'Obtiene una lista paginada de artículos con filtros opcionales.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Cantidad de elementos por página',
    example: 10,
    type: Number,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Búsqueda por título o contenido',
    example: 'pachuca',
    type: String,
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filtrar por categoría',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiQuery({
    name: 'published',
    required: false,
    description: 'Filtrar por estado de publicación',
    example: true,
    type: Boolean,
  })
  @ApiOkResponse({
    description: 'Lista de artículos obtenida exitosamente',
    schema: {
      example: {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Nueva victoria de los Tuzos del Pachuca',
            slug: 'nueva-victoria-de-los-tuzos-del-pachuca',
            excerpt: 'Los Tuzos del Pachuca lograron una victoria contundente...',
            published: true,
            author: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Juan Pérez',
              email: 'juan.perez@noticiaspachuca.com',
            },
            categories: [
              {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Deportes',
                slug: 'deportes',
                color: '#1f7a1f',
              },
            ],
            tags: ['fútbol', 'pachuca', 'liga-mx'],
            createdAt: '2025-01-15T09:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    },
  })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.articlesService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener artículo por ID',
    description: 'Obtiene un artículo específico por su ID único.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del artículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @ApiOkResponse({
    description: 'Artículo encontrado',
    type: ArticleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Artículo no encontrado',
    schema: {
      example: {
        statusCode: 404,
        message: 'Artículo con ID 550e8400-e29b-41d4-a716-446655440000 no encontrado',
        error: 'Not Found',
      },
    },
  })
  findOne(@Param('id') id: string): Promise<ArticleResponseDto> {
    return this.articlesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar artículo',
    description: 'Actualiza un artículo existente. Requiere permisos de editor o administrador.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del artículo a actualizar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Artículo actualizado exitosamente',
    type: ArticleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Artículo no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiForbiddenResponse({
    description: 'Permisos insuficientes para actualizar artículos',
  })
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleResponseDto> {
    return this.articlesService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar artículo',
    description: 'Elimina un artículo permanentemente. Solo administradores.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID único del artículo a eliminar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Artículo eliminado exitosamente',
    schema: {
      example: {
        success: true,
        message: 'Artículo eliminado exitosamente',
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Artículo no encontrado',
  })
  @ApiUnauthorizedResponse({
    description: 'Token JWT inválido o expirado',
  })
  @ApiForbiddenResponse({
    description: 'Solo administradores pueden eliminar artículos',
  })
  remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
```

---

## 🔐 **CONFIGURACIÓN DE AUTENTICACIÓN JWT**

### **6. Controlador de Autenticación**

```typescript
// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar sesión',
    description: 'Autentica un usuario y devuelve tokens JWT.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      example1: {
        summary: 'Login de editor',
        value: {
          email: 'editor@noticiaspachuca.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login exitoso',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos',
  })
  @ApiUnauthorizedResponse({
    description: 'Credenciales inválidas',
  })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description: 'Crea una nueva cuenta de usuario.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuario registrado exitosamente',
    type: AuthResponseDto,
  })
  register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }
}
```

### **7. DTOs de Autenticación**

```typescript
// src/auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'editor@noticiaspachuca.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'password123',
    minLength: 6,
    writeOnly: true,
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}

// src/auth/dto/auth-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class UserDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'juan.perez@noticiaspachuca.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'editor' })
  @Expose()
  role: string;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT de acceso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  accessToken: string;

  @ApiProperty({
    description: 'Token JWT de renovación',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @Expose()
  refreshToken: string;

  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: UserDto,
  })
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    description: 'Tiempo de expiración del token en segundos',
    example: 900,
  })
  @Expose()
  expiresIn: number;
}
```

---

## ⚡ **MEJORES PRÁCTICAS 2025**

### **✅ DO (Hacer)**

1. **Usar CLI Plugin** para automatización
```json
// nest-cli.json
{
  "compilerOptions": {
    "plugins": ["@nestjs/swagger"]
  }
}
```

2. **Organizar con Tags** por funcionalidad
3. **Ejemplos completos** en todos los DTOs
4. **Autenticación JWT** bien configurada
5. **Response DTOs** con class-transformer
6. **Validation pipes** globales
7. **Operation IDs** concisos
8. **Persistir autorización** en browser
9. **Múltiples ejemplos** en ApiBody
10. **Documentación interactiva** rica

### **❌ DON'T (No hacer)**

1. **NO documentar endpoints** sin decoradores
2. **NO exponer passwords** en responses
3. **NO usar nombres genéricos** en operationId
4. **NO omitir ejemplos** en DTOs
5. **NO documentar sin tags**
6. **NO olvidar validation**
7. **NO hardcodear URLs** de servidor

---

## 🎨 **PERSONALIZACIÓN AVANZADA**

### **8. Crear Decoradores Personalizados**

```typescript
// src/common/decorators/api-paginated-response.decorator.ts
import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiOkResponse({
      description: 'Lista paginada exitosa',
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'number', example: 100 },
                  page: { type: 'number', example: 1 },
                  limit: { type: 'number', example: 10 },
                  totalPages: { type: 'number', example: 10 },
                },
              },
            },
          },
        ],
      },
    }),
  );
};
```

### **9. Uso del Decorador Personalizado**

```typescript
// Uso en controlador
@Get()
@ApiPaginatedResponse(ArticleResponseDto)
findAll(@Query() paginationDto: PaginationDto) {
  return this.articlesService.findAll(paginationDto);
}
```

---

## 🚀 **ENDPOINTS GENERADOS**

Con esta configuración tendrás:

✅ **Swagger UI:** `http://localhost:3001/docs`
✅ **OpenAPI JSON:** `http://localhost:3001/docs-json`
✅ **OpenAPI YAML:** `http://localhost:3001/docs-yaml`

## 🎯 **RESULTADO FINAL**

**Con esta guía obtienes:**

✅ **Documentación interactiva** completa
✅ **Autenticación JWT** integrada
✅ **Ejemplos realistas** en toda la API
✅ **Organización por tags**
✅ **Validación automática**
✅ **Response schemas** tipados
✅ **Personalización avanzada**
✅ **Compatible con generación de SDKs**

**Esta guía está basada en las mejores prácticas de 2025 y documentación oficial de NestJS.**