import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  Animated,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputWithIconProps extends TextInputProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  errorMessage?: string | null;
  containerStyle?: object;
  rightComponent?: React.ReactNode; // Optional component to render on the right side
  animationDelay?: number; // Delay for the component's appearance animation
}

export const InputWithIcon: React.FC<InputWithIconProps> = ({
  label,
  iconName,
  errorMessage,
  containerStyle,
  rightComponent,
  animationDelay = 0,
  ...rest
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: animationDelay,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, animationDelay]);

  const wrapperStyle = {
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.inputContainerWrapper, wrapperStyle, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputBase, errorMessage && styles.inputErrorBorder]}>
        <Ionicons name={iconName} size={20} color="#8A8A8E" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, !rest.editable && styles.disabledInput]}
          placeholderTextColor="#6C757D"
          {...rest}
        />
        {rightComponent}
      </View>
      {errorMessage ? <Text style={styles.errorMessage}>{errorMessage}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  inputContainerWrapper: {
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 7,
  },
  inputBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputErrorBorder: {
    borderColor: '#D32F2F',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#212529',
  },
  disabledInput: {
    backgroundColor: '#F0F0F0',
    color: '#8A8A8E',
  },
  errorMessage: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
  },
});