import React from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';

export interface TextareaProps extends Omit<TextInputProps, 'multiline'> {
  rows?: number;
}

export function Textarea({ rows = 4, style, ...props }: TextareaProps) {
  const minHeight = rows * 20; // Approximate line height

  return (
    <TextInput
      {...props}
      multiline
      numberOfLines={rows}
      textAlignVertical="top"
      style={[
        styles.textarea,
        { minHeight },
        style
      ]}
    />
  );
}

const styles = StyleSheet.create({
  textarea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111827'
  }
});
