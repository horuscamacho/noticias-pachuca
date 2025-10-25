import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { BrutalistInput } from '@/components/BrutalistInput';
import { BrutalistButton } from '@/components/BrutalistButton';
import { loginSchema, LoginFormData } from '@/lib/validations/loginSchema';

/**
 * LoginScreen - User login form with brutalist design
 *
 * Features:
 * - Form validation with Zod
 * - Managed by react-hook-form
 * - Email/Password authentication
 * - Google Sign-In option
 * - Forgot password link
 * - Link to registration
 * - Brutalist styling
 * - Full TypeScript typing
 * - Accessibility support
 *
 * Form Fields:
 * - Email
 * - Password
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state management with react-hook-form + Zod
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * Handle email/password login submission
   * For now, just logs the data (no backend)
   */
  const onSubmit = async (data: LoginFormData) => {
    console.log('🔐 Login Form Data:');
    console.log('---------------------------');
    console.log('Email:', data.email);
    console.log('Contraseña:', '********' + data.password.slice(-2));
    console.log('---------------------------');

    // TODO: Send to backend API
    // await loginUser(data);

    // Navigate to main app or home
    // router.replace('/');
  };

  /**
   * Handle Google Sign-In
   */
  const handleGoogleSignIn = async () => {
    console.log('🔐 Google Sign-In pressed');

    // TODO: Implement Google Sign-In
    // await signInWithGoogle();
  };

  /**
   * Navigate to forgot password screen
   */
  const handleForgotPassword = () => {
    console.log('🔐 Forgot password pressed');

    // TODO: Navigate to forgot password screen
    // router.push('/(auth)/forgot-password');
  };

  /**
   * Navigate to registration screen
   */
  const handleCreateAccount = () => {
    router.replace('/(auth)/register');
  };

  /**
   * Navigate back to onboarding
   */
  const handleGoBack = () => {
    router.replace('/(onboard)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Header */}
        <View className="border-b-4 border-black flex-row px-6 py-4 bg-white gap-5">
          <Pressable
            onPress={handleGoBack}
            className="flex-row items-center h-auto w-auto bg-black px-2"
          >
            <ThemedText variant="button" className="text-brutalist-brown">
              ← VOLVER
            </ThemedText>
          </Pressable>
          <ThemedText variant="h1" className="text-black">
            INICIAR SESIÓN
          </ThemedText>
        </View>

        {/* Scrollable Form */}
        <ScrollView
          className="flex-1 bg-brutalist-gray"
          contentContainerStyle={{
            padding: 24,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <BrutalistInput
                label="Correo Electrónico"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
                placeholder="correo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            )}
          />

          {/* Password */}
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
                placeholder="Ingresa tu contraseña"
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />

          {/* Forgot Password Link */}
          <Pressable
            onPress={handleForgotPassword}
            className="border-l-4 border-brutalist-yellow pl-4 py-2"
            accessibilityRole="button"
            accessibilityLabel="¿Olvidaste tu contraseña?"
            accessibilityHint="Abre la pantalla de recuperación de contraseña"
          >
            <ThemedText variant="bodyEmphasis" className="text-brutalist-brown">
              ¿Olvidaste tu contraseña?
            </ThemedText>
          </Pressable>

          {/* Login Button */}
          <BrutalistButton
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Iniciar sesión"
            accessibilityHint="Inicia sesión con tu correo y contraseña"
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </BrutalistButton>

          {/* Divider */}
          <View className="flex-row items-center gap-4 py-4">
            <View className="flex-1 h-1 bg-black" />
            <ThemedText variant="caption" className="text-black">
              O CONTINÚA CON
            </ThemedText>
            <View className="flex-1 h-1 bg-black" />
          </View>

          {/* Google Sign-In Button */}
          <BrutalistButton
            variant="secondary"
            onPress={handleGoogleSignIn}
            fullWidth
            accessibilityLabel="Iniciar sesión con Google"
            accessibilityHint="Usa tu cuenta de Google para iniciar sesión"
          >
            Continuar con Google
          </BrutalistButton>

          {/* Create Account Link */}
          <View className="border-t-4 border-black pt-6 mt-4">
            <ThemedText variant="body" className="text-center text-black mb-4">
              ¿No tienes una cuenta?
            </ThemedText>
            <BrutalistButton
              variant="tertiary"
              onPress={handleCreateAccount}
              fullWidth
              accessibilityLabel="Crear una cuenta nueva"
              accessibilityHint="Abre el formulario de registro"
            >
              Crear cuenta
            </BrutalistButton>
          </View>
        </ScrollView>
      </View>
      <StatusBar hidden />
    </KeyboardAvoidingView>
  );
}
