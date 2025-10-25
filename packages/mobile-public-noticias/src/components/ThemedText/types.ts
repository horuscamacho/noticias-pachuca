import { type TextProps, type TextStyle } from 'react-native'

export type ThemeVariant = 'light' | 'dark' | 'auto'

export type TextVariant =
  | 'display-large'      // 48px - Títulos principales de pantalla
  | 'display-medium'     // 36px - Títulos secundarios
  | 'display-small'      // 32px - Títulos pequeños
  | 'headline-large'     // 28px - Headlines importantes
  | 'headline-medium'    // 24px - Headlines estándar
  | 'headline-small'     // 22px - Headlines pequeños
  | 'title-large'        // 20px - Títulos de sección
  | 'title-medium'       // 18px - Títulos medianos
  | 'title-small'        // 16px - Títulos pequeños
  | 'body-large'         // 16px - Texto principal grande
  | 'body-medium'        // 14px - Texto estándar
  | 'body-small'         // 12px - Texto secundario
  | 'label-large'        // 14px - Labels importantes
  | 'label-medium'       // 12px - Labels estándar
  | 'label-small'        // 10px - Labels pequeños
  | 'caption'            // 10px - Texto descriptivo
  | 'overline'           // 9px - Texto sobrelínea

export type FontWeight =
  | 'thin'        // 100
  | 'ultralight'  // 200
  | 'light'       // 300
  | 'regular'     // 400
  | 'medium'      // 500
  | 'semibold'    // 600
  | 'bold'        // 700
  | 'heavy'       // 800
  | 'black'       // 900

export type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify'

export type TextTransform = 'none' | 'capitalize' | 'uppercase' | 'lowercase'

export interface ResponsiveConfig {
  /** Habilitar dimensionamiento responsivo basado en pantalla */
  enabled: boolean
  /** Ancho de referencia para cálculos (default: 375) */
  baseWidth?: number
  /** Factor de escala mínimo (default: 0.8) */
  minScale?: number
  /** Factor de escala máximo (default: 1.4) */
  maxScale?: number
  /** Usar la dimensión más pequeña (width/height) para cálculos */
  useSmallestDimension?: boolean
}

export interface AccessibilityConfig {
  /** Permitir escalado por configuraciones del dispositivo */
  allowFontScaling?: boolean
  /** Multiplicador máximo para escalado (default: 1.2) */
  maxFontSizeMultiplier?: number
  /** Respetar configuraciones de accesibilidad extremas */
  respectDeviceSettings?: boolean
  /** Escalado dinámico basado en configuraciones de usuario */
  dynamicTypeScaling?: boolean
}

export interface ThemedTextTheme {
  light: {
    primary: string
    secondary: string
    accent: string
    muted: string
    disabled: string
    error: string
    warning: string
    success: string
    info: string
  }
  dark: {
    primary: string
    secondary: string
    accent: string
    muted: string
    disabled: string
    error: string
    warning: string
    success: string
    info: string
  }
}

export interface ThemedTextProps extends Omit<TextProps, 'style'> {
  /** Variante de texto predefinida */
  variant?: TextVariant

  /** Color del texto (semantic colors) */
  color?: keyof ThemedTextTheme['light']

  /** Color personalizado (overrides semantic color) */
  customColor?: string

  /** Peso de la fuente */
  weight?: FontWeight

  /** Texto en itálica */
  italic?: boolean

  /** Tamaño de fuente personalizado (overrides variant) */
  size?: number

  /** Altura de línea personalizada */
  lineHeight?: number

  /** Espaciado entre letras */
  letterSpacing?: number

  /** Alineación del texto */
  align?: TextAlign

  /** Transformación del texto */
  transform?: TextTransform

  /** Tema a usar */
  theme?: ThemeVariant

  /** Configuración responsiva */
  responsive?: ResponsiveConfig | boolean

  /** Configuración de accesibilidad */
  accessibility?: AccessibilityConfig

  /** Animaciones habilitadas */
  animated?: boolean

  /** Truncar texto con ellipsis */
  truncate?: boolean | number

  /** Destacar/resaltar texto */
  highlight?: boolean

  /** Texto seleccionable */
  selectable?: boolean

  /** Estilo personalizado adicional */
  style?: TextStyle | TextStyle[]

  /** ID para testing */
  testID?: string
}

export interface FontConfig {
  fontSize: number
  lineHeight: number
  letterSpacing?: number
  fontWeight: FontWeight
}

export interface VariantDefinition {
  [key: string]: FontConfig
}

export interface ResponsiveDimensions {
  width: number
  height: number
  scale: number
  fontScale: number
}

export interface AccessibilityInfo {
  isScreenReaderEnabled: boolean
  isReduceMotionEnabled: boolean
  fontScale: number
  colorScheme: 'light' | 'dark' | null
}