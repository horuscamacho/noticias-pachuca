import React, { useMemo } from 'react'
import { Text, useColorScheme, TextStyle } from 'react-native'
import { ThemedTextProps, ThemedTextTheme, ResponsiveConfig, AccessibilityConfig } from './types'
import {
  getVariantConfig,
  scaleFont,
  applyAccessibilityScaling,
  calculateLineHeight,
  getAleoFontFamily,
  getTruncationProps,
  DEFAULT_RESPONSIVE_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG
} from './utils'

// Tema de colores por defecto
const defaultTheme: ThemedTextTheme = {
  light: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#007AFF',
    muted: '#8E8E93',
    disabled: '#C7C7CC',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    info: '#5AC8FA'
  },
  dark: {
    primary: '#FFFFFF',
    secondary: '#AEAEB2',
    accent: '#0A84FF',
    muted: '#8E8E93',
    disabled: '#48484A',
    error: '#FF453A',
    warning: '#FF9F0A',
    success: '#30D158',
    info: '#64D2FF'
  }
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  children,
  variant = 'body-medium',
  color = 'primary',
  customColor,
  weight,
  italic = false,
  size,
  lineHeight,
  letterSpacing,
  align = 'auto',
  transform = 'none',
  theme = 'auto',
  responsive = true,
  accessibility = DEFAULT_ACCESSIBILITY_CONFIG,
  animated = false,
  truncate,
  highlight = false,
  selectable = false,
  style,
  testID,
  ...textProps
}) => {
  const systemColorScheme = useColorScheme()

  // Determinar tema efectivo
  const effectiveTheme = useMemo(() => {
    if (theme === 'auto') {
      return systemColorScheme === 'dark' ? 'dark' : 'light'
    }
    return theme
  }, [theme, systemColorScheme])

  // Configuración responsiva
  const responsiveConfig = useMemo((): ResponsiveConfig => {
    if (typeof responsive === 'boolean') {
      return responsive ? DEFAULT_RESPONSIVE_CONFIG : { enabled: false }
    }
    return { ...DEFAULT_RESPONSIVE_CONFIG, ...responsive }
  }, [responsive])

  // Configuración de accesibilidad
  const accessibilityConfig = useMemo((): AccessibilityConfig => {
    return { ...DEFAULT_ACCESSIBILITY_CONFIG, ...accessibility }
  }, [accessibility])

  // Obtener configuración base de la variante
  const variantConfig = useMemo(() => {
    return getVariantConfig(variant)
  }, [variant])

  // Calcular tamaño de fuente final
  const finalFontSize = useMemo(() => {
    const baseSize = size ?? variantConfig.fontSize

    // Aplicar escalado responsivo
    const responsiveSize = scaleFont(
      baseSize,
      responsiveConfig.enabled,
      responsiveConfig
    )

    return responsiveSize
  }, [size, variantConfig.fontSize, responsiveConfig])

  // Aplicar configuraciones de accesibilidad
  const accessibilityProps = useMemo(() => {
    return applyAccessibilityScaling(finalFontSize, accessibilityConfig)
  }, [finalFontSize, accessibilityConfig])

  // Calcular line height final
  const finalLineHeight = useMemo(() => {
    if (lineHeight) return lineHeight

    return calculateLineHeight(
      accessibilityProps.fontSize,
      variantConfig.lineHeight
    )
  }, [lineHeight, accessibilityProps.fontSize, variantConfig.lineHeight])

  // Obtener color del texto
  const textColor = useMemo(() => {
    if (customColor) return customColor

    const themeColors = defaultTheme[effectiveTheme]
    return themeColors[color] || themeColors.primary
  }, [customColor, effectiveTheme, color])

  // Props para truncamiento
  const truncationProps = useMemo(() => {
    return getTruncationProps(truncate)
  }, [truncate])

  // Estilo final
  const finalStyle = useMemo((): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: accessibilityProps.fontSize,
      lineHeight: finalLineHeight,
      letterSpacing: letterSpacing ?? variantConfig.letterSpacing,
      fontFamily: getAleoFontFamily(weight ?? variantConfig.fontWeight, italic),
      color: textColor,
      textAlign: align,
      textTransform: transform,
      ...(highlight && {
        backgroundColor: effectiveTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4
      })
    }

    // Combinar con estilos personalizados
    if (Array.isArray(style)) {
      return [baseStyle, ...style] as TextStyle
    }

    return { ...baseStyle, ...style }
  }, [
    accessibilityProps.fontSize,
    finalLineHeight,
    letterSpacing,
    variantConfig.letterSpacing,
    weight,
    variantConfig.fontWeight,
    italic,
    textColor,
    align,
    transform,
    highlight,
    effectiveTheme,
    style
  ])

  return (
    <Text
      style={finalStyle}
      selectable={selectable}
      allowFontScaling={accessibilityProps.allowFontScaling}
      maxFontSizeMultiplier={accessibilityProps.maxFontSizeMultiplier}
      testID={testID}
      accessibilityRole="text"
      {...truncationProps}
      {...textProps}
    >
      {children}
    </Text>
  )
}

// Componentes predefinidos para uso común
export const Display = {
  Large: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="display-large" {...props} />
  ),
  Medium: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="display-medium" {...props} />
  ),
  Small: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="display-small" {...props} />
  )
}

export const Headline = {
  Large: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="headline-large" {...props} />
  ),
  Medium: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="headline-medium" {...props} />
  ),
  Small: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="headline-small" {...props} />
  )
}

export const Title = {
  Large: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="title-large" {...props} />
  ),
  Medium: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="title-medium" {...props} />
  ),
  Small: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="title-small" {...props} />
  )
}

export const Body = {
  Large: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="body-large" {...props} />
  ),
  Medium: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="body-medium" {...props} />
  ),
  Small: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="body-small" {...props} />
  )
}

export const Label = {
  Large: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="label-large" {...props} />
  ),
  Medium: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="label-medium" {...props} />
  ),
  Small: (props: Omit<ThemedTextProps, 'variant'>) => (
    <ThemedText variant="label-small" {...props} />
  )
}

export const Caption = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText variant="caption" {...props} />
)

export const Overline = (props: Omit<ThemedTextProps, 'variant'>) => (
  <ThemedText variant="overline" {...props} />
)