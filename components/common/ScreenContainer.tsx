import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  ViewStyle,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme/colors';

const DEFAULT_VERTICAL_PADDING = 20;

interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
  statusBarColor?: string;
  statusBarStyle?: 'dark-content' | 'light-content';
  contentContainerStyle?: ViewStyle;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  style,
  statusBarColor = colors.background,
  statusBarStyle = 'dark-content',
  contentContainerStyle,
}) => {
  const insets = useSafeAreaInsets();
  const scrollPaddingBottom = insets.bottom + DEFAULT_VERTICAL_PADDING;

  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={[
        styles.scrollViewContent,
        contentContainerStyle,
        { paddingBottom: scrollPaddingBottom },
      ]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={Platform.OS === 'ios'}
      contentInsetAdjustmentBehavior="automatic"
      scrollIndicatorInsets={{ top: insets.top, bottom: insets.bottom }}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.nonScrollableContent,
        contentContainerStyle,
        { paddingBottom: Math.max(scrollPaddingBottom, insets.bottom) },
      ]}
    >
      {children}
    </View>
  );

  const keyboardVerticalOffset =
    Platform.OS === 'ios' ? insets.top + 44 : (StatusBar.currentHeight ?? 0) + insets.top;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: statusBarColor }, style]}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarColor}
        translucent={true}
      />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: DEFAULT_VERTICAL_PADDING,
  },
  nonScrollableContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: DEFAULT_VERTICAL_PADDING,
  },
});

export default ScreenContainer;
