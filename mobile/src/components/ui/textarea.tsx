import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface TextareaProps extends TextInputProps {
  // Add custom props if needed
}

export function Textarea({ style, ...props }: TextareaProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const backgroundColor = useThemeColor({}, 'input');

  const styles = StyleSheet.create({
    textarea: {
      minHeight: 80, // min-h-20 (assuming 1 unit = 4px, 20*4=80)
      width: '100%',
      borderRadius: 6, // rounded-md
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      color: textColor,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      textAlignVertical: 'top', // For Android to align text at the top
    },
  });

  return (
    <TextInput
      multiline
      style={[styles.textarea, style]}
      placeholderTextColor="#6B7280" // Placeholder for gray-500
      {...props}
    />
  );
}
