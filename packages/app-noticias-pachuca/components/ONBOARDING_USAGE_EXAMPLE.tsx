/**
 * ONBOARDING SCREEN - COMPLETE USAGE EXAMPLE
 * Production-ready implementation using Logo and BrutalistButton components
 */

import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { Logo, BrutalistButton, ThemedText } from '@/components';

/**
 * Onboarding Screen Component
 * Demonstrates complete usage of brutalist design system components
 */
export default function OnboardingScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = () => {
    // Navigate to account creation flow
    console.log('Navigate to account creation');
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    // Simulate authentication
    setTimeout(() => {
      setIsLoading(false);
      console.log('Navigate to sign in');
    }, 2000);
  };

  const handleSkip = () => {
    // Navigate to main app without authentication
    console.log('Navigate to main app');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-between px-6 py-12">
          {/* Top Section: Logo */}
          <View className="items-center pt-8">
            <Logo size="large" className="mb-4" />

            <ThemedText
              variant="body"
              className="text-center px-8 mt-4"
              style={{ color: '#4B5563' }}
            >
              Tu fuente confiable de noticias locales en Pachuca
            </ThemedText>
          </View>

          {/* Bottom Section: CTA Buttons */}
          <View className="w-full space-y-4">
            {/* Primary CTA */}
            <BrutalistButton
              variant="primary"
              onPress={handleCreateAccount}
              fullWidth
              accessibilityLabel="Crear una cuenta nueva en Noticias Pachuca"
              accessibilityHint="Abre el formulario de registro"
              testID="onboarding-create-account-button"
            >
              Crear cuenta
            </BrutalistButton>

            {/* Secondary CTA */}
            <BrutalistButton
              variant="secondary"
              onPress={handleSignIn}
              fullWidth
              loading={isLoading}
              disabled={isLoading}
              accessibilityLabel="Iniciar sesión con tu cuenta existente"
              accessibilityHint="Abre el formulario de inicio de sesión"
              testID="onboarding-sign-in-button"
            >
              {isLoading ? 'Cargando...' : 'Iniciar sesión'}
            </BrutalistButton>

            {/* Tertiary Skip */}
            <BrutalistButton
              variant="tertiary"
              onPress={handleSkip}
              fullWidth
              accessibilityLabel="Continuar sin crear cuenta"
              accessibilityHint="Accede a las noticias sin autenticación"
              testID="onboarding-skip-button"
            >
              Continuar sin cuenta
            </BrutalistButton>

            {/* Footer Text */}
            <ThemedText
              variant="small"
              className="text-center mt-6 px-4"
              style={{ color: '#6B7280' }}
            >
              Al continuar, aceptas nuestros Términos de Servicio y Política de
              Privacidad
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * ALTERNATIVE LAYOUT: HERO WITH FEATURES
 */
export function OnboardingWithFeaturesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerClassName="flex-grow"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 py-8">
          {/* Hero Section */}
          <View className="items-center mb-12">
            <Logo size="large" />
          </View>

          {/* Features Section */}
          <View className="mb-8 space-y-6">
            <FeatureItem
              title="NOTICIAS LOCALES"
              description="Cobertura completa de eventos en Pachuca y alrededores"
            />
            <FeatureItem
              title="ACTUALIZACIONES EN TIEMPO REAL"
              description="Mantente informado con notificaciones instantáneas"
            />
            <FeatureItem
              title="CONTENIDO VERIFICADO"
              description="Noticias confiables de fuentes oficiales"
            />
          </View>

          {/* CTA Section */}
          <View className="space-y-4">
            <BrutalistButton
              variant="primary"
              onPress={() => console.log('Start')}
              fullWidth
            >
              Comenzar
            </BrutalistButton>

            <BrutalistButton
              variant="tertiary"
              onPress={() => console.log('Skip')}
              fullWidth
            >
              Explorar sin cuenta
            </BrutalistButton>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Feature Item Component
 * Used in alternative layout
 */
function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="border-l-4 border-brutalist-brown pl-4">
      <ThemedText variant="caption" className="mb-1">
        {title}
      </ThemedText>
      <ThemedText variant="body" style={{ color: '#4B5563' }}>
        {description}
      </ThemedText>
    </View>
  );
}

/**
 * MINIMAL LAYOUT: CENTERED LOGO AND SINGLE CTA
 */
export function MinimalOnboardingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        {/* Logo */}
        <Logo size="large" className="mb-16" />

        {/* Single CTA */}
        <BrutalistButton
          variant="primary"
          onPress={() => console.log('Get Started')}
          fullWidth
          className="max-w-md"
        >
          Empezar ahora
        </BrutalistButton>

        {/* Secondary Action */}
        <BrutalistButton
          variant="tertiary"
          onPress={() => console.log('Sign In')}
          className="mt-4"
        >
          ¿Ya tienes cuenta?
        </BrutalistButton>
      </View>
    </SafeAreaView>
  );
}

/**
 * USAGE IN APP HEADER
 */
export function AppHeader() {
  return (
    <View className="bg-white border-b-4 border-black px-4 py-3">
      <Logo size="small" />
    </View>
  );
}

/**
 * USAGE IN BUTTON GROUP
 */
export function ActionButtonGroup() {
  return (
    <View className="flex-row space-x-4 p-4">
      <BrutalistButton
        variant="secondary"
        onPress={() => console.log('Cancel')}
        className="flex-1"
      >
        Cancelar
      </BrutalistButton>

      <BrutalistButton
        variant="primary"
        onPress={() => console.log('Confirm')}
        className="flex-1"
      >
        Confirmar
      </BrutalistButton>
    </View>
  );
}

/**
 * USAGE WITH LOADING STATE
 */
export function FormWithLoadingButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
  };

  return (
    <View className="p-6">
      {/* Form fields would go here */}

      <BrutalistButton
        variant="primary"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        fullWidth
      >
        Enviar formulario
      </BrutalistButton>
    </View>
  );
}

/**
 * USAGE WITH DISABLED STATE
 */
export function FormValidationExample() {
  const [formIsValid, setFormIsValid] = useState(false);

  return (
    <View className="p-6">
      {/* Form fields would go here */}

      <BrutalistButton
        variant="primary"
        onPress={() => console.log('Submit')}
        disabled={!formIsValid}
        fullWidth
      >
        Continuar
      </BrutalistButton>

      <ThemedText variant="small" className="text-center mt-4" style={{ color: '#FF0000' }}>
        {!formIsValid && 'Por favor completa todos los campos requeridos'}
      </ThemedText>
    </View>
  );
}

/**
 * LOGO SIZE COMPARISON
 */
export function LogoSizeComparison() {
  return (
    <View className="p-8 space-y-8 bg-gray-50">
      <View>
        <ThemedText variant="caption" className="mb-2">
          LARGE (Hero)
        </ThemedText>
        <Logo size="large" />
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          MEDIUM (Default)
        </ThemedText>
        <Logo size="medium" />
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          SMALL (Header)
        </ThemedText>
        <Logo size="small" />
      </View>
    </View>
  );
}

/**
 * BUTTON VARIANT COMPARISON
 */
export function ButtonVariantComparison() {
  return (
    <View className="p-8 space-y-6 bg-gray-50">
      <View>
        <ThemedText variant="caption" className="mb-2">
          PRIMARY (CTA)
        </ThemedText>
        <BrutalistButton
          variant="primary"
          onPress={() => console.log('Primary')}
          fullWidth
        >
          Primary Button
        </BrutalistButton>
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          SECONDARY (Alternative)
        </ThemedText>
        <BrutalistButton
          variant="secondary"
          onPress={() => console.log('Secondary')}
          fullWidth
        >
          Secondary Button
        </BrutalistButton>
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          TERTIARY (Minimal)
        </ThemedText>
        <BrutalistButton
          variant="tertiary"
          onPress={() => console.log('Tertiary')}
          fullWidth
        >
          Tertiary Button
        </BrutalistButton>
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          DISABLED STATE
        </ThemedText>
        <BrutalistButton
          variant="primary"
          onPress={() => {}}
          disabled
          fullWidth
        >
          Disabled Button
        </BrutalistButton>
      </View>

      <View>
        <ThemedText variant="caption" className="mb-2">
          LOADING STATE
        </ThemedText>
        <BrutalistButton
          variant="primary"
          onPress={() => {}}
          loading
          disabled
          fullWidth
        >
          Loading...
        </BrutalistButton>
      </View>
    </View>
  );
}
