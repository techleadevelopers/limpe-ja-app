// LimpeJaApp/app/(common)/feedback/[targetId].tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert, // Importar Alert
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // Para as estrelas e outros ícones

// <--- ADICIONADO: Importar o serviço de review e suas tipagens
import { submitFeedback } from '../../services/reviewService';
// Importar SubmitReviewDto (assumindo que você o definiu em types/backend/reviews.ts)
import { SubmitReviewDto } from '../../types/backend/reviews'; 
import { useAuth } from '../../../hooks/useAuth'; // Para obter o ID do usuário que está dando feedback

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
  starSize = 36,
  activeColor = '#FFC107',
  inactiveColor = '#CED4DA',
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
    // Se você passar o providerId para a tela de feedback, adicione aqui também
    providerId?: string; 
  }>();
  
  const { targetId, type = 'app_feedback', serviceName, providerName, providerId } = params;
  const router = useRouter();
  const { user } = useAuth(); // Obtém o usuário logado

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitFeedback = async () => {
    // CORREÇÃO: Verificar se user.id existe antes de prosseguir
    if (!user?.id) {
        Alert.alert("Erro de Autenticação", "Não foi possível identificar o usuário. Por favor, faça login novamente.");
        return;
    }

    if (type !== 'app_feedback' && rating === 0) {
      Alert.alert("Avaliação Incompleta", "Por favor, selecione de 1 a 5 estrelas.");
      return;
    }
    if (comment.trim() === '' && (type === 'service' || type === 'provider_profile')) {
      Alert.alert("Comentário Vazio", "Por favor, escreva um comentário sobre sua experiência.");
      return;
    }
    if (type === 'app_feedback' && comment.trim() === '') {
        Alert.alert("Feedback Vazio", "Por favor, escreva sua sugestão ou problema.");
        return;
    }

    setIsLoading(true);
    try {
        const feedbackData: SubmitReviewDto = {
            targetId: targetId,
            type: type,
            rating: rating,
            comment: comment.trim(),
            // CORREÇÃO: ADICIONAR O userId AQUI!
            userId: user.id, // <--- ESTE É O CAMPO QUE FALTAVA!
            
            // Campos adicionais que podem ser úteis para o backend
            serviceName: serviceName,
            providerName: providerName,
            providerId: providerId, // Passar o providerId se estiver disponível
        };

        // <--- CHAMA O SERVIÇO REAL PARA ENVIAR O FEEDBACK
        await submitFeedback(feedbackData);

        Alert.alert("Feedback Enviado!", "Obrigado pela sua contribuição.");
        setIsLoading(false); // Garante que o loading para antes de navegar
        if (router.canGoBack()) {
            router.back();
        } else {
            // Fallback se não puder voltar (ex: se for a primeira tela do stack)
            if (type === 'app_feedback') router.replace('/(client)/explore'); // Navega para home do cliente
            else router.replace('/(client)/bookings'); // Ou para a tela de agendamentos se for de serviço/provedor
        }
    } catch (error: any) {
        console.error("[FeedbackScreen] Erro ao enviar feedback:", error.response?.data || error.message);
        Alert.alert("Erro ao Enviar", error.response?.data?.message || "Não foi possível enviar seu feedback. Tente novamente.");
    } finally {
        setIsLoading(false);
    }
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
          numberOfLines={Platform.OS === 'ios' ? 5 : 5}
          maxLength={500}
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
    flexGrow: 1,
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
  starContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  starTouchable: {
      padding: 5,
  },
  commentInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CED4DA',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
    minHeight: 120,
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