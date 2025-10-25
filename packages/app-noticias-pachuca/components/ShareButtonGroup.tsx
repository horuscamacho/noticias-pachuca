/**
 * ShareButtonGroup Component
 * Social media share buttons with platform-specific colors
 */

import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ViewStyle, TextStyle, Linking, Alert, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';

interface ShareButtonGroupProps {
  title: string;
  url: string;
  onShareComplete?: (platform: 'facebook' | 'twitter' | 'whatsapp') => void;
  showLabel?: boolean;
  className?: string;
  style?: ViewStyle;
  testID?: string;
}

type SocialPlatform = 'facebook' | 'twitter' | 'whatsapp';

interface PlatformConfig {
  label: string;
  backgroundColor: string;
  pressedColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  facebook: {
    label: 'FACEBOOK',
    backgroundColor: '#4267B2',
    pressedColor: '#365899',
    icon: 'logo-facebook',
  },
  twitter: {
    label: 'X',
    backgroundColor: '#000000',
    pressedColor: '#14171A',
    icon: 'logo-twitter',
  },
  whatsapp: {
    label: 'WHATSAPP',
    backgroundColor: '#25D366',
    pressedColor: '#128C7E',
    icon: 'logo-whatsapp',
  },
};

/**
 * Social media share button group
 *
 * @example
 * ```tsx
 * <ShareButtonGroup
 *   title="Noticia importante"
 *   url="https://example.com/noticia/123"
 *   showLabel={true}
 * />
 * ```
 */
export const ShareButtonGroup = React.memo<ShareButtonGroupProps>(
  ({
    title,
    url,
    onShareComplete,
    showLabel = true,
    style,
    testID = 'share-button-group',
  }) => {
    const handleShare = async (platform: SocialPlatform) => {
      try {
        let shareUrl: string;

        switch (platform) {
          case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
            break;
          case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
            break;
          case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
            break;
        }

        const canOpen = await Linking.canOpenURL(shareUrl);
        if (canOpen) {
          await Linking.openURL(shareUrl);
          onShareComplete?.(platform);
        } else {
          // Fallback to native share
          await Share.share({
            message: `${title}\n\n${url}`,
            url: url,
          });
          onShareComplete?.(platform);
        }
      } catch (error) {
        console.error(`Error sharing to ${platform}:`, error);
        Alert.alert('Error', `No se pudo compartir en ${PLATFORM_CONFIGS[platform].label}`);
      }
    };

    return (
      <View style={[styles.container, style]} testID={testID}>
        {showLabel && (
          <ThemedText variant="caption" style={styles.label}>
            COMPARTIR:
          </ThemedText>
        )}

        <View style={styles.buttonsContainer}>
          {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
            <ShareButton
              key={platform}
              platform={platform as SocialPlatform}
              config={config}
              onPress={() => handleShare(platform as SocialPlatform)}
            />
          ))}
        </View>
      </View>
    );
  }
);

ShareButtonGroup.displayName = 'ShareButtonGroup';

/**
 * Individual share button
 */
const ShareButton = React.memo<{
  platform: SocialPlatform;
  config: PlatformConfig;
  onPress: () => void;
}>(({ platform, config, onPress }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.button,
        {
          backgroundColor: isPressed ? config.pressedColor : config.backgroundColor,
        },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Compartir en ${config.label}`}
      accessibilityHint="Abre la aplicación para compartir este artículo"
      testID={`share-button-${platform}`}
    >
      <View style={styles.buttonContent}>
        <Ionicons name={config.icon} size={20} color="#FFFFFF" />
        <ThemedText variant="button" style={styles.buttonText}>
          {config.label}
        </ThemedText>
      </View>
    </Pressable>
  );
});

ShareButton.displayName = 'ShareButton';

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  } as ViewStyle,
  label: {
    marginBottom: 12,
    color: '#000000',
  } as TextStyle,
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,
  button: {
    flex: 1,
    height: 40,
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  } as ViewStyle,
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  } as ViewStyle,
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
  } as TextStyle,
});
