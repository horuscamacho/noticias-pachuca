import { BrutalistButton } from "@/components/BrutalistButton";
import { Logo } from "@/components/Logo";
import {
  OnboardingCarousel,
  OnboardingSlide,
} from "@/components/OnboardingCarousel";
import { PaginationDots } from "@/components/PaginationDots";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Onboarding slides data
 */
const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: "NOTICIAS DE ÚLTIMA HORA",
    description:
      "Sigue las historias más importantes con reportajes en vivo, videos y notificaciones instantáneas.",
  },
  {
    id: 2,
    title: "MANTENTE INFORMADO",
    description:
      "Recibe actualizaciones instantáneas sobre noticias locales y nacionales que te importan.",
  },
  {
    id: 3,
    title: "FUENTES CONFIABLES",
    description:
      "Lee noticias verificadas de periodistas confiables y fuentes oficiales de Pachuca.",
  },
];

/**
 * OnboardingScreen - Brutalist onboarding experience
 *
 * Features:
 * - Logo with NOTICIAS PACHUCA branding
 * - 3-slide carousel with pagination
 * - Three action buttons (primary, secondary, tertiary)
 * - Brutalist design system with thick borders and bold colors
 * - Full accessibility support
 * - Responsive layout with SafeAreaView
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  /**
   * Navigate to account creation flow
   */
  const handleCreateAccount = () => {
    router.replace("/(auth)/register");
  };

  /**
   * Navigate to sign in flow
   */
  const handleSignIn = () => {
    router.replace("/(auth)/login");
  };

  /**
   * Skip onboarding and navigate to main app
   */
  const handleContinueWithoutAccount = () => {
    // Navigate to home tab in invited section
    router.replace("/(invited)/home");
  };

  const { top, bottom } = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: top,
        paddingBottom: bottom,
      }}
      className="flex-1 bg-white"
    >
      <View className="flex-1">
        {/* Header with Logo - Reduced size */}
        <View className="pt-4 pb-3 items-center bg-white border-b-4 border-black">
          <Logo size="small" />
        </View>

        {/* Carousel Section */}
        <View className="flex-1">
          <OnboardingCarousel
            slides={ONBOARDING_SLIDES}
            onSlideChange={setActiveSlide}
            className="flex-1"
          />

          {/* Pagination Dots */}
          <View className="py-6 items-center">
            <PaginationDots
              total={ONBOARDING_SLIDES.length}
              activeIndex={activeSlide}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View className="px-6 pb-8 gap-4 bg-white border-t-4 border-black pt-6">
          {/* Primary CTA - Create Account */}
          <BrutalistButton
            variant="primary"
            onPress={handleCreateAccount}
            fullWidth
            accessibilityLabel="Crear una cuenta de Noticias Pachuca"
            accessibilityHint="Abre el formulario de registro"
          >
            Crear cuenta
          </BrutalistButton>

          {/* Secondary CTA - Sign In */}
          <BrutalistButton
            variant="secondary"
            onPress={handleSignIn}
            fullWidth
            accessibilityLabel="Iniciar sesión"
            accessibilityHint="Abre la pantalla de inicio de sesión"
          >
            Iniciar sesión
          </BrutalistButton>

          {/* Tertiary CTA - Skip */}
          <BrutalistButton
            variant="tertiary"
            onPress={handleContinueWithoutAccount}
            fullWidth
            accessibilityLabel="Continuar sin cuenta"
            accessibilityHint="Salta el registro y ve a la aplicación"
          >
            Continuar sin cuenta
          </BrutalistButton>
        </View>
      </View>
      <StatusBar hidden />
    </View>
  );
}
