import React, { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { BrutalistButton, Logo, ThemedText } from './index';

/**
 * Complete usage examples for Logo and BrutalistButton components
 *
 * This file demonstrates all variants, states, and use cases for the brutalist
 * design system components in a production mobile app context.
 */

/**
 * Example 1: Onboarding Screen
 * Shows all three button variants with logo in typical authentication flow
 */
export const OnboardingScreenExample = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAccount = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    Alert.alert('Success', 'Account created!');
  };

  const handleSignIn = () => {
    Alert.alert('Sign In', 'Navigate to sign in screen');
  };

  const handleContinueWithoutAccount = () => {
    Alert.alert('Continue', 'Navigate to main app');
  };

  return (
    <View className="flex-1 bg-background px-6 justify-center items-center">
      {/* Logo - Large size for hero section */}
      <Logo size="large" className="mb-12" />

      {/* Headline */}
      <ThemedText
        variant="h2"
        className="text-center mb-4"
        style={{ color: '#000000' }}
      >
        ÚLTIMAS NOTICIAS DE PACHUCA
      </ThemedText>

      {/* Subtitle */}
      <ThemedText variant="body" className="text-center mb-12 px-4">
        Mantente informado con las noticias más relevantes de tu ciudad
      </ThemedText>

      {/* Primary CTA - Create Account */}
      <BrutalistButton
        variant="primary"
        onPress={handleCreateAccount}
        loading={isLoading}
        disabled={isLoading}
        fullWidth
        className="mb-4"
        accessibilityLabel="Crear una cuenta nueva"
        accessibilityHint="Abre el formulario de registro"
      >
        Crear cuenta
      </BrutalistButton>

      {/* Secondary CTA - Sign In */}
      <BrutalistButton
        variant="secondary"
        onPress={handleSignIn}
        fullWidth
        className="mb-4"
        accessibilityLabel="Iniciar sesión con una cuenta existente"
      >
        Iniciar sesión
      </BrutalistButton>

      {/* Tertiary action - Skip */}
      <BrutalistButton
        variant="tertiary"
        onPress={handleContinueWithoutAccount}
        fullWidth
        accessibilityLabel="Continuar sin crear cuenta"
        accessibilityHint="Accede a la app sin registrarte"
      >
        Continuar sin cuenta
      </BrutalistButton>
    </View>
  );
};

/**
 * Example 2: All Logo Sizes
 * Demonstrates responsive logo sizing for different contexts
 */
export const LogoSizesExample = () => {
  return (
    <ScrollView
      className="flex-1 bg-background px-6 py-12"
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <ThemedText variant="h3" className="mb-8">
        LOGO SIZE VARIANTS
      </ThemedText>

      {/* Small - For compact headers/navigation */}
      <View className="mb-12 items-center">
        <ThemedText variant="caption" className="mb-4">
          SMALL (Navigation/Header)
        </ThemedText>
        <Logo size="small" />
      </View>

      {/* Medium - Default size for general use */}
      <View className="mb-12 items-center">
        <ThemedText variant="caption" className="mb-4">
          MEDIUM (Default)
        </ThemedText>
        <Logo size="medium" />
      </View>

      {/* Large - For hero sections/splash screens */}
      <View className="mb-12 items-center">
        <ThemedText variant="caption" className="mb-4">
          LARGE (Hero/Splash)
        </ThemedText>
        <Logo size="large" />
      </View>
    </ScrollView>
  );
};

/**
 * Example 3: All Button Variants
 * Comprehensive showcase of button states and variants
 */
export const ButtonVariantsExample = () => {
  const [primaryLoading, setPrimaryLoading] = useState(false);
  const [secondaryLoading, setSecondaryLoading] = useState(false);

  const simulateAsync = async (
    setter: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    setter(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setter(false);
  };

  return (
    <ScrollView className="flex-1 bg-background px-6 py-12">
      <Logo size="medium" className="mb-12 self-center" />

      <ThemedText variant="h3" className="mb-8">
        BUTTON VARIANTS
      </ThemedText>

      {/* Primary Variant */}
      <View className="mb-8">
        <ThemedText variant="caption" className="mb-3">
          PRIMARY (CTA)
        </ThemedText>

        {/* Normal */}
        <BrutalistButton
          variant="primary"
          onPress={() => simulateAsync(setPrimaryLoading)}
          className="mb-3"
        >
          Primary Button
        </BrutalistButton>

        {/* Loading */}
        <BrutalistButton
          variant="primary"
          onPress={() => {}}
          loading={primaryLoading}
          disabled={primaryLoading}
          className="mb-3"
        >
          Loading State
        </BrutalistButton>

        {/* Disabled */}
        <BrutalistButton
          variant="primary"
          onPress={() => {}}
          disabled={true}
          className="mb-3"
        >
          Disabled State
        </BrutalistButton>

        {/* Full Width */}
        <BrutalistButton
          variant="primary"
          onPress={() => Alert.alert('Full Width', 'Button pressed')}
          fullWidth
        >
          Full Width
        </BrutalistButton>
      </View>

      {/* Secondary Variant */}
      <View className="mb-8">
        <ThemedText variant="caption" className="mb-3">
          SECONDARY (Alternative)
        </ThemedText>

        {/* Normal */}
        <BrutalistButton
          variant="secondary"
          onPress={() => simulateAsync(setSecondaryLoading)}
          className="mb-3"
        >
          Secondary Button
        </BrutalistButton>

        {/* Loading */}
        <BrutalistButton
          variant="secondary"
          onPress={() => {}}
          loading={secondaryLoading}
          disabled={secondaryLoading}
          className="mb-3"
        >
          Loading State
        </BrutalistButton>

        {/* Disabled */}
        <BrutalistButton
          variant="secondary"
          onPress={() => {}}
          disabled={true}
          className="mb-3"
        >
          Disabled State
        </BrutalistButton>
      </View>

      {/* Tertiary Variant */}
      <View className="mb-8">
        <ThemedText variant="caption" className="mb-3">
          TERTIARY (Subtle)
        </ThemedText>

        {/* Normal */}
        <BrutalistButton
          variant="tertiary"
          onPress={() => Alert.alert('Tertiary', 'Button pressed')}
          className="mb-3"
        >
          Tertiary Button
        </BrutalistButton>

        {/* Disabled */}
        <BrutalistButton
          variant="tertiary"
          onPress={() => {}}
          disabled={true}
          className="mb-3"
        >
          Disabled State
        </BrutalistButton>

        {/* Full Width */}
        <BrutalistButton
          variant="tertiary"
          onPress={() => Alert.alert('Skip', 'Action skipped')}
          fullWidth
        >
          Skip This Step
        </BrutalistButton>
      </View>
    </ScrollView>
  );
};

/**
 * Example 4: Article Action Buttons
 * Shows buttons in content context (share, save, comment)
 */
export const ArticleActionsExample = () => {
  const [isSaved, setIsSaved] = useState(false);

  const handleShare = () => {
    Alert.alert('Share', 'Share article functionality');
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(isSaved ? 'Removed' : 'Saved', 'Article bookmark toggled');
  };

  const handleComment = () => {
    Alert.alert('Comment', 'Open comments section');
  };

  return (
    <View className="flex-1 bg-background px-6 py-12">
      <Logo size="small" className="mb-8 self-center" />

      <ThemedText variant="h3" className="mb-4">
        BREAKING NEWS TITLE
      </ThemedText>

      <ThemedText variant="body" className="mb-8">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua.
      </ThemedText>

      {/* Action buttons in row */}
      <View className="flex-row gap-3 mb-6">
        <BrutalistButton
          variant="secondary"
          onPress={handleShare}
          className="flex-1"
        >
          Compartir
        </BrutalistButton>

        <BrutalistButton
          variant={isSaved ? 'primary' : 'secondary'}
          onPress={handleSave}
          className="flex-1"
        >
          {isSaved ? 'Guardado' : 'Guardar'}
        </BrutalistButton>
      </View>

      <BrutalistButton
        variant="tertiary"
        onPress={handleComment}
        fullWidth
      >
        Ver comentarios (24)
      </BrutalistButton>
    </View>
  );
};

/**
 * Example 5: Form Submission
 * Demonstrates buttons in form context with validation
 */
export const FormSubmissionExample = () => {
  const [formValid, setFormValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    Alert.alert('Success', 'Form submitted successfully');
  };

  const handleCancel = () => {
    Alert.alert('Cancel', 'Form cancelled');
  };

  return (
    <View className="flex-1 bg-background px-6 py-12">
      <Logo size="small" className="mb-8 self-center" />

      <ThemedText variant="h3" className="mb-8">
        CONTACTO
      </ThemedText>

      {/* Form fields would go here */}
      <ThemedText variant="body" className="mb-12">
        (Form fields: name, email, message...)
      </ThemedText>

      {/* Toggle validation for demo */}
      <BrutalistButton
        variant="tertiary"
        onPress={() => setFormValid(!formValid)}
        fullWidth
        className="mb-6"
      >
        {formValid ? 'Invalid Form (Click)' : 'Valid Form (Click)'}
      </BrutalistButton>

      {/* Submit button - disabled when invalid */}
      <BrutalistButton
        variant="primary"
        onPress={handleSubmit}
        disabled={!formValid || isSubmitting}
        loading={isSubmitting}
        fullWidth
        className="mb-4"
        accessibilityLabel="Enviar formulario de contacto"
      >
        Enviar
      </BrutalistButton>

      {/* Cancel button */}
      <BrutalistButton
        variant="secondary"
        onPress={handleCancel}
        disabled={isSubmitting}
        fullWidth
      >
        Cancelar
      </BrutalistButton>
    </View>
  );
};

/**
 * Example 6: Minimal Header with Logo
 * Shows logo in navigation/header context
 */
export const HeaderExample = () => {
  const handleMenuPress = () => {
    Alert.alert('Menu', 'Open navigation menu');
  };

  const handleSearchPress = () => {
    Alert.alert('Search', 'Open search');
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b-4 border-black">
        <BrutalistButton
          variant="tertiary"
          onPress={handleMenuPress}
          accessibilityLabel="Abrir menú"
        >
          Menu
        </BrutalistButton>

        <Logo size="small" />

        <BrutalistButton
          variant="tertiary"
          onPress={handleSearchPress}
          accessibilityLabel="Buscar noticias"
        >
          Buscar
        </BrutalistButton>
      </View>

      {/* Content */}
      <View className="flex-1 items-center justify-center px-6">
        <ThemedText variant="h2" className="text-center">
          CONTENT AREA
        </ThemedText>
      </View>
    </View>
  );
};

/**
 * Export all examples
 */
export const BrutalistComponentExamples = {
  OnboardingScreen: OnboardingScreenExample,
  LogoSizes: LogoSizesExample,
  ButtonVariants: ButtonVariantsExample,
  ArticleActions: ArticleActionsExample,
  FormSubmission: FormSubmissionExample,
  Header: HeaderExample,
};
