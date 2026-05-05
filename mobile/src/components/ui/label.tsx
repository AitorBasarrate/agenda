import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export function Label({ children, style, ...props }: LabelProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const textColor = themeColors.text;

  const styles = StyleSheet.create({
    label: {
      fontSize: 14, // text-sm
      fontWeight: '500', // font-medium
      lineHeight: 20, // leading-none
      color: textColor,
      // The peer-disabled styles and select-none are web-specific CSS properties
      // For React Native, you might control these states via props and conditional styling.
    },
  });

  return (
    <Text style={[styles.label, style]} {...props}>
      {children}
    </Text>
  );
}
