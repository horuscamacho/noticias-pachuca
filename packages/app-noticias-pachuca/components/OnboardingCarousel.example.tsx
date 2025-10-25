/**
 * OnboardingCarousel Example Usage
 *
 * This file demonstrates how to use the carousel components
 * in a complete onboarding screen implementation.
 */

import React, { useState } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import {
  OnboardingCarousel,
  PaginationDots,
  BrutalistButton,
  OnboardingSlide,
} from '@/components';

/**
 * Example slide data
 */
const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Breaking news',
    description:
      'Follow stories as they unfold with real-time updates from trusted sources across Pachuca.',
  },
  {
    id: 2,
    title: 'Stay informed',
    description:
      'Get instant notifications about news that matters to you. Never miss an important update.',
  },
  {
    id: 3,
    title: 'Trusted sources',
    description:
      'Read verified news from local journalists and official channels. Quality reporting you can trust.',
  },
];

/**
 * Complete onboarding screen implementation
 */
export function OnboardingScreenExample() {
  const [activeSlide, setActiveSlide] = useState(0);
  const isLastSlide = activeSlide === ONBOARDING_SLIDES.length - 1;

  const handleGetStarted = () => {
    console.log('Navigate to main app');
    // Navigation logic here
  };

  const handleSkip = () => {
    console.log('Skip onboarding');
    // Navigation logic here
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="dark-content" />

      {/* Main Content Container */}
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        {/* Skip Button - Top Right */}
        <View style={{ alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 16 }}>
          <BrutalistButton
            variant="tertiary"
            onPress={handleSkip}
            accessibilityLabel="Skip onboarding"
          >
            SKIP
          </BrutalistButton>
        </View>

        {/* Carousel */}
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <OnboardingCarousel
            slides={ONBOARDING_SLIDES}
            onSlideChange={setActiveSlide}
            accessibilityLabel="Onboarding tutorial carousel"
          />
        </View>

        {/* Bottom Section - Pagination + CTA */}
        <View style={{ paddingHorizontal: 24, paddingBottom: 32, gap: 32 }}>
          {/* Pagination Dots - Centered */}
          <View style={{ alignItems: 'center' }}>
            <PaginationDots
              total={ONBOARDING_SLIDES.length}
              activeIndex={activeSlide}
              accessibilityLabel={`Onboarding progress: slide ${activeSlide + 1} of ${ONBOARDING_SLIDES.length}`}
            />
          </View>

          {/* CTA Button */}
          <BrutalistButton
            variant="primary"
            fullWidth
            onPress={handleGetStarted}
            accessibilityLabel={
              isLastSlide ? 'Get started with the app' : 'Continue to next slide'
            }
          >
            {isLastSlide ? 'GET STARTED' : 'NEXT'}
          </BrutalistButton>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Minimal example - Just the carousel
 */
export function MinimalCarouselExample() {
  const slides: OnboardingSlide[] = [
    { id: 1, title: 'Welcome', description: 'Welcome to our app' },
    { id: 2, title: 'Features', description: 'Explore amazing features' },
    { id: 3, title: 'Get Started', description: 'Let\'s begin your journey' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <OnboardingCarousel slides={slides} />
    </View>
  );
}

/**
 * Advanced example - With custom slide change handler
 */
export function AdvancedCarouselExample() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSlideChange = (index: number) => {
    setCurrentSlide(index);

    // Track analytics
    console.log('Slide viewed:', index);

    // Custom logic per slide
    if (index === 2) {
      console.log('User reached final slide');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flex: 1 }}>
        {/* Header with slide counter */}
        <View style={{ padding: 24 }}>
          <BrutalistButton variant="tertiary" onPress={() => console.log('Back')}>
            {currentSlide + 1} / {ONBOARDING_SLIDES.length}
          </BrutalistButton>
        </View>

        {/* Carousel */}
        <View style={{ flex: 1 }}>
          <OnboardingCarousel
            slides={ONBOARDING_SLIDES}
            onSlideChange={handleSlideChange}
          />
        </View>

        {/* Footer with pagination */}
        <View style={{ padding: 24, alignItems: 'center' }}>
          <PaginationDots
            total={ONBOARDING_SLIDES.length}
            activeIndex={currentSlide}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Standalone PaginationDots example
 */
export function PaginationDotsExample() {
  const [active, setActive] = useState(0);

  return (
    <View style={{ padding: 24, gap: 24 }}>
      {/* 3 dots */}
      <PaginationDots total={3} activeIndex={0} />

      {/* 5 dots with different active states */}
      <PaginationDots total={5} activeIndex={2} />

      {/* Interactive example */}
      <View style={{ gap: 16 }}>
        <PaginationDots total={4} activeIndex={active} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {[0, 1, 2, 3].map((index) => (
            <BrutalistButton
              key={index}
              variant={active === index ? 'primary' : 'secondary'}
              onPress={() => setActive(index)}
            >
              {index + 1}
            </BrutalistButton>
          ))}
        </View>
      </View>
    </View>
  );
}
