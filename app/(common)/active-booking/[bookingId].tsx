// C:\Users\Paulo\desktop\relax-app\routes\(common)\active-booking\[bookingId].tsx

import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const ActiveBookingDetails = () => {
  const { bookingId } = useLocalSearchParams();

  return (
    <View>
      <Text>Details for booking ID: {bookingId}</Text>
    </View>
  );
};

export default ActiveBookingDetails; // <-- This is the important part