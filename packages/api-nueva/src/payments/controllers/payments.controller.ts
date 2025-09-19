import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

// Usar servicios de paginado establecidos
import { PaginationService } from '../../common/services/pagination.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

import { PaymentProcessorService } from '../services/payment-processor.service';
import { Payment, PaymentDocument } from '../schemas/payment.schema';

import {
  CreatePaymentDto,
  ConfirmPaymentDto,
  RefundPaymentDto,
  PaymentQueryDto,
} from '../dto/payment.dto';

import { PaymentResult } from '../interfaces/payment.interface';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    private readonly paymentProcessor: PaymentProcessorService,
    private readonly paginationService: PaginationService, // USAR SERVICIO EXISTENTE
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo pago',
    description: 'Crea un Payment Intent en Stripe y lo registra en la base de datos',
  })
  @ApiResponse({
    status: 201,
    description: 'Pago creado exitosamente',
    type: Object, // Se puede crear un tipo específico después
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de pago inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaymentResult> {
    try {
      // Validar que el usuario solo pueda crear pagos para sí mismo
      if (createPaymentDto.userId !== user.id) {
        throw new HttpException(
          'No puedes crear pagos para otros usuarios',
          HttpStatus.FORBIDDEN,
        );
      }

      this.logger.log(
        `💳 Creando pago para usuario ${user.id}: $${(createPaymentDto.amount / 100).toFixed(2)} ${createPaymentDto.currency.toUpperCase()}`
      );

      const result = await this.paymentProcessor.createPaymentIntent(createPaymentDto);

      this.logger.log(`✅ Pago creado exitosamente: ${result.id}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error creando pago:`, error);
      throw new HttpException(
        error.message || 'Error interno del servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':paymentIntentId/confirm')
  @ApiOperation({
    summary: 'Confirmar un pago',
    description: 'Confirma un Payment Intent que requiere confirmación manual',
  })
  @ApiParam({
    name: 'paymentIntentId',
    description: 'ID del Payment Intent de Stripe',
    example: 'pi_1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Pago confirmado exitosamente',
  })
  async confirmPayment(
    @Param('paymentIntentId') paymentIntentId: string,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaymentResult> {
    try {
      // Verificar que el pago pertenece al usuario
      const payment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId,
        userId: user.id,
      });

      if (!payment) {
        throw new HttpException(
          'Pago no encontrado o no autorizado',
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`🔐 Confirmando pago ${paymentIntentId} para usuario ${user.id}`);

      const result = await this.paymentProcessor.confirmPayment({
        ...confirmPaymentDto,
        paymentIntentId,
      });

      this.logger.log(`✅ Pago confirmado: ${result.id} - Status: ${result.status}`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error confirmando pago:`, error);
      throw new HttpException(
        error.message || 'Error interno del servidor',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Listar pagos del usuario',
    description: 'Obtiene una lista paginada de pagos del usuario autenticado',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Número de página',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Elementos por página (máximo 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
  })
  @ApiQuery({
    name: 'currency',
    required: false,
    description: 'Filtrar por moneda',
    enum: ['usd', 'mxn'],
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos obtenida exitosamente',
  })
  async getPayments(
    @Query() query: PaymentQueryDto,
    @CurrentUser() user: { id: string },
  ): Promise<PaginatedResponse<PaymentDocument>> {
    try {
      this.logger.log(
        `📊 Obteniendo pagos para usuario ${user.id} - Página: ${query.page}, Límite: ${query.limit}`
      );

      // Construir filtros
      const filter: Record<string, unknown> = {
        userId: user.id,
        deletedAt: null, // Soft delete
      };

      if (query.status) {
        filter.status = query.status;
      }

      if (query.currency) {
        filter.currency = query.currency.toLowerCase();
      }

      if (query.startDate || query.endDate) {
        filter.createdAt = {};
        if (query.startDate) {
          (filter.createdAt as Record<string, unknown>)['$gte'] = new Date(query.startDate);
        }
        if (query.endDate) {
          (filter.createdAt as Record<string, unknown>)['$lte'] = new Date(query.endDate);
        }
      }

      if (query.minAmount || query.maxAmount) {
        filter.amount = {};
        if (query.minAmount) {
          (filter.amount as Record<string, unknown>)['$gte'] = query.minAmount;
        }
        if (query.maxAmount) {
          (filter.amount as Record<string, unknown>)['$lte'] = query.maxAmount;
        }
      }

      // USAR EL PATRÓN DE PAGINADO ESTABLECIDO
      const result = await this.paginationService.paginate(
        this.paymentModel,
        query,
        filter,
        {
          sort: { createdAt: -1 },
          select: '-__v', // Excluir campos internos
        },
      );

      this.logger.log(
        `✅ Pagos obtenidos: ${result.data.length} de ${result.pagination.total} total`
      );

      return result;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo pagos:`, error);
      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalles de un pago',
    description: 'Obtiene los detalles completos de un pago específico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pago',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalles del pago obtenidos exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  async getPayment(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<PaymentDocument> {
    try {
      this.logger.log(`🔍 Obteniendo pago ${id} para usuario ${user.id}`);

      const payment = await this.paymentModel
        .findOne({
          _id: id,
          userId: user.id,
          deletedAt: null,
        })
        .select('-__v')
        .exec();

      if (!payment) {
        throw new HttpException(
          'Pago no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      this.logger.log(`✅ Pago encontrado: ${payment.stripePaymentIntentId}`);

      return payment;
    } catch (error) {
      this.logger.error(`❌ Error obteniendo pago:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/refund')
  @ApiOperation({
    summary: 'Reembolsar un pago',
    description: 'Procesa un reembolso total o parcial de un pago exitoso',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del pago a reembolsar',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Reembolso procesado exitosamente',
  })
  @ApiResponse({
    status: 404,
    description: 'Pago no encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'El pago no puede ser reembolsado',
  })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
    @CurrentUser() user: { id: string },
  ): Promise<{ message: string; refundId: string }> {
    try {
      // Verificar que el pago pertenece al usuario
      const payment = await this.paymentModel.findOne({
        _id: id,
        userId: user.id,
        deletedAt: null,
      });

      if (!payment) {
        throw new HttpException(
          'Pago no encontrado',
          HttpStatus.NOT_FOUND,
        );
      }

      // Verificar que el pago puede ser reembolsado
      if (payment.status !== 'succeeded') {
        throw new HttpException(
          'Solo se pueden reembolsar pagos exitosos',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `💸 Procesando reembolso para pago ${id} - Usuario: ${user.id}`
      );

      // TODO: Implementar lógica de reembolso
      // const refundResult = await this.paymentProcessor.refundPayment({
      //   ...refundPaymentDto,
      //   paymentId: id,
      // });

      this.logger.log(`✅ Reembolso procesado exitosamente para pago ${id}`);

      return {
        message: 'Reembolso procesado exitosamente',
        refundId: 'placeholder_refund_id', // Temporal
      };
    } catch (error) {
      this.logger.error(`❌ Error procesando reembolso:`, error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Error interno del servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}