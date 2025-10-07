import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { MailCoreService } from '../../modules/mail/services/mail-core.service';
import { EmailPriority } from '../../modules/mail/types/mail.types';
import {
  NewsletterSubscriber,
  NewsletterSubscriberDocument,
} from '../schemas/newsletter-subscriber.schema';
import {
  Newsletter,
  NewsletterDocument,
} from '../schemas/newsletter.schema';
import {
  PublishedNoticia,
  PublishedNoticiaDocument,
} from '../schemas/published-noticia.schema';
import {
  SubscribeNewsletterDto,
  UpdatePreferencesDto,
  NewsletterContentDto,
} from '../dto/newsletter.dto';

interface PopulatedCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

type PopulatedNoticia = Omit<PublishedNoticiaDocument, 'category'> & {
  category: PopulatedCategory;
};

/**
 * 📧 Newsletter Service
 * Servicio para gestión de boletines y suscriptores
 */
@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);
  private readonly frontendUrl: string;

  constructor(
    @InjectModel(NewsletterSubscriber.name)
    private newsletterSubscriberModel: Model<NewsletterSubscriberDocument>,
    @InjectModel(Newsletter.name)
    private newsletterModel: Model<NewsletterDocument>,
    @InjectModel(PublishedNoticia.name)
    private publishedNoticiaModel: Model<PublishedNoticiaDocument>,
    private readonly mailCoreService: MailCoreService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://noticiaspachuca.com');
  }

  /**
   * 📝 Suscribir a boletín (double opt-in)
   */
  async subscribe(dto: SubscribeNewsletterDto): Promise<NewsletterSubscriberDocument> {
    const { email, name, manana = false, tarde = false, semanal = false, deportes = false, source } = dto;

    // Verificar si ya existe
    let subscriber = await this.newsletterSubscriberModel.findOne({ email });

    if (subscriber) {
      // Si ya está suscrito y confirmado, actualizar preferencias
      if (subscriber.isConfirmed && subscriber.isActive) {
        subscriber.preferences = { manana, tarde, semanal, deportes };
        if (name) subscriber.name = name;
        await subscriber.save();

        this.logger.log(`✅ Preferencias actualizadas para: ${email}`);
        return subscriber;
      }

      // Si existe pero no confirmado, reenviar confirmación
      if (!subscriber.isConfirmed) {
        await this.sendConfirmationEmail(subscriber);
        this.logger.log(`📧 Reenvío de confirmación a: ${email}`);
        return subscriber;
      }
    }

    // Crear nuevo suscriptor
    const { randomBytes } = await import('crypto');
    subscriber = new this.newsletterSubscriberModel({
      email,
      name,
      preferences: { manana, tarde, semanal, deportes },
      isActive: true,
      isConfirmed: false,
      subscribedAt: new Date(),
      unsubscribeToken: randomBytes(32).toString('hex'),
      confirmationToken: randomBytes(32).toString('hex'),
      confirmationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      metadata: {
        source: source || 'api',
      },
    });

    await subscriber.save();

    // Enviar email de confirmación
    await this.sendConfirmationEmail(subscriber);

    this.logger.log(`🆕 Nueva suscripción: ${email}`);
    return subscriber;
  }

  /**
   * ✅ Confirmar suscripción con token
   */
  async confirmSubscription(token: string): Promise<NewsletterSubscriberDocument> {
    const subscriber = await this.newsletterSubscriberModel.findOne({
      confirmationToken: token,
      confirmationTokenExpires: { $gt: new Date() },
    });

    if (!subscriber) {
      throw new BadRequestException('Token inválido o expirado');
    }

    subscriber.isConfirmed = true;
    subscriber.confirmedAt = new Date();
    subscriber.confirmationToken = undefined;
    subscriber.confirmationTokenExpires = undefined;

    await subscriber.save();

    this.logger.log(`✅ Suscripción confirmada: ${subscriber.email}`);
    return subscriber;
  }

  /**
   * 🚫 Desuscribir con token
   */
  async unsubscribe(token: string, reason?: string): Promise<void> {
    const subscriber = await this.newsletterSubscriberModel.findOne({
      unsubscribeToken: token,
    });

    if (!subscriber) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    if (reason) subscriber.unsubscribeReason = reason;

    await subscriber.save();

    this.logger.log(`🚫 Desuscripción exitosa: ${subscriber.email}`);
  }

  /**
   * ⚙️ Actualizar preferencias
   */
  async updatePreferences(token: string, preferences: Partial<UpdatePreferencesDto>): Promise<NewsletterSubscriberDocument> {
    const subscriber = await this.newsletterSubscriberModel.findOne({
      unsubscribeToken: token,
    });

    if (!subscriber) {
      throw new NotFoundException('Suscriptor no encontrado');
    }

    const { manana, tarde, semanal, deportes } = preferences;

    if (manana !== undefined) subscriber.preferences.manana = manana;
    if (tarde !== undefined) subscriber.preferences.tarde = tarde;
    if (semanal !== undefined) subscriber.preferences.semanal = semanal;
    if (deportes !== undefined) subscriber.preferences.deportes = deportes;

    await subscriber.save();

    this.logger.log(`⚙️ Preferencias actualizadas: ${subscriber.email}`);
    return subscriber;
  }

  /**
   * 🌅 Generar boletín de la mañana (Top 5 últimas 24h)
   */
  async generateBoletinManana(): Promise<NewsletterContentDto> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const noticias = await this.publishedNoticiaModel
      .find({
        publishedAt: { $gte: yesterday },
        status: 'published',
      })
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean()
      .exec();

    const noticiasSnapshot = noticias.map((n) => ({
      id: (n._id as Types.ObjectId).toString(),
      title: n.title,
      slug: n.slug,
      category: 'General', // Sin populate, usamos valor por defecto
      featuredImage: n.featuredImage?.original,
    }));

    const subject = `☀️ Buenos días Pachuca - ${new Date().toLocaleDateString('es-MX')}`;

    return {
      type: 'manana',
      subject,
      html: this.generateBoletinHTML('manana', noticiasSnapshot),
      noticias: noticiasSnapshot,
    };
  }

  /**
   * 🌆 Generar boletín de la tarde (Top 3 más leídas del día)
   */
  async generateBoletinTarde(): Promise<NewsletterContentDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const noticias = await this.publishedNoticiaModel
      .find({
        publishedAt: { $gte: today },
        status: 'published',
      })
      .sort({ 'stats.views': -1 })
      .limit(3)
      .lean()
      .exec();

    const noticiasSnapshot = noticias.map((n) => ({
      id: (n._id as Types.ObjectId).toString(),
      title: n.title,
      slug: n.slug,
      category: 'General', // Sin populate, usamos valor por defecto
      featuredImage: n.featuredImage?.original,
    }));

    const subject = `🌆 Resumen vespertino - ${new Date().toLocaleDateString('es-MX')}`;

    return {
      type: 'tarde',
      subject,
      html: this.generateBoletinHTML('tarde', noticiasSnapshot),
      noticias: noticiasSnapshot,
    };
  }

  /**
   * 📅 Generar boletín semanal (Top 10 de la semana)
   */
  async generateBoletinSemanal(): Promise<NewsletterContentDto> {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const noticias = await this.publishedNoticiaModel
      .find({
        publishedAt: { $gte: lastWeek },
        status: 'published',
      })
      .sort({ 'stats.views': -1 })
      .limit(10)
      .lean()
      .exec();

    const noticiasSnapshot = noticias.map((n) => ({
      id: (n._id as Types.ObjectId).toString(),
      title: n.title,
      slug: n.slug,
      category: 'General', // Sin populate, usamos valor por defecto
      featuredImage: n.featuredImage?.original,
    }));

    const subject = `📅 Lo mejor de la semana - Pachuca Noticias`;

    return {
      type: 'semanal',
      subject,
      html: this.generateBoletinHTML('semanal', noticiasSnapshot),
      noticias: noticiasSnapshot,
    };
  }

  /**
   * ⚽ Generar boletín de deportes (si hay noticias)
   */
  async generateBoletinDeportes(): Promise<NewsletterContentDto | null> {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Buscar noticias de deportes directamente por tags
    const noticias = await this.publishedNoticiaModel
      .find({
        publishedAt: { $gte: yesterday },
        status: 'published',
        $or: [
          { tags: { $in: ['deportes', 'deporte', 'fútbol', 'futbol', 'tuzos', 'pachuca'] } },
          { keywords: { $in: ['deportes', 'deporte', 'fútbol', 'futbol', 'tuzos', 'pachuca'] } },
        ],
      })
      .sort({ publishedAt: -1 })
      .limit(5)
      .lean()
      .exec();

    if (noticias.length === 0) {
      return null; // No hay noticias de deportes
    }

    const noticiasSnapshot = noticias.map((n) => ({
      id: (n._id as Types.ObjectId).toString(),
      title: n.title,
      slug: n.slug,
      category: 'Deportes',
      featuredImage: n.featuredImage?.original,
    }));

    const subject = `⚽ Deportes en Pachuca - ${new Date().toLocaleDateString('es-MX')}`;

    return {
      type: 'deportes',
      subject,
      html: this.generateBoletinHTML('deportes', noticiasSnapshot),
      noticias: noticiasSnapshot,
    };
  }

  /**
   * 📧 Enviar email de confirmación
   */
  private async sendConfirmationEmail(subscriber: NewsletterSubscriberDocument): Promise<void> {
    const confirmationUrl = `${this.frontendUrl}/confirmar-suscripcion?token=${subscriber.confirmationToken}`;

    await this.mailCoreService.sendEmail({
      to: subscriber.email,
      subject: '✅ Confirma tu suscripción - Noticias Pachuca',
      template: 'newsletter/confirm-subscription',
      context: {
        recipientName: subscriber.name || 'Lector',
        recipientEmail: subscriber.email,
        confirmationUrl,
      },
      priority: EmailPriority.HIGH,
    });

    this.logger.log(`📧 Confirmación enviada a: ${subscriber.email}`);
  }

  /**
   * 🎨 Generar HTML del boletín (placeholder simple)
   */
  private generateBoletinHTML(
    type: 'manana' | 'tarde' | 'semanal' | 'deportes',
    noticias: Array<{ id: string; title: string; slug: string; category: string; featuredImage?: string }>,
  ): string {
    const titles = {
      manana: '☀️ Buenos días Pachuca',
      tarde: '🌆 Resumen Vespertino',
      semanal: '📅 Lo Mejor de la Semana',
      deportes: '⚽ Deportes en Pachuca',
    };

    const noticiasHTML = noticias
      .map(
        (n) => `
      <div style="margin-bottom: 24px; border-left: 4px solid #FF0000; padding-left: 16px;">
        ${n.featuredImage ? `<img src="${n.featuredImage}" alt="${n.title}" style="width: 100%; max-width: 600px; margin-bottom: 12px;" />` : ''}
        <h3 style="margin: 0 0 8px 0; font-family: 'Roboto Mono', monospace;">${n.title}</h3>
        <p style="margin: 0 0 8px 0; color: #854836; font-weight: bold;">${n.category}</p>
        <a href="${this.frontendUrl}/noticia/${n.slug}" style="color: #FF0000; text-decoration: none; font-weight: bold;">
          LEER MÁS →
        </a>
      </div>
    `,
      )
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titles[type]}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Inter, Arial, sans-serif; background-color: #FFFFFF;">
  <div style="max-width: 600px; margin: 0 auto; padding: 24px; border: 4px solid #000000;">
    <h1 style="font-family: 'Roboto Mono', monospace; font-size: 28px; margin-bottom: 24px; border-bottom: 4px solid #FF0000; padding-bottom: 12px;">
      ${titles[type]}
    </h1>
    ${noticiasHTML}
    <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #E5E7EB; font-size: 12px; color: #6B7280;">
      <p>© ${new Date().getFullYear()} Noticias Pachuca. Todos los derechos reservados.</p>
      <p><a href="${this.frontendUrl}/desuscribir?token={{UNSUBSCRIBE_TOKEN}}" style="color: #6B7280;">Desuscribirse</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }
}
