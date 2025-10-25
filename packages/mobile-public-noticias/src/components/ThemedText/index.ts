export { ThemedText, Display, Headline, Title, Body, Label, Caption, Overline } from './ThemedText'
export { FontShowcase } from './FontShowcase'
export type {
  ThemedTextProps,
  TextVariant,
  FontWeight,
  ThemeVariant,
  ResponsiveConfig,
  AccessibilityConfig,
  ThemedTextTheme,
  FontConfig,
  VariantDefinition
} from './types'
export {
  FONT_VARIANTS,
  FONT_WEIGHT_MAP,
  getResponsiveDimensions,
  calculateResponsiveScale,
  scaleFont,
  applyAccessibilityScaling,
  getDeviceInfo,
  DEFAULT_RESPONSIVE_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG
} from './utils'