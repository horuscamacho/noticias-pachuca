import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

/**
 * 📱 SocialMediaCopyGeneratorService
 * Valida copys sociales según mejores prácticas 2025-2026
 */
@Injectable()
export class SocialMediaCopyGeneratorService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Validar Facebook Copy según mejores prácticas
   */
  validateFacebookCopy(copy: {
    hook: string;
    copy: string;
    emojis: string[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Hook: 10-15 palabras (flexibilidad 5-20)
    const hookWords = copy.hook.split(/\s+/).filter(word => word.length > 0).length;
    if (hookWords < 5 || hookWords > 20) {
      errors.push(`Hook debe tener 10-15 palabras (actual: ${hookWords} palabras)`);
    }

    // Copy total: 40-80 palabras mínimo recomendado (puede ser más si es valioso)
    const copyWords = copy.copy.split(/\s+/).filter(word => word.length > 0).length;
    if (copyWords < 20) {
      errors.push(`Copy muy corto (actual: ${copyWords} palabras, mínimo recomendado: 40)`);
    }

    // Emojis: máximo 4
    if (copy.emojis.length > 4) {
      errors.push(`Máximo 4 emojis permitidos (actual: ${copy.emojis.length})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validar Twitter Copy según mejores prácticas
   */
  validateTwitterCopy(copy: {
    tweet: string;
    emojis: string[];
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Tweet: 200-240 chars recomendado (NO usar 280 completos)
    const tweetLength = copy.tweet.length;
    if (tweetLength > 250) {
      errors.push(`Tweet muy largo (actual: ${tweetLength} chars, máximo recomendado: 240)`);
    }

    if (tweetLength < 50) {
      errors.push(`Tweet muy corto (actual: ${tweetLength} chars)`);
    }

    // Emojis: máximo 2
    if (copy.emojis.length > 2) {
      errors.push(`Máximo 2 emojis en Twitter (actual: ${copy.emojis.length})`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validar copys completos y emitir eventos si hay warnings
   */
  validateAllCopies(
    copys: {
      facebook?: { hook: string; copy: string; emojis: string[] };
      twitter?: { tweet: string; emojis: string[] };
    },
    context?: { extractedContentId?: string; agentId?: string },
  ): {
    valid: boolean;
    facebookValidation?: { valid: boolean; errors: string[] };
    twitterValidation?: { valid: boolean; errors: string[] };
    overallErrors: string[];
  } {
    const overallErrors: string[] = [];
    let facebookValidation: { valid: boolean; errors: string[] } | undefined;
    let twitterValidation: { valid: boolean; errors: string[] } | undefined;

    // Validar Facebook copy si existe
    if (copys.facebook) {
      facebookValidation = this.validateFacebookCopy(copys.facebook);
      if (!facebookValidation.valid) {
        overallErrors.push(...facebookValidation.errors.map(e => `Facebook: ${e}`));
      }
    }

    // Validar Twitter copy si existe
    if (copys.twitter) {
      twitterValidation = this.validateTwitterCopy(copys.twitter);
      if (!twitterValidation.valid) {
        overallErrors.push(...twitterValidation.errors.map(e => `Twitter: ${e}`));
      }
    }

    // Emitir evento si hay errores
    if (overallErrors.length > 0) {
      this.eventEmitter.emit('generator-pro.social-copy.validation-failed', {
        errors: overallErrors,
        context,
        timestamp: new Date(),
      });
    }

    return {
      valid: overallErrors.length === 0,
      facebookValidation,
      twitterValidation,
      overallErrors,
    };
  }
}
