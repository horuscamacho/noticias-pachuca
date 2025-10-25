/**
 * RichTextContent Component
 * Renders text content with inline bold formatting
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from './ThemedText';

export type RichTextVariant = 'body' | 'lead';

interface RichTextContentProps {
  content: string;
  variant?: RichTextVariant;
  className?: string;
  style?: TextStyle;
  testID?: string;
}

interface TextSegment {
  text: string;
  isBold: boolean;
}

/**
 * Parses markdown-like **bold** syntax and renders rich text
 *
 * @example
 * ```tsx
 * <RichTextContent
 *   content="El alcalde **Eduardo Medécigo Rubio** anunció..."
 *   variant="body"
 * />
 * ```
 */
export const RichTextContent = React.memo<RichTextContentProps>(
  ({ content, variant = 'body', style, testID = 'rich-text-content' }) => {
    // Split content into paragraphs
    const paragraphs = useMemo(() => {
      return content.split('\n\n').filter((p) => p.trim().length > 0);
    }, [content]);

    return (
      <View style={styles.container} testID={testID}>
        {paragraphs.map((paragraph, paragraphIndex) => (
          <RichTextParagraph
            key={paragraphIndex}
            text={paragraph}
            variant={variant}
            style={[style, paragraphIndex > 0 && styles.paragraphSpacing]}
          />
        ))}
      </View>
    );
  }
);

RichTextContent.displayName = 'RichTextContent';

/**
 * Individual paragraph with inline bold formatting
 */
const RichTextParagraph = React.memo<{
  text: string;
  variant: RichTextVariant;
  style?: TextStyle;
}>(({ text, variant, style }) => {
  // Parse inline bold (**text**)
  const segments = useMemo<TextSegment[]>(() => {
    const regex = /\*\*(.*?)\*\*/g;
    const result: TextSegment[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      // Add normal text before match
      if (match.index > lastIndex) {
        result.push({
          text: text.substring(lastIndex, match.index),
          isBold: false,
        });
      }

      // Add bold text
      result.push({
        text: match[1],
        isBold: true,
      });

      lastIndex = regex.lastIndex;
    }

    // Add remaining normal text
    if (lastIndex < text.length) {
      result.push({
        text: text.substring(lastIndex),
        isBold: false,
      });
    }

    return result.length > 0 ? result : [{ text, isBold: false }];
  }, [text]);

  const baseStyle = variant === 'body' ? styles.bodyText : styles.leadText;

  return (
    <Text
      style={[baseStyle, style]}
      accessible={true}
      accessibilityRole="text"
    >
      {segments.map((segment, index) => (
        <Text
          key={index}
          style={segment.isBold ? styles.boldText : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
});

RichTextParagraph.displayName = 'RichTextParagraph';

const styles = StyleSheet.create({
  container: {
    width: '100%',
  } as ViewStyle,
  bodyText: {
    fontSize: 16,
    lineHeight: 27,
    color: '#1F1F1F',
    fontWeight: '400',
  } as TextStyle,
  leadText: {
    fontSize: 18,
    lineHeight: 29,
    color: '#4B5563',
    fontWeight: '500',
  } as TextStyle,
  boldText: {
    fontWeight: '700',
    color: '#000000',
  } as TextStyle,
  paragraphSpacing: {
    marginTop: 16,
  } as ViewStyle,
});
