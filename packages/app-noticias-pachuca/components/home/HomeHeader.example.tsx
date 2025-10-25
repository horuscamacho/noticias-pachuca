/**
 * HomeHeader Usage Examples
 *
 * Demonstrates various usage patterns for the HomeHeader component
 * and its child components (BrutalistBanner, EditionDropdown).
 */

import React, { useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import {
  HomeHeader,
  BrutalistBanner,
  EditionDropdown,
} from './index';
import { ThemedText } from '../ThemedText';

/**
 * Example 1: Basic HomeHeader
 */
export const BasicHomeHeaderExample = () => {
  const handleEditionPress = () => {
    Alert.alert('Edición', 'Abrir selector de edición');
  };

  const handleRegister = () => {
    Alert.alert('Registro', 'Abrir formulario de registro');
  };

  return (
    <HomeHeader
      onEditionPress={handleEditionPress}
      onBannerCtaPress={handleRegister}
    />
  );
};

/**
 * Example 2: HomeHeader with Current Edition
 */
export const HomeHeaderWithEditionExample = () => {
  const [currentEdition, setCurrentEdition] = useState('PACHUCA');

  const handleEditionPress = () => {
    // In a real app, this would open a modal/action sheet
    Alert.alert(
      'Seleccionar Edición',
      'Elige tu edición preferida',
      [
        { text: 'Pachuca', onPress: () => setCurrentEdition('PACHUCA') },
        { text: 'Nacional', onPress: () => setCurrentEdition('NACIONAL') },
        { text: 'Hidalgo', onPress: () => setCurrentEdition('HIDALGO') },
      ]
    );
  };

  const handleRegister = () => {
    Alert.alert('Registro', 'Abrir formulario de registro');
  };

  return (
    <HomeHeader
      onEditionPress={handleEditionPress}
      currentEdition={currentEdition}
      onBannerCtaPress={handleRegister}
    />
  );
};

/**
 * Example 3: HomeHeader with Custom Banner
 */
export const HomeHeaderCustomBannerExample = () => {
  const handleEditionPress = () => {
    Alert.alert('Edición', 'Abrir selector de edición');
  };

  const handlePromotion = () => {
    Alert.alert('Promoción', 'Ver detalles de la promoción especial');
  };

  return (
    <HomeHeader
      onEditionPress={handleEditionPress}
      onBannerCtaPress={handlePromotion}
      bannerTitle="OFERTA ESPECIAL: 3 MESES GRATIS PARA NUEVOS SUSCRIPTORES"
      bannerCtaText="Obtener ahora"
    />
  );
};

/**
 * Example 4: HomeHeader without Banner
 */
export const HomeHeaderNoBannerExample = () => {
  const handleEditionPress = () => {
    Alert.alert('Edición', 'Abrir selector de edición');
  };

  return (
    <HomeHeader
      onEditionPress={handleEditionPress}
      onBannerCtaPress={() => {}}
      hideBanner={true}
    />
  );
};

/**
 * Example 5: Standalone BrutalistBanner Component
 */
export const StandaloneBannerExample = () => {
  const handleCtaPress = () => {
    Alert.alert('CTA Pressed', 'Banner action triggered');
  };

  return (
    <View className="gap-4 p-4">
      {/* Default brown banner */}
      <BrutalistBanner
        title="SUSCRÍBETE PARA VIVIR LA NUEVA EXPERIENCIA DE LAS NOTICIAS EN HIDALGO"
        ctaText="Registrarse"
        onCtaPress={handleCtaPress}
      />

      {/* Yellow banner */}
      <BrutalistBanner
        title="OFERTA POR TIEMPO LIMITADO"
        ctaText="Ver oferta"
        onCtaPress={handleCtaPress}
        backgroundColor="yellow"
      />

      {/* Black banner */}
      <BrutalistBanner
        title="EDICIÓN ESPECIAL DISPONIBLE"
        ctaText="Leer ahora"
        onCtaPress={handleCtaPress}
        backgroundColor="black"
      />

      {/* Disabled banner */}
      <BrutalistBanner
        title="PRÓXIMAMENTE"
        ctaText="Suscribirse"
        onCtaPress={() => {}}
        disabled={true}
      />
    </View>
  );
};

/**
 * Example 6: Standalone EditionDropdown Component
 */
export const StandaloneDropdownExample = () => {
  const [edition, setEdition] = useState('EDICIÓN');

  const handlePress = () => {
    Alert.alert(
      'Seleccionar Edición',
      'Elige tu edición preferida',
      [
        { text: 'Pachuca', onPress: () => setEdition('PACHUCA') },
        { text: 'Nacional', onPress: () => setEdition('NACIONAL') },
        { text: 'Hidalgo', onPress: () => setEdition('HIDALGO') },
        { text: 'Todo', onPress: () => setEdition('EDICIÓN') },
      ]
    );
  };

  return (
    <View className="p-4 gap-4">
      <ThemedText variant="h3">Estados del Dropdown:</ThemedText>

      {/* Default state */}
      <EditionDropdown onPress={handlePress} />

      {/* With edition selected */}
      <EditionDropdown
        onPress={handlePress}
        currentEdition={edition}
      />

      {/* Disabled state */}
      <EditionDropdown
        onPress={() => {}}
        currentEdition="NACIONAL"
        disabled={true}
      />
    </View>
  );
};

/**
 * Example 7: Complete Home Screen Header Integration
 */
export const CompleteHomeScreenExample = () => {
  const [currentEdition, setCurrentEdition] = useState<string | undefined>(
    undefined
  );
  const [showBanner, setShowBanner] = useState(true);

  const handleEditionPress = () => {
    Alert.alert(
      'Seleccionar Edición',
      'Elige la edición que deseas ver',
      [
        { text: 'Todas', onPress: () => setCurrentEdition(undefined) },
        { text: 'Pachuca', onPress: () => setCurrentEdition('PACHUCA') },
        { text: 'Nacional', onPress: () => setCurrentEdition('NACIONAL') },
        { text: 'Hidalgo', onPress: () => setCurrentEdition('HIDALGO') },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleRegister = () => {
    Alert.alert(
      'Registro',
      'Redirigiendo al formulario de registro...',
      [
        {
          text: 'OK',
          onPress: () => {
            // Hide banner after registration flow starts
            setShowBanner(false);
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <HomeHeader
        onEditionPress={handleEditionPress}
        currentEdition={currentEdition}
        onBannerCtaPress={handleRegister}
        hideBanner={!showBanner}
      />

      {/* Placeholder for news content */}
      <View className="p-4">
        <ThemedText variant="h2" className="mb-4">
          Últimas Noticias
        </ThemedText>
        <ThemedText variant="body" className="mb-2">
          Edición actual: {currentEdition || 'Todas las ediciones'}
        </ThemedText>
        <ThemedText variant="small">
          {showBanner
            ? 'Banner visible'
            : 'Banner oculto (usuario inició registro)'}
        </ThemedText>
      </View>
    </ScrollView>
  );
};

/**
 * All Examples Showcase
 */
export const AllHomeHeaderExamples = () => {
  return (
    <ScrollView className="flex-1 bg-gray-100">
      {/* Example 1 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          1. Basic HomeHeader
        </ThemedText>
        <BasicHomeHeaderExample />
      </View>

      {/* Example 2 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          2. With Current Edition
        </ThemedText>
        <HomeHeaderWithEditionExample />
      </View>

      {/* Example 3 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          3. Custom Banner Content
        </ThemedText>
        <HomeHeaderCustomBannerExample />
      </View>

      {/* Example 4 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          4. Without Banner
        </ThemedText>
        <HomeHeaderNoBannerExample />
      </View>

      {/* Example 5 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          5. Standalone Banners
        </ThemedText>
        <StandaloneBannerExample />
      </View>

      {/* Example 6 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          6. Standalone Dropdown
        </ThemedText>
        <StandaloneDropdownExample />
      </View>

      {/* Example 7 */}
      <View className="mb-4">
        <ThemedText variant="h3" className="p-4 bg-white">
          7. Complete Integration
        </ThemedText>
        <CompleteHomeScreenExample />
      </View>
    </ScrollView>
  );
};
