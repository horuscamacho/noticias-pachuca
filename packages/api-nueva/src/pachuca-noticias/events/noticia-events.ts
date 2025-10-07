import { Types } from 'mongoose';

/**
 * Evento emitido cuando una noticia es publicada
 */
export class NoticiaPublishedEvent {
  noticiaId: Types.ObjectId;
  slug: string;
  title: string;
  category: string;
  publishedAt: Date;

  constructor(data: Partial<NoticiaPublishedEvent>) {
    Object.assign(this, data);
  }
}

/**
 * Evento emitido cuando una noticia es despublicada
 */
export class NoticiaUnpublishedEvent {
  noticiaId: Types.ObjectId;
  slug: string;

  constructor(data: Partial<NoticiaUnpublishedEvent>) {
    Object.assign(this, data);
  }
}

/**
 * Nombres de eventos para EventEmitter2
 */
export const NOTICIA_EVENTS = {
  PUBLISHED: 'noticia.published',
  UNPUBLISHED: 'noticia.unpublished',
  UPDATED: 'noticia.updated',
  DELETED: 'noticia.deleted',
} as const;
