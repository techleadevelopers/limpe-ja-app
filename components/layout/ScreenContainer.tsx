import React from 'react';
import { View, ViewProps, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDevice } from '@/utils/responsive';

export default function ScreenContainer({ style, children, ...rest }: ViewProps) {
  const { isLargePhone } = useDevice();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
	        {
	          paddingTop:
	            Platform.OS === 'android'
	              ? insets.top + 5
	              : 5,
	          paddingBottom: -12,
	        },
        isLargePhone && styles.maxW,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // só aplica no Pro Max; 12 Pro fica igual
  maxW: { alignSelf: 'center', width: '100%', maxWidth: 820, paddingHorizontal: 10 },
});
