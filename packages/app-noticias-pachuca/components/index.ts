/**
 * Component exports
 * Barrel file for easy imports
 */

// Typography
export { ThemedText, getTypographyToken, TEXT_VARIANTS } from './ThemedText';
export type { ThemedTextProps, TextVariant } from './ThemedText';

// Logo
export { Logo, getLogoSizeConfig, LOGO_SIZE_VARIANTS } from './Logo';
export type { LogoProps } from './Logo';

// Buttons
export {
  BrutalistButton,
  getButtonVariantConfig,
  BUTTON_VARIANT_OPTIONS,
} from './BrutalistButton';
export type { BrutalistButtonProps } from './BrutalistButton';

// Carousel
export { PaginationDots, PAGINATION_DOT_TOKENS } from './PaginationDots';
export type { PaginationDotsProps } from './PaginationDots';

export { CarouselSlide, CAROUSEL_SLIDE_TOKENS } from './CarouselSlide';
export type { CarouselSlideProps } from './CarouselSlide';

export { OnboardingCarousel } from './OnboardingCarousel';
export type { OnboardingCarouselProps, OnboardingSlide } from './OnboardingCarousel';

// Form Components
export { BrutalistInput, INPUT_DESIGN_TOKENS } from './BrutalistInput';
export type { BrutalistInputProps } from './BrutalistInput';

export {
  BrutalistSegmentedControl,
  SEGMENTED_CONTROL_DESIGN_TOKENS,
} from './BrutalistSegmentedControl';
export type {
  BrutalistSegmentedControlProps,
  SegmentedControlOption,
} from './BrutalistSegmentedControl';

export {
  BrutalistDatePicker,
  DATE_PICKER_DESIGN_TOKENS,
  datePickerUtils,
} from './BrutalistDatePicker';
export type { BrutalistDatePickerProps } from './BrutalistDatePicker';

// Home Components
export {
  BrutalistBanner,
  EditionDropdown,
  HomeHeader,
  BRUTALIST_BANNER_TOKENS,
  EDITION_DROPDOWN_DESIGN_TOKENS,
  HOME_HEADER_DESIGN_TOKENS,
} from './home';
export type {
  BrutalistBannerProps,
  BannerBackgroundColor,
  EditionDropdownProps,
  HomeHeaderProps,
} from './home';
