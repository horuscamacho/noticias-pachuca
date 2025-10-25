import React from 'react'
import { ScrollView, View, StyleSheet } from 'react-native'
import { ThemedText } from './ThemedText'
import type { FontWeight, TextVariant } from './types'

interface FontWeightDemo {
  weight: FontWeight
  label: string
  numeric: string
}

interface VariantDemo {
  variant: TextVariant
  label: string
  size: string
}

const fontWeights: FontWeightDemo[] = [
  { weight: 'thin', label: 'Thin', numeric: '100' },
  { weight: 'ultralight', label: 'Ultra Light', numeric: '200' },
  { weight: 'light', label: 'Light', numeric: '300' },
  { weight: 'regular', label: 'Regular', numeric: '400' },
  { weight: 'medium', label: 'Medium', numeric: '500' },
  { weight: 'semibold', label: 'Semi Bold', numeric: '600' },
  { weight: 'bold', label: 'Bold', numeric: '700' },
  { weight: 'heavy', label: 'Extra Bold', numeric: '800' },
  { weight: 'black', label: 'Black', numeric: '900' }
]

const textVariants: VariantDemo[] = [
  { variant: 'display-large', label: 'Display Large', size: '48px' },
  { variant: 'display-medium', label: 'Display Medium', size: '36px' },
  { variant: 'display-small', label: 'Display Small', size: '32px' },
  { variant: 'headline-large', label: 'Headline Large', size: '28px' },
  { variant: 'headline-medium', label: 'Headline Medium', size: '24px' },
  { variant: 'headline-small', label: 'Headline Small', size: '22px' },
  { variant: 'title-large', label: 'Title Large', size: '20px' },
  { variant: 'title-medium', label: 'Title Medium', size: '18px' },
  { variant: 'title-small', label: 'Title Small', size: '16px' },
  { variant: 'body-large', label: 'Body Large', size: '16px' },
  { variant: 'body-medium', label: 'Body Medium', size: '14px' },
  { variant: 'body-small', label: 'Body Small', size: '12px' },
  { variant: 'label-large', label: 'Label Large', size: '14px' },
  { variant: 'label-medium', label: 'Label Medium', size: '12px' },
  { variant: 'label-small', label: 'Label Small', size: '10px' },
  { variant: 'caption', label: 'Caption', size: '10px' },
  { variant: 'overline', label: 'Overline', size: '9px' }
]

export const FontShowcase: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <ThemedText variant="display-medium" style={styles.mainTitle}>
        Aleo Font Showcase
      </ThemedText>

      <ThemedText variant="body-medium" color="secondary" style={styles.subtitle}>
        Complete demonstration of all 18 Aleo font variants and typography system
      </ThemedText>

      {/* Font Weights Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Font Weights (Normal)
        </ThemedText>

        {fontWeights.map(({ weight, label, numeric }) => (
          <View key={weight} style={styles.weightRow}>
            <ThemedText
              variant="title-medium"
              weight={weight}
              style={styles.sampleText}
            >
              The quick brown fox jumps over the lazy dog
            </ThemedText>
            <View style={styles.weightInfo}>
              <ThemedText variant="label-medium" color="accent">
                {label}
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                {numeric} • Aleo-{label.replace(' ', '')}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Font Weights Italic Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Font Weights (Italic)
        </ThemedText>

        {fontWeights.map(({ weight, label, numeric }) => (
          <View key={`${weight}-italic`} style={styles.weightRow}>
            <ThemedText
              variant="title-medium"
              weight={weight}
              italic
              style={styles.sampleText}
            >
              The quick brown fox jumps over the lazy dog
            </ThemedText>
            <View style={styles.weightInfo}>
              <ThemedText variant="label-medium" color="accent">
                {label} Italic
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                {numeric} • Aleo-{label.replace(' ', '')}Italic
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Text Variants Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Typography Variants
        </ThemedText>

        {textVariants.map(({ variant, label, size }) => (
          <View key={variant} style={styles.variantRow}>
            <ThemedText variant={variant} style={styles.variantSample}>
              {label} Sample Text
            </ThemedText>
            <View style={styles.variantInfo}>
              <ThemedText variant="label-medium" color="accent">
                {variant}
              </ThemedText>
              <ThemedText variant="caption" color="muted">
                {size}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>

      {/* Color Variations Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Semantic Colors
        </ThemedText>

        <View style={styles.colorsGrid}>
          <View style={styles.colorRow}>
            <ThemedText variant="body-medium" color="primary">
              Primary Text
            </ThemedText>
            <ThemedText variant="body-medium" color="secondary">
              Secondary Text
            </ThemedText>
          </View>

          <View style={styles.colorRow}>
            <ThemedText variant="body-medium" color="accent">
              Accent Text
            </ThemedText>
            <ThemedText variant="body-medium" color="muted">
              Muted Text
            </ThemedText>
          </View>

          <View style={styles.colorRow}>
            <ThemedText variant="body-medium" color="error">
              Error Text
            </ThemedText>
            <ThemedText variant="body-medium" color="warning">
              Warning Text
            </ThemedText>
          </View>

          <View style={styles.colorRow}>
            <ThemedText variant="body-medium" color="success">
              Success Text
            </ThemedText>
            <ThemedText variant="body-medium" color="info">
              Info Text
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Special Features Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Special Features
        </ThemedText>

        <View style={styles.featureRow}>
          <ThemedText variant="label-medium" color="muted" style={styles.featureLabel}>
            Highlighted Text:
          </ThemedText>
          <ThemedText variant="body-medium" highlight>
            This text has a background highlight
          </ThemedText>
        </View>

        <View style={styles.featureRow}>
          <ThemedText variant="label-medium" color="muted" style={styles.featureLabel}>
            Truncated Text:
          </ThemedText>
          <ThemedText variant="body-medium" truncate style={styles.truncateDemo}>
            This is a very long text that will be truncated with ellipsis to demonstrate the truncation feature of ThemedText component
          </ThemedText>
        </View>

        <View style={styles.featureRow}>
          <ThemedText variant="label-medium" color="muted" style={styles.featureLabel}>
            Transformed Text:
          </ThemedText>
          <View style={styles.transformRow}>
            <ThemedText variant="body-small" transform="uppercase">
              uppercase text
            </ThemedText>
            <ThemedText variant="body-small" transform="lowercase">
              LOWERCASE TEXT
            </ThemedText>
            <ThemedText variant="body-small" transform="capitalize">
              capitalize text
            </ThemedText>
          </View>
        </View>

        <View style={styles.featureRow}>
          <ThemedText variant="label-medium" color="muted" style={styles.featureLabel}>
            Text Alignment:
          </ThemedText>
          <View style={styles.alignmentDemo}>
            <ThemedText variant="body-small" align="left">
              Left aligned text
            </ThemedText>
            <ThemedText variant="body-small" align="center">
              Center aligned text
            </ThemedText>
            <ThemedText variant="body-small" align="right">
              Right aligned text
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Mixed Examples Section */}
      <View style={styles.section}>
        <ThemedText variant="headline-medium" style={styles.sectionTitle}>
          Mixed Examples
        </ThemedText>

        <View style={styles.mixedExample}>
          <ThemedText variant="title-large" weight="bold" color="accent">
            Article Title Example
          </ThemedText>

          <ThemedText variant="caption" color="muted" style={styles.metadata}>
            Published on January 15, 2025 • 5 min read
          </ThemedText>

          <ThemedText variant="body-medium" style={styles.paragraph}>
            This is an example of how different text variants work together to create a
            cohesive reading experience. The <ThemedText variant="body-medium" weight="semibold">
            ThemedText component</ThemedText> provides excellent typography control.
          </ThemedText>

          <ThemedText variant="body-medium" style={styles.paragraph}>
            You can combine <ThemedText variant="body-medium" italic>italic text</ThemedText>,
            <ThemedText variant="body-medium" weight="bold"> bold text</ThemedText>, and
            <ThemedText variant="body-medium" color="accent"> colored text</ThemedText> seamlessly
            within the same paragraph for rich text formatting.
          </ThemedText>

          <ThemedText variant="overline" transform="uppercase" letterSpacing={1.5} color="muted">
            Category: Typography
          </ThemedText>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText variant="caption" color="muted" align="center">
          ThemedText Component • Aleo Font Family • 18 Variants
        </ThemedText>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  content: {
    padding: 24,
    paddingBottom: 48
  },
  mainTitle: {
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    marginBottom: 32,
    textAlign: 'center'
  },
  section: {
    marginBottom: 40
  },
  sectionTitle: {
    marginBottom: 20
  },
  weightRow: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  sampleText: {
    marginBottom: 4
  },
  weightInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  variantRow: {
    marginBottom: 20
  },
  variantSample: {
    marginBottom: 4
  },
  variantInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  colorsGrid: {
    gap: 12
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  featureRow: {
    marginBottom: 16
  },
  featureLabel: {
    marginBottom: 4
  },
  truncateDemo: {
    maxWidth: '80%'
  },
  transformRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap'
  },
  alignmentDemo: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
    padding: 12
  },
  mixedExample: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    padding: 20
  },
  metadata: {
    marginTop: 8,
    marginBottom: 16
  },
  paragraph: {
    marginBottom: 12,
    lineHeight: 22
  },
  footer: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)'
  }
})