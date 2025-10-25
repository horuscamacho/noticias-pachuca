import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserGeneratedContent, UserGeneratedContentDocument } from '../schemas/user-generated-content.schema';
import { UserContentService } from './user-content.service';

/**
 * ⏰ Scheduler Service para Auto-cierre de Contenido Urgent
 *
 * Ejecuta un cron job cada 5 minutos que:
 * 1. Busca contenido URGENT que cumplió 2 horas sin actualización
 * 2. Llama a UserContentService.closeUrgentContent() para cada uno
 * 3. El servicio agregará párrafo de cierre automáticamente
 *
 * También ejecuta el proceso INMEDIATAMENTE al iniciar el servidor
 * para cerrar contenido que expiró mientras el servidor estaba apagado
 *
 * Query:
 * - isUrgent: true
 * - urgentClosed: false
 * - urgentAutoCloseAt <= now
 * - status: 'published'
 */
@Injectable()
export class UrgentContentSchedulerService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UrgentContentSchedulerService.name);

  constructor(
    @InjectModel(UserGeneratedContent.name)
    private readonly userContentModel: Model<UserGeneratedContentDocument>,
    private readonly userContentService: UserContentService,
  ) {
    this.logger.log('⏰ Urgent Content Scheduler initialized');
  }

  /**
   * 🚀 Se ejecuta INMEDIATAMENTE cuando el servidor arranca
   * Cierra contenido urgent que expiró mientras el servidor estaba apagado
   */
  async onApplicationBootstrap(): Promise<void> {
    this.logger.log('🚀 [BOOTSTRAP] Ejecutando verificación inicial de contenido urgent expirado...');

    try {
      // Ejecutar el mismo proceso que el cron job
      await this.handleUrgentContentAutoClosure();
      this.logger.log('✅ [BOOTSTRAP] Verificación inicial completada');
    } catch (error) {
      this.logger.error(
        `❌ [BOOTSTRAP] Error en verificación inicial: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      // No lanzamos excepción para no bloquear el inicio del servidor
    }
  }

  /**
   * ⏰ Cron job que se ejecuta cada 5 minutos
   * Cierra automáticamente contenido urgent que cumplió 2 horas sin actualización
   *
   * Expresión cron: '* /5 * * * *' (cada 5 minutos)
   * Equivalente: CronExpression.EVERY_5_MINUTES
   */
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'urgent-content-auto-closure',
    timeZone: 'America/Mexico_City',
  })
  async handleUrgentContentAutoClosure(): Promise<void> {
    this.logger.debug('⏰ [CRON] Ejecutando auto-cierre de contenido urgent...');

    try {
      const now = new Date();

      // 1. Buscar contenido urgent que ya debe cerrarse
      const expiredContent = await this.userContentModel.find({
        isUrgent: true,
        urgentClosed: false,
        urgentAutoCloseAt: { $lte: now },
        status: 'published',
      }).exec();

      if (expiredContent.length === 0) {
        this.logger.debug('⏰ [CRON] No hay contenido urgent para cerrar');
        return;
      }

      this.logger.log(`⏰ [CRON] Encontrados ${expiredContent.length} contenidos urgent para auto-cerrar`);

      // 2. Cerrar cada contenido expirado
      const results = {
        total: expiredContent.length,
        successful: 0,
        failed: 0,
        errors: [] as Array<{ id: string; error: string }>,
      };

      for (const content of expiredContent) {
        try {
          const contentId = (content._id as Types.ObjectId).toString();
          this.logger.log(`⏰ [CRON] Cerrando contenido urgent: ${contentId}`);

          // Llamar a UserContentService.closeUrgentContent con closedBy='system'
          await this.userContentService.closeUrgentContent(
            contentId,
            'system',
          );

          results.successful++;
          this.logger.log(`✅ [CRON] Contenido urgent ${contentId} auto-cerrado exitosamente`);
        } catch (error) {
          results.failed++;
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          results.errors.push({
            id: (content._id as Types.ObjectId).toString(),
            error: errorMsg,
          });
          this.logger.error(
            `❌ [CRON] Error al auto-cerrar contenido ${content._id}: ${errorMsg}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }

      // 3. Log de resumen
      this.logger.log(
        `⏰ [CRON] Auto-cierre completado: ${results.successful}/${results.total} exitosos, ${results.failed} fallidos`,
      );

      if (results.errors.length > 0) {
        this.logger.warn(
          `⚠️ [CRON] Errores en auto-cierre: ${JSON.stringify(results.errors, null, 2)}`,
        );
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `❌ [CRON] Error crítico en handleUrgentContentAutoClosure: ${errorMsg}`,
        error instanceof Error ? error.stack : undefined,
      );
      // No lanzamos excepción para no bloquear el cron job
    }
  }

  /**
   * 📊 Método auxiliar para obtener estadísticas de contenido urgent
   * Útil para monitoreo y debugging
   */
  async getUrgentContentStats(): Promise<{
    totalActive: number;
    totalExpiredPendingClosure: number;
    totalClosed: number;
    nextClosureIn?: number; // Minutos hasta el próximo cierre
  }> {
    try {
      const now = new Date();

      // Contenido activo
      const totalActive = await this.userContentModel.countDocuments({
        isUrgent: true,
        urgentClosed: false,
        status: 'published',
      });

      // Contenido expirado pendiente de cierre
      const totalExpiredPendingClosure = await this.userContentModel.countDocuments({
        isUrgent: true,
        urgentClosed: false,
        urgentAutoCloseAt: { $lte: now },
        status: 'published',
      });

      // Contenido cerrado
      const totalClosed = await this.userContentModel.countDocuments({
        isUrgent: true,
        urgentClosed: true,
      });

      // Próximo cierre
      let nextClosureIn: number | undefined;
      const nextToClose = await this.userContentModel
        .findOne({
          isUrgent: true,
          urgentClosed: false,
          urgentAutoCloseAt: { $gt: now },
          status: 'published',
        })
        .sort({ urgentAutoCloseAt: 1 })
        .exec();

      if (nextToClose && nextToClose.urgentAutoCloseAt) {
        const msUntilClosure = nextToClose.urgentAutoCloseAt.getTime() - now.getTime();
        nextClosureIn = Math.ceil(msUntilClosure / 60000); // Convertir a minutos
      }

      return {
        totalActive,
        totalExpiredPendingClosure,
        totalClosed,
        nextClosureIn,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error getting urgent content stats: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        totalActive: 0,
        totalExpiredPendingClosure: 0,
        totalClosed: 0,
      };
    }
  }

  /**
   * 🔍 Método manual para forzar verificación de cierre (útil para testing)
   * NO debe usarse en producción de forma regular
   */
  async manualCheckAndClose(): Promise<void> {
    this.logger.warn('⚠️ [MANUAL] Forzando verificación manual de cierre');
    await this.handleUrgentContentAutoClosure();
  }
}
