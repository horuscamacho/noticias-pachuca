# Brutalist Forms - Quick Start Guide

**5-minute guide to get your form working.**

---

## 1. Import Components

```typescript
import {
  BrutalistInput,
  BrutalistSegmentedControl,
  BrutalistDatePicker,
  BrutalistButton,
} from '@/components';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
```

---

## 2. Define Validation Schema

```typescript
const registrationSchema = z.object({
  name: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  gender: z.enum(['male', 'female', 'other']),
  birthdate: z.date(),
});

type FormData = z.infer<typeof registrationSchema>;
```

---

## 3. Initialize Form

```typescript
const {
  control,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm<FormData>({
  resolver: zodResolver(registrationSchema),
});

const onSubmit = async (data: FormData) => {
  // Call your API
  console.log(data);
};
```

---

## 4. Render Form

```typescript
<View style={{ gap: 24, padding: 20 }}>
  {/* Text Input */}
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

  {/* Email Input */}
  <Controller
    control={control}
    name="email"
    render={({ field: { onChange, onBlur, value } }) => (
      <BrutalistInput
        label="Email"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        error={errors.email?.message}
        keyboardType="email-address"
        autoCapitalize="none"
      />
    )}
  />

  {/* Password Input */}
  <Controller
    control={control}
    name="password"
    render={({ field: { onChange, onBlur, value } }) => (
      <BrutalistInput
        label="Contraseña"
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        error={errors.password?.message}
        secureTextEntry
      />
    )}
  />

  {/* Segmented Control */}
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

  {/* Date Picker */}
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

  {/* Submit Button */}
  <BrutalistButton
    variant="primary"
    onPress={handleSubmit(onSubmit)}
    disabled={isSubmitting}
  >
    {isSubmitting ? 'Enviando...' : 'Crear Cuenta'}
  </BrutalistButton>
</View>
```

---

## Component Cheatsheet

### BrutalistInput

```typescript
<BrutalistInput
  label="Nombre"              // Required
  value={value}               // Required
  onChangeText={onChange}     // Required
  onBlur={onBlur}            // Optional
  error={errorMessage}        // Optional
  placeholder="Texto..."      // Optional
  secureTextEntry            // For passwords
  keyboardType="email-address" // email-address, phone-pad, numeric, etc.
  autoCapitalize="none"      // none, sentences, words, characters
  returnKeyType="next"       // next, done, go, send, search
/>
```

### BrutalistSegmentedControl

```typescript
<BrutalistSegmentedControl
  label="Género"              // Required
  options={[                  // Required - Array of options
    { label: 'Hombre', value: 'male' },
    { label: 'Mujer', value: 'female' },
  ]}
  value={value}               // Required - Current selection
  onChange={onChange}         // Required
  error={errorMessage}        // Optional
/>
```

### BrutalistDatePicker

```typescript
<BrutalistDatePicker
  label="Fecha"               // Required
  value={date}                // Required - Date or null
  onChange={onChange}         // Required
  minimumAge={18}            // Optional - Age restriction
  error={errorMessage}        // Optional
/>
```

---

## Common Patterns

### Email + Password Login

```typescript
const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

<Controller name="email" render={({ field }) => (
  <BrutalistInput
    label="Email"
    keyboardType="email-address"
    autoCapitalize="none"
    {...field}
  />
)} />

<Controller name="password" render={({ field }) => (
  <BrutalistInput
    label="Contraseña"
    secureTextEntry
    {...field}
  />
)} />
```

### Phone Number

```typescript
<BrutalistInput
  label="Teléfono"
  keyboardType="phone-pad"
  placeholder="+52 1234567890"
/>
```

### Numeric Input

```typescript
<BrutalistInput
  label="Edad"
  keyboardType="numeric"
/>
```

### Multi-Step Form

```typescript
const [step, setStep] = useState(1);

{step === 1 && (
  <>
    <Controller name="name" ... />
    <Controller name="email" ... />
  </>
)}

{step === 2 && (
  <>
    <Controller name="gender" ... />
    <Controller name="birthdate" ... />
  </>
)}
```

---

## Validation Examples

### Required Field

```typescript
z.string().min(1, 'Este campo es requerido')
```

### Email

```typescript
z.string().email('Email inválido')
```

### Password (8+ chars, 1 uppercase, 1 number)

```typescript
z.string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener una mayúscula')
  .regex(/[0-9]/, 'Debe contener un número')
```

### Phone Number

```typescript
z.string().regex(/^\+?\d{10,}$/, 'Teléfono inválido')
```

### Date (18+ years old)

```typescript
z.date().refine((date) => {
  const age = new Date().getFullYear() - date.getFullYear();
  return age >= 18;
}, 'Debes ser mayor de 18 años')
```

### Enum

```typescript
z.enum(['male', 'female', 'other'], {
  required_error: 'Selecciona una opción',
})
```

---

## Styling

### Form Container

```typescript
<ScrollView contentContainerStyle={{
  padding: 20,
  gap: 24,  // Space between inputs
}}>
  {/* Form fields */}
</ScrollView>
```

### Custom Spacing

```typescript
<View style={{ gap: 16 }}>  {/* Tight spacing */}
<View style={{ gap: 24 }}>  {/* Normal spacing */}
<View style={{ gap: 32 }}>  {/* Loose spacing */}
```

---

## Error Handling

```typescript
const onSubmit = async (data: FormData) => {
  try {
    await api.register(data);
    // Success
    navigation.navigate('Home');
  } catch (error) {
    // Handle API errors
    if (error.response?.status === 409) {
      // Set form error
      setError('email', {
        message: 'Email ya registrado',
      });
    } else {
      Alert.alert('Error', 'Algo salió mal');
    }
  }
};
```

---

## Testing

```typescript
// In your test file
import { render, screen, fireEvent } from '@testing-library/react-native';

test('form submission works', async () => {
  const onSubmit = jest.fn();
  render(<RegistrationForm onSubmit={onSubmit} />);

  // Fill inputs
  fireEvent.changeText(
    screen.getByTestId('name-input'),
    'John Doe'
  );

  // Press submit
  fireEvent.press(screen.getByText('Crear Cuenta'));

  // Assert
  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

---

## Troubleshooting

### Form not submitting?
- Check validation schema
- Add `console.log(errors)` to see validation errors

### Date picker not working?
- Make sure `react-native-date-picker` is installed
- Run `npx pod-install` (iOS)

### TypeScript errors?
- Ensure form data type matches schema: `type FormData = z.infer<typeof schema>`

### Input lag?
- Wrap in `React.memo` if parent re-renders frequently
- Use `Controller` from react-hook-form (already optimized)

---

## Complete Example File

See working example:
`/Users/sinhuecamacho/Desktop/work/noticias-pachuca/packages/app-noticias-pachuca/components/BrutalistFormComponents.example.tsx`

---

## Next Steps

1. Copy the code above
2. Replace with your field names
3. Add your API call to `onSubmit`
4. Test on device
5. Done!

**That's it! Your form is ready to use.**
