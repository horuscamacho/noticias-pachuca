import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import React from "react";
import { Controller, useForm } from "react-hook-form";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrutalistButton } from "@/components/BrutalistButton";
import { BrutalistDatePicker } from "@/components/BrutalistDatePicker";
import { BrutalistInput } from "@/components/BrutalistInput";
import { BrutalistSegmentedControl } from "@/components/BrutalistSegmentedControl";
import { ThemedText } from "@/components/ThemedText";
import {
    GENDER_OPTIONS,
    RegisterFormData,
    registerSchema,
} from "@/lib/validations/registerSchema";

/**
 * RegisterScreen - User registration form with brutalist design
 *
 * Features:
 * - Form validation with Zod
 * - Managed by react-hook-form
 * - Separated concerns (logic vs presentation)
 * - Full TypeScript typing
 * - Accessibility support
 * - Brutalist styling
 *
 * Form Fields:
 * - First name
 * - Last name
 * - Email
 * - Birthdate (18+ validation)
 * - Gender (Hombre/Mujer/Otro)
 * - Password
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Form state management with react-hook-form + Zod
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      birthdate: undefined,
      gender: undefined,
      password: "",
    },
  });

  /**
   * Handle form submission
   * For now, just logs the data (no backend)
   */
  const onSubmit = async (data: RegisterFormData) => {
    console.log("📝 Registration Form Data:");
    console.log("---------------------------");
    console.log("Nombre:", data.firstName);
    console.log("Apellido:", data.lastName);
    console.log("Email:", data.email);
    console.log(
      "Fecha de Nacimiento:",
      data.birthdate.toLocaleDateString("es-MX")
    );
    console.log("Género:", data.gender);
    console.log("Contraseña:", "********" + data.password.slice(-2)); // Partial masking
    console.log("---------------------------");

    // TODO: Send to backend API
    // await registerUser(data);

    // Navigate to success screen or home
    // router.replace('/');
  };

  /**
   * Navigate back to onboarding
   */
  const handleGoBack = () => {
    router.replace("/(onboard)");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View
        style={{
          flex: 1,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          backgroundColor: "#FFFFFF",
        }}
      >
        {/* Header */}
        <View className="border-b-4 border-black flex-row px-6 py-4 bg-white gap-5">
          <Pressable
            onPress={handleGoBack}
            className=" flex-row items-center h-auto w-auto bg-black px-2"
          >
            <ThemedText variant="button" className="text-brutalist-brown">
              ← VOLVER
            </ThemedText>
          </Pressable>
          <ThemedText variant="h1" className="text-black">
            CREAR CUENTA
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
          {/* First Name */}
          <Controller
            control={control}
            name="firstName"
            render={({ field: { onChange, onBlur, value } }) => (
              <BrutalistInput
                label="Nombre"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.firstName?.message}
                placeholder="Ingresa tu nombre"
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />

          {/* Last Name */}
          <Controller
            control={control}
            name="lastName"
            render={({ field: { onChange, onBlur, value } }) => (
              <BrutalistInput
                label="Apellido"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.lastName?.message}
                placeholder="Ingresa tu apellido"
                autoCapitalize="words"
                returnKeyType="next"
              />
            )}
          />

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

          {/* Birthdate */}
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

          {/* Gender */}
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, value } }) => (
              <BrutalistSegmentedControl
                label="Género"
                options={GENDER_OPTIONS}
                value={value || ""}
                onChange={onChange}
                error={errors.gender?.message}
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
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            )}
          />
        </ScrollView>

        {/* Submit Button (Fixed at bottom) */}
        <View className="px-6 py-4 bg-white border-t-4 border-black">
          <BrutalistButton
            variant="primary"
            onPress={handleSubmit(onSubmit)}
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
            accessibilityLabel="Crear cuenta"
            accessibilityHint="Registrarse en Noticias Pachuca"
          >
            {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
          </BrutalistButton>
        </View>
      </View>
      <StatusBar hidden />
    </KeyboardAvoidingView>
  );
}
