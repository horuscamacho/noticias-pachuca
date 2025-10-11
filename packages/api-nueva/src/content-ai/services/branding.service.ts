import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Input options para branding
 */
export interface BrandingOptions {
  /**
   * Prompt editorial limpio (SIN branding)
   * Este prompt se usa para metadata y debe estar libre de instrucciones técnicas
   */
  basePrompt: string;

  /**
   * Texto del watermark
   * Ejemplo: "NOTICIAS PACHUCA", "Coyote Noticias"
   */
  watermarkText: string;

  /**
   * Incluir decoraciones adicionales (opcional)
   */
  includeDecorations?: boolean;

  /**
   * Keywords para decoraciones (opcional, máx 5)
   */
  keywords?: string[];
}

/**
 * Resultado con prompts separados
 * ARQUITECTURA CLAVE: Mantener basePrompt y brandingInstructions SEPARADOS
 */
export interface BrandingResult {
  /**
   * Prompt editorial LIMPIO (sin branding)
   * Usar para: metadata, altText, caption
   * NO contiene instrucciones de watermark
   */
  basePrompt: string;

  /**
   * Instrucciones de branding SEPARADAS
   * Solo para referencia interna
   */
  brandingInstructions: string;

  /**
   * Prompt completo para OpenAI (basePrompt + brandingInstructions)
   * Usar para: generación con OpenAI
   * NUNCA guardar en metadata (contiene instrucciones técnicas)
   */
  fullPrompt: string;

  /**
   * Configuración aplicada
   */
  config: {
    watermarkText: string;
    watermarkPosition: string;
    includeDecorations: boolean;
    keywords: string[];
  };
}

/**
 * 🎨 Branding Service (Refactorizado)
 * Construye prompts con SEPARACIÓN LIMPIA entre editorial y branding
 *
 * RESPONSABILIDAD:
 * - Mantener basePrompt limpio (para metadata)
 * - Crear brandingInstructions separadas
 * - Combinar ambos en fullPrompt (solo para OpenAI)
 * - NUNCA contaminar metadata con instrucciones técnicas
 *
 * REGLAS APLICADAS:
 * ✅ NO usa any (todos los tipos explícitos)
 * ✅ NO usa forwardRef (servicio standalone)
 * ✅ Separación limpia de concerns
 *
 * ARQUITECTURA:
 * basePrompt (limpio) → metadata ✅
 * brandingInstructions (separado) → referencia interna
 * fullPrompt (combinado) → OpenAI API → NO guardar en metadata ❌
 *
 * @example
 * const result = await branding.applyBranding({
 *   basePrompt: "Editorial portrait: distinguished mayor announcing plan...",
 *   watermarkText: "NOTICIAS PACHUCA"
 * });
 * // result.basePrompt = limpio (para metadata)
 * // result.brandingInstructions = separado
 * // result.fullPrompt = combinado (para OpenAI)
 */
@Injectable()
export class BrandingService {
  private readonly logger = new Logger(BrandingService.name);

  /**
   * Aplicar branding con separación limpia
   *
   * @param options - Opciones de branding
   * @returns Resultado con prompts separados
   */
  async applyBranding(options: BrandingOptions): Promise<BrandingResult> {
    // Validar primero
    this.validateBrandingOptions(options);

    const { basePrompt, watermarkText, includeDecorations, keywords } = options;

    this.logger.log(`🎨 Applying branding: watermark="${watermarkText}", decorations=${includeDecorations}`);

    // 1. Construir instrucciones de branding (SEPARADAS)
    const brandingInstructions = this.buildBrandingInstructions(
      watermarkText,
      includeDecorations || false,
      keywords || [],
    );

    // 2. Combinar para OpenAI (pero mantener separados en resultado)
    const fullPrompt = this.combinePrompts(basePrompt, brandingInstructions);

    // 3. Configuración aplicada
    const config = {
      watermarkText,
      watermarkPosition: 'bottom-right',
      includeDecorations: includeDecorations || false,
      keywords: keywords || [],
    };

    this.logger.debug(
      `✅ Branding applied: basePrompt=${basePrompt.length} chars, ` +
      `branding=${brandingInstructions.length} chars, ` +
      `fullPrompt=${fullPrompt.length} chars`,
    );

    return {
      basePrompt: basePrompt.trim(),
      brandingInstructions: brandingInstructions.trim(),
      fullPrompt: fullPrompt.trim(),
      config,
    };
  }

  /**
   * Construir instrucciones de branding (SEPARADAS del prompt editorial)
   *
   * @param watermarkText - Texto del watermark
   * @param includeDecorations - Incluir decoraciones
   * @param keywords - Keywords para decoraciones
   * @returns Instrucciones de branding en texto separado
   */
  private buildBrandingInstructions(
    watermarkText: string,
    includeDecorations: boolean,
    keywords: string[],
  ): string {
    const instructions: string[] = [];

    // Instrucción de watermark
    instructions.push(`BRANDING INSTRUCTIONS:`);
    instructions.push(`Include '${watermarkText}' watermark in the bottom-right corner.`);
    instructions.push(`Watermark style: subtle, semi-transparent, professional news style.`);
    instructions.push(`Brand colors: vibrant yellow (#f1ef47) and black.`);

    // Decoraciones (si se solicitan)
    if (includeDecorations && keywords.length > 0) {
      const selectedKeywords = keywords.slice(0, 3); // Max 3 keywords
      instructions.push('');
      instructions.push(`Optionally include subtle decorative banners with keywords: ${selectedKeywords.join(', ')}.`);
      instructions.push(`Keep text minimal (max 20% of image) to avoid social media penalties.`);
    }

    // Constraints profesionales
    instructions.push('');
    instructions.push('IMPORTANT CONSTRAINTS:');
    instructions.push('- Maintain professional journalism standards');
    instructions.push('- Do not add waterdrops or excessive decorative elements');
    instructions.push('- Keep branding subtle and tasteful');
    instructions.push('- Preserve the essence and composition of the original concept');

    return instructions.join('\n');
  }

  /**
   * Combinar basePrompt + brandingInstructions para OpenAI
   * Resultado se usa SOLO para generación, NUNCA para metadata
   *
   * @param basePrompt - Prompt editorial limpio
   * @param brandingInstructions - Instrucciones de branding
   * @returns Prompt completo combinado
   */
  private combinePrompts(basePrompt: string, brandingInstructions: string): string {
    return `${basePrompt.trim()}\n\n${brandingInstructions.trim()}`;
  }

  /**
   * Validar opciones de branding
   * Método público para que otros servicios puedan validar antes de usar
   *
   * @param options - Opciones a validar
   * @throws BadRequestException si validación falla
   */
  validateBrandingOptions(options: BrandingOptions): void {
    if (!options.watermarkText || options.watermarkText.trim().length === 0) {
      throw new BadRequestException('Watermark text is required');
    }

    if (options.watermarkText.length > 50) {
      throw new BadRequestException('Watermark text must be 50 characters or less');
    }

    if (options.keywords && options.keywords.length > 5) {
      throw new BadRequestException('Maximum 5 keywords allowed for decorations');
    }

    if (options.basePrompt.length > 2000) {
      throw new BadRequestException('Base prompt must be 2000 characters or less');
    }
  }

  /**
   * DEPRECATED: Método legacy para backwards compatibility
   * Usar applyBranding() en su lugar
   *
   * @deprecated Use applyBranding() instead for clean separation
   */
  async buildPrompt(options: BrandingOptions): Promise<string> {
    this.logger.warn('⚠️ buildPrompt() is deprecated, use applyBranding() for clean separation');
    const result = await this.applyBranding(options);
    return result.fullPrompt;
  }
}
