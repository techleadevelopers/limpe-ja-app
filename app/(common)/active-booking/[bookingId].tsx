// C:\Users\Paulo\desktop\relax-app\routes\(common)\active-booking\[bookingId].tsx

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const ActiveBookingDetails = () => {
  const { bookingId } = useLocalSearchParams();

  // Animações para o conteúdo
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text 
        style={[
          styles.detailText,
          { opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }
        ]}
      >
        Details for booking ID: {bookingId}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  detailText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
});

export default ActiveBookingDetails;