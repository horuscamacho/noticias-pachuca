# Brutalist Form Components

Production-ready React Native form components with brutalist styling for registration and data entry screens.

## Components

### 1. BrutalistInput
Text input with label, error states, and full keyboard configuration.

**Features:**
- 56px touch target for accessibility
- Focus state with 6px brown border (#854836)
- Error state with 4px red border + error message
- Full keyboard type support
- ThemedText for consistent typography
- TypeScript fully typed

**Usage:**
```tsx
import { BrutalistInput } from './components';

<BrutalistInput
  label="Nombre"
  value={name}
  onChangeText={setName}
  placeholder="Ingresa tu nombre"
  autoCapitalize="words"
/>

// Email input
<BrutalistInput
  label="Email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  keyboardType="email-address"
  autoCapitalize="none"
/>

// Password input
<BrutalistInput
  label="Contraseña"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  error={errors.password}
/>
```

**Props:**
```typescript
interface BrutalistInputProps {
  label: string;                          // Required label text
  value: string;                          // Current value
  onChangeText: (text: string) => void;   // Change handler
  onBlur?: () => void;                    // Blur handler
  error?: string;                         // Error message
  placeholder?: string;                   // Placeholder text
  secureTextEntry?: boolean;              // Hide text (passwords)
  keyboardType?: KeyboardTypeOptions;     // Keyboard type
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: ReturnKeyTypeOptions;   // Return key type
  onSubmitEditing?: () => void;           // Submit handler
  editable?: boolean;                     // Enable/disable
  testID?: string;                        // Test ID
}
```

---

### 2. BrutalistSegmentedControl
Multi-option selector with equal-width segments and bold active states.

**Features:**
- 48px height segments
- Active: brown background (#854836) + yellow text (#FFB22C)
- Inactive: white background + black text
- 4px black borders between segments
- Full accessibility support
- TypeScript fully typed

**Usage:**
```tsx
import { BrutalistSegmentedControl } from './components';

// Gender selector
<BrutalistSegmentedControl
  label="Género"
  options={[
    { label: 'Hombre', value: 'male' },
    { label: 'Mujer', value: 'female' },
    { label: 'Otro', value: 'other' },
  ]}
  value={gender}
  onChange={setGender}
/>

// With error
<BrutalistSegmentedControl
  label="Tipo de cuenta"
  options={[
    { label: 'Personal', value: 'personal' },
    { label: 'Empresa', value: 'business' },
  ]}
  value={accountType}
  onChange={setAccountType}
  error={errors.accountType}
/>
```

**Props:**
```typescript
interface SegmentedControlOption {
  label: string;  // Display text
  value: string;  // Value
}

interface BrutalistSegmentedControlProps {
  label: string;                           // Required label text
  options: SegmentedControlOption[];       // Array of options
  value: string;                           // Selected value
  onChange: (value: string) => void;       // Change handler
  error?: string;                          // Error message
  testID?: string;                         // Test ID
}
```

---

### 3. BrutalistDatePicker
Date picker with modal interface and age restriction support.

**Features:**
- 56px touch target trigger button
- DD/MM/YYYY format display
- Modal date picker (react-native-date-picker)
- Age restriction (minimumAge prop)
- Error state with red border
- Spanish locale
- TypeScript fully typed

**Usage:**
```tsx
import { BrutalistDatePicker } from './components';

// Basic date picker
<BrutalistDatePicker
  label="Fecha de Nacimiento"
  value={birthdate}
  onChange={setBirthdate}
/>

// With 18+ restriction
<BrutalistDatePicker
  label="Fecha de Nacimiento"
  value={birthdate}
  onChange={setBirthdate}
  minimumAge={18}
  error={errors.birthdate}
/>
```

**Props:**
```typescript
interface BrutalistDatePickerProps {
  label: string;                    // Required label text
  value: Date | null;               // Selected date
  onChange: (date: Date) => void;   // Change handler
  minimumAge?: number;              // Age restriction (default: 0)
  error?: string;                   // Error message
  testID?: string;                  // Test ID
}
```

---

## Design Tokens

All components use consistent brutalist design tokens:

```typescript
const FORM_TOKENS = {
  colors: {
    inputBackground: '#F7F7F7',
    inputBorder: '#000000',
    inputBorderFocus: '#854836',
    inputBorderError: '#FF0000',
    inputText: '#000000',
    inputPlaceholder: '#6B7280',
    segmentActive: '#854836',
    segmentActiveText: '#FFB22C',
    segmentInactive: '#FFFFFF',
    segmentInactiveText: '#000000',
    errorText: '#FF0000',
  },
  borders: {
    default: 4,
    focus: 6,
  },
  spacing: {
    inputPadding: 16,
    labelMargin: 4,
    errorMargin: 4,
  },
  sizing: {
    inputHeight: 56,
    segmentHeight: 48,
  },
};
```

---

## React Hook Form Integration

All components work seamlessly with react-hook-form:

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BrutalistInput,
  BrutalistSegmentedControl,
  BrutalistDatePicker,
} from './components';

// Define schema
const schema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  gender: z.enum(['male', 'female', 'other']),
  birthdate: z.date(),
});

type FormData = z.infer<typeof schema>;

// In component
const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});

// Render inputs
<Controller
  control={control}
  name="name"
  render={({ field: { onChange, onBlur, value } }) => (
    <BrutalistInput
      label="Nombre"
      value={value}
      onChangeText={onChange}
      onBlur={onBlur}
      error={errors.name?.message}
    />
  )}
/>

<Controller
  control={control}
  name="gender"
  render={({ field: { onChange, value } }) => (
    <BrutalistSegmentedControl
      label="Género"
      options={[
        { label: 'Hombre', value: 'male' },
        { label: 'Mujer', value: 'female' },
        { label: 'Otro', value: 'other' },
      ]}
      value={value || ''}
      onChange={onChange}
      error={errors.gender?.message}
    />
  )}
/>

<Controller
  control={control}
  name="birthdate"
  render={({ field: { onChange, value } }) => (
    <BrutalistDatePicker
      label="Fecha de Nacimiento"
      value={value || null}
      onChange={onChange}
      minimumAge={18}
      error={errors.birthdate?.message}
    />
  )}
/>
```

---

## Complete Registration Form Example

See `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistFormComponents.example.tsx` for:
- Full registration form with all components
- react-hook-form integration
- Zod validation
- TypeScript types
- Error handling
- Submit handling

---

## Accessibility

All components are fully accessible:

### BrutalistInput
- `accessibilityLabel` set to label text
- `accessibilityHint` shows error if present
- `accessibilityState` reflects disabled state
- 56px minimum touch target

### BrutalistSegmentedControl
- Container has `accessibilityRole="radiogroup"`
- Each option has `accessibilityRole="radio"`
- `accessibilityState` reflects checked/selected state
- `accessibilityHint` guides selection

### BrutalistDatePicker
- Trigger has `accessibilityRole="button"`
- `accessibilityLabel` includes current value
- `accessibilityHint` explains interaction
- Modal picker is native and accessible

---

## Performance

All components use:
- `React.memo` for re-render optimization
- `React.useCallback` for stable handlers
- `React.useMemo` for computed values
- Minimal inline styles

---

## File Locations

- **BrutalistInput**: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistInput.tsx`
- **BrutalistSegmentedControl**: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistSegmentedControl.tsx`
- **BrutalistDatePicker**: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistDatePicker.tsx`
- **Examples**: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistFormComponents.example.tsx`
- **Exports**: `/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/index.ts`

---

## Testing

All components include `testID` props for testing:

```tsx
// Input
<BrutalistInput
  testID="registration-name-input"
  // ... other props
/>

// Segmented Control
<BrutalistSegmentedControl
  testID="registration-gender-control"
  // ... other props
/>

// Date Picker
<BrutalistDatePicker
  testID="registration-birthdate-picker"
  // ... other props
/>

// In tests
const input = screen.getByTestId('registration-name-input-input');
const genderOption = screen.getByTestId('registration-gender-control-option-male');
const dateTrigger = screen.getByTestId('registration-birthdate-picker-trigger');
```

---

## Dependencies

Required packages (already installed):
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation
- `react-native-date-picker` - Date picker modal

---

## Next Steps

1. Import components in your registration screen
2. Set up react-hook-form with Zod schema
3. Wire up form submission to API
4. Add loading states
5. Test on iOS and Android

Ready to use in production!
