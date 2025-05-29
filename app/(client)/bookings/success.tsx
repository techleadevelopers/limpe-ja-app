import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- Cores da imagem de referência (ajustadas para um tom de verde-água/turquesa) ---
const primaryColor = '#008080'; // Um verde-água mais escuro (usado no header e no meio do gradiente de fundo)
const secondaryColor = '#00A3A3'; // Um verde-água mais claro (usado no header)
const lightestTeal = '#F0F8F8'; // Um tom muito claro, quase branco, para o efeito de reflexo no fundo


// --- Interface para os parâmetros que esta tela vai receber ---
interface SuccessParams {
  providerId?: string;
  providerName?: string;
  providerImage?: string;
  providerRating?: number; // Adicionado para as estrelas
  serviceName?: string;
  bookingDate?: string;
  bookingTime?: string;
  clientAddress?: string;
  paymentValue?: string;
  paymentMethod?: string;
}

export default function SuccessScreen() {
  const params = useLocalSearchParams() as SuccessParams;

  const router = useRouter();

  // Dados mockados para desenvolvimento/teste rápido se os params não vierem
  const mockParams: SuccessParams = {
    providerId: 'provider1',
    providerName: 'Ana Oliveira',
    providerImage: 'https://randomuser.me/api/portraits/women/43.jpg',
    providerRating: 4.5, // Exemplo de avaliação
    serviceName: 'Limpeza Residencial Detalhada',
    bookingDate: '29 de Maio de 2025',
    bookingTime: '14:30',
    clientAddress: 'Rua Doutor Quirino, N° 58 - Centro - Campinas SP',
    paymentValue: '95,50',
    paymentMethod: 'PIX',
  };

  // Usar os parâmetros recebidos ou os mockados se não houver
  const {
    providerName,
    providerImage,
    providerRating, // Adicionado
    serviceName,
    bookingDate,
    bookingTime,
    clientAddress,
    paymentValue,
    paymentMethod,
  } = (Object.keys(params).length > 0 ? params : mockParams) as SuccessParams;

  // Função para renderizar as estrelas de avaliação
  const renderStars = (rating: number | undefined) => {
    if (rating === undefined || rating === null) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : (i - rating < 1 && i - rating > 0 ? "star-half" : "star-outline")}
          size={16}
          color="#FFD700" // Cor dourada para as estrelas
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const handleGoToBookings = () => {
    router.replace({ pathname: '/(client)/bookings', params: { highlightNew: true } } as any);
  };

  const handleGoHome = () => {
    router.replace('/(client)/explore' as any);
  };

  return (
    // O LinearGradient agora é o container principal para o fundo
    <LinearGradient
      colors={[lightestTeal, primaryColor, lightestTeal]} // Cores para o gradiente de fundo
      locations={[0.0, 0.5, 1.0]} // Posições das cores: claro no início, escuro no meio, claro no final
      start={{ x: 0, y: 0 }} // Começa no canto superior esquerdo
      end={{ x: 1, y: 1 }} // Termina no canto inferior direito (diagonal)
      style={styles.fullScreenGradient} // Estilo para preencher a tela
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header com gradiente */}
      <LinearGradient
        colors={[primaryColor, secondaryColor]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        {/* Botão de Voltar */}
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        {/* Título Centralizado */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detalhes do Agendamento</Text>
        </View>

        {/* Botão de Três Pontos */}
        <TouchableOpacity onPress={() => console.log('Menu de 3 pontos pressionado')} style={styles.headerButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Card - Replicando o estilo do "Boarding Pass" */}
        <View style={styles.mainCardContainer}>
          {/* Background do card com gradiente e blur (efeito glassmorphism) */}
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.9)', 'rgba(240, 255, 255, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFillObject} />

          {/* Conteúdo do Card */}
          <View style={styles.cardContentNew}>
            {/* Seção do Prestador (Header do "Boarding Pass") */}
            <View style={styles.providerHeaderSection}>
              {providerImage && <Image source={{ uri: providerImage }} style={styles.providerAvatar} />}
              <View style={styles.providerHeaderText}>
                <Text style={styles.providerNameText}>{providerName}</Text>
                <Text style={styles.providerRoleText}>Prestador(a)</Text>
              </View>
              {renderStars(providerRating)}
            </View>

            {/* Linha divisória com círculos */}
            <View style={styles.dividerContainer}>
              <View style={styles.circle} />
              <View style={styles.dashedLine} />
              <View style={styles.circle} />
            </View>

            {/* Seção de Origem/Destino (Serviço e Endereço) */}
            <View style={styles.locationSection}>
              <View style={styles.locationItem}>
                {/* Usando as 3 primeiras letras do serviço como "código" */}
                <Text style={styles.locationCode}>{serviceName ? serviceName.substring(0, 3).toUpperCase() : 'SRV'}</Text>
                <Text style={styles.locationLabel}>{serviceName}</Text>
              </View>
              <Ionicons name="airplane" size={24} color={primaryColor} style={styles.airplaneIcon} />
              <View style={styles.locationItem}>
                {/* Usando "END" como código e o primeiro pedaço do endereço */}
                <Text style={styles.locationCode}>END</Text>
                <Text style={styles.locationLabel}>{clientAddress ? clientAddress.split(',')[0] : 'Endereço'}</Text>
              </View>
            </View>

            {/* Detalhes da Data e Hora */}
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeCard}>
                <Ionicons name="calendar-outline" size={20} color={primaryColor} />
                <Text style={styles.dateTimeLabel}>Data</Text>
                <Text style={styles.dateTimeValue}>{bookingDate}</Text>
              </View>
              <View style={styles.dateTimeCard}>
                <Ionicons name="time-outline" size={20} color={primaryColor} />
                <Text style={styles.dateTimeLabel}>Hora</Text>
                <Text style={styles.dateTimeValue}>{bookingTime}</Text>
              </View>
            </View>

            {/* Detalhes Adicionais (Serviço, Valor, Pagamento) */}
            <View style={styles.additionalDetailsContainer}>
              <View style={styles.additionalDetailItem}>
                <Text style={styles.additionalDetailLabel}>Serviço</Text>
                <Text style={styles.additionalDetailValue}>{serviceName}</Text>
              </View>
              <View style={styles.additionalDetailItem}>
                <Text style={styles.additionalDetailLabel}>Valor</Text>
                <Text style={styles.additionalDetailValue}>R$ {paymentValue}</Text>
              </View>
              <View style={styles.additionalDetailItem}>
                <Text style={styles.additionalDetailLabel}>Pagamento</Text>
                <Text style={styles.additionalDetailValue}>{paymentMethod}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtonsContainerNew}>
          <TouchableOpacity style={[styles.downloadButton, { backgroundColor: primaryColor }]} onPress={handleGoToBookings}>
            <Ionicons name="list-outline" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
            <Text style={styles.downloadButtonText}>Ver Meus Agendamentos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.downloadButton, styles.secondaryDownloadButton]} onPress={handleGoHome}>
            <Ionicons name="home-outline" size={20} color={primaryColor} style={{ marginRight: 10 }} />
            <Text style={[styles.downloadButtonText, { color: primaryColor }]}>Voltar para o Início</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fullScreenGradient: {
    flex: 1, // Faz o gradiente preencher toda a tela
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row', // Adicionado para layout horizontal
    justifyContent: 'space-between', // Distribui os itens
    alignItems: 'center', // Alinha verticalmente
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
  },
  headerButton: { // Estilo para os botões de voltar e de três pontos
    padding: 5, // Aumenta a área de toque
  },
  headerTitleContainer: {
    flex: 1, // Permite que o título ocupe o espaço restante
    alignItems: 'center', // Centraliza o texto dentro do container
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
    backgroundColor: 'transparent', // Garante que o gradiente de fundo seja visível
  },
  mainCardContainer: {
    width: '100%',
    borderRadius: 15,
    overflow: 'hidden',
    marginTop: 20, // Espaçamento do cabeçalho
    marginBottom: 30,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  cardContentNew: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  providerHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  providerHeaderText: {
    flex: 1,
  },
  providerNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  providerRoleText: {
    fontSize: 14,
    color: '#666',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginHorizontal: -6,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  locationItem: {
    alignItems: 'center',
    flex: 1,
  },
  locationCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  locationLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  airplaneIcon: {
    marginHorizontal: 15,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dateTimeCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    width: '45%',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dateTimeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  additionalDetailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 20,
  },
  additionalDetailItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 15,
  },
  additionalDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  additionalDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  actionButtonsContainerNew: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    marginBottom: 15,
    backgroundColor: primaryColor,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryDownloadButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: primaryColor,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(0,0,0,0.1)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});