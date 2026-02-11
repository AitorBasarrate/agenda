import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface InputProps extends TextInputProps {
  // You can add custom props here if needed,
  // but for now, we'll just extend TextInputProps
}

export function Input({ style, ...props }: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border'); // Assuming 'border' exists in your theme
  const backgroundColor = useThemeColor({}, 'input'); // Assuming 'input' exists in your theme

  const styles = StyleSheet.create({
    input: {
      height: 40,
      minWidth: 0,
      width: '100%',
      borderRadius: 6, // rounded-md
      borderWidth: 1,
      paddingHorizontal: 12,
      fontSize: 16,
      color: textColor,
      borderColor: borderColor,
      backgroundColor: backgroundColor,
      // Placeholder color can be set via placeholderTextColor prop
      // Focus styles are typically handled by the parent component or specific hooks in RN
    },
  });

  return (
    <TextInput
      style={[styles.input, style]}
      placeholderTextColor="#6B7280" // Placeholder for gray-500
      {...props}
    />
  );
}
