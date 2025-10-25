# React Native Form Implementation Roadmap

**Step-by-step guide to implementing modern form handling in your React Native project**

---

## Phase 1: Setup & Installation (30 minutes)

### Step 1: Install Dependencies

```bash
# Core dependencies
npm install react-hook-form @hookform/resolvers zod

# Date picker (choose one or both)
npm install react-native-date-picker
# OR
npm install @react-native-community/datetimepicker

# Install iOS pods (if using date pickers)
cd ios && pod install && cd ..
```

### Step 2: Verify Installation

Create a test file to ensure everything works:

```typescript
// test-setup.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const testSchema = z.object({
  email: z.string().email(),
});

console.log('✅ All packages installed correctly!');
```

---

## Phase 2: Project Structure Setup (15 minutes)

### Create Directory Structure

```bash
mkdir -p src/components/forms
mkdir -p src/schemas
mkdir -p src/features/auth/components
mkdir -p src/features/auth/hooks
mkdir -p src/features/auth/schemas
```

### Expected Structure

```
src/
├── components/
│   └── forms/
│       ├── RHFInput.tsx
│       ├── RHFDatePicker.tsx
│       └── RHFSelect.tsx (future)
├── schemas/
│   └── commonSchemas.ts
└── features/
    └── auth/
        ├── components/
        │   ├── SignupForm.tsx
        │   └── LoginForm.tsx
        ├── hooks/
        │   ├── useSignupForm.ts
        │   └── useLoginForm.ts
        └── schemas/
            └── authSchemas.ts
```

---

## Phase 3: Create Reusable Components (1 hour)

### Step 1: Basic Input Component

Create `src/components/forms/RHFInput.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

export interface RHFInputProps<T extends FieldValues> extends TextInputProps {
  control: Control<T, any>;
  name: Path<T>;
  label?: string;
  left?: ReactNode;
  right?: ReactNode;
}

const RHFInput = <T extends FieldValues>({
  control,
  name,
  label,
  left,
  right,
  ...rest
}: RHFInputProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <View style={[styles.inputContainer, error && styles.inputError]}>
            {left}
            <TextInput
              style={styles.input}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              placeholderTextColor="#999"
              {...rest}
            />
            {right}
          </View>
          {error && <Text style={styles.errorText}>{error.message}</Text>}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    paddingHorizontal: 12,
    gap: 12,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: '#ff4444' },
  input: { flex: 1, fontSize: 16, height: 50, color: '#333' },
  errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },
});

export default RHFInput;
```

**Test it:**
```typescript
<RHFInput
  control={control}
  name="email"
  label="Email"
  placeholder="Enter email"
/>
```

### Step 2: Date Picker Component

Create `src/components/forms/RHFDatePicker.tsx`:

```typescript
import React, { useState } from 'react';
import { Button, Text, View, StyleSheet } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { Control, Controller, FieldValues, Path } from 'react-hook-form';

interface RHFDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  minimumAge?: number; // For age validation (e.g., 18)
}

const RHFDatePicker = <T extends FieldValues>({
  control,
  name,
  label,
  minimumAge = 18,
}: RHFDatePickerProps<T>) => {
  const [open, setOpen] = useState(false);

  const getMaxDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - minimumAge);
    return date;
  };

  const getMinDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 100);
    return date;
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          {label && <Text style={styles.label}>{label}</Text>}
          <Button
            title={value ? value.toLocaleDateString() : 'Select Date'}
            onPress={() => setOpen(true)}
          />
          {error && <Text style={styles.errorText}>{error.message}</Text>}

          <DatePicker
            modal
            open={open}
            date={value || getMaxDate()}
            mode="date"
            minimumDate={getMinDate()}
            maximumDate={getMaxDate()}
            onConfirm={(selectedDate) => {
              setOpen(false);
              onChange(selectedDate);
            }}
            onCancel={() => setOpen(false)}
            title={label || 'Select Date'}
          />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  errorText: { color: '#ff4444', fontSize: 12, marginTop: 4 },
});

export default RHFDatePicker;
```

---

## Phase 4: Create Validation Schemas (30 minutes)

### Common Schemas

Create `src/schemas/commonSchemas.ts`:

```typescript
import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8, uppercase, number)
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Phone validation (10 digits)
export const phoneSchema = z.string()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits');

// Age validation (18+)
export const dateOfBirthSchema = z.date().refine(
  (date) => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age >= 18;
  },
  { message: 'You must be at least 18 years old' }
);

// Username validation
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');
```

### Auth Schemas

Create `src/features/auth/schemas/authSchemas.ts`:

```typescript
import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  dateOfBirthSchema,
  usernameSchema,
} from '../../../schemas/commonSchemas';

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Signup schema
export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  dateOfBirth: dateOfBirthSchema,
  terms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  }
);

export type SignupFormData = z.infer<typeof signupSchema>;
```

---

## Phase 5: Create Form Hooks (30 minutes)

### Login Hook

Create `src/features/auth/hooks/useLoginForm.ts`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/authSchemas';

export const useLoginForm = () => {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur', // Validate on blur
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log('Login data:', data);
      // TODO: Call your API
      // await api.login(data);
    } catch (error) {
      console.error('Login error:', error);
      form.setError('root', {
        message: 'Invalid email or password',
      });
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
```

### Signup Hook

Create `src/features/auth/hooks/useSignupForm.ts`:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupFormData } from '../schemas/authSchemas';

export const useSignupForm = () => {
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SignupFormData) => {
    try {
      console.log('Signup data:', data);
      // TODO: Call your API
      // await api.signup(data);
    } catch (error) {
      console.error('Signup error:', error);
      form.setError('root', {
        message: 'Registration failed. Please try again.',
      });
    }
  };

  return {
    ...form,
    onSubmit: form.handleSubmit(onSubmit),
  };
};
```

---

## Phase 6: Create Form Components (45 minutes)

### Login Form

Create `src/features/auth/components/LoginForm.tsx`:

```typescript
import React from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import RHFInput from '../../../components/forms/RHFInput';
import { useLoginForm } from '../hooks/useLoginForm';

const LoginForm = () => {
  const { control, onSubmit, formState: { errors, isSubmitting } } = useLoginForm();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      <RHFInput
        control={control}
        name="email"
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <RHFInput
        control={control}
        name="password"
        label="Password"
        placeholder="Enter your password"
        secureTextEntry
      />

      {errors.root && (
        <Text style={styles.errorText}>{errors.root.message}</Text>
      )}

      <Button
        title={isSubmitting ? 'Logging in...' : 'Login'}
        onPress={onSubmit}
        disabled={isSubmitting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginForm;
```

### Signup Form

Create `src/features/auth/components/SignupForm.tsx`:

```typescript
import React from 'react';
import { View, Button, StyleSheet, Text, ScrollView } from 'react-native';
import RHFInput from '../../../components/forms/RHFInput';
import RHFDatePicker from '../../../components/forms/RHFDatePicker';
import { useSignupForm } from '../hooks/useSignupForm';

const SignupForm = () => {
  const { control, onSubmit, formState: { errors, isSubmitting } } = useSignupForm();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <RHFInput
        control={control}
        name="username"
        label="Username"
        placeholder="Choose a username"
        autoCapitalize="none"
      />

      <RHFInput
        control={control}
        name="email"
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <RHFInput
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="10 digit phone number"
        keyboardType="phone-pad"
      />

      <RHFInput
        control={control}
        name="password"
        label="Password"
        placeholder="Create a password"
        secureTextEntry
      />

      <RHFInput
        control={control}
        name="confirmPassword"
        label="Confirm Password"
        placeholder="Re-enter password"
        secureTextEntry
      />

      <RHFDatePicker
        control={control}
        name="dateOfBirth"
        label="Date of Birth"
        minimumAge={18}
      />

      {errors.root && (
        <Text style={styles.errorText}>{errors.root.message}</Text>
      )}

      <Button
        title={isSubmitting ? 'Creating Account...' : 'Sign Up'}
        onPress={onSubmit}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default SignupForm;
```

---

## Phase 7: Testing (30 minutes)

### Test the Components

```typescript
// App.tsx or test screen
import React from 'react';
import { SafeAreaView } from 'react-native';
import SignupForm from './src/features/auth/components/SignupForm';

export default function App() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SignupForm />
    </SafeAreaView>
  );
}
```

### Manual Testing Checklist

- [ ] Email validation works
- [ ] Password validation shows errors
- [ ] Phone number accepts only 10 digits
- [ ] Date picker prevents under-18 selection
- [ ] Password confirmation shows mismatch error
- [ ] Form submission prevents with errors
- [ ] Loading state shows during submission

---

## Phase 8: API Integration (1 hour)

### Create API Service

Create `src/services/api/authApi.ts`:

```typescript
export const authApi = {
  login: async (data: LoginFormData) => {
    const response = await fetch('YOUR_API_URL/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  signup: async (data: SignupFormData) => {
    const response = await fetch('YOUR_API_URL/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Signup failed');
    }

    return response.json();
  },
};
```

### Update Hooks with API Calls

```typescript
// useLoginForm.ts
import { authApi } from '../../services/api/authApi';

const onSubmit = async (data: LoginFormData) => {
  try {
    const result = await authApi.login(data);
    console.log('Login successful:', result);
    // Navigate to home screen
  } catch (error) {
    form.setError('root', {
      message: 'Invalid email or password',
    });
  }
};
```

---

## Phase 9: Enhancements (Optional)

### Add Loading States

```typescript
const [isLoading, setIsLoading] = useState(false);

const onSubmit = async (data) => {
  setIsLoading(true);
  try {
    await authApi.login(data);
  } finally {
    setIsLoading(false);
  }
};
```

### Add Success Messages

```typescript
import { Alert } from 'react-native';

const onSubmit = async (data) => {
  try {
    await authApi.signup(data);
    Alert.alert('Success', 'Account created successfully!');
  } catch (error) {
    Alert.alert('Error', 'Registration failed');
  }
};
```

### Add Password Visibility Toggle

```typescript
const [showPassword, setShowPassword] = useState(false);

<RHFInput
  name="password"
  secureTextEntry={!showPassword}
  right={
    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
      <Icon name={showPassword ? 'eye-off' : 'eye'} />
    </TouchableOpacity>
  }
/>
```

---

## Phase 10: Best Practices Review

### Checklist

- [ ] ✅ Using React Hook Form for form state
- [ ] ✅ Using Zod for validation
- [ ] ✅ Schemas defined in separate files
- [ ] ✅ Types inferred with `z.infer<>`
- [ ] ✅ Logic separated into custom hooks
- [ ] ✅ Reusable input components
- [ ] ✅ TypeScript generics for type safety
- [ ] ✅ Styles defined outside components
- [ ] ✅ Validation mode set (`onBlur` recommended)
- [ ] ✅ Default values provided
- [ ] ✅ Error messages user-friendly
- [ ] ✅ Loading states during submission
- [ ] ✅ API errors handled gracefully
- [ ] ✅ Accessibility labels added

---

## Timeline Summary

| Phase | Duration | Task |
|-------|----------|------|
| 1 | 30 min | Setup & Installation |
| 2 | 15 min | Project Structure |
| 3 | 1 hour | Reusable Components |
| 4 | 30 min | Validation Schemas |
| 5 | 30 min | Form Hooks |
| 6 | 45 min | Form Components |
| 7 | 30 min | Testing |
| 8 | 1 hour | API Integration |
| 9 | 1 hour | Enhancements (optional) |
| **Total** | **5-6 hours** | **Complete Implementation** |

---

## Next Steps

1. **Start with Phase 1** - Install dependencies
2. **Follow each phase in order** - Build incrementally
3. **Test after each phase** - Ensure everything works
4. **Customize as needed** - Adapt to your design system
5. **Expand with more forms** - Apply patterns to other features

---

## Common Issues & Solutions

### Issue: "Cannot find module '@hookform/resolvers'"

**Solution:**
```bash
npm install @hookform/resolvers
```

### Issue: Date picker not working on iOS

**Solution:**
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

### Issue: Type errors with generic components

**Solution:**
```typescript
// Ensure you're using Path<T> from react-hook-form
import { Path } from 'react-hook-form';

name: Path<T>  // Not just string
```

### Issue: Form not validating

**Solution:**
```typescript
// Make sure resolver is passed
useForm({
  resolver: zodResolver(schema),  // Don't forget this!
})
```

---

## Resources

- **Implementation Guide:** REACT_NATIVE_FORM_IMPLEMENTATION_GUIDE_2025.md
- **Cheat Sheet:** REACT_NATIVE_FORMS_CHEAT_SHEET.md
- **Comparison:** FORM_LIBRARIES_COMPARISON_2025.md
- **Research Summary:** RESEARCH_SUMMARY_REACT_NATIVE_FORMS.md

---

**Happy Coding!** 🚀

You now have a complete roadmap to implement modern, performant, and type-safe forms in React Native using industry best practices for 2025-2026.
