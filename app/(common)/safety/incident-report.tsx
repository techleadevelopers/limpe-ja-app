// LimpeJaApp/app/(common)/safety/incident-report.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { useMutation } from '@tanstack/react-query';
import { reportIncident } from '../../../services/safetyService';
import { IncidentReportDto, IncidentType } from '../../../types/backend/safety';
import { router } from 'expo-router';

export default function IncidentReportScreen() {
  const [incidentType, setIncidentType] = useState<IncidentType>(IncidentType.OTHER);
  const [description, setDescription] = useState('');
  const [bookingId, setBookingId] = useState(''); // Optional
  const [attachments, setAttachments] = useState<string[]>([]); // URLs of uploaded images

  const reportIncidentMutation = useMutation({
    mutationFn: (data: IncidentReportDto) => reportIncident(data),
    onSuccess: () => {
      Alert.alert('Relatório Enviado', 'Seu relatório de incidente foi enviado com sucesso. Nossa equipe irá revisá-lo.');
      router.back();
    },
    onError: (error) => {
      Alert.alert('Erro', `Não foi possível enviar o relatório: ${error.message}`);
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
      // In a real app, you would upload this image to a storage service (e.g., S3, Firebase Storage)
      // and get a URL. For now, we'll just use the local URI as a placeholder.
      // You might also want to limit the number of attachments.
      setAttachments((prev) => [...prev, result.assets[0].uri]);
      Alert.alert('Anexo Adicionado', 'Imagem selecionada. Em um ambiente real, ela seria enviada ao servidor.');
    }
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      Alert.alert('Campos Obrigatórios', 'Por favor, descreva o incidente.');
      return;
    }

    const reportData: IncidentReportDto = {
      type: incidentType,
      description,
      bookingId: bookingId || undefined, // Send only if not empty
      attachments, // These would be actual URLs from a cloud storage
    };
    reportIncidentMutation.mutate(reportData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Relatar Incidente</Text>
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
          style={styles.input}
          placeholder="Ex: 123e4567-e89b-12d3-a456-426614174000"
          value={bookingId}
          onChangeText={setBookingId}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Anexar Evidências (Fotos):</Text>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
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
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={reportIncidentMutation.isPending}
      >
        {reportIncidentMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar Relatório</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
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
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});