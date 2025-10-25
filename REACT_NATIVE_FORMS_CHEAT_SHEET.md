# React Native Forms Cheat Sheet 2025

Quick reference for modern form handling in React Native with TypeScript.

---

## Installation

```bash
npm install react-hook-form @hookform/resolvers zod react-native-date-picker
cd ios && pod install
```

---

## Basic Form Setup

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// 1. Define schema
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

// 2. Use in component
const MyForm = () => {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => console.log(data);

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput onChangeText={onChange} value={value} />
        )}
      />
      {errors.email && <Text>{errors.email.message}</Text>}
      <Button onPress={handleSubmit(onSubmit)} title="Submit" />
    </View>
  );
};
```

---

## Reusable Input Component

```typescript
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface InputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
}

const Input = <T extends FieldValues>({
  control,
  name,
  label,
  ...rest
}: InputProps<T>) => (
  <Controller
    control={control}
    name={name}
    render={({ field: { onChange, value }, fieldState: { error } }) => (
      <View>
        {label && <Text>{label}</Text>}
        <TextInput onChangeText={onChange} value={value} {...rest} />
        {error && <Text style={{ color: 'red' }}>{error.message}</Text>}
      </View>
    )}
  />
);

// Usage
<Input control={control} name="email" label="Email" />
```

---

## Common Zod Validations

```typescript
import { z } from 'zod';

const schema = z.object({
  // Email
  email: z.string().email(),

  // Password (min 8, at least one uppercase, one number)
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Need uppercase')
    .regex(/[0-9]/, 'Need number'),

  // Phone (10 digits)
  phone: z.string().regex(/^\d{10}$/, '10 digits required'),

  // Number range
  age: z.number().min(18).max(120),

  // Optional field
  middleName: z.string().optional(),

  // With default value
  country: z.string().default('US'),

  // Enum
  role: z.enum(['admin', 'user', 'guest']),

  // Array
  tags: z.array(z.string()).min(1, 'At least one tag'),

  // URL
  website: z.string().url(),

  // Custom validation
  username: z.string().refine(
    (val) => !val.includes(' '),
    'No spaces allowed'
  ),
});
```

---

## Age Validation (18+)

```typescript
const schema = z.object({
  dateOfBirth: z.date().refine(
    (date) => {
      const today = new Date();
      let age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
        age--;
      }
      return age >= 18;
    },
    { message: 'Must be 18 or older' }
  ),
});
```

---

## Date Picker with Age Constraint

```typescript
import DatePicker from 'react-native-date-picker';

const DateInput = ({ control, name }) => {
  const [open, setOpen] = useState(false);

  const get18YearsAgo = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 18);
    return date;
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <>
          <Button onPress={() => setOpen(true)} title="Select Date" />
          <DatePicker
            modal
            open={open}
            date={value || get18YearsAgo()}
            mode="date"
            maximumDate={get18YearsAgo()}
            onConfirm={(date) => {
              setOpen(false);
              onChange(date);
            }}
            onCancel={() => setOpen(false)}
          />
        </>
      )}
    />
  );
};
```

---

## Password Confirmation

```typescript
const schema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);
```

---

## Dynamic Fields (useFieldArray)

```typescript
import { useForm, useFieldArray } from 'react-hook-form';

const schema = z.object({
  items: z.array(z.object({
    name: z.string().min(1),
    quantity: z.number().min(1),
  })).min(1),
});

const DynamicForm = () => {
  const { control, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { items: [{ name: '', quantity: 1 }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  return (
    <View>
      {fields.map((field, index) => (
        <View key={field.id}>
          <Input control={control} name={`items.${index}.name`} />
          <Input control={control} name={`items.${index}.quantity`} />
          <Button onPress={() => remove(index)} title="Remove" />
        </View>
      ))}
      <Button onPress={() => append({ name: '', quantity: 1 })} title="Add" />
    </View>
  );
};
```

---

## Custom Hook Pattern

```typescript
// hooks/useLoginForm.ts
export const useLoginForm = () => {
  const form = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      await api.login(data);
    } catch (error) {
      form.setError('root', { message: 'Invalid credentials' });
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
  };
};

// Usage in component
const LoginForm = () => {
  const { control, onSubmit } = useLoginForm();
  return <View>...</View>;
};
```

---

## Form State

```typescript
const { formState } = useForm();

// Check if form is valid
formState.isValid

// Check if form is submitting
formState.isSubmitting

// Get all errors
formState.errors

// Check if form is dirty (modified)
formState.isDirty

// Check if field is touched
formState.touchedFields.email

// Number of submit attempts
formState.submitCount
```

---

## Validation Modes

```typescript
useForm({
  mode: 'onBlur',    // Validate on blur (recommended)
  mode: 'onChange',  // Validate on every change
  mode: 'onSubmit',  // Validate only on submit (default)
  mode: 'onTouched', // Validate after blur, then on change
  mode: 'all',       // Validate on blur and change
});
```

---

## Watch Field Values

```typescript
const { watch } = useForm();

// Watch single field
const email = watch('email');

// Watch multiple fields
const [email, password] = watch(['email', 'password']);

// Watch all fields
const allValues = watch();

// Watch with callback
useEffect(() => {
  const subscription = watch((value, { name }) => {
    console.log(name, 'changed to', value[name]);
  });
  return () => subscription.unsubscribe();
}, [watch]);
```

---

## Set Values Programmatically

```typescript
const { setValue, reset } = useForm();

// Set single field
setValue('email', 'test@example.com');

// Set with validation
setValue('email', 'test@example.com', { shouldValidate: true });

// Reset entire form
reset();

// Reset with new values
reset({ email: '', password: '' });
```

---

## Conditional Validation

```typescript
const schema = z.object({
  accountType: z.enum(['personal', 'business']),
  companyName: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.accountType === 'business' && !data.companyName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Company name required for business accounts',
      path: ['companyName'],
    });
  }
});
```

---

## Async Validation

```typescript
const schema = z.object({
  username: z.string().refine(
    async (username) => {
      const exists = await api.checkUsername(username);
      return !exists;
    },
    { message: 'Username already taken' }
  ),
});
```

---

## Error Handling

```typescript
const onSubmit = async (data) => {
  try {
    await api.submit(data);
  } catch (error) {
    // Set form-level error
    setError('root', { message: 'Submission failed' });

    // Set field-level error
    setError('email', { message: 'Email already exists' });
  }
};

// Display root error
{errors.root && <Text>{errors.root.message}</Text>}
```

---

## TypeScript Tips

```typescript
// Infer type from schema
type FormData = z.infer<typeof schema>;

// Type-safe default values
const defaultValues: Partial<FormData> = {
  email: '',
};

// Type-safe field names
const name: Path<FormData> = 'email'; // Autocomplete!

// Generic component
const Input = <T extends FieldValues>(props: InputProps<T>) => ...;
```

---

## Performance Tips

1. Define styles outside component
```typescript
const styles = StyleSheet.create({ ... });
```

2. Use `defaultValues` to prevent undefined warnings
```typescript
useForm({ defaultValues: { email: '' } });
```

3. Minimize `watch()` usage
```typescript
// Good: Watch specific field
const email = watch('email');

// Bad: Watch everything
const all = watch();
```

4. Use validation mode wisely
```typescript
// Less intrusive
mode: 'onBlur'

// More real-time feedback
mode: 'onChange'
```

---

## Common Patterns

### Login Form
```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
```

### Signup Form
```typescript
const signupSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
  dateOfBirth: z.date(),
  terms: z.boolean().refine((val) => val === true, 'Must accept terms'),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords don't match", path: ["confirmPassword"] }
);
```

### Profile Form
```typescript
const profileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional(),
  avatar: z.string().url().optional(),
});
```

---

## Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { render, fireEvent } from '@testing-library/react-native';

// Test schema
test('validates email', () => {
  const result = schema.safeParse({ email: 'invalid' });
  expect(result.success).toBe(false);
});

// Test component
test('shows error on invalid input', async () => {
  const { getByPlaceholderText, getByText } = render(<MyForm />);

  const input = getByPlaceholderText('Email');
  fireEvent.changeText(input, 'invalid');

  const submit = getByText('Submit');
  fireEvent.press(submit);

  expect(getByText('Invalid email')).toBeTruthy();
});
```

---

## Quick Comparison

| Feature | React Hook Form | Formik |
|---------|----------------|--------|
| Bundle Size | 8.6 KB | ~50 KB |
| Dependencies | 0 | Multiple |
| Re-renders | Minimal | Many |
| Performance | Excellent | Good |
| TypeScript | Excellent | Good |
| Recommendation | ✅ Use | ❌ Legacy |

| Feature | Zod | Yup |
|---------|-----|-----|
| TypeScript | Excellent | Good |
| Dependencies | 0 | Multiple |
| Type Inference | Automatic | Manual |
| Performance | Fastest | Good |
| Recommendation | ✅ TypeScript | ✅ JavaScript |

---

## Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [Date Picker](https://github.com/henninghall/react-native-date-picker)

---

**Last Updated:** October 24, 2025
