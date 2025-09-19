# ThemedText Component - Documentación Completa

## Índice
1. [Introducción](#introducción)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [API Reference](#api-reference)
4. [Variantes de Texto](#variantes-de-texto)
5. [Sistema de Fuentes Aleo](#sistema-de-fuentes-aleo)
6. [Sistema de Temas](#sistema-de-temas)
7. [Responsividad y Accesibilidad](#responsividad-y-accesibilidad)
8. [Componentes Predefinidos](#componentes-predefinidos)
9. [Ejemplos de Uso](#ejemplos-de-uso)
10. [Mejores Prácticas](#mejores-prácticas)
11. [Troubleshooting](#troubleshooting)

## Introducción

ThemedText es un componente de texto avanzado diseñado para aplicaciones React Native con Expo. Proporciona:

- **17 variantes tipográficas** basadas en Material Design 3
- **18 variantes completas** de la fuente Aleo (incluyendo itálicas)
- **Sistema de temas** automático (light/dark)
- **Escalado responsivo** basado en dimensiones de pantalla
- **Soporte completo de accesibilidad** con control granular
- **Componentes predefinidos** para uso rápido

### Características Principales

- ✅ Escalado automático responsivo
- ✅ Control total sobre configuraciones de accesibilidad del dispositivo
- ✅ Soporte completo para fuente Aleo (18 variantes)
- ✅ Temas automáticos light/dark
- ✅ TypeScript estricto sin `any`
- ✅ Optimización de performance con useMemo
- ✅ Colores semánticos predefinidos
- ✅ Truncamiento inteligente de texto

## Instalación y Configuración

### 1. Configuración de Fuentes en _layout.tsx

```tsx
import { useFonts } from "expo-font";

export default function RootLayout() {
  const [loaded] = useFonts({
    // Aleo - 18 variantes completas
    "Aleo-Thin": require("@/assets/fonts/Aleo-Thin.ttf"),
    "Aleo-ThinItalic": require("@/assets/fonts/Aleo-ThinItalic.ttf"),
    "Aleo-ExtraLight": require("@/assets/fonts/Aleo-ExtraLight.ttf"),
    "Aleo-ExtraLightItalic": require("@/assets/fonts/Aleo-ExtraLightItalic.ttf"),
    "Aleo-Light": require("@/assets/fonts/Aleo-Light.ttf"),
    "Aleo-LightItalic": require("@/assets/fonts/Aleo-LightItalic.ttf"),
    "Aleo-Regular": require("@/assets/fonts/Aleo-Regular.ttf"),
    "Aleo-Italic": require("@/assets/fonts/Aleo-Italic.ttf"),
    "Aleo-Medium": require("@/assets/fonts/Aleo-Medium.ttf"),
    "Aleo-MediumItalic": require("@/assets/fonts/Aleo-MediumItalic.ttf"),
    "Aleo-SemiBold": require("@/assets/fonts/Aleo-SemiBold.ttf"),
    "Aleo-SemiBoldItalic": require("@/assets/fonts/Aleo-SemiBoldItalic.ttf"),
    "Aleo-Bold": require("@/assets/fonts/Aleo-Bold.ttf"),
    "Aleo-BoldItalic": require("@/assets/fonts/Aleo-BoldItalic.ttf"),
    "Aleo-ExtraBold": require("@/assets/fonts/Aleo-ExtraBold.ttf"),
    "Aleo-ExtraBoldItalic": require("@/assets/fonts/Aleo-ExtraBoldItalic.ttf"),
    "Aleo-Black": require("@/assets/fonts/Aleo-Black.ttf"),
    "Aleo-BlackItalic": require("@/assets/fonts/Aleo-BlackItalic.ttf"),
  });

  if (!loaded) return null;
  // resto del componente...
}
```

### 2. Importación del Componente

```tsx
import {
  ThemedText,
  Display,
  Headline,
  Title,
  Body,
  Label
} from '@/src/components/ThemedText'
```

## API Reference

### ThemedTextProps

```tsx
interface ThemedTextProps extends Omit<TextProps, 'style'> {
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
```

### Tipos Principales

```tsx
type TextVariant =
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

type FontWeight =
  | 'thin'        // 100 -> Aleo-Thin
  | 'ultralight'  // 200 -> Aleo-ExtraLight
  | 'light'       // 300 -> Aleo-Light
  | 'regular'     // 400 -> Aleo-Regular
  | 'medium'      // 500 -> Aleo-Medium
  | 'semibold'    // 600 -> Aleo-SemiBold
  | 'bold'        // 700 -> Aleo-Bold
  | 'heavy'       // 800 -> Aleo-ExtraBold
  | 'black'       // 900 -> Aleo-Black

type ThemeVariant = 'light' | 'dark' | 'auto'

type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify'
```

## Variantes de Texto

### Display (Títulos Principales)
```tsx
<ThemedText variant="display-large">Título Principal</ThemedText>   // 48px
<ThemedText variant="display-medium">Título Secundario</ThemedText> // 36px
<ThemedText variant="display-small">Título Pequeño</ThemedText>     // 32px
```

### Headlines (Encabezados)
```tsx
<ThemedText variant="headline-large">Headline Grande</ThemedText>   // 28px
<ThemedText variant="headline-medium">Headline Medio</ThemedText>   // 24px
<ThemedText variant="headline-small">Headline Pequeño</ThemedText>  // 22px
```

### Titles (Títulos de Sección)
```tsx
<ThemedText variant="title-large">Sección Principal</ThemedText>  // 20px
<ThemedText variant="title-medium">Sección Media</ThemedText>     // 18px
<ThemedText variant="title-small">Sección Pequeña</ThemedText>    // 16px
```

### Body (Texto Principal)
```tsx
<ThemedText variant="body-large">Texto principal grande</ThemedText>  // 16px
<ThemedText variant="body-medium">Texto estándar</ThemedText>         // 14px (default)
<ThemedText variant="body-small">Texto secundario</ThemedText>        // 12px
```

### Labels (Etiquetas)
```tsx
<ThemedText variant="label-large">Label importante</ThemedText>   // 14px
<ThemedText variant="label-medium">Label estándar</ThemedText>    // 12px
<ThemedText variant="label-small">Label pequeño</ThemedText>      // 10px
```

### Especializados
```tsx
<ThemedText variant="caption">Texto descriptivo</ThemedText>      // 10px
<ThemedText variant="overline">TEXTO SOBRELÍNEA</ThemedText>      // 9px
```

## Sistema de Fuentes Aleo

### Mapeo de Pesos Completo

| FontWeight | Fuente Normal | Fuente Itálica |
|------------|---------------|----------------|
| thin | Aleo-Thin | Aleo-ThinItalic |
| ultralight | Aleo-ExtraLight | Aleo-ExtraLightItalic |
| light | Aleo-Light | Aleo-LightItalic |
| regular | Aleo-Regular | Aleo-Italic |
| medium | Aleo-Medium | Aleo-MediumItalic |
| semibold | Aleo-SemiBold | Aleo-SemiBoldItalic |
| bold | Aleo-Bold | Aleo-BoldItalic |
| heavy | Aleo-ExtraBold | Aleo-ExtraBoldItalic |
| black | Aleo-Black | Aleo-BlackItalic |

### Ejemplos de Pesos
```tsx
<ThemedText weight="thin">Texto muy delgado</ThemedText>
<ThemedText weight="light">Texto ligero</ThemedText>
<ThemedText weight="regular">Texto normal</ThemedText>
<ThemedText weight="medium">Texto medio</ThemedText>
<ThemedText weight="bold">Texto en negrita</ThemedText>
<ThemedText weight="black">Texto muy pesado</ThemedText>

{/* Con itálicas */}
<ThemedText weight="medium" italic>Texto medio en itálica</ThemedText>
<ThemedText weight="bold" italic>Texto negrita en itálica</ThemedText>
```

## Sistema de Temas

### Colores Semánticos

```tsx
// Tema Light
const lightColors = {
  primary: '#000000',     // Texto principal
  secondary: '#666666',   // Texto secundario
  accent: '#007AFF',      // Texto de acento
  muted: '#8E8E93',       // Texto apagado
  disabled: '#C7C7CC',    // Texto deshabilitado
  error: '#FF3B30',       // Texto de error
  warning: '#FF9500',     // Texto de advertencia
  success: '#34C759',     // Texto de éxito
  info: '#5AC8FA'         // Texto informativo
}

// Tema Dark
const darkColors = {
  primary: '#FFFFFF',     // Texto principal
  secondary: '#AEAEB2',   // Texto secundario
  accent: '#0A84FF',      // Texto de acento
  muted: '#8E8E93',       // Texto apagado
  disabled: '#48484A',    // Texto deshabilitado
  error: '#FF453A',       // Texto de error
  warning: '#FF9F0A',     // Texto de advertencia
  success: '#30D158',     // Texto de éxito
  info: '#64D2FF'         // Texto informativo
}
```

### Uso de Colores
```tsx
<ThemedText color="primary">Texto principal</ThemedText>
<ThemedText color="secondary">Texto secundario</ThemedText>
<ThemedText color="accent">Texto de acento</ThemedText>
<ThemedText color="error">Texto de error</ThemedText>
<ThemedText color="success">Texto de éxito</ThemedText>

{/* Color personalizado */}
<ThemedText customColor="#FF6B35">Color personalizado</ThemedText>

{/* Forzar tema */}
<ThemedText theme="dark" color="primary">Siempre tema oscuro</ThemedText>
<ThemedText theme="light" color="primary">Siempre tema claro</ThemedText>
```

## Responsividad y Accesibilidad

### Configuración Responsiva
```tsx
interface ResponsiveConfig {
  enabled: boolean                    // Habilitar escalado responsivo
  baseWidth?: number                 // Ancho de referencia (default: 375)
  minScale?: number                  // Escala mínima (default: 0.8)
  maxScale?: number                  // Escala máxima (default: 1.4)
  useSmallestDimension?: boolean     // Usar dimensión más pequeña
}

// Ejemplos
<ThemedText responsive={false}>Sin escalado</ThemedText>

<ThemedText responsive={true}>Escalado automático</ThemedText>

<ThemedText responsive={{
  enabled: true,
  baseWidth: 414,
  minScale: 0.9,
  maxScale: 1.2
}}>
  Escalado personalizado
</ThemedText>
```

### Configuración de Accesibilidad
```tsx
interface AccessibilityConfig {
  allowFontScaling?: boolean          // Permitir escalado del sistema
  maxFontSizeMultiplier?: number     // Multiplicador máximo (default: 1.2)
  respectDeviceSettings?: boolean     // Respetar configuraciones del dispositivo
  dynamicTypeScaling?: boolean        // Escalado dinámico
}

// Ejemplos
<ThemedText accessibility={{
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.5,
  respectDeviceSettings: true
}}>
  Texto con accesibilidad mejorada
</ThemedText>

<ThemedText accessibility={{
  allowFontScaling: false,
  respectDeviceSettings: false
}}>
  Texto con tamaño fijo
</ThemedText>
```

### Configuraciones por Defecto
```tsx
const DEFAULT_RESPONSIVE_CONFIG = {
  enabled: true,
  baseWidth: 375,
  minScale: 0.8,
  maxScale: 1.4,
  useSmallestDimension: false
}

const DEFAULT_ACCESSIBILITY_CONFIG = {
  allowFontScaling: true,
  maxFontSizeMultiplier: 1.2,
  respectDeviceSettings: true,
  dynamicTypeScaling: false
}
```

## Componentes Predefinidos

### Display
```tsx
import { Display } from '@/src/components/ThemedText'

<Display.Large>Título Principal</Display.Large>       // display-large
<Display.Medium>Título Secundario</Display.Medium>    // display-medium
<Display.Small>Título Pequeño</Display.Small>         // display-small
```

### Headline
```tsx
import { Headline } from '@/src/components/ThemedText'

<Headline.Large>Headline Grande</Headline.Large>      // headline-large
<Headline.Medium>Headline Medio</Headline.Medium>     // headline-medium
<Headline.Small>Headline Pequeño</Headline.Small>     // headline-small
```

### Title
```tsx
import { Title } from '@/src/components/ThemedText'

<Title.Large>Sección Principal</Title.Large>          // title-large
<Title.Medium>Sección Media</Title.Medium>            // title-medium
<Title.Small>Sección Pequeña</Title.Small>            // title-small
```

### Body
```tsx
import { Body } from '@/src/components/ThemedText'

<Body.Large>Texto principal grande</Body.Large>       // body-large
<Body.Medium>Texto estándar</Body.Medium>             // body-medium
<Body.Small>Texto secundario</Body.Small>             // body-small
```

### Label
```tsx
import { Label } from '@/src/components/ThemedText'

<Label.Large>Label importante</Label.Large>           // label-large
<Label.Medium>Label estándar</Label.Medium>           // label-medium
<Label.Small>Label pequeño</Label.Small>              // label-small
```

### Especializados
```tsx
import { Caption, Overline } from '@/src/components/ThemedText'

<Caption>Texto descriptivo</Caption>                  // caption
<Overline>TEXTO SOBRELÍNEA</Overline>                // overline
```

## Ejemplos de Uso

### Ejemplo Básico
```tsx
import { ThemedText } from '@/src/components/ThemedText'

export function MyComponent() {
  return (
    <View>
      <ThemedText variant="title-large" color="primary">
        Título de la Sección
      </ThemedText>
      <ThemedText variant="body-medium" color="secondary">
        Este es el contenido principal de la sección con texto que se adapta
        automáticamente al tema del sistema.
      </ThemedText>
    </View>
  )
}
```

### Ejemplo con Componentes Predefinidos
```tsx
import { Display, Body, Label } from '@/src/components/ThemedText'

export function WelcomeScreen() {
  return (
    <View>
      <Display.Large color="accent">¡Bienvenido!</Display.Large>
      <Body.Medium style={{ marginVertical: 16 }}>
        Esta aplicación utiliza el sistema de tipografía ThemedText
        con soporte completo para la fuente Aleo.
      </Body.Medium>
      <Label.Small color="muted">v1.0.0</Label.Small>
    </View>
  )
}
```

### Ejemplo con Configuración Avanzada
```tsx
export function AdvancedTextExample() {
  return (
    <ScrollView>
      {/* Título responsivo con configuración personalizada */}
      <ThemedText
        variant="headline-large"
        weight="bold"
        color="primary"
        responsive={{
          enabled: true,
          baseWidth: 414,
          minScale: 0.9,
          maxScale: 1.3
        }}
        accessibility={{
          allowFontScaling: true,
          maxFontSizeMultiplier: 1.5
        }}
      >
        Título Adaptable
      </ThemedText>

      {/* Texto con truncamiento */}
      <ThemedText
        variant="body-medium"
        truncate={2}
        style={{ marginVertical: 8 }}
      >
        Este es un texto muy largo que será truncado después de dos líneas
        para mantener una interfaz limpia y organizada en la aplicación móvil.
      </ThemedText>

      {/* Texto destacado */}
      <ThemedText
        variant="body-small"
        highlight
        italic
        weight="medium"
      >
        Texto destacado con fondo
      </ThemedText>

      {/* Texto con transformación */}
      <ThemedText
        variant="overline"
        transform="uppercase"
        letterSpacing={2}
        color="muted"
      >
        Categoría Principal
      </ThemedText>
    </ScrollView>
  )
}
```

### Ejemplo de Lista con Diferentes Variantes
```tsx
export function TypographyShowcase() {
  const variants: { variant: TextVariant; label: string }[] = [
    { variant: 'display-large', label: 'Display Large (48px)' },
    { variant: 'headline-medium', label: 'Headline Medium (24px)' },
    { variant: 'title-large', label: 'Title Large (20px)' },
    { variant: 'body-medium', label: 'Body Medium (14px)' },
    { variant: 'label-small', label: 'Label Small (10px)' },
  ]

  return (
    <View>
      {variants.map(({ variant, label }) => (
        <View key={variant} style={{ marginBottom: 16 }}>
          <ThemedText variant={variant}>
            Texto de ejemplo
          </ThemedText>
          <ThemedText variant="caption" color="muted">
            {label}
          </ThemedText>
        </View>
      ))}
    </View>
  )
}
```

### Ejemplo con Estados de Error
```tsx
export function FormExample() {
  const [hasError, setHasError] = useState(false)

  return (
    <View>
      <Label.Medium color={hasError ? 'error' : 'primary'}>
        Email Address
      </Label.Medium>

      <TextInput
        style={[
          styles.input,
          hasError && styles.inputError
        ]}
        placeholder="Enter your email"
      />

      {hasError && (
        <ThemedText variant="caption" color="error">
          Please enter a valid email address
        </ThemedText>
      )}
    </View>
  )
}
```

## Mejores Prácticas

### 1. Jerarquía Visual
```tsx
// ✅ Correcto: Usar jerarquía clara
<Display.Large>Página Principal</Display.Large>
<Headline.Medium>Sección Importante</Headline.Medium>
<Title.Small>Subsección</Title.Small>
<Body.Medium>Contenido principal</Body.Medium>

// ❌ Incorrecto: Jerarquía confusa
<Body.Large>Página Principal</Body.Large>  // Muy pequeño para título principal
<Display.Small>Contenido</Display.Small>    // Muy grande para contenido
```

### 2. Colores Semánticos
```tsx
// ✅ Correcto: Usar colores semánticos
<ThemedText color="error">Error en la validación</ThemedText>
<ThemedText color="success">Operación exitosa</ThemedText>
<ThemedText color="warning">Advertencia importante</ThemedText>

// ❌ Incorrecto: Colores hardcodeados
<ThemedText customColor="red">Error en la validación</ThemedText>
<ThemedText style={{ color: '#00FF00' }}>Operación exitosa</ThemedText>
```

### 3. Responsividad
```tsx
// ✅ Correcto: Configuración responsiva apropiada
<ThemedText
  variant="title-large"
  responsive={true}  // Permite escalado automático
>
  Título que se adapta
</ThemedText>

// ✅ Correcto: Desactivar responsividad cuando sea necesario
<ThemedText
  variant="caption"
  responsive={false}  // Mantener tamaño fijo para metadatos
>
  Marca de tiempo: 12:34 PM
</ThemedText>
```

### 4. Accesibilidad
```tsx
// ✅ Correcto: Permitir escalado para accesibilidad
<ThemedText
  accessibility={{
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.5
  }}
>
  Contenido importante
</ThemedText>

// ✅ Correcto: Usar truncamiento inteligente
<ThemedText truncate={2}>
  Texto largo que puede necesitar ser truncado para mantener la interfaz limpia
</ThemedText>
```

### 5. Performance
```tsx
// ✅ Correcto: Usar componentes predefinidos
<Title.Large>Mi Título</Title.Large>

// ❌ Menos eficiente: Especificar variant cada vez
<ThemedText variant="title-large">Mi Título</ThemedText>

// ✅ Correcto: Reutilizar configuraciones
const errorTextProps = {
  color: 'error' as const,
  variant: 'caption' as const
}

<ThemedText {...errorTextProps}>Error 1</ThemedText>
<ThemedText {...errorTextProps}>Error 2</ThemedText>
```

### 6. Consistencia de Fuentes
```tsx
// ✅ Correcto: Usar pesos consistentes con la familia Aleo
<ThemedText weight="medium">Texto medio</ThemedText>
<ThemedText weight="semibold">Texto semi-negrita</ThemedText>

// ✅ Correcto: Combinar con itálicas cuando sea apropiado
<ThemedText weight="regular" italic>Texto en itálica</ThemedText>
<ThemedText weight="bold" italic>Negrita en itálica</ThemedText>
```

## Troubleshooting

### Problema: Fuentes no cargan correctamente
```tsx
// Verificar que todas las fuentes estén en _layout.tsx
const [loaded] = useFonts({
  "Aleo-Regular": require("@/assets/fonts/Aleo-Regular.ttf"),
  // ... todas las 18 variantes
});

if (!loaded) return null; // Importante: no renderizar hasta que carguen
```

### Problema: Texto muy pequeño en dispositivos grandes
```tsx
// Ajustar configuración responsiva
<ThemedText
  responsive={{
    enabled: true,
    baseWidth: 375,
    maxScale: 1.6  // Aumentar escala máxima
  }}
>
  Texto que escala mejor
</ThemedText>
```

### Problema: Texto no respeta tema del sistema
```tsx
// Asegurarse de que theme esté en "auto" (default)
<ThemedText theme="auto" color="primary">
  Se adapta al tema del sistema
</ThemedText>

// O usar useColorScheme para debugging
import { useColorScheme } from 'react-native'
const colorScheme = useColorScheme()
console.log('Current scheme:', colorScheme)
```

### Problema: Performance con muchos componentes de texto
```tsx
// Usar componentes predefinidos
import { Body, Title } from '@/src/components/ThemedText'

// ✅ Más eficiente
<Body.Medium>Contenido</Body.Medium>

// ❌ Menos eficiente
<ThemedText variant="body-medium">Contenido</ThemedText>
```

### Problema: Accesibilidad no funciona como esperado
```tsx
// Verificar configuración de accesibilidad
<ThemedText
  accessibility={{
    allowFontScaling: true,
    maxFontSizeMultiplier: 1.3,
    respectDeviceSettings: true
  }}
  accessibilityRole="text"  // Añadir role explícito
>
  Texto accesible
</ThemedText>
```

### Debugging: Información del Dispositivo
```tsx
import { getDeviceInfo } from '@/src/components/ThemedText/utils'

// Para debugging
const deviceInfo = getDeviceInfo()
console.log('Device info:', deviceInfo)
/*
Output example:
{
  width: 414,
  height: 896,
  scale: 2,
  fontScale: 1,
  responsiveScale: 1.104,
  isTablet: false,
  isPhablet: true,
  isSmallDevice: false
}
*/
```

---

## Conclusión

ThemedText proporciona una solución completa para tipografía en React Native, combinando:

- **Flexibilidad**: 17 variantes + configuración personalizada
- **Rendimiento**: Optimizado con useMemo y componentes predefinidos
- **Accesibilidad**: Control granular sobre configuraciones del dispositivo
- **Responsive**: Escalado automático basado en dimensiones de pantalla
- **Consistencia**: Sistema de temas y colores semánticos
- **Developer Experience**: TypeScript estricto y API intuitiva

Para más información sobre implementaciones específicas o casos de uso avanzados, consultar los archivos fuente en `/src/components/ThemedText/`.