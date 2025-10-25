import React from 'react';
import { View, Text, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import { ChevronDown } from 'lucide-react-native';

interface CollapsibleHeaderProps {
  logoAnimatedStyle: {
    opacity: number;
  };
  bannerAnimatedStyle: {
    opacity: number;
  };
  onLayout: (event: LayoutChangeEvent) => void;
  onRegisterPress?: () => void;
  onEditionPress?: () => void;
}

export const CollapsibleHeader: React.FC<CollapsibleHeaderProps> = ({
  logoAnimatedStyle,
  bannerAnimatedStyle,
  onLayout,
  onRegisterPress,
  onEditionPress,
}) => {
  return (
    <Animated.View style={styles.container} onLayout={onLayout}>
      {/* Logo Section */}
      <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>NOTICIAS PACHUCA</Text>
        </View>
        <Pressable
          style={styles.dropdownButton}
          onPress={onEditionPress}
          accessibilityLabel="Seleccionar edición"
          accessibilityHint="Abre el menú para seleccionar una edición"
          accessibilityRole="button"
        >
          <Text style={styles.dropdownText}>EDICIÓN</Text>
          <ChevronDown size={16} color="#000000" />
        </Pressable>
      </Animated.View>

      {/* Banner Section */}
      <Animated.View style={[styles.bannerSection, bannerAnimatedStyle]}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerText}>
            SUSCRÍBETE PARA VIVIR LA NUEVA{'\n'}
            EXPERIENCIA DE LAS NOTICIAS{'\n'}
            EN HIDALGO
          </Text>
          <Pressable
            style={styles.ctaButton}
            onPress={onRegisterPress}
            accessibilityLabel="Registrarse"
            accessibilityHint="Crea una cuenta para suscribirte"
            accessibilityRole="button"
          >
            <Text style={styles.ctaButtonText}>REGISTRARSE</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F7F7F7',
  },

  // Logo Section
  logoSection: {
    height: 80,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 4,
    borderBottomColor: '#000000',
  },
  logoContainer: {
    flex: 1,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#000000',
    lineHeight: 24,
  },
  dropdownButton: {
    width: 100,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#000000',
  },

  // Banner Section
  bannerSection: {
    minHeight: 180,
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: '#854836',
    borderWidth: 4,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  bannerText: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
  },
  ctaButton: {
    height: 48,
    minWidth: 160,
    backgroundColor: '#FFB22C',
    borderWidth: 4,
    borderColor: '#000000',
    borderRadius: 0,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#000000',
    lineHeight: 20,
  },
});
