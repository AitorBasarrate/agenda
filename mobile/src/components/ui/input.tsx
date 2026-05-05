import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

interface InputProps extends TextInputProps {
  // You can add custom props here if needed,
  // but for now, we'll just extend TextInputProps
}

export function Input({ style, ...props }: InputProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const textColor = themeColors.text;
  const borderColor = themeColors.border;
  const backgroundColor = themeColors.input;

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
      placeholderTextColor={themeColors.placeholder}
      {...props}
    />
  );
}
