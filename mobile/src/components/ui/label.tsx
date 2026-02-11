import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export function Label({ children, style, ...props }: LabelProps) {
  const textColor = useThemeColor({}, 'text'); // Use a suitable text color from your theme

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
