import { Dimensions, PixelRatio } from 'react-native'
import { FontConfig, VariantDefinition, ResponsiveDimensions, FontWeight } from './types'

// Configuración base de variantes tipográficas (Material Design 3)
export const FONT_VARIANTS: VariantDefinition = {
  'display-large': {
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.25,
    fontWeight: 'regular'
  },
  'display-medium': {
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
    fontWeight: 'regular'
  },
  'display-small': {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
    fontWeight: 'regular'
  },
  'headline-large': {
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
    fontWeight: 'regular'
  },
  'headline-medium': {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
    fontWeight: 'regular'
  },
  'headline-small': {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: 'regular'
  },
  'title-large': {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
    fontWeight: 'medium'
  },
  'title-medium': {
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.15,
    fontWeight: 'medium'
  },
  'title-small': {
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: 'medium'
  },
  'body-large': {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    fontWeight: 'regular'
  },
  'body-medium': {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
    fontWeight: 'regular'
  },
  'body-small': {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    fontWeight: 'regular'
  },
  'label-large': {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
    fontWeight: 'medium'
  },
  'label-medium': {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
    fontWeight: 'medium'
  },
  'label-small': {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
    fontWeight: 'medium'
  },
  'caption': {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    fontWeight: 'regular'
  },
  'overline': {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1.5,
    fontWeight: 'medium'
  }
}

// Mapeo de pesos de fuente a familias Aleo (18 variantes completas)
export const FONT_WEIGHT_MAP: Record<FontWeight, string> = {
  thin: 'Aleo-Thin',           // 100 -> Thin
  ultralight: 'Aleo-ExtraLight', // 200 -> ExtraLight
  light: 'Aleo-Light',         // 300 -> Light
  regular: 'Aleo-Regular',     // 400 -> Regular
  medium: 'Aleo-Medium',       // 500 -> Medium
  semibold: 'Aleo-SemiBold',   // 600 -> SemiBold
  bold: 'Aleo-Bold',           // 700 -> Bold
  heavy: 'Aleo-ExtraBold',     // 800 -> ExtraBold
  black: 'Aleo-Black'          // 900 -> Black
}

// Mapeo con variantes itálicas
export const FONT_WEIGHT_ITALIC_MAP: Record<FontWeight, string> = {
  thin: 'Aleo-ThinItalic',
  ultralight: 'Aleo-ExtraLightItalic',
  light: 'Aleo-LightItalic',
  regular: 'Aleo-Italic',
  medium: 'Aleo-MediumItalic',
  semibold: 'Aleo-SemiBoldItalic',
  bold: 'Aleo-BoldItalic',
  heavy: 'Aleo-ExtraBoldItalic',
  black: 'Aleo-BlackItalic'
}

// Mapeo numérico de pesos (fallback para React Native nativo)
export const FONT_WEIGHT_NUMERIC: Record<FontWeight, string> = {
  thin: '100',
  ultralight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
  black: '900'
}

// Obtener dimensiones actuales del dispositivo
export const getResponsiveDimensions = (): ResponsiveDimensions => {
  const { width, height } = Dimensions.get('window')
  const scale = PixelRatio.get()
  const fontScale = PixelRatio.getFontScale()

  return {
    width,
    height,
    scale,
    fontScale
  }
}

// Calcular factor de escala responsivo
export const calculateResponsiveScale = (
  baseWidth = 375,
  minScale = 0.8,
  maxScale = 1.4,
  useSmallestDimension = false
): number => {
  const dimensions = getResponsiveDimensions()

  let referenceWidth = dimensions.width

  if (useSmallestDimension) {
    referenceWidth = Math.min(dimensions.width, dimensions.height)
  }

  const scale = referenceWidth / baseWidth

  // Aplicar límites
  return Math.max(minScale, Math.min(maxScale, scale))
}

// Aplicar escalado responsivo a un tamaño de fuente
export const scaleFont = (
  fontSize: number,
  responsive = false,
  config?: {
    baseWidth?: number
    minScale?: number
    maxScale?: number
    useSmallestDimension?: boolean
  }
): number => {
  if (!responsive) return fontSize

  const scale = calculateResponsiveScale(
    config?.baseWidth,
    config?.minScale,
    config?.maxScale,
    config?.useSmallestDimension
  )

  return Math.round(fontSize * scale)
}

// Aplicar configuraciones de accesibilidad
export const applyAccessibilityScaling = (
  fontSize: number,
  config?: {
    allowFontScaling?: boolean
    maxFontSizeMultiplier?: number
    respectDeviceSettings?: boolean
  }
): {
  fontSize: number
  allowFontScaling: boolean
  maxFontSizeMultiplier?: number
} => {
  const {
    allowFontScaling = true,
    maxFontSizeMultiplier = 1.2,
    respectDeviceSettings = true
  } = config || {}

  if (!respectDeviceSettings) {
    return {
      fontSize,
      allowFontScaling: false
    }
  }

  return {
    fontSize,
    allowFontScaling,
    maxFontSizeMultiplier
  }
}

// Calcular line height proporcional
export const calculateLineHeight = (
  fontSize: number,
  baseLineHeight?: number,
  ratio = 1.4
): number => {
  if (baseLineHeight) {
    // Mantener proporción original
    const originalRatio = baseLineHeight / fontSize
    return Math.round(fontSize * originalRatio)
  }

  // Usar ratio por defecto
  return Math.round(fontSize * ratio)
}

// Validar y obtener configuración de variante
export const getVariantConfig = (variant: string): FontConfig => {
  const config = FONT_VARIANTS[variant]

  if (!config) {
    console.warn(`ThemedText: Unknown variant "${variant}". Using body-medium as fallback.`)
    return FONT_VARIANTS['body-medium']
  }

  return config
}

// Combinar configuraciones de fuente
export const mergeConfigs = (
  baseConfig: FontConfig,
  overrides: Partial<FontConfig>
): FontConfig => {
  return {
    fontSize: overrides.fontSize ?? baseConfig.fontSize,
    lineHeight: overrides.lineHeight ?? baseConfig.lineHeight,
    letterSpacing: overrides.letterSpacing ?? baseConfig.letterSpacing,
    fontWeight: overrides.fontWeight ?? baseConfig.fontWeight
  }
}

// Obtener información del dispositivo para debugging
export const getDeviceInfo = () => {
  const dimensions = getResponsiveDimensions()
  const scale = calculateResponsiveScale()

  return {
    ...dimensions,
    responsiveScale: scale,
    isTablet: Math.min(dimensions.width, dimensions.height) >= 768,
    isPhablet: Math.min(dimensions.width, dimensions.height) >= 414,
    isSmallDevice: Math.min(dimensions.width, dimensions.height) < 375
  }
}

// Normalizar peso de fuente (devuelve fontFamily de Aleo)
export const normalizeFontWeight = (weight: FontWeight, italic = false): string => {
  if (italic) {
    return FONT_WEIGHT_ITALIC_MAP[weight] || 'Aleo-Italic'
  }
  return FONT_WEIGHT_MAP[weight] || 'Aleo-Regular'
}

// Obtener fontFamily de Aleo basado en peso e italic
export const getAleoFontFamily = (weight: FontWeight = 'regular', italic = false): string => {
  if (italic) {
    return FONT_WEIGHT_ITALIC_MAP[weight] || 'Aleo-Italic'
  }
  return FONT_WEIGHT_MAP[weight] || 'Aleo-Regular'
}

// Aplicar truncamiento de texto
export const getTruncationProps = (truncate?: boolean | number) => {
  if (truncate === false || truncate === undefined) {
    return {}
  }

  if (truncate === true) {
    return {
      numberOfLines: 1,
      ellipsizeMode: 'tail' as const
    }
  }

  if (typeof truncate === 'number') {
    return {
      numberOfLines: truncate,
      ellipsizeMode: 'tail' as const
    }
  }

  return {}
}

// Configuración por defecto para responsive
export const DEFAULT_RESPONSIVE_CONFIG = {
  enabled: true,
  baseWidth: 375,
  minScale: 0.8,
  maxScale: 1.4,
  useSmallestDimension: false
}

// Configuración por defecto para accesibilidad
export const DEFAULT_ACCESSIBILITY_CONFIG = {
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.2,
  respectDeviceSettings: true,
  dynamicTypeScaling: false
}