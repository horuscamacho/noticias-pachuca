/**
 * Brutalist Form Components - Complete Usage Examples
 *
 * This file demonstrates all three form components with:
 * - react-hook-form integration
 * - Zod validation schemas
 * - Real-world registration form
 * - TypeScript best practices
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BrutalistInput,
  BrutalistSegmentedControl,
  BrutalistDatePicker,
  BrutalistButton,
  ThemedText,
} from './index';

/**
 * Validation schema using Zod
 */
const registrationSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres'),
  email: z
    .string()
    .email('Email inválido')
    .min(1, 'El email es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Selecciona tu género',
  }),
  birthdate: z
    .date({
      required_error: 'La fecha de nacimiento es requerida',
    })
    .refine((date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 18;
    }, 'Debes ser mayor de 18 años'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

/**
 * Complete registration form example
 */
export const RegistrationFormExample: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      gender: undefined,
      birthdate: undefined,
    },
  });

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      console.log('Form submitted:', data);
      // API call here
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Registro exitoso!');
      reset();
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Error en el registro');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <ThemedText variant="h2" style={styles.title}>
        Crear Cuenta
      </ThemedText>
      <ThemedText variant="body" style={styles.subtitle}>
        Completa el formulario para registrarte
      </ThemedText>

      {/* Form */}
      <View style={styles.form}>
        {/* Name Input */}
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <BrutalistInput
              label="Nombre Completo"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.name?.message}
              placeholder="Juan Pérez"
              autoCapitalize="words"
              returnKeyType="next"
              testID="registration-name-input"
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
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              testID="registration-email-input"
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
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              returnKeyType="done"
              testID="registration-password-input"
            />
          )}
        />

        {/* Gender Segmented Control */}
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
              testID="registration-gender-control"
            />
          )}
        />

        {/* Birthdate Picker */}
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
              testID="registration-birthdate-picker"
            />
          )}
        />

        {/* Submit Button */}
        <BrutalistButton
          variant="primary"
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={styles.submitButton}
          testID="registration-submit-button"
        >
          {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
        </BrutalistButton>
      </View>
    </ScrollView>
  );
};

/**
 * Individual component examples
 */
export const IndividualExamples: React.FC = () => {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [birthdate, setBirthdate] = React.useState<Date | null>(null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText variant="h2" style={styles.title}>
        Component Examples
      </ThemedText>

      {/* Basic Input */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Basic Input
        </ThemedText>
        <BrutalistInput
          label="Nombre"
          value={name}
          onChangeText={setName}
          placeholder="Ingresa tu nombre"
          autoCapitalize="words"
        />
      </View>

      {/* Email Input */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Email Input
        </ThemedText>
        <BrutalistInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Password Input */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Password Input
        </ThemedText>
        <BrutalistInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          secureTextEntry
        />
      </View>

      {/* Input with Error */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Input with Error
        </ThemedText>
        <BrutalistInput
          label="Email"
          value="invalid-email"
          onChangeText={() => {}}
          error="Email inválido"
          keyboardType="email-address"
        />
      </View>

      {/* Segmented Control */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Segmented Control
        </ThemedText>
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
      </View>

      {/* Segmented Control with Error */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Segmented Control with Error
        </ThemedText>
        <BrutalistSegmentedControl
          label="Tipo de cuenta"
          options={[
            { label: 'Personal', value: 'personal' },
            { label: 'Empresa', value: 'business' },
          ]}
          value=""
          onChange={() => {}}
          error="Selecciona un tipo de cuenta"
        />
      </View>

      {/* Date Picker */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Date Picker
        </ThemedText>
        <BrutalistDatePicker
          label="Fecha de Nacimiento"
          value={birthdate}
          onChange={setBirthdate}
          minimumAge={18}
        />
      </View>

      {/* Date Picker with Error */}
      <View style={styles.section}>
        <ThemedText variant="h3" style={styles.sectionTitle}>
          Date Picker with Error
        </ThemedText>
        <BrutalistDatePicker
          label="Fecha del evento"
          value={null}
          onChange={() => {}}
          error="La fecha es requerida"
        />
      </View>
    </ScrollView>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  form: {
    gap: 24,
  },
  submitButton: {
    marginTop: 16,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
  },
});

/**
 * Export examples for testing
 */
export default RegistrationFormExample;
