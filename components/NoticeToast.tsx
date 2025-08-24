// components/ui/NoticeToast.tsx
// ================================================
import React from 'react';
import {
  View,
  Text,
  Pressable,
  Animated,
  StyleSheet,
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Chip from '../components/common/Chip'; // Certifique-se que Chip.tsx exporta um componente Chip real
import Colors from '../constants/Colors'; // Importa o objeto de cores
import { useFadeSlideIn } from '../components/utils/useFadeSlideIn'; // Seu hook de animação

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  // Colors é um default export com chaves light/dark
  // Garante que o tipo retornado seja o de 'light' para consistência,
  // já que 'dark' terá as mesmas propriedades.
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

// Definir um valor padrão para o offset de tradução.
// Se você tiver um arquivo Motion.ts ou similar que exporta `Motion.offsets.translateY`,
// importe-o e use-o. Caso contrário, este valor fixo é um bom ponto de partida.
const DEFAULT_TRANSLATE_Y_OFFSET = 100; // Por exemplo, o toast desliza 100px para baixo/cima

interface NoticeToastProps {
  visible: boolean;
  kind?: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onPress?: () => void;
  onHide?: () => void; // Callback para quando o toast deve ser escondido (ex: long press)
}

export const NoticeToast: React.FC<NoticeToastProps> = ({
  visible,
  kind = 'INFO',
  title,
  subtitle,
  ctaLabel,
  onPress,
  onHide,
}) => {
  const theme = useTheme(); // Obtém o tema atual

  // Determina a cor da borda e do Chip com base no 'kind' e no tema atual
  const borderColor = React.useMemo(() => {
    switch (kind) {
      case 'SUCCESS':
        return theme.success;
      case 'WARNING':
        return theme.warning;
      case 'ERROR':
        return theme.error;
      case 'INFO':
      default:
        return theme.info || theme.primary; // Usa theme.info se disponível, senão theme.primary
    }
  }, [kind, theme]);

  // useFadeSlideIn precisa de um offset inicial para a animação.
  // Negativo para deslizar de cima para baixo.
  // Corrigido: Assumindo que useFadeSlideIn só recebe 'visible' e lida com o offset internamente.
  const { opacity, translateY } = useFadeSlideIn(visible); // Removido -DEFAULT_TRANSLATE_Y_OFFSET

  return (
    <Animated.View
      pointerEvents="box-none" // Permite que toques passem através da view quando não visível
      style={[styles.toastWrap, { opacity, transform: [{ translateY }] }]}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onHide} // onLongPress para acionar o onHide (esconder o toast)
        style={[
          styles.toast,
          {
            borderLeftColor: borderColor, // Cor da barra lateral
            backgroundColor: theme.cardBackground, // Fundo do toast
          },
        ]}
      >
        <View style={styles.contentContainer}>
          <Text style={[styles.toastTitle, { color: theme.textPrimary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.toastSub, { color: theme.textSecondary }]}>{subtitle}</Text>
          ) : null}
        </View>
        {/* Chip usa a mesma cor da borda */}
        {/* Convertendo borderColor para 'any' para resolver o erro de tipo, já que o tipo ChipColor é desconhecido */}
        {ctaLabel ? <Chip label={ctaLabel} color={borderColor as any} /> : null}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    top: 0, // Posiciona o toast no topo da tela
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 50, // Espaçamento do topo para não cobrir a barra de status ou notch
    alignItems: 'center',
    zIndex: 1000, // Garante que o toast esteja acima da maioria dos outros elementos da UI
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderLeftWidth: 5, // Largura da barra de cor lateral
    padding: 15,
    width: '100%', // Ocupa a largura total disponível dentro do padding horizontal
    // Sombras para dar um efeito de elevação
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Sombra para Android
  },
  contentContainer: {
    flex: 1, // Permite que o conteúdo ocupe o espaço restante
    marginRight: 10, // Espaçamento entre o texto e o Chip
  },
  toastTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  toastSub: {
    fontSize: 14,
    marginTop: 4,
  },
});