/**
 * Test file to verify all component imports and types work correctly
 * This file should be deleted after verification
 */

import React from 'react';
import { View } from 'react-native';

// Import all components
import {
  Logo,
  BrutalistButton,
  ThemedText,
  getLogoSizeConfig,
  getButtonVariantConfig,
  LOGO_SIZE_VARIANTS,
  BUTTON_VARIANT_OPTIONS,
} from './index';

// Import all types
import type {
  LogoProps,
  BrutalistButtonProps,
  ThemedTextProps,
} from './index';

/**
 * Type-safe test component demonstrating correct usage
 */
export const ComponentImportTest: React.FC = () => {
  // Test Logo props
  const logoProps: LogoProps = {
    size: 'medium',
    className: 'mb-4',
    testID: 'test-logo',
    accessibilityLabel: 'Test Logo',
  };

  // Test BrutalistButton props
  const buttonProps: BrutalistButtonProps = {
    variant: 'primary',
    onPress: () => console.log('Button pressed'),
    children: 'Test Button',
    disabled: false,
    loading: false,
    fullWidth: true,
    enableHaptics: true,
  };

  // Test ThemedText props
  const textProps: ThemedTextProps = {
    variant: 'h1',
    children: 'Test Text',
    className: 'text-center',
  };

  // Test helper functions
  const mediumLogoConfig = getLogoSizeConfig('medium');
  const primaryButtonConfig = getButtonVariantConfig('primary');

  // Test constant exports
  const logoVariants: string[] = LOGO_SIZE_VARIANTS;
  const buttonVariants: string[] = BUTTON_VARIANT_OPTIONS;

  console.log('Logo config:', mediumLogoConfig);
  console.log('Button config:', primaryButtonConfig);
  console.log('Logo variants:', logoVariants);
  console.log('Button variants:', buttonVariants);

  return (
    <View>
      {/* Test Logo component */}
      <Logo {...logoProps} />

      {/* Test BrutalistButton component */}
      <BrutalistButton {...buttonProps} />

      {/* Test ThemedText component */}
      <ThemedText {...textProps} />

      {/* Test all logo sizes */}
      {LOGO_SIZE_VARIANTS.map((size) => (
        <Logo key={size} size={size} />
      ))}

      {/* Test all button variants */}
      {BUTTON_VARIANT_OPTIONS.map((variant) => (
        <BrutalistButton
          key={variant}
          variant={variant}
          onPress={() => console.log(`${variant} pressed`)}
        >
          {variant.toUpperCase()}
        </BrutalistButton>
      ))}
    </View>
  );
};

/**
 * Type tests - These should not cause TypeScript errors
 */
export const TypeTests = () => {
  // Valid logo sizes
  const validSizes: Array<'small' | 'medium' | 'large'> = [
    'small',
    'medium',
    'large',
  ];

  // Valid button variants
  const validVariants: Array<'primary' | 'secondary' | 'tertiary'> = [
    'primary',
    'secondary',
    'tertiary',
  ];

  // Logo with all props
  const logo: LogoProps = {
    size: 'large',
    className: 'my-4',
    style: { marginTop: 10 },
    testID: 'logo',
    accessibilityLabel: 'Noticias Pachuca',
  };

  // Button with all props
  const button: BrutalistButtonProps = {
    variant: 'primary',
    onPress: () => {},
    children: 'Submit',
    disabled: false,
    loading: false,
    className: 'mt-4',
    style: { marginTop: 10 },
    accessibilityLabel: 'Submit form',
    accessibilityHint: 'Submits the form data',
    testID: 'submit-btn',
    enableHaptics: true,
    fullWidth: true,
  };

  return null;
};

/**
 * Edge case tests
 */
export const EdgeCaseTests = () => {
  return (
    <View>
      {/* Logo without any props (should use defaults) */}
      <Logo />

      {/* Button with minimal props */}
      <BrutalistButton variant="primary" onPress={() => {}}>
        Minimal
      </BrutalistButton>

      {/* Button with children as React node, not string */}
      <BrutalistButton variant="secondary" onPress={() => {}}>
        <ThemedText variant="button">Complex Child</ThemedText>
      </BrutalistButton>

      {/* Button with style array */}
      <BrutalistButton
        variant="tertiary"
        onPress={() => {}}
        style={[{ marginTop: 10 }, { marginBottom: 10 }]}
      >
        Style Array
      </BrutalistButton>

      {/* Logo with style array */}
      <Logo style={[{ marginTop: 10 }, { marginBottom: 10 }]} />

      {/* All states */}
      <BrutalistButton variant="primary" onPress={() => {}} disabled>
        Disabled
      </BrutalistButton>

      <BrutalistButton variant="primary" onPress={() => {}} loading>
        Loading
      </BrutalistButton>

      <BrutalistButton variant="primary" onPress={() => {}} disabled loading>
        Disabled + Loading
      </BrutalistButton>
    </View>
  );
};

export default ComponentImportTest;
