import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "../global.css";
import { StatusBar } from "expo-status-bar";
import { PortalHost } from "@rn-primitives/portal";

import { AnalyticsProvider } from "@/src/features/analytics/components/AnalyticsProvider";
import { ResponsiveProvider } from "@/src/features/responsive";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/src/config/queryClient";
import { useAutoTokenRefresh } from "@/src/hooks";
export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const [loaded] = useFonts({
    // Aleo - 18 variantes completas
    "Aleo-Thin": require("@/assets/fonts/Aleo-Thin.ttf"),
    "Aleo-ThinItalic": require("@/assets/fonts/Aleo-ThinItalic.ttf"),
    "Aleo-ExtraLight": require("@/assets/fonts/Aleo-ExtraLight.ttf"),
    "Aleo-ExtraLightItalic": require("@/assets/fonts/Aleo-ExtraLightItalic.ttf"),
    "Aleo-Light": require("@/assets/fonts/Aleo-Light.ttf"),
    "Aleo-LightItalic": require("@/assets/fonts/Aleo-LightItalic.ttf"),
    "Aleo-Regular": require("@/assets/fonts/Aleo-Regular.ttf"),
    "Aleo-Italic": require("@/assets/fonts/Aleo-Italic.ttf"),
    "Aleo-Medium": require("@/assets/fonts/Aleo-Medium.ttf"),
    "Aleo-MediumItalic": require("@/assets/fonts/Aleo-MediumItalic.ttf"),
    "Aleo-SemiBold": require("@/assets/fonts/Aleo-SemiBold.ttf"),
    "Aleo-SemiBoldItalic": require("@/assets/fonts/Aleo-SemiBoldItalic.ttf"),
    "Aleo-Bold": require("@/assets/fonts/Aleo-Bold.ttf"),
    "Aleo-BoldItalic": require("@/assets/fonts/Aleo-BoldItalic.ttf"),
    "Aleo-ExtraBold": require("@/assets/fonts/Aleo-ExtraBold.ttf"),
    "Aleo-ExtraBoldItalic": require("@/assets/fonts/Aleo-ExtraBoldItalic.ttf"),
    "Aleo-Black": require("@/assets/fonts/Aleo-Black.ttf"),
    "Aleo-BlackItalic": require("@/assets/fonts/Aleo-BlackItalic.ttf"),
  });

  // Auto-refresh de tokens de forma proactiva
  useAutoTokenRefresh();

  if (!loaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <ResponsiveProvider>
        <AnalyticsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="(auth)/login"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(protected)/protected-screen"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="(protected)/(tabs)/home.tsx"
              options={{ headerShown: false }}
            />
          </Stack>
          <StatusBar style="auto" />
          <PortalHost />
        </AnalyticsProvider>
      </ResponsiveProvider>
    </QueryClientProvider>
  );
}
