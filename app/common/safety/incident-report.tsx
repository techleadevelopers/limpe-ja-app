import { Ionicons } from '@expo/vector-icons'; // Importar Ionicons para o cabeA§alho
import { Picker } from '@react-native-picker/picker';
import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { toastUserError } from '../../../_shared/errors/uiFeedback';
import { getBookingDetails } from '../../../services/bookingService';
import { submitIncidentClaim } from '../../../services/incidentService';
import { reportIncident } from '../../../services/safetyService';
import { BookingDetails } from '../../../types/backend/bookings';
import { IncidentReportDto, IncidentType } from '../../../types/backend/safety';

export default function IncidentReportScreen() {
  const [incidentType, setIncidentType] = useState<IncidentType>(IncidentType.OTHER);
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState(''); // Optional
  const [attachments, setAttachments] = useState<string[]>([]); // URLs of uploaded images
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [claimAmount, setClaimAmount] = useState('');

  // AnimaA§Aµes
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formContentAnim = useRef(new Animated.Value(0)).current;
  const submitButtonScaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque no botALo submit

  useEffect(() => {
    // AnimaA§Aµes de entrada da tela
    Animated.stagger(150, [
      Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(formContentAnim, { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [formContentAnim, headerAnim]);

  useEffect(() => {
    const normalizedBookingId = bookingId.trim();
    if (!normalizedBookingId) {
      setBooking(null);
      setBookingError(null);
      setBookingLoading(false);
      return;
    }

    let cancelled = false;
    setBookingLoading(true);
    setBookingError(null);

    getBookingDetails(normalizedBookingId)
      .then((data) => {
        if (cancelled) return;
        setBooking(data);
      })
      .catch(() => {
        if (cancelled) return;
        setBooking(null);
        setBookingError('Não foi possível carregar o agendamento informado.');
      })
      .finally(() => {
        if (!cancelled) {
          setBookingLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const reportIncidentMutation = useMutation({
    mutationFn: (data: IncidentReportDto) => reportIncident(data),
    onSuccess: () => {
      Alert.alert('Relatório Enviado', 'Seu relatório de incidente foi enviado com sucesso. Nossa equipe irá revisá-lo.');
      router.back();
    },
    onError: (error: any) => {
      Alert.alert('Erro', `Não foi possível enviar o relatório: ${error.message || 'Erro desconhecido'}`);
    },
  });

  const incidentClaimMutation = useMutation({
    mutationFn: submitIncidentClaim,
    onSuccess: () => {
      Alert.alert('Sinistro registrado', 'Seu sinistro foi encaminhado ao time de seguros. Entraremos em contato em breve.');
      router.back();
    },
    onError: (error: any) => {
      toastUserError(error, 'Erro ao enviar o sinistro');
    },
  });

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setAttachments((prev) => [...prev, result.assets[0].uri]);
      Alert.alert('Anexo Adicionado', 'Imagem selecionada. Em um ambiente real, ela seria enviada ao servidor.');
    }
  };

  const parseCurrencyToCents = (value: string) => {
    const normalized = value.replace(/\s+/g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    if (Number.isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  };

  const formatCurrency = (value: number) =>
    (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const isClaimMode = Boolean(booking?.insurance);
  const isSubmitting = reportIncidentMutation.isPending || incidentClaimMutation.isPending;
  const submitLabel = isClaimMode ? 'Enviar Sinistro' : 'Enviar Relatório';

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, descreva o incidente.');
      return;
    }

    const trimmedBookingId = bookingId.trim();
    if (isClaimMode) {
      if (!trimmedBookingId) {
        Alert.alert('Agendamento necessário', 'Informe o ID do agendamento para abrir o sinistro.');
        return;
      }

      const amountCents = parseCurrencyToCents(claimAmount);
      if (amountCents <= 0) {
        Alert.alert('Valor inválido', 'Informe o valor estimado do sinistro em reais.');
        return;
      }

      incidentClaimMutation.mutate({
        bookingId: trimmedBookingId,
        description: description.trim(),
        amountCents,
        attachments,
        type: incidentType,
      });
      return;
    }

    reportIncidentMutation.mutate({
      type: incidentType,
      description: description.trim(),
      bookingId: trimmedBookingId || undefined,
      attachments,
    });
  };

  // Feedback de toque para botões
  const onPressInButton = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 0.95, useNativeDriver: true }).start();
  };
  const onPressOutButton = (anim: Animated.Value) => {
    Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
  };

  return (
    <View style={styles.outerContainer}>
      {/* Custom Header */}
      <Animated.View
        style={[
          styles.customHeader,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Relatar Incidente</Text>
        <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Animated.View
          style={[
            styles.animatedContentWrapper,
            {
              opacity: formContentAnim,
              transform: [
                {
                  translateY: formContentAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.descriptionText}>
            Use este formulário para relatar qualquer incidente ocorrido durante ou após um serviço.
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Tipo de Incidente:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={incidentType}
                onValueChange={(itemValue) => setIncidentType(itemValue)}
                style={styles.picker}
              >
                {Object.values(IncidentType).map((type) => (
                  <Picker.Item key={type} label={type.replace(/_/g, ' ')} value={type} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descrição Detalhada:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Descreva o que aconteceu, data, hora, quem estava envolvido, etc."
              multiline
              numberOfLines={6}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>ID do Agendamento (Opcional):</Text>
            <TextInput
              testID="incident-booking-id-input"
              style={styles.input}
              placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
              value={bookingId}
              onChangeText={setBookingId}
            />
            {bookingLoading && <Text style={styles.bookingStatus}>Buscando dados do agendamento...</Text>}
            {bookingError && <Text style={styles.bookingError}>{bookingError}</Text>}
            {booking?.insurance && (
              <View style={styles.insuranceBanner}>
                <Text style={styles.insuranceTitle}>Seguro disponível</Text>
                <Text style={styles.insuranceDetail}>Plano {booking.insurance.planId}</Text>
                <Text style={styles.insuranceDetail}>
                  Cobertura {formatCurrency(booking.insurance.coverageCents)} · Franquia {formatCurrency(booking.insurance.deductibleCents)}
                </Text>
                <Text style={styles.insuranceHint}>
                  Ao registrar o sinistro, informe o valor solicitado e envie provas do ocorrido.
                </Text>
              </View>
            )}
          </View>

          {booking?.insurance && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Valor estimado do sinistro:</Text>
              <TextInput
                testID="incident-claim-amount-input"
                style={styles.input}
                placeholder="Ex: 150,00"
                value={claimAmount}
                onChangeText={setClaimAmount}
                keyboardType="decimal-pad"
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Anexar Evidências (Fotos):</Text>
            <TouchableOpacity
              style={[styles.attachButton, { transform: [{ scale: submitButtonScaleAnim }] }]} // Reutiliza animação
              onPress={pickImage}
              onPressIn={() => onPressInButton(submitButtonScaleAnim)}
              onPressOut={() => onPressOutButton(submitButtonScaleAnim)}
            >
              <Text style={styles.attachButtonText}>Selecionar Imagem</Text>
            </TouchableOpacity>
            {attachments.length > 0 && (
              <View style={styles.attachmentsContainer}>
                {attachments.map((uri, index) => (
                  <Text key={index} style={styles.attachmentText}>
                    Anexo {index + 1}: {uri.substring(uri.lastIndexOf('/') + 1)}
                  </Text>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              { transform: [{ scale: submitButtonScaleAnim }] },
              isSubmitting && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            onPressIn={() => onPressInButton(submitButtonScaleAnim)}
            onPressOut={() => onPressOutButton(submitButtonScaleAnim)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  animatedContentWrapper: {
    // Estilo para o conteúdo animado
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 0,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#444',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  attachButton: {
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  attachButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  attachmentsContainer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  attachmentText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  insuranceBanner: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#36B37E',
    backgroundColor: '#E6FFFA',
  },
  insuranceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#064E3B',
    marginBottom: 4,
  },
  insuranceDetail: {
    fontSize: 13,
    color: '#064E3B',
  },
  insuranceHint: {
    fontSize: 12,
    color: '#065F46',
    marginTop: 6,
  },
  bookingStatus: {
    fontSize: 12,
    color: '#2563EB',
    marginTop: 4,
  },
  bookingError: {
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
  },
});
