// components/client/explore/provider/BookServiceButton.tsx
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Animated, Text, TouchableOpacity, Platform, StyleSheet, View } from 'react-native';
import { useRouter, type Router } from 'expo-router';

interface BookServiceButtonProps {
  providerId: string;
  serviceId?: string; // Adicionada a prop serviceId
  router: Router; // Usar o tipo Router do expo-router para melhor tipagem
  bookNowButtonAnim: Animated.Value;
  servicePrice?: number; // <--- CORREÇÃO: Adicionada a propriedade servicePrice como número opcional
  sticky?: boolean; // Torna o botão fixo na parte inferior (barra)
  safeBottomInset?: number; // Ajuste opcional para área segura inferior
}

const BookServiceButton: React.FC<BookServiceButtonProps> = ({
  providerId,
  serviceId,
  router,
  bookNowButtonAnim,
  servicePrice, // <--- CORREÇÃO: Desestruturada a nova prop
  sticky = false,
  safeBottomInset = 0,
}) => {
  return (
    <Animated.View
      style={[
        sticky ? localStyles.stickyContainer : localStyles.buttonContainer,
        sticky && { paddingBottom: Math.max(8, safeBottomInset) },
        {
          opacity: bookNowButtonAnim,
          transform: [{
            translateY: bookNowButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [100, 0] })
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#A8D8FF', '#4A90E2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={localStyles.bookServiceButtonGradient} // Aplicando a sombra aqui
      >
        <TouchableOpacity
          style={localStyles.bookServiceButton}
          onPress={() => router.push({
            pathname: `/(client)/bookings/schedule-service`,
            params: {
              providerId: providerId,
              serviceId: serviceId,
              // ✅ CORREÇÃO: Passar servicePrice como string, com verificação de null/undefined
              servicePrice: servicePrice != null ? servicePrice.toString() : undefined,
            }
          })}
        >
          {/* ✅ CORREÇÃO: Exibir preço formatado se for um número válido, senão "Agendar Serviço" */}
          <Text style={localStyles.bookServiceButtonText}>
            {servicePrice != null && typeof servicePrice === 'number' && Number.isFinite(servicePrice)
              ? `Agendar por R$ ${servicePrice.toFixed(2).replace('.', ',')}`
              : 'Agendar Serviço'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const localStyles = StyleSheet.create({
  buttonContainer: {
    // Removido o posicionamento absoluto e estilos de barra inferior fixa.
    // O botão agora fluirá com o conteúdo.
    marginVertical: 20, // Adiciona margem vertical para espaçamento do conteúdo ao redor
    alignSelf: 'center', // Centraliza o botão horizontalmente dentro do seu container pai
    width: '90%', // Define a largura do botão para 90% do container pai
    maxWidth: 400, // Opcional: limita a largura máxima para telas maiores
  },
  stickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(255,255,255,0.85)', // Barra sutil translúcida
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  bookServiceButtonGradient: {
    borderRadius: 12,
    // CORREÇÃO 2: Adicionando sombra sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  bookServiceButton: {
    paddingVertical: 16, // +1dp (Corrigido para 16)
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bookServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default BookServiceButton;
