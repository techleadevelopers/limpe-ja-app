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

interface StandardInputProps extends TextInputProps {
  label: string;
  errorMessage?: string | null;
  containerStyle?: object;
  animationDelay?: number; // Delay for the component's appearance animation
}

export const StandardInput: React.FC<StandardInputProps> = ({
  label,
  errorMessage,
  containerStyle,
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
      <TextInput
        style={[styles.inputBase, errorMessage && styles.inputErrorBorder, !rest.editable && styles.disabledInput]}
        placeholderTextColor="#6C757D"
        {...rest}
      />
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212529',
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