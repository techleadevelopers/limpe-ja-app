import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform, // Importar Platform para ajustes finos
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';

interface Props {
  route: {
    params: {
      providerName: string;
      providerAvatar?: string;
    };
  };
  navigation: any;
}

export default function PostBookingReview({ route, navigation }: Props) {
  // Protege acesso aos params vindo da navegação
  const navRoute = route ?? (useRoute() as any);
  const params = navRoute?.params || {};
  const providerName: string = params.providerName || 'Prestador';
  const providerAvatar: string | undefined = params.providerAvatar;
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const hasAvatar = !!providerAvatar;
  const providerInitial = useMemo(
    () => (providerName ? providerName.charAt(0).toUpperCase() : '?'),
    [providerName],
  );

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const handleSubmit = () => {
    // TODO: integrar submitReview
    // navigation.navigate('home');
    console.log(`Avaliação enviada: ${rating} estrelas, Comentário: ${comment}`);
    navigation.goBack(); // Usar goBack() simula fechar o modal/overlay
  };

  return (
    // 🛑 Fundo: Neutro, Muito Claro e Confortável (Quase branco)
    <LinearGradient colors={['#F5F5F5', '#FFFFFF']} style={styles.container}>
      
      {/* 🛑 REMOVIDO: View style={styles.glow} -> Simplificar e limpar o fundo */}

      <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
        
        {/* 🛑 REMOVIDO: Badge superior "Sua Avaliação" -> Design mais clean */}

        <View style={styles.avatarWrap}>
          {hasAvatar ? (
            <Image source={{ uri: providerAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{providerInitial}</Text>
            </View>
          )}
        </View>

        {/* 🛑 Títulos: Mais suaves e centralizados */}
        <Text style={styles.title}>O que achou do serviço?</Text>
        <Text style={styles.subtitle}>com **{providerName}**</Text>

        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((s) => (
            <TouchableOpacity key={s} onPress={() => setRating(s)} activeOpacity={0.7}>
              <Ionicons
                name={s <= rating ? 'star' : 'star-outline'}
                size={34} // Estrelas maiores para melhor toque e visual
                // 🛑 Cor: Primária, mais vibrante e consistente
                color={s <= rating ? '#FFC300' : '#E0E0E0'} 
                style={styles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* 🛑 Helper: Feedback de texto mais direto */}
        <Text style={styles.helper}>Sua opinião é importante para o **{providerName}**</Text>

        <TextInput
          placeholder="Deixe um comentário opcional..."
          placeholderTextColor="#B0B0B0" // Cinza claro e suave
          multiline
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          autoCorrect={false}
          keyboardAppearance={Platform.OS === 'ios' ? 'light' : 'default'}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          {/* 🛑 Botão: Gradiente suave, alto contraste */}
          <LinearGradient
            colors={['#107FBF', '#0B598F']} // Azul institucional mais forte
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>Enviar avaliação</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // 🛑 Container: Fundo Super Claro
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // Não usar paddingHorizontal aqui, o card já se ajusta
  },
  // 🛑 Card: Mais Redondo, Menor Padding, Sombra Sutil
  card: {
    width: '90%', // Levemente menor
    padding: 30, // Padding vertical e horizontal balanceado
    borderRadius: 20, // Mais arredondado
    backgroundColor: '#FFFFFF', // Branco puro para a Apple Vibe
    
    // Sombra: Mais leve e moderna (iOS style)
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
    elevation: 5,
    
    alignItems: 'center',
    borderWidth: 0, // Remover borda de cor fraca
  },
  
  // 🛑 Avatar: Mais suave e com mais destaque
  avatarWrap: {
    marginBottom: 10,
    marginTop: 0, // Remove o gap superior do badge
  },
  avatar: {
    width: 80, // Levemente menor
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    borderWidth: 3, // Borda um pouco mais grossa para destacar
    borderColor: '#E0E0E0', // Cor de borda neutra (cinza claro)
  },
  avatarFallback: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '600',
    color: '#0B598F',
  },
  
  // 🛑 Títulos: Mais clean
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#888888',
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Estrelas
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 25,
    justifyContent: 'center',
  },
  starIcon: { 
    marginHorizontal: 4, 
    // Garante que o toque seja o único responsável pela cor
  },
  
  // Helper
  helper: {
    fontSize: 13,
    color: '#AAAAAA',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // 🛑 Input: Mais claro e arredondado
  input: {
    width: '100%',
    minHeight: 120, // Altura maior para conforto
    borderRadius: 12, // Levemente menos arredondado que o card
    backgroundColor: '#F7F7F7',
    borderWidth: 1,
    borderColor: '#EFEFEF', // Borda super clara
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 25,
    color: '#333333',
    // Sombra interna sutil
    shadowColor: 'transparent', 
  },
  
  // 🛑 Botão: Flat, Foco no Gradiente
  button: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 14, // Levemente menor para compactar
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600', // Levemente menos negrito (iOS style)
    textAlign: 'center',
  },
  
  // Badge antigo REMOVIDO
  // badge: { ... },
  // badgeText: { ... },
});