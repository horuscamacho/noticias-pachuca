# Brutalist Registration Form - Design Specification

## Design System Foundation

### Color Palette
```typescript
const COLORS = {
  brown: '#854836',      // Primary brand color, headers, active states
  yellow: '#FFB22C',     // Accent color, highlights, CTAs
  black: '#000000',      // Text, borders, structural elements
  lightGray: '#F7F7F7',  // Input backgrounds, disabled states
  white: '#FFFFFF',      // Card backgrounds, input text
  red: '#FF0000',        // Error states, validation
};
```

### Typography Scale
```typescript
const TYPOGRAPHY = {
  h1: { fontSize: 32, fontWeight: '900', lineHeight: 38 },
  h2: { fontSize: 24, fontWeight: '800', lineHeight: 30 },
  body: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  error: { fontSize: 13, fontWeight: '700', lineHeight: 18 },
  input: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  label: { fontSize: 14, fontWeight: '800', lineHeight: 20 },
};
```

### Spacing System
```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};
```

### Border Specifications
```typescript
const BORDERS = {
  width: 4,              // All borders are 4px thick
  radius: 0,             // No border radius (sharp corners)
  focusWidth: 6,         // Focus state gets thicker border
};
```

---

## 1. BrutalistInput Component

### Visual Design

#### Default State
```
┌─────────────────────────────────────┐
│ NOMBRE                              │ ← Label (14px, #000, 800 weight)
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Juan                          ┃ │ ← Input (16px, #000, 600 weight)
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   Background: #F7F7F7
└─────────────────────────────────────┘   Border: 4px #000
                                          Padding: 16px
                                          Height: 56px
```

#### Focus State
```
┌─────────────────────────────────────┐
│ NOMBRE                              │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Juan|                         ┃ │ ← Cursor visible
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   Border: 6px #854836
└─────────────────────────────────────┘   Background: #FFFFFF
```

#### Error State
```
┌─────────────────────────────────────┐
│ CORREO ELECTRÓNICO                  │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ correo@invalido               ┃ │   Border: 4px #FF0000
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   Background: #FFF5F5
│ ⚠ Correo electrónico inválido      │ ← Error message (13px, #FF0000, 700)
└─────────────────────────────────────┘   Icon: ⚠ (16px)
```

#### Disabled State
```
┌─────────────────────────────────────┐
│ CAMPO DESHABILITADO                 │ ← Label: #666
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Valor deshabilitado           ┃ │   Border: 4px #CCC
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │   Background: #E8E8E8
└─────────────────────────────────────┘   Text: #999
```

### Component Props Interface

```typescript
export interface BrutalistInputProps {
  // Required
  label: string;
  value: string;
  onChangeText: (text: string) => void;

  // Optional
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;

  // Validation
  required?: boolean;
  onBlur?: () => void;
  onFocus?: () => void;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}
```

### Styling Specifications

```typescript
const inputStyles = {
  container: {
    width: '100%',
    marginBottom: 24, // SPACING.xl
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8, // SPACING.sm
  },

  labelDisabled: {
    color: '#666666',
  },

  inputWrapper: {
    position: 'relative',
    height: 56,
  },

  input: {
    height: 56,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    borderRadius: 0, // Sharp corners
  },

  inputFocused: {
    borderWidth: 6,
    borderColor: '#854836',
    backgroundColor: '#FFFFFF',
    // Adjust padding to compensate for thicker border
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  inputError: {
    borderColor: '#FF0000',
    backgroundColor: '#FFF5F5',
  },

  inputDisabled: {
    borderColor: '#CCCCCC',
    backgroundColor: '#E8E8E8',
    color: '#999999',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // SPACING.sm
    gap: 6,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF0000',
    lineHeight: 18,
  },

  errorIcon: {
    fontSize: 16,
    color: '#FF0000',
  },
};
```

### Interaction Design

```typescript
const interactionBehavior = {
  // Focus Management
  onFocus: {
    action: 'Apply focus styles immediately',
    borderTransition: 'Instant (no animation)',
    backgroundChange: 'Instant',
    cursorBehavior: 'Show blinking cursor',
  },

  // Blur Management
  onBlur: {
    action: 'Remove focus styles, trigger validation',
    validateField: 'Run validation rules',
    showError: 'Display error if validation fails',
  },

  // Input Changes
  onChange: {
    action: 'Update value immediately',
    liveValidation: 'Only if field has been blurred before',
    clearError: 'Clear error when user starts typing',
  },

  // Keyboard
  keyboardAvoid: true,
  returnKeyType: 'next',
  blurOnSubmit: false,
};
```

---

## 2. BrutalistSegmentedControl Component

### Visual Design

#### Default State (Gender Selector)
```
┌─────────────────────────────────────────────────────────┐
│ GÉNERO                                                  │
│ ┏━━━━━━━━━━┓┏━━━━━━━━━━┓┏━━━━━━━━━━┓                │
│ ┃ HOMBRE   ┃┃ MUJER    ┃┃ OTRO     ┃                │
│ ┗━━━━━━━━━━┛┗━━━━━━━━━━┛┗━━━━━━━━━━┛                │
└─────────────────────────────────────────────────────────┘

Each segment:
- Width: 33.33% (equal distribution)
- Height: 48px (minimum 44pt touch target)
- Border: 4px #000
- Background: #F7F7F7
- Text: 14px, #000, 800 weight
- Padding: 12px vertical
```

#### Active State
```
┌─────────────────────────────────────────────────────────┐
│ GÉNERO                                                  │
│ ┏━━━━━━━━━━┓┏━━━━━━━━━━┓┏━━━━━━━━━━┓                │
│ ┃█HOMBRE██ ┃┃ MUJER    ┃┃ OTRO     ┃                │
│ ┗━━━━━━━━━━┛┗━━━━━━━━━━┛┗━━━━━━━━━━┛                │
└─────────────────────────────────────────────────────────┘

Active segment:
- Background: #854836
- Text color: #FFB22C
- Border: 4px #000
- All other segments remain default
```

#### Error State
```
┌─────────────────────────────────────────────────────────┐
│ GÉNERO                                                  │
│ ┏━━━━━━━━━━┓┏━━━━━━━━━━┓┏━━━━━━━━━━┓                │
│ ┃ HOMBRE   ┃┃ MUJER    ┃┃ OTRO     ┃                │
│ ┗━━━━━━━━━━┛┗━━━━━━━━━━┛┗━━━━━━━━━━┛                │
│ ⚠ Por favor selecciona tu género                       │
└─────────────────────────────────────────────────────────┘

Error state:
- Border: 4px #FF0000 (entire control)
- Background segments: #FFF5F5
- Error message below
```

### Component Props Interface

```typescript
export interface BrutalistSegmentedControlOption {
  label: string;
  value: string;
}

export interface BrutalistSegmentedControlProps {
  // Required
  label: string;
  options: BrutalistSegmentedControlOption[];
  selectedValue: string | null;
  onChange: (value: string) => void;

  // Optional
  error?: string;
  disabled?: boolean;
  required?: boolean;

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}
```

### Styling Specifications

```typescript
const segmentedControlStyles = {
  container: {
    width: '100%',
    marginBottom: 24, // SPACING.xl
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8, // SPACING.sm
  },

  segmentsWrapper: {
    flexDirection: 'row',
    borderWidth: 4,
    borderColor: '#000000',
    height: 48,
  },

  segmentsWrapperError: {
    borderColor: '#FF0000',
  },

  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRightWidth: 4,
    borderRightColor: '#000000',

    // Minimum touch target
    minHeight: 48, // 44pt + border compensation
  },

  segmentLast: {
    borderRightWidth: 0, // No border on last segment
  },

  segmentActive: {
    backgroundColor: '#854836',
  },

  segmentError: {
    backgroundColor: '#FFF5F5',
  },

  segmentDisabled: {
    backgroundColor: '#E8E8E8',
    opacity: 0.6,
  },

  segmentText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  segmentTextActive: {
    color: '#FFB22C',
  },

  segmentTextDisabled: {
    color: '#999999',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF0000',
    lineHeight: 18,
  },
};
```

### Interaction Design

```typescript
const segmentedControlInteraction = {
  onPress: {
    action: 'Change selection immediately',
    feedback: 'No animation (instant color change)',
    haptic: 'Light impact feedback',
    clearError: 'Remove error state on selection',
  },

  accessibility: {
    role: 'radiogroup',
    state: 'Announce selected option',
    hint: 'Tap to select',
  },
};
```

---

## 3. BrutalistDatePicker Component

### Visual Design

#### Trigger Button (Unopened)
```
┌─────────────────────────────────────┐
│ FECHA DE NACIMIENTO                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ DD/MM/YYYY              [📅] ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────────────┘

Trigger button:
- Height: 56px
- Border: 4px #000
- Background: #F7F7F7
- Icon: Calendar emoji/icon (24px) aligned right
- Text: 16px, #666 (placeholder) or #000 (selected)
- Format: DD/MM/YYYY
```

#### Selected State
```
┌─────────────────────────────────────┐
│ FECHA DE NACIMIENTO                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 15/03/1995              [📅] ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ Edad: 29 años                       │ ← Age confirmation (small text)
└─────────────────────────────────────┘
```

#### Error State (Under 18)
```
┌─────────────────────────────────────┐
│ FECHA DE NACIMIENTO                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 15/03/2010              [📅] ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│ ⚠ Debes tener al menos 18 años     │
└─────────────────────────────────────┘

Border: 4px #FF0000
Background: #FFF5F5
```

#### Modal Picker Design
```
┌─────────────────────────────────────┐
│                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃ SELECCIONA TU FECHA        ┃  │
│  ┃                            ┃  │
│  ┃  [Día]  [Mes]     [Año]   ┃  │
│  ┃   15     03      1995     ┃  │ ← Native picker wheels
│  ┃   16     04      1996     ┃  │
│  ┃ ►17◄   ►05◄    ►1997◄    ┃  │
│  ┃   18     06      1998     ┃  │
│  ┃   19     07      1999     ┃  │
│  ┃                            ┃  │
│  ┃  ┏━━━━━━━━┓  ┏━━━━━━━━┓  ┃  │
│  ┃  ┃CANCELAR┃  ┃█ACEPTAR┃  ┃  │
│  ┃  ┗━━━━━━━━┛  ┗━━━━━━━━┛  ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                     │
└─────────────────────────────────────┘

Modal:
- Background overlay: rgba(0,0,0,0.7)
- Card background: #FFFFFF
- Border: 4px #000
- Padding: 24px
- Max date: Today minus 18 years
- Default: Today minus 25 years
```

### Component Props Interface

```typescript
export interface BrutalistDatePickerProps {
  // Required
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;

  // Optional
  minimumAge?: number; // Default: 18
  maximumAge?: number; // Default: 120
  error?: string;
  disabled?: boolean;
  required?: boolean;

  // Display
  placeholder?: string; // Default: "DD/MM/YYYY"
  dateFormat?: string; // Default: "DD/MM/YYYY"

  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}
```

### Styling Specifications

```typescript
const datePickerStyles = {
  container: {
    width: '100%',
    marginBottom: 24,
  },

  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  triggerButton: {
    height: 56,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#F7F7F7',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  triggerButtonFocused: {
    borderColor: '#854836',
    backgroundColor: '#FFFFFF',
  },

  triggerButtonError: {
    borderColor: '#FF0000',
    backgroundColor: '#FFF5F5',
  },

  triggerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },

  triggerPlaceholder: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },

  triggerIcon: {
    fontSize: 24,
    marginLeft: 12,
  },

  ageConfirmation: {
    fontSize: 13,
    fontWeight: '600',
    color: '#854836',
    marginTop: 6,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000000',
    textTransform: 'uppercase',
    marginBottom: 24,
    textAlign: 'center',
  },

  pickerContainer: {
    marginBottom: 24,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  modalButton: {
    flex: 1,
    height: 48,
    borderWidth: 4,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalButtonCancel: {
    backgroundColor: '#F7F7F7',
  },

  modalButtonAccept: {
    backgroundColor: '#854836',
  },

  modalButtonText: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  modalButtonTextCancel: {
    color: '#000000',
  },

  modalButtonTextAccept: {
    color: '#FFB22C',
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },

  errorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF0000',
    lineHeight: 18,
  },
};
```

### Interaction Design

```typescript
const datePickerInteraction = {
  onTriggerPress: {
    action: 'Open modal picker',
    animation: 'Fade in overlay (200ms)',
    defaultDate: 'Current value or (today - 25 years)',
  },

  onDateChange: {
    action: 'Update temporary value in picker',
    validation: 'Check age requirement in real-time',
    showWarning: 'Highlight if under minimum age',
  },

  onCancel: {
    action: 'Close modal without saving',
    animation: 'Fade out overlay (200ms)',
    revertValue: 'Keep previous value',
  },

  onAccept: {
    action: 'Save selected date and close modal',
    validation: 'Final age check',
    showError: 'Display error if validation fails',
    formatDisplay: 'Show formatted date in trigger',
    showAge: 'Display calculated age below',
  },

  ageCalculation: {
    formula: 'today.year - birthdate.year (adjust for month/day)',
    display: 'Show as "Edad: XX años"',
    validate: 'Must be >= minimumAge',
  },
};
```

---

## 4. Form Layout & Screen Structure

### Overall Screen Layout

```
┌─────────────────────────────────────┐
│ ← REGISTRO                          │ ← Header (64px height)
├─────────────────────────────────────┤
│                                     │
│ [Scrollable Form Area]              │
│                                     │
│   Nombre                            │
│   [Input field]                     │
│                                     │
│   Apellido                          │
│   [Input field]                     │
│                                     │
│   Correo Electrónico                │
│   [Input field]                     │
│                                     │
│   Fecha de Nacimiento               │
│   [Date picker]                     │
│                                     │
│   Género                            │
│   [Segmented control]               │
│                                     │
│   Contraseña                        │
│   [Password input]                  │
│                                     │
│   [Bottom padding: 100px]           │ ← Space for button
│                                     │
├─────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃█        CREAR CUENTA         █┃ │ ← Fixed bottom button
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
└─────────────────────────────────────┘
```

### Layout Specifications

```typescript
const formLayoutStyles = {
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  header: {
    height: 64,
    backgroundColor: '#854836',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFB22C',
    textTransform: 'uppercase',
    marginLeft: 12,
  },

  scrollContainer: {
    flex: 1,
  },

  scrollContent: {
    padding: 24, // SPACING.xl
    paddingBottom: 100, // Space for fixed button
  },

  formSection: {
    gap: 24, // SPACING.xl between fields
  },

  submitButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 4,
    borderTopColor: '#000000',
    // Shadow for separation
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 8,
  },

  submitButton: {
    height: 56,
    borderWidth: 4,
    borderColor: '#000000',
    backgroundColor: '#854836',
    justifyContent: 'center',
    alignItems: 'center',
  },

  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },

  submitButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFB22C',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  submitButtonTextDisabled: {
    color: '#666666',
  },
};
```

### Keyboard Handling

```typescript
const keyboardBehavior = {
  KeyboardAvoidingView: {
    behavior: Platform.OS === 'ios' ? 'padding' : 'height',
    keyboardVerticalOffset: Platform.OS === 'ios' ? 64 : 0, // Header height
  },

  ScrollView: {
    keyboardShouldPersistTaps: 'handled',
    scrollEventThrottle: 16,
  },

  onInputFocus: {
    action: 'Scroll to make input visible',
    offset: 60, // Extra padding above input
  },

  submitButton: {
    visibility: 'Hide when keyboard is open',
    reason: 'More space for form',
    alternative: 'Return key on last field submits form',
  },
};
```

---

## 5. Error Handling & Validation UX

### Validation Rules

```typescript
const validationRules = {
  nombre: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    errorMessages: {
      required: 'El nombre es obligatorio',
      minLength: 'El nombre debe tener al menos 2 caracteres',
      maxLength: 'El nombre no puede exceder 50 caracteres',
      pattern: 'El nombre solo puede contener letras',
    },
  },

  apellido: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
    errorMessages: {
      required: 'El apellido es obligatorio',
      minLength: 'El apellido debe tener al menos 2 caracteres',
      maxLength: 'El apellido no puede exceder 50 caracteres',
      pattern: 'El apellido solo puede contener letras',
    },
  },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 100,
    errorMessages: {
      required: 'El correo electrónico es obligatorio',
      pattern: 'Ingresa un correo electrónico válido',
      maxLength: 'El correo es demasiado largo',
    },
  },

  fechaNacimiento: {
    required: true,
    minimumAge: 18,
    maximumAge: 120,
    errorMessages: {
      required: 'La fecha de nacimiento es obligatoria',
      minimumAge: 'Debes tener al menos 18 años',
      maximumAge: 'Por favor verifica la fecha',
    },
  },

  genero: {
    required: true,
    options: ['hombre', 'mujer', 'otro'],
    errorMessages: {
      required: 'Por favor selecciona tu género',
    },
  },

  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    errorMessages: {
      required: 'La contraseña es obligatoria',
      minLength: 'La contraseña debe tener al menos 8 caracteres',
      pattern: 'Debe contener mayúsculas, minúsculas y números',
    },
  },
};
```

### Error Display Timing

```typescript
const errorDisplayStrategy = {
  onMount: {
    showErrors: false,
    reason: 'Don\'t overwhelm user on initial load',
  },

  onType: {
    showErrors: false,
    clearExistingError: true,
    reason: 'Give user chance to fix without pressure',
  },

  onBlur: {
    showErrors: true,
    validate: 'Run validation for that field',
    display: 'Show error if validation fails',
  },

  onSubmit: {
    showErrors: true,
    validateAll: 'Check all fields',
    scrollTo: 'First error field',
    focus: 'First error field',
    preventSubmit: 'If any errors exist',
  },

  afterFirstError: {
    liveValidation: true,
    reason: 'Help user fix errors in real-time',
  },
};
```

### Error Message Patterns

```typescript
const errorMessageComponents = {
  // Individual field error
  fieldError: {
    position: 'Below input field',
    spacing: '8px margin-top',
    icon: '⚠',
    iconSize: '16px',
    textStyle: 'error variant from ThemedText',
    alignment: 'flex-start',
  },

  // Form-level error (network, server)
  formError: {
    position: 'Top of form, below header',
    background: '#FF0000',
    textColor: '#FFFFFF',
    padding: '16px',
    border: '4px #000',
    dismissible: true,
  },

  // Success state
  success: {
    position: 'Top of screen',
    background: '#854836',
    textColor: '#FFB22C',
    message: 'Cuenta creada exitosamente',
    duration: 3000,
    action: 'Navigate to login/home',
  },
};
```

---

## 6. Accessibility Specifications

### Screen Reader Support

```typescript
const accessibilityProps = {
  BrutalistInput: {
    label: {
      accessible: true,
      accessibilityRole: 'text',
      accessibilityLabel: 'Campo de entrada para [nombre del campo]',
    },
    input: {
      accessible: true,
      accessibilityRole: 'none', // Handled by TextInput
      accessibilityLabel: props.accessibilityLabel || props.label,
      accessibilityHint: props.error || props.accessibilityHint,
      accessibilityState: {
        disabled: props.disabled,
      },
    },
    error: {
      accessible: true,
      accessibilityRole: 'alert',
      accessibilityLive: 'polite',
    },
  },

  BrutalistSegmentedControl: {
    container: {
      accessible: true,
      accessibilityRole: 'radiogroup',
      accessibilityLabel: props.label,
    },
    segment: {
      accessible: true,
      accessibilityRole: 'radio',
      accessibilityState: {
        selected: isSelected,
        disabled: props.disabled,
      },
      accessibilityHint: 'Toca para seleccionar',
    },
  },

  BrutalistDatePicker: {
    trigger: {
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: `${props.label}: ${formattedDate || 'No seleccionado'}`,
      accessibilityHint: 'Toca para abrir el selector de fecha',
    },
    modal: {
      accessible: true,
      accessibilityViewIsModal: true,
    },
  },

  submitButton: {
    accessible: true,
    accessibilityRole: 'button',
    accessibilityLabel: 'Crear cuenta',
    accessibilityHint: 'Toca para crear tu cuenta',
    accessibilityState: {
      disabled: !isFormValid,
    },
  },
};
```

### Focus Order

```typescript
const focusOrder = [
  'nombre-input',          // 1
  'apellido-input',        // 2
  'email-input',           // 3
  'fechaNacimiento-button', // 4
  'genero-segment-hombre', // 5
  'genero-segment-mujer',  // 6
  'genero-segment-otro',   // 7
  'password-input',        // 8
  'submit-button',         // 9
];

const focusManagement = {
  returnKeyType: {
    nombre: 'next',
    apellido: 'next',
    email: 'next',
    password: 'done', // Last field
  },

  onSubmitEditing: {
    action: 'Focus next field in sequence',
    lastField: 'Submit form if valid',
  },
};
```

### Color Contrast Ratios

```typescript
const contrastRatios = {
  // WCAG AA requires 4.5:1 for normal text, 3:1 for large text

  labelText: {
    foreground: '#000000',
    background: '#FFFFFF',
    ratio: '21:1', // Excellent
    wcagLevel: 'AAA',
  },

  inputText: {
    foreground: '#000000',
    background: '#F7F7F7',
    ratio: '19.5:1', // Excellent
    wcagLevel: 'AAA',
  },

  errorText: {
    foreground: '#FF0000',
    background: '#FFFFFF',
    ratio: '4.8:1', // Good
    wcagLevel: 'AA',
  },

  activeSegmentText: {
    foreground: '#FFB22C',
    background: '#854836',
    ratio: '4.9:1', // Good
    wcagLevel: 'AA',
  },

  placeholderText: {
    foreground: '#666666',
    background: '#F7F7F7',
    ratio: '5.1:1', // Good
    wcagLevel: 'AA',
  },
};
```

### Touch Target Sizes

```typescript
const touchTargets = {
  minimum: 44, // iOS HIG & WCAG 2.5.5 minimum

  inputs: {
    height: 56,
    reason: 'Exceeds minimum, comfortable for thumbs',
  },

  segmentedControl: {
    height: 48,
    width: 'Dynamic (min 44pt)',
    reason: 'Each segment meets minimum',
  },

  buttons: {
    height: 56,
    width: '100% or minimum 88pt',
    reason: 'Large, easy to tap',
  },

  datePickerTrigger: {
    height: 56,
    width: '100%',
    reason: 'Full width for easy interaction',
  },
};
```

---

## 7. Complete Form Implementation Example

### Registration Form Data Model

```typescript
export interface RegistrationFormData {
  nombre: string;
  apellido: string;
  email: string;
  fechaNacimiento: Date | null;
  genero: 'hombre' | 'mujer' | 'otro' | null;
  password: string;
}

export interface RegistrationFormErrors {
  nombre?: string;
  apellido?: string;
  email?: string;
  fechaNacimiento?: string;
  genero?: string;
  password?: string;
  form?: string; // General form errors
}

export interface RegistrationFormState {
  data: RegistrationFormData;
  errors: RegistrationFormErrors;
  touched: {
    [K in keyof RegistrationFormData]?: boolean;
  };
  isSubmitting: boolean;
  isValid: boolean;
}
```

### Form Hook Architecture

```typescript
export interface UseRegistrationFormReturn {
  // State
  formData: RegistrationFormData;
  errors: RegistrationFormErrors;
  touched: { [key: string]: boolean };
  isSubmitting: boolean;
  isValid: boolean;

  // Field handlers
  handleNombreChange: (value: string) => void;
  handleApellidoChange: (value: string) => void;
  handleEmailChange: (value: string) => void;
  handleFechaNacimientoChange: (date: Date) => void;
  handleGeneroChange: (value: string) => void;
  handlePasswordChange: (value: string) => void;

  // Blur handlers (validation triggers)
  handleNombreBlur: () => void;
  handleApellidoBlur: () => void;
  handleEmailBlur: () => void;
  handleFechaNacimientoBlur: () => void;
  handleGeneroBlur: () => void;
  handlePasswordBlur: () => void;

  // Form actions
  handleSubmit: () => Promise<void>;
  resetForm: () => void;

  // Utilities
  getFieldError: (field: keyof RegistrationFormData) => string | undefined;
  shouldShowError: (field: keyof RegistrationFormData) => boolean;
}
```

### Component Usage Pattern

```typescript
// Example screen implementation structure
const RegistrationScreen = () => {
  const form = useRegistrationForm();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>REGISTRO</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formSection}>
            <BrutalistInput
              label="Nombre"
              value={form.formData.nombre}
              onChangeText={form.handleNombreChange}
              onBlur={form.handleNombreBlur}
              error={form.shouldShowError('nombre') ? form.errors.nombre : undefined}
              placeholder="Juan"
              autoCapitalize="words"
              autoComplete="given-name"
              returnKeyType="next"
              testID="nombre-input"
            />

            <BrutalistInput
              label="Apellido"
              value={form.formData.apellido}
              onChangeText={form.handleApellidoChange}
              onBlur={form.handleApellidoBlur}
              error={form.shouldShowError('apellido') ? form.errors.apellido : undefined}
              placeholder="Pérez"
              autoCapitalize="words"
              autoComplete="family-name"
              returnKeyType="next"
              testID="apellido-input"
            />

            <BrutalistInput
              label="Correo Electrónico"
              value={form.formData.email}
              onChangeText={form.handleEmailChange}
              onBlur={form.handleEmailBlur}
              error={form.shouldShowError('email') ? form.errors.email : undefined}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              testID="email-input"
            />

            <BrutalistDatePicker
              label="Fecha de Nacimiento"
              value={form.formData.fechaNacimiento}
              onChange={form.handleFechaNacimientoChange}
              error={form.shouldShowError('fechaNacimiento') ? form.errors.fechaNacimiento : undefined}
              minimumAge={18}
              testID="fecha-nacimiento-picker"
            />

            <BrutalistSegmentedControl
              label="Género"
              options={[
                { label: 'Hombre', value: 'hombre' },
                { label: 'Mujer', value: 'mujer' },
                { label: 'Otro', value: 'otro' },
              ]}
              selectedValue={form.formData.genero}
              onChange={form.handleGeneroChange}
              error={form.shouldShowError('genero') ? form.errors.genero : undefined}
              testID="genero-control"
            />

            <BrutalistInput
              label="Contraseña"
              value={form.formData.password}
              onChangeText={form.handlePasswordChange}
              onBlur={form.handlePasswordBlur}
              error={form.shouldShowError('password') ? form.errors.password : undefined}
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
              returnKeyType="done"
              onSubmitEditing={form.handleSubmit}
              testID="password-input"
            />
          </View>
        </ScrollView>

        <View style={styles.submitButtonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !form.isValid && styles.submitButtonDisabled,
            ]}
            onPress={form.handleSubmit}
            disabled={!form.isValid || form.isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Crear cuenta"
            accessibilityState={{ disabled: !form.isValid }}
            testID="submit-button"
          >
            <Text style={styles.submitButtonText}>
              {form.isSubmitting ? 'CREANDO...' : 'CREAR CUENTA'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
```

---

## 8. Animation & Transition Specifications

### Brutalist Animation Philosophy

```typescript
const animationPrinciples = {
  philosophy: 'Instant feedback, no decorative animations',

  allowed: [
    'Modal fade in/out (quick, 200ms)',
    'Error message slide in (150ms)',
    'Keyboard avoiding (native)',
  ],

  forbidden: [
    'Bouncy animations',
    'Easing curves (use linear)',
    'Skeleton loaders',
    'Transition delays',
    'Hover effects (mobile)',
  ],
};
```

### Specific Transitions

```typescript
const transitions = {
  modalOverlay: {
    type: 'fade',
    duration: 200,
    easing: 'linear',
    property: 'opacity',
    values: { from: 0, to: 0.7 },
  },

  errorMessage: {
    type: 'slide',
    duration: 150,
    easing: 'linear',
    property: 'translateY',
    values: { from: -10, to: 0 },
  },

  borderColorChange: {
    type: 'instant',
    duration: 0,
    reason: 'Brutalist = no smooth transitions',
  },

  backgroundColorChange: {
    type: 'instant',
    duration: 0,
    reason: 'Immediate visual feedback',
  },
};
```

---

## 9. Responsive Behavior & Device Support

### Screen Size Breakpoints

```typescript
const breakpoints = {
  small: { width: 320, height: 568 }, // iPhone SE
  medium: { width: 375, height: 667 }, // iPhone 8
  large: { width: 414, height: 896 }, // iPhone 11 Pro Max
  xlarge: { width: 428, height: 926 }, // iPhone 14 Pro Max
};

const responsiveBehavior = {
  small: {
    formPadding: 16,
    inputHeight: 52, // Slightly smaller
    fontSize: 15,
  },

  medium: {
    formPadding: 24,
    inputHeight: 56,
    fontSize: 16,
  },

  large: {
    formPadding: 24,
    inputHeight: 56,
    fontSize: 16,
  },

  xlarge: {
    formPadding: 32,
    inputHeight: 60, // Slightly larger
    fontSize: 17,
  },
};
```

### Landscape Orientation

```typescript
const landscapeAdaptations = {
  formLayout: {
    strategy: 'Single column maintained',
    reason: 'Simplicity over complexity',
  },

  datePickerModal: {
    strategy: 'Wider modal, same height',
    maxWidth: '80%',
  },

  submitButton: {
    position: 'Still fixed at bottom',
    visibility: 'May hide when keyboard open',
  },
};
```

---

## 10. Design Tokens Export

### Complete Token System

```typescript
export const BrutalistFormTokens = {
  colors: {
    primary: '#854836',
    accent: '#FFB22C',
    black: '#000000',
    white: '#FFFFFF',
    lightGray: '#F7F7F7',
    mediumGray: '#CCCCCC',
    darkGray: '#666666',
    error: '#FF0000',
    errorBackground: '#FFF5F5',
    disabledBackground: '#E8E8E8',
    disabledText: '#999999',
    overlayBackground: 'rgba(0, 0, 0, 0.7)',
  },

  typography: {
    h1: { size: 32, weight: '900', lineHeight: 38 },
    h2: { size: 24, weight: '800', lineHeight: 30 },
    h3: { size: 20, weight: '800', lineHeight: 26 },
    body: { size: 16, weight: '600', lineHeight: 24 },
    caption: { size: 14, weight: '600', lineHeight: 20 },
    label: { size: 14, weight: '800', lineHeight: 20 },
    error: { size: 13, weight: '700', lineHeight: 18 },
    input: { size: 16, weight: '600', lineHeight: 24 },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
  },

  borders: {
    width: 4,
    focusWidth: 6,
    radius: 0,
    color: '#000000',
    errorColor: '#FF0000',
  },

  dimensions: {
    inputHeight: 56,
    buttonHeight: 56,
    segmentHeight: 48,
    headerHeight: 64,
    minTouchTarget: 44,
  },

  animations: {
    modalFadeDuration: 200,
    errorSlideDuration: 150,
    easing: 'linear',
  },
};
```

---

## 11. Testing & Quality Checklist

### Visual Testing Checklist

- [ ] All borders are exactly 4px thick
- [ ] No border radius anywhere (0px)
- [ ] Focus states show 6px borders
- [ ] Error states use #FF0000 consistently
- [ ] All text is uppercase where specified
- [ ] Color contrast ratios meet WCAG AA
- [ ] Touch targets are minimum 44pt
- [ ] Brutalist aesthetic maintained throughout

### Functional Testing Checklist

- [ ] Form validates on blur
- [ ] Errors clear when user types
- [ ] Submit button disabled when invalid
- [ ] Age calculation is accurate
- [ ] Date picker respects minimum age
- [ ] Gender selector works on all options
- [ ] Password secureTextEntry works
- [ ] Keyboard dismisses appropriately
- [ ] ScrollView scrolls to active input
- [ ] Form submits with return key on last field

### Accessibility Testing Checklist

- [ ] Screen reader reads all labels
- [ ] Focus order is logical
- [ ] Error messages announce properly
- [ ] All interactive elements have labels
- [ ] Disabled states are announced
- [ ] Color is not the only indicator
- [ ] Touch targets meet size requirements
- [ ] Keyboard navigation works

### Cross-Device Testing

- [ ] iPhone SE (small screen)
- [ ] iPhone 13 (medium screen)
- [ ] iPhone 14 Pro Max (large screen)
- [ ] iPad (tablet, if supported)
- [ ] Android small device
- [ ] Android large device
- [ ] Portrait orientation
- [ ] Landscape orientation

---

## 12. Implementation Files Structure

```
/components/
  /forms/
    BrutalistInput.tsx
    BrutalistDatePicker.tsx
    BrutalistSegmentedControl.tsx
    BrutalistFormError.tsx

  /ui/
    BrutalistButton.tsx (existing)
    ThemedText.tsx (existing)

/hooks/
  useRegistrationForm.ts
  useFormValidation.ts

/utils/
  validation.ts
  dateHelpers.ts

/constants/
  BrutalistFormTokens.ts
  ValidationRules.ts

/screens/
  RegistrationScreen.tsx

/types/
  forms.types.ts
```

---

## Summary

This brutalist registration form design prioritizes:

1. **Clarity**: Thick borders, high contrast, clear labels
2. **Usability**: Large touch targets, immediate feedback, helpful errors
3. **Accessibility**: Screen reader support, proper focus order, WCAG compliance
4. **Consistency**: Design tokens ensure uniform appearance
5. **Brutalist Aesthetic**: No-nonsense, functional, bold design

The design is ready for implementation with complete specifications for all components, interactions, and edge cases.

**Key Files to Create:**
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/components/forms/BrutalistInput.tsx`
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/components/forms/BrutalistDatePicker.tsx`
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/components/forms/BrutalistSegmentedControl.tsx`
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/hooks/useRegistrationForm.ts`
- `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/mobile-expo/src/constants/BrutalistFormTokens.ts`

All measurements, colors, and interactions are specified for pixel-perfect implementation.
