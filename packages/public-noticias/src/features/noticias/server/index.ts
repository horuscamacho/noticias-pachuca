/**
 * 📡 Noticias Server Functions
 *
 * Exporta todas las server functions relacionadas con noticias.
 * Estas funciones se ejecutan en el servidor y hacen fetch a la API de NestJS.
 */

export { getNoticiaBySlug } from './getNoticiaBySlug';
export { getNoticias } from './getNoticias';
export { getRelatedNoticias, type GetRelatedNoticiasParams } from './getRelatedNoticias';
