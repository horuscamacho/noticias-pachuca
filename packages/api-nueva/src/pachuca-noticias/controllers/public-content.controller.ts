import { Controller, Get, Post, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PublicContentService } from '../services/public-content.service';
import { ContactMailService } from '../services/contact-mail.service';
import { NewsletterService } from '../services/newsletter.service';
import { ContactMessage, ContactMessageDocument } from '../schemas/contact-message.schema';
import {
  CategoryResponseDto,
  PublicNoticiaResponseDto,
  SearchResultDto,
  PaginatedResponseDto,
  CategoryQueryDto,
  SearchQueryDto,
} from '../dto/public-content.dto';
import { ContactFormDto, ContactResponseDto } from '../dto/contact.dto';
import {
  SubscribeNewsletterDto,
  NewsletterSubscriptionResponseDto,
  NewsletterContentDto,
} from '../dto/newsletter.dto';

/**
 * 🌐 Public Content Controller
 * Endpoints públicos para categorías y búsqueda
 * Sin autenticación (APIs públicas de solo lectura)
 */
@Controller('public-content')
export class PublicContentController {
  constructor(
    private readonly publicContentService: PublicContentService,
    private readonly contactMailService: ContactMailService,
    private readonly newsletterService: NewsletterService,
    @InjectModel(ContactMessage.name)
    private readonly contactMessageModel: Model<ContactMessageDocument>,
  ) {}

  /**
   * GET /api/public-content/categories
   * Lista de categorías activas con contadores
   */
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories(): Promise<CategoryResponseDto[]> {
    return this.publicContentService.getCategories();
  }

  /**
   * GET /api/public-content/categoria/:slug
   * Noticias por categoría (paginadas)
   */
  @Get('categoria/:slug')
  @HttpCode(HttpStatus.OK)
  async getNoticiasByCategory(
    @Param('slug') slug: string,
    @Query() query: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.publicContentService.getNoticiasByCategory(slug, page, limit);
  }

  /**
   * GET /api/public-content/busqueda/:query
   * Búsqueda full-text de noticias
   */
  @Get('busqueda/:query')
  @HttpCode(HttpStatus.OK)
  async searchNoticias(
    @Param('query') query: string,
    @Query() searchQuery: SearchQueryDto,
  ): Promise<PaginatedResponseDto<SearchResultDto>> {
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const sortBy = searchQuery.sortBy || 'relevance';
    const categorySlug = searchQuery.category;

    return this.publicContentService.searchNoticias(
      query,
      categorySlug,
      sortBy,
      page,
      limit,
    );
  }

  /**
   * GET /api/public-content/tag/:slug
   * Noticias por tag (paginadas)
   */
  @Get('tag/:slug')
  @HttpCode(HttpStatus.OK)
  async getNoticiasByTag(
    @Param('slug') slug: string,
    @Query() query: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.publicContentService.getNoticiasByTag(slug, page, limit);
  }

  /**
   * GET /api/public-content/autor/:slug
   * Noticias por autor (paginadas)
   */
  @Get('autor/:slug')
  @HttpCode(HttpStatus.OK)
  async getNoticiasByAuthor(
    @Param('slug') slug: string,
    @Query() query: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<PublicNoticiaResponseDto>> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    return this.publicContentService.getNoticiasByAuthor(slug, page, limit);
  }

  /**
   * POST /api/public-content/contacto
   * Formulario de contacto público
   */
  @Post('contacto')
  @HttpCode(HttpStatus.OK)
  async submitContact(
    @Body() contactDto: ContactFormDto,
  ): Promise<ContactResponseDto> {
    // 1. Guardar mensaje en base de datos
    const contactMessage = new this.contactMessageModel({
      name: contactDto.name,
      email: contactDto.email,
      subject: contactDto.subject,
      message: contactDto.message,
      status: 'pending',
      metadata: {
        userAgent: '',
        ipAddress: '',
      },
    });

    await contactMessage.save();

    // 2. Enviar notificación al admin
    await this.contactMailService.sendContactNotification({
      name: contactDto.name,
      email: contactDto.email,
      subject: contactDto.subject,
      message: contactDto.message,
    });

    // 3. Enviar confirmación al usuario
    await this.contactMailService.sendContactConfirmation({
      name: contactDto.name,
      email: contactDto.email,
      subject: contactDto.subject,
    });

    // 4. Retornar respuesta exitosa
    return {
      message: 'Mensaje enviado exitosamente. Te responderemos pronto.',
      id: String(contactMessage._id),
    };
  }

  /**
   * POST /api/public-content/suscribir-boletin
   * Suscripción a boletines (double opt-in)
   */
  @Post('suscribir-boletin')
  @HttpCode(HttpStatus.OK)
  async subscribeNewsletter(
    @Body() dto: SubscribeNewsletterDto,
  ): Promise<NewsletterSubscriptionResponseDto> {
    const subscriber = await this.newsletterService.subscribe(dto);

    return {
      message: subscriber.isConfirmed
        ? 'Ya estás suscrito. Hemos actualizado tus preferencias.'
        : 'Revisa tu email para confirmar tu suscripción.',
      email: subscriber.email,
      isConfirmed: subscriber.isConfirmed,
    };
  }

  /**
   * GET /api/public-content/confirmar-suscripcion?token=...
   * Confirmar suscripción con token
   */
  @Get('confirmar-suscripcion')
  @HttpCode(HttpStatus.OK)
  async confirmSubscription(
    @Query('token') token: string,
  ): Promise<NewsletterSubscriptionResponseDto> {
    const subscriber = await this.newsletterService.confirmSubscription(token);

    return {
      message: '¡Suscripción confirmada! Comenzarás a recibir nuestros boletines.',
      email: subscriber.email,
      isConfirmed: true,
    };
  }

  /**
   * GET /api/public-content/desuscribir?token=...
   * Desuscribirse del boletín
   */
  @Get('desuscribir')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(
    @Query('token') token: string,
    @Query('reason') reason?: string,
  ): Promise<{ message: string }> {
    await this.newsletterService.unsubscribe(token, reason);

    return {
      message: 'Te has desuscrito exitosamente. Lamentamos verte partir.',
    };
  }

  /**
   * GET /api/public-content/boletin/:tipo
   * Obtener contenido de boletín (preview)
   */
  @Get('boletin/:tipo')
  @HttpCode(HttpStatus.OK)
  async getBoletinContent(
    @Param('tipo') tipo: 'manana' | 'tarde' | 'semanal' | 'deportes',
  ): Promise<NewsletterContentDto | { message: string }> {
    switch (tipo) {
      case 'manana':
        return this.newsletterService.generateBoletinManana();
      case 'tarde':
        return this.newsletterService.generateBoletinTarde();
      case 'semanal':
        return this.newsletterService.generateBoletinSemanal();
      case 'deportes':
        const deportes = await this.newsletterService.generateBoletinDeportes();
        return deportes || { message: 'No hay noticias de deportes disponibles' };
      default:
        return { message: 'Tipo de boletín no válido' };
    }
  }
}
