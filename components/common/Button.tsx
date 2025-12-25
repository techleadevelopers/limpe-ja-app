// LimpeJaApp/src/components/common/Button.tsx
import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
  useColorScheme,
} from 'react-native';
import Colors from '../../constants/Colors';
import { pressableBase, shadow, textBase } from '../../app/_shared/ui/parity';

interface ButtonProps {
  title: string;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'ghost';
}

function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  disabled,
  kind = 'primary',
}) => {
  const theme = useTheme();

  const variantStyles = useMemo(() => {
    switch (kind) {
      case 'secondary':
        return {
          button: {
            backgroundColor: theme.secondary,
            borderColor: theme.secondary,
            borderWidth: 1,
          },
          text: {
            color: '#FFF',
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: theme.interactivePrimary || theme.primary,
            borderWidth: 1,
          },
          text: {
            color: theme.interactivePrimary || theme.primary,
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            borderWidth: 1,
          },
          text: {
            color: '#FFF',
          },
        };
    }
  }, [kind, theme]);

  const pressableParity = pressableBase();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      android_ripple={pressableParity.androidRipple}
      style={({ pressed }) => [
        styles.baseButton,
        pressableParity.style,
        variantStyles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[textBase(styles.baseButtonText), variantStyles.text, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    ...shadow(2),
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  baseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Button;
