import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DatePickerInputProps {
  label: string;
  value?: Date;
  onChange: (date?: Date) => void;
  errorMessage?: string | null;
  maximumDate?: Date;
  animationDelay?: number; // Delay for the component's appearance animation
}

export const DatePickerInput: React.FC<DatePickerInputProps> = ({
  label,
  value,
  onChange,
  errorMessage,
  maximumDate,
  animationDelay = 0,
}) => {
  const [showDatePicker, setShowDatePicker] = React.useState(false);
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

  const onDateChange = (event: DateTimePickerEvent, selectedDateValue?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDateValue) {
      onChange(selectedDateValue);
    }
  };

  return (
    <Animated.View style={[styles.inputContainerWrapper, wrapperStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[styles.datePickerButton, errorMessage && styles.inputErrorBorder]}
        onPress={() => setShowDatePicker(true)}
      >
        <Ionicons name="calendar-outline" size={20} color="#007AFF" style={styles.inputIcon} />
        <Text style={styles.datePickerButtonText}>
          {value ? value.toLocaleDateString('pt-BR') : "Toque para selecionar"}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color="#8A8A8E" />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={value || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? "spinner" : "default"}
          onChange={onDateChange}
          maximumDate={maximumDate}
        />
      )}
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
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 12,
    justifyContent: 'space-between',
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
  datePickerButtonText: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  errorMessage: {
    color: '#D32F2F',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 5,
  },
});