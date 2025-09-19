import {
  IsNumber,
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  Min,
  Max,
  Length,
  IsNotEmpty,
  IsEmail,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class CreatePaymentDto {
  @ApiProperty({
    description: 'ID del usuario que realiza el pago',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Monto en centavos (ej: 1000 = $10.00)',
    example: 2500,
    minimum: 50,
    maximum: 999999,
  })
  @IsNumber()
  @Min(50) // Mínimo $0.50
  @Max(999999) // Máximo $9,999.99
  amount: number;

  @ApiProperty({
    description: 'Código de moneda ISO',
    example: 'usd',
    enum: ['usd', 'mxn'],
  })
  @IsEnum(['usd', 'mxn'])
  @Transform(({ value }) => value.toLowerCase())
  currency: 'usd' | 'mxn';

  @ApiProperty({
    description: 'ID del método de pago de Stripe',
    example: 'pm_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Descripción del pago',
    example: 'Suscripción Premium - Plan Mensual',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Email para el recibo (opcional)',
    example: 'usuario@ejemplo.com',
  })
  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales',
    example: { planType: 'premium', source: 'mobile_app' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'ID del Payment Intent de Stripe',
    example: 'pi_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentIntentId: string;

  @ApiPropertyOptional({
    description: 'ID del método de pago (si cambió)',
    example: 'pm_1234567890',
  })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'URL de retorno después de 3D Secure',
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}

export class RefundPaymentDto {
  @ApiProperty({
    description: 'ID del pago a reembolsar',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @ApiPropertyOptional({
    description: 'Monto a reembolsar en centavos (omitir para reembolso completo)',
    example: 1000,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({
    description: 'Razón del reembolso',
    example: 'requested_by_customer',
    enum: ['duplicate', 'fraudulent', 'requested_by_customer'],
  })
  @IsOptional()
  @IsEnum(['duplicate', 'fraudulent', 'requested_by_customer'])
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';

  @ApiPropertyOptional({
    description: 'Metadatos adicionales para el reembolso',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

// 🎯 USANDO EL PATRÓN DE PAGINADO ESTABLECIDO
export class PaymentQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Estado del pago',
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
  })
  @IsOptional()
  @IsEnum(['pending', 'processing', 'succeeded', 'failed', 'canceled'])
  status?: string;

  @ApiPropertyOptional({
    description: 'Moneda',
    enum: ['usd', 'mxn'],
  })
  @IsOptional()
  @IsEnum(['usd', 'mxn'])
  currency?: string;

  @ApiPropertyOptional({
    description: 'Fecha de inicio (ISO string)',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Fecha de fin (ISO string)',
    example: '2023-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario (para filtrar pagos de un usuario específico)',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Monto mínimo en centavos',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minAmount?: number;

  @ApiPropertyOptional({
    description: 'Monto máximo en centavos',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxAmount?: number;
}

export class CreateCustomerDto {
  @ApiProperty({
    description: 'Email del cliente',
    example: 'cliente@ejemplo.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del cliente',
    example: '+52 55 1234 5678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Descripción del cliente',
    example: 'Cliente premium desde 2023',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Metadatos del cliente',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdatePaymentMethodDto {
  @ApiProperty({
    description: 'ID del método de pago',
    example: 'pm_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Establecer como método predeterminado',
    example: true,
  })
  @IsOptional()
  setAsDefault?: boolean;
}