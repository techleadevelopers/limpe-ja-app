import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
  Easing
} from 'react-native';
import { Icons3D } from '../../../../constants/icons3d'; // << ícones 3D (docCheck)

const SCREEN_WIDTH = Dimensions.get('window').width;

interface SecurityRefProps {
  shineAnim: Animated.Value;
  // isLoading?: boolean; // Removido, pois o componente será estático
}

const SecurityRef: React.FC<SecurityRefProps> = ({
  shineAnim,
  // isLoading
}) => {
  const trackerIconPulseAnim = useRef(new Animated.Value(1)).current;
  const msgShineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // pulso dos ícones
    Animated.loop(
      Animated.sequence([
        Animated.timing(trackerIconPulseAnim, { toValue: 1.1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(trackerIconPulseAnim, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // shimmer na mensagem
    Animated.loop(
      Animated.sequence([
        Animated.timing(msgShineAnim, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(msgShineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // O estado de carregamento e o modo de input foram removidos, pois não são relevantes para este componente.
  // Se houver necessidade de um skeleton para este componente, ele precisaria ser reimplementado especificamente.

  return (
    <View style={s.card}>
      {/* Trilho com ícone + mensagem de segurança + docCheck 3D */}
      <View style={s.track}>
        <Animated.Image
          source={require('../../../../assets/images/woman.png')} // Caminho ajustado para o novo local do componente
          style={[s.trackIcon, { transform: [{ scale: trackerIconPulseAnim }] }]}
          resizeMode="contain"
        />

        {/* Mensagem de segurança (original do componente) */}
        <View style={s.safeMsgWrap}>
          <Text numberOfLines={2} style={s.safeMsgText}>
            Este prestador tem documentação rigorosa verificada para a sua segurança.
          </Text>

          {/* shimmer suave passando na mensagem */}
          <Animated.View
            pointerEvents="none"
            style={[
              s.safeMsgShine,
              {
                transform: [
                  {
                    translateX: msgShineAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-SCREEN_WIDTH * 0.45, SCREEN_WIDTH * 0.45],
                    }),
                  },
                ],
              },
            ]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>

        {/* Ícone 3D docCheck à direita */}
        <Animated.Image
          source={Icons3D.docCheck}
          style={[s.trackIcon, { transform: [{ scale: trackerIconPulseAnim }] }]}
          resizeMode="contain"
        />
      </View>

      {/* Nova seção: Mensagem de Suporte */}
      <View style={s.supportRow}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#2A72E7" style={{ marginRight: 8 }} />
        <Text style={s.supportMessageText}>
          Entre em contato com o nosso suporte para mais informações.
        </Text>
      </View>

      {/* brilho diagonal do card (efeito existente) */}
      <Animated.View style={[s.shine, { transform: [{ translateX: shineAnim }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const s = StyleSheet.create({
  card: {
    backgroundColor: '#F0F6FF',
    borderRadius: 18,
    marginHorizontal: 26,
    padding: 14,
    marginTop: 12,
    overflow: 'hidden',
  },

  // trilho
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  trackIcon: {
    width: 66,
    height: 66,
    marginHorizontal: 0,
  },

  // mensagem de segurança (no lugar do pontilhado)
  safeMsgWrap: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 0,
    paddingVertical: 18,
    borderRadius: 14,
    backgroundColor: '#EAF3FF', // azul bem leve
    overflow: 'hidden',
    justifyContent: 'center',
  },
  safeMsgText: {
    fontSize: 12,
    color: '#4B6B8A',
    fontWeight: '400', // leve/fina e confortável
    lineHeight: 16,
    left: 15,
  },
  safeMsgShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '85%',
  },

  // Nova seção de suporte
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#CFE1FF',
    justifyContent: 'center', // Centraliza o conteúdo da linha
  },
  supportMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#223243',
    textAlign: 'center', // Centraliza o texto
    flex: 1, // Permite que o texto ocupe o espaço disponível
    marginRight: 10, // Espaço entre o texto e a borda direita
  },

  // brilho do card
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: SCREEN_WIDTH * 0.3,
    transform: [{ skewX: '-20deg' }],
    overflow: 'hidden',
  },

  // Estilos de skeleton e input removidos, pois não são mais usados
  // skeleton: { ... },
  // skeletonIcon: { ... },
  // skeletonLine: { ... },
  // inputCard: { ... },
  // inputTitle: { ... },
  // inputRow: { ... },
  // input: { ... },
});

export default SecurityRef;