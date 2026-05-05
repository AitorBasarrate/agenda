import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

// Replicating some basic variants based on common patterns and guidelines
type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'icon' | 'sm' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string; // For compatibility, though direct styles are preferred
  style?: object; // Allow passing custom styles
  disabled?: boolean;
}

export function Button({
  children,
  onPress,
  variant = 'default',
  size = 'default',
  style,
  disabled = false,
  ...props
}: ButtonProps) {
  const isDarkMode = useColorScheme() === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const backgroundColor = themeColors.background;
  const textColor = themeColors.text;
  const border = themeColors.border;
  const primary = themeColors.primary;

  const getVariantStyles = (buttonVariant: ButtonVariant) => {
    switch (buttonVariant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: border,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          paddingHorizontal: 0,
          paddingVertical: 0,
        };
      case 'default':
      default:
        return {
          backgroundColor: primary,
        };
    }
  };

  const getSizeStyles = (buttonSize: ButtonSize) => {
    switch (buttonSize) {
      case 'icon':
        return {
          width: 36, // h-9 w-9, assuming 1 unit = 4px
          height: 36,
          paddingHorizontal: 0,
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
          borderRadius: 6, // rounded-md
        };
      case 'sm':
        return {
          height: 32,
          paddingHorizontal: 12,
          borderRadius: 6,
        };
      case 'lg':
        return {
          height: 44,
          paddingHorizontal: 32,
          borderRadius: 8,
        };
      case 'default':
      default:
        return {
          height: 40,
          paddingHorizontal: 16,
          borderRadius: 6,
        };
    }
  };

  const buttonStyles = StyleSheet.create({
    base: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      fontSize: 16,
      fontWeight: '500', // medium
      color: variant === 'default' ? '#FFFFFF' : textColor,
    },
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        buttonStyles.base,
        getVariantStyles(variant),
        getSizeStyles(size),
        style,
      ]}
      disabled={disabled}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text style={buttonStyles.text}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}
