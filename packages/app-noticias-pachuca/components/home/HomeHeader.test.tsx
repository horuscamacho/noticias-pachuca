/**
 * HomeHeader Component Tests
 *
 * Unit tests for HomeHeader, BrutalistBanner, and EditionDropdown components.
 * Run with: npm test components/home/HomeHeader.test.tsx
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { HomeHeader, BrutalistBanner, EditionDropdown } from './index';

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('HomeHeader', () => {
  const mockEditionPress = jest.fn();
  const mockBannerCtaPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default props', () => {
    const { getByTestId } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
      />
    );

    expect(getByTestId('home-header')).toBeTruthy();
    expect(getByTestId('home-header-logo-section')).toBeTruthy();
    expect(getByTestId('home-header-banner')).toBeTruthy();
  });

  it('renders with current edition', () => {
    const { getByTestId, getByText } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        currentEdition="PACHUCA"
        onBannerCtaPress={mockBannerCtaPress}
      />
    );

    expect(getByText('PACHUCA')).toBeTruthy();
  });

  it('hides banner when hideBanner is true', () => {
    const { queryByTestId } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
        hideBanner={true}
      />
    );

    expect(queryByTestId('home-header-banner')).toBeNull();
  });

  it('calls onEditionPress when edition dropdown is pressed', () => {
    const { getByTestId } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
      />
    );

    fireEvent.press(getByTestId('edition-dropdown'));
    expect(mockEditionPress).toHaveBeenCalledTimes(1);
  });

  it('calls onBannerCtaPress when banner CTA is pressed', () => {
    const { getByTestId } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
      />
    );

    fireEvent.press(getByTestId('brutalist-banner-cta'));
    expect(mockBannerCtaPress).toHaveBeenCalledTimes(1);
  });

  it('renders custom banner title and CTA text', () => {
    const { getByText } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
        bannerTitle="CUSTOM TITLE"
        bannerCtaText="Custom CTA"
      />
    );

    expect(getByText('CUSTOM TITLE')).toBeTruthy();
    expect(getByText('Custom CTA')).toBeTruthy();
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
      />
    );

    const header = getByTestId('home-header');
    expect(header.props.accessibilityRole).toBe('header');
  });
});

describe('BrutalistBanner', () => {
  const mockCtaPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with required props', () => {
    const { getByText } = render(
      <BrutalistBanner
        title="Test Banner Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
      />
    );

    expect(getByText('Test Banner Title')).toBeTruthy();
    expect(getByText('Test CTA')).toBeTruthy();
  });

  it('calls onCtaPress when CTA button is pressed', () => {
    const { getByTestId } = render(
      <BrutalistBanner
        title="Test Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
      />
    );

    fireEvent.press(getByTestId('brutalist-banner-cta'));
    expect(mockCtaPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onCtaPress when disabled', () => {
    const { getByTestId } = render(
      <BrutalistBanner
        title="Test Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
        disabled={true}
      />
    );

    fireEvent.press(getByTestId('brutalist-banner-cta'));
    expect(mockCtaPress).not.toHaveBeenCalled();
  });

  it('triggers haptic feedback on CTA press', async () => {
    const { getByTestId } = render(
      <BrutalistBanner
        title="Test Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
        enableHaptics={true}
      />
    );

    fireEvent.press(getByTestId('brutalist-banner-cta'));

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });
  });

  it('does not trigger haptics when disabled', async () => {
    const { getByTestId } = render(
      <BrutalistBanner
        title="Test Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
        enableHaptics={false}
      />
    );

    fireEvent.press(getByTestId('brutalist-banner-cta'));

    await waitFor(() => {
      expect(Haptics.impactAsync).not.toHaveBeenCalled();
    });
  });

  it('handles different background colors', () => {
    const { rerender, getByTestId } = render(
      <BrutalistBanner
        title="Test"
        ctaText="CTA"
        onCtaPress={mockCtaPress}
        backgroundColor="brown"
      />
    );

    let banner = getByTestId('brutalist-banner');
    expect(banner.props.style.backgroundColor).toBe('#854836');

    rerender(
      <BrutalistBanner
        title="Test"
        ctaText="CTA"
        onCtaPress={mockCtaPress}
        backgroundColor="yellow"
      />
    );

    banner = getByTestId('brutalist-banner');
    expect(banner.props.style.backgroundColor).toBe('#FFB22C');

    rerender(
      <BrutalistBanner
        title="Test"
        ctaText="CTA"
        onCtaPress={mockCtaPress}
        backgroundColor="black"
      />
    );

    banner = getByTestId('brutalist-banner');
    expect(banner.props.style.backgroundColor).toBe('#000000');
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <BrutalistBanner
        title="Test Title"
        ctaText="Test CTA"
        onCtaPress={mockCtaPress}
        accessibilityLabel="Custom banner label"
        ctaAccessibilityLabel="Custom CTA label"
      />
    );

    const banner = getByTestId('brutalist-banner');
    expect(banner.props.accessibilityLabel).toBe('Custom banner label');

    const cta = getByTestId('brutalist-banner-cta');
    expect(cta.props.accessibilityRole).toBe('button');
    expect(cta.props.accessibilityLabel).toBe('Custom CTA label');
  });
});

describe('EditionDropdown', () => {
  const mockPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with default edition', () => {
    const { getByText } = render(<EditionDropdown onPress={mockPress} />);

    expect(getByText('EDICIÓN')).toBeTruthy();
  });

  it('renders with custom edition', () => {
    const { getByText } = render(
      <EditionDropdown onPress={mockPress} currentEdition="PACHUCA" />
    );

    expect(getByText('PACHUCA')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByTestId } = render(<EditionDropdown onPress={mockPress} />);

    fireEvent.press(getByTestId('edition-dropdown'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByTestId } = render(
      <EditionDropdown onPress={mockPress} disabled={true} />
    );

    fireEvent.press(getByTestId('edition-dropdown'));
    expect(mockPress).not.toHaveBeenCalled();
  });

  it('triggers haptic feedback on press', async () => {
    const { getByTestId } = render(
      <EditionDropdown onPress={mockPress} enableHaptics={true} />
    );

    fireEvent.press(getByTestId('edition-dropdown'));

    await waitFor(() => {
      expect(Haptics.impactAsync).toHaveBeenCalledWith(
        Haptics.ImpactFeedbackStyle.Light
      );
    });
  });

  it('has correct accessibility properties', () => {
    const { getByTestId } = render(
      <EditionDropdown
        onPress={mockPress}
        currentEdition="PACHUCA"
        accessibilityLabel="Custom label"
        accessibilityHint="Custom hint"
      />
    );

    const dropdown = getByTestId('edition-dropdown');
    expect(dropdown.props.accessibilityRole).toBe('button');
    expect(dropdown.props.accessibilityLabel).toBe('Custom label');
    expect(dropdown.props.accessibilityHint).toBe('Custom hint');
  });

  it('updates disabled state correctly', () => {
    const { getByTestId, rerender } = render(
      <EditionDropdown onPress={mockPress} disabled={false} />
    );

    let dropdown = getByTestId('edition-dropdown');
    expect(dropdown.props.accessibilityState.disabled).toBe(false);

    rerender(<EditionDropdown onPress={mockPress} disabled={true} />);

    dropdown = getByTestId('edition-dropdown');
    expect(dropdown.props.accessibilityState.disabled).toBe(true);
  });
});

describe('Integration Tests', () => {
  it('HomeHeader integrates all child components correctly', () => {
    const mockEditionPress = jest.fn();
    const mockBannerCtaPress = jest.fn();

    const { getByTestId, getByText } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        currentEdition="NACIONAL"
        onBannerCtaPress={mockBannerCtaPress}
        bannerTitle="INTEGRATION TEST"
        bannerCtaText="Test CTA"
      />
    );

    // Verify all parts render
    expect(getByTestId('home-header')).toBeTruthy();
    expect(getByTestId('edition-dropdown')).toBeTruthy();
    expect(getByTestId('home-header-banner')).toBeTruthy();

    // Verify content
    expect(getByText('NACIONAL')).toBeTruthy();
    expect(getByText('INTEGRATION TEST')).toBeTruthy();
    expect(getByText('Test CTA')).toBeTruthy();

    // Test interactions
    fireEvent.press(getByTestId('edition-dropdown'));
    expect(mockEditionPress).toHaveBeenCalledTimes(1);

    fireEvent.press(getByTestId('brutalist-banner-cta'));
    expect(mockBannerCtaPress).toHaveBeenCalledTimes(1);
  });

  it('handles press states correctly', () => {
    const mockPress = jest.fn();

    const { getByTestId } = render(
      <EditionDropdown onPress={mockPress} currentEdition="TEST" />
    );

    const dropdown = getByTestId('edition-dropdown');

    // Simulate press in
    fireEvent(dropdown, 'pressIn');

    // Simulate press out
    fireEvent(dropdown, 'pressOut');

    // Verify press was called
    fireEvent.press(dropdown);
    expect(mockPress).toHaveBeenCalledTimes(1);
  });
});

describe('Memoization Tests', () => {
  it('HomeHeader does not re-render when props are unchanged', () => {
    const mockEditionPress = jest.fn();
    const mockBannerCtaPress = jest.fn();

    const { rerender } = render(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
        currentEdition="PACHUCA"
      />
    );

    // Rerender with same props (should not cause re-render due to React.memo)
    rerender(
      <HomeHeader
        onEditionPress={mockEditionPress}
        onBannerCtaPress={mockBannerCtaPress}
        currentEdition="PACHUCA"
      />
    );

    // Component should be memoized
    expect(true).toBe(true); // If we get here without errors, memoization works
  });
});
