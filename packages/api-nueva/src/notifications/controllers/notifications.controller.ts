import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Platform } from '../../auth/decorators/platform.decorator';
import { NotificationRouterService } from '../services/notification-router.service';
import { SessionManagerService } from '../services/session-manager.service';
import { SendNotificationDto } from '../dto/send-notification.dto';
import { UpdateAppStateDto, UpdatePushTokenDto } from '../dto/device-state.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationRouter: NotificationRouterService,
    private sessionManager: SessionManagerService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Enviar notificación a usuario específico' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    const result = await this.notificationRouter.sendNotification(dto);
    return {
      success: result.success,
      message: result.success
        ? 'Notificación enviada exitosamente'
        : 'Error enviando notificación',
      data: result,
    };
  }

  @Post('send-to-all/:userId')
  @ApiOperation({ summary: 'Enviar a todos los dispositivos del usuario' })
  async sendToAllDevices(
    @Param('userId') userId: string,
    @Body() notification: any,
  ) {
    const result = await this.notificationRouter.sendToAllDevices(
      userId,
      notification,
    );
    return {
      success: result.success,
      message: 'Notificación enviada a todos los dispositivos',
      data: result,
    };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Obtener sesiones activas del usuario actual' })
  async getUserSessions(@CurrentUser() user: any) {
    const sessions = await this.sessionManager.getUserSessions(user.id);
    return {
      success: true,
      data: {
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s) => s.isActive).length,
      },
    };
  }

  @Get('sessions/:userId')
  @ApiOperation({ summary: 'Obtener sesiones de usuario específico (admin)' })
  async getSpecificUserSessions(@Param('userId') userId: string) {
    const sessions = await this.sessionManager.getUserSessions(userId);
    return {
      success: true,
      data: {
        userId,
        sessions,
        totalSessions: sessions.length,
        activeSessions: sessions.filter((s) => s.isActive).length,
      },
    };
  }

  @Patch('app-state')
  @ApiOperation({
    summary: 'Actualizar estado de la aplicación (foreground/background)',
  })
  async updateAppState(
    @CurrentUser() user: any,
    @Platform('deviceId') deviceId: string,
    @Body() dto: UpdateAppStateDto,
  ) {
    await this.sessionManager.updateAppState(
      user.id,
      dto.deviceId || deviceId,
      dto.appState,
    );

    return {
      success: true,
      message: 'Estado de app actualizado exitosamente',
      data: {
        userId: user.id,
        deviceId: dto.deviceId || deviceId,
        appState: dto.appState,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch('push-token')
  @ApiOperation({ summary: 'Actualizar token de push notifications' })
  async updatePushToken(
    @CurrentUser() user: any,
    @Platform('deviceId') deviceId: string,
    @Body() dto: UpdatePushTokenDto,
  ) {
    await this.sessionManager.updatePushToken(
      user.id,
      dto.deviceId || deviceId,
      dto.expoPushToken,
    );

    return {
      success: true,
      message: 'Push token actualizado exitosamente',
      data: {
        userId: user.id,
        deviceId: dto.deviceId || deviceId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('test/socket/:userId')
  @ApiOperation({ summary: 'Test de notificación vía Socket.IO' })
  async testSocketNotification(@Param('userId') userId: string) {
    const result = await this.notificationRouter.sendOnlySocket(userId, {
      type: 'system_alert',
      title: 'Test Socket.IO',
      body: 'Esta es una notificación de prueba vía Socket.IO',
      data: { test: true, timestamp: new Date().toISOString() },
    });

    return {
      success: true,
      message: 'Notificación de prueba enviada vía Socket.IO',
      data: result,
    };
  }

  @Get('test/push/:userId')
  @ApiOperation({ summary: 'Test de push notification' })
  async testPushNotification(@Param('userId') userId: string) {
    const result = await this.notificationRouter.sendOnlyPush(userId, {
      type: 'system_alert',
      title: 'Test Push Notification',
      body: 'Esta es una notificación de prueba vía Push',
      data: { test: true, timestamp: new Date().toISOString() },
      priority: 'high',
    });

    return {
      success: true,
      message: 'Push notification de prueba enviada',
      data: result,
    };
  }
}
