// components/provider/BookServiceButton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BookServiceButtonProps {
  providerId: string;
  serviceId?: string; // Adicionada a prop serviceId
  router: any;
  bookNowButtonAnim: Animated.Value;
}

const BookServiceButton: React.FC<BookServiceButtonProps> = ({
  providerId,
  serviceId, // Desestruturada a nova prop
  router,
  bookNowButtonAnim,
}) => {
  const insets = useSafeAreaInsets();
  const safeAreaBottom = insets.bottom;

  return (
    <Animated.View style={[
      localStyles.bookNowButtonWrapper,
      {
        opacity: bookNowButtonAnim,
        transform: [{
          translateY: bookNowButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] })
        }],
        paddingBottom: Platform.OS === 'ios' ? 25 + safeAreaBottom : 15 + safeAreaBottom
      }
    ]}>
      <LinearGradient
        colors={['#A8D8FF', '#4A90E2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={localStyles.bookServiceButtonGradient}
      >
        <TouchableOpacity style={localStyles.bookServiceButton} onPress={() => router.push({ pathname: `/(client)/bookings/schedule-service`, params: { providerId: providerId, serviceId: serviceId } })}>
          <Text style={localStyles.bookServiceButtonText}>Agendar Serviço</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const localStyles = StyleSheet.create({
  bookNowButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  bookServiceButtonGradient: {
    borderRadius: 12,
  },
  bookServiceButton: {
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bookServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default BookServiceButton;