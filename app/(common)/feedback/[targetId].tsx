// LimpeJaApp/app/(common)/feedback/[targetId].tsx
import React, { useState } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    Alert, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    Platform
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Para as estrelas e outros ícones

// Componente StarRating Aprimorado
interface StarRatingProps {
  rating: number;
  onRate: (rate: number) => void;
  maxStars?: number;
  starSize?: number;
  activeColor?: string;
  inactiveColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRate,
  maxStars = 5,
  starSize = 36, // Tamanho do ícone da estrela
  activeColor = '#FFC107', // Amarelo/Dourado para estrela ativa
  inactiveColor = '#CED4DA', // Cinza claro para estrela inativa
}) => {
  return (
    <View style={styles.starContainer}>
      {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
        <TouchableOpacity key={star} onPress={() => onRate(star)} style={styles.starTouchable}>
          <Ionicons
            name={rating >= star ? "star" : "star-outline"}
            size={starSize}
            color={rating >= star ? activeColor : inactiveColor}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};


export default function FeedbackScreen() {
  const params = useLocalSearchParams<{
    targetId: string;
    type?: 'service' | 'provider_profile' | 'app_feedback';
    serviceName?: string;
    providerName?: string;
  }>();
  
  const { targetId, type = 'app_feedback', serviceName, providerName } = params; // Define um tipo padrão se não vier
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    if (type !== 'app_feedback' && rating === 0) {
      Alert.alert("Avaliação Incompleta", "Por favor, selecione de 1 a 5 estrelas.");
      return;
    }
    if (comment.trim() === '' && (type === 'service' || type === 'provider_profile')) { // Comentário obrigatório para serviço/provedor
      Alert.alert("Comentário Vazio", "Por favor, escreva um comentário sobre sua experiência.");
      return;
    }
    if (type === 'app_feedback' && comment.trim() === '') {
        Alert.alert("Feedback Vazio", "Por favor, escreva sua sugestão ou problema.");
        return;
    }


    setIsLoading(true);
    console.log("[FeedbackScreen] Enviando feedback:", { targetId, type, rating, comment, serviceName, providerName });
    // TODO: Chamar o serviço real para enviar o feedback:
    // try {
    //   await submitFeedback({ targetId, type, rating, comment, serviceName, providerName });
    //   Alert.alert("Feedback Enviado!", "Obrigado pela sua contribuição.");
    //   router.back();
    // } catch (error: any) {
    //   Alert.alert("Erro ao Enviar", error.message || "Não foi possível enviar seu feedback. Tente novamente.");
    // } finally {
    //   setIsLoading(false);
    // }

    // Simulação de sucesso
    setTimeout(() => {
      Alert.alert("Feedback Enviado! (Simulado)", "Obrigado pela sua avaliação/comentário.");
      setIsLoading(false);
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback se não puder voltar (ex: se for a primeira tela do stack)
        if (type === 'app_feedback') router.replace('/'); // Ou uma tela de "obrigado"
        else router.replace('/(client)/bookings'); // Ou para a tela de detalhes do agendamento
      }
    }, 1500);
  };

  let screenTitle = "Deixe seu Feedback";
  let contextInfo = "";
  let commentPlaceholder = "Descreva sua sugestão, elogio ou problema...";

  if (type === 'service') {
    screenTitle = `Avaliar Serviço`;
    contextInfo = `Serviço: ${serviceName || 'Não especificado'}${providerName ? `\nPrestado por: ${providerName}` : ''}`;
    commentPlaceholder = "Como foi sua experiência com este serviço?";
  } else if (type === 'provider_profile') {
    screenTitle = `Avaliar Profissional`;
    contextInfo = `Profissional: ${providerName || 'Não especificado'}`;
    commentPlaceholder = `Como foi sua experiência com ${providerName || 'este profissional'}?`;
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: screenTitle }} />
      
      <Text style={styles.headerTitle}>{screenTitle}</Text>
      {contextInfo && <Text style={styles.contextText}>{contextInfo}</Text>}

      {type !== 'app_feedback' && (
        <View style={styles.section}>
          <Text style={styles.label}>Sua Avaliação:</Text>
          <StarRating rating={rating} onRate={setRating} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.label}>{type === 'app_feedback' ? 'Seu Feedback:' : 'Seu Comentário:'}</Text>
        <TextInput
          style={styles.commentInput}
          value={comment}
          onChangeText={setComment}
          placeholder={commentPlaceholder}
          placeholderTextColor="#ADB5BD"
          multiline
          numberOfLines={Platform.OS === 'ios' ? 5 : 5} // numberOfLines para altura inicial
          maxLength={500} // Limite de caracteres
        />
      </View>

      <TouchableOpacity 
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]} 
        onPress={handleSubmitFeedback}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Enviar Feedback</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flexGrow: 1, // Para que o ScrollView ocupe espaço mesmo com pouco conteúdo
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 8,
    textAlign: 'center',
  },
  contextText: {
    fontSize: 15,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
    marginBottom: 12,
  },
  starContainer: { // Estilo do componente StarRating
    flexDirection: 'row',
    justifyContent: 'center', // Centraliza as estrelas
    marginBottom: 10, // Espaço abaixo das estrelas
  },
  starTouchable: { // Para aumentar a área de toque da estrela
      padding: 5, // Pequeno padding em volta do ícone
  },
  // Os estilos 'star' e 'starSelected' não são mais necessários aqui, pois estão no componente StarRating
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
    minHeight: 120, // Altura mínima para o campo de texto
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
});