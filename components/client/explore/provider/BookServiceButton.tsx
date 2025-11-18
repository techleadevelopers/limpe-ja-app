// components/client/explore/provider/BookServiceButton.tsx
import React from 'react';
import { Animated, Text, TouchableOpacity, Platform, StyleSheet, View } from 'react-native';
import { type Router } from 'expo-router';
import { AppColors, AppShadows } from '../../../../constants/appStyles';

interface BookServiceButtonProps {
  providerId: string;
  serviceId?: string;
  router: Router;
  bookNowButtonAnim: Animated.Value;
  servicePrice?: number;
  sticky?: boolean;
  safeBottomInset?: number;
}

const BookServiceButton: React.FC<BookServiceButtonProps> = ({
  providerId,
  serviceId,
  router,
  bookNowButtonAnim,
  servicePrice,
  sticky = false,
  safeBottomInset = 0,
}) => {
  const baseBottomPadding = Platform.OS === 'ios' ? 34 : 20;

  const handlePress = () => {
    router.push({
      pathname: '/(client)/bookings/schedule-service',
      params: {
        providerId,
        serviceId,
        servicePrice: servicePrice != null ? servicePrice.toString() : undefined,
      },
    });
  };

  const label =
    servicePrice != null && typeof servicePrice === 'number' && Number.isFinite(servicePrice)
      ? `Agendar • R$ ${servicePrice.toFixed(2).replace('.', ',')}/h`
      : 'Agendar serviço';

  const content = (
    <TouchableOpacity style={styles.btn} onPress={handlePress} activeOpacity={0.9}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );

  if (!sticky) {
    return (
      <Animated.View
        style={[
          styles.inlineContainer,
          {
            opacity: bookNowButtonAnim,
            transform: [
              {
                translateY: bookNowButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [40, 0],
                }),
              },
            ],
          },
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          paddingBottom: baseBottomPadding + (safeBottomInset || 0),
        },
      ]}
    >
      <Animated.View
        style={{
          opacity: bookNowButtonAnim,
          transform: [
            {
              translateY: bookNowButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [40, 0],
              }),
            },
          ],
        }}
      >
        {content}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  inlineContainer: {
    marginVertical: 20,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
  },
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 18,
    marginBottom: -38,
    backgroundColor: AppColors.white,
    ...AppShadows.medium,
  },
  btn: {
    backgroundColor: AppColors.primaryInteractive,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...AppShadows.medium,
    borderRightWidth: 0,
    borderRightColor: '#45484b56',
    borderTopStartRadius: 44,
    borderBottomStartRadius: 44,
    borderTopEndRadius: 44,
    borderBottomEndRadius: 44,
    borderBottomColor: '#45484b56',
    borderBottomWidth: 0.1,
    borderLeftColor: '#45484b56',
    borderLeftWidth: 1,
    shadowColor: '#45484b56',
    shadowOffset: { width: -1, height: 1 },
    shadowOpacity: 3.55,
    shadowRadius: 35,
    elevation: 6,
  },
  text: {
    color: AppColors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default BookServiceButton;

