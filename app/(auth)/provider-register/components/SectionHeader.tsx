import React from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface SectionHeaderProps {
  title: string;
  animationDelay?: number; // Delay for the component's appearance animation
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, animationDelay = 0 }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      delay: animationDelay,
      useNativeDriver: true,
    }).start();
  }, [animatedValue, animationDelay]);

  const headerStyle = {
    opacity: animatedValue,
    transform: [{ translateY: animatedValue.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <Animated.View style={headerStyle}>
      <Text style={styles.sectionHeader}>{title}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginTop: 25,
    marginBottom: 15,
    borderTopWidth: 1,
    borderTopColor: '#DEE2E6',
    paddingTop: 20,
  },
});