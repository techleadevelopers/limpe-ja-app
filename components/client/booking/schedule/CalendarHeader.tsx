import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Importar LinearGradient

interface CalendarHeaderProps {
  currentDisplayMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  routerBack: () => void; // Mantido, mas não usado diretamente na UI deste componente
  MONTH_NAMES_PT: string[];
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDisplayMonth,
  onPrevMonth,
  onNextMonth,
  // routerBack, // Não usado diretamente na UI deste componente, mas mantido nas props
  MONTH_NAMES_PT,
}) => {
  const monthTranslateAnim = useRef(new Animated.Value(0)).current; // Animação para transição de meses

  // Efeito para resetar a animação quando o mês muda
  useEffect(() => {
    monthTranslateAnim.setValue(0); // Reseta a posição
  }, [currentDisplayMonth]);

  const handleMonthChange = (direction: 'prev' | 'next', action: () => void) => {
    // Animação de slide para o mês
    Animated.timing(monthTranslateAnim, {
      toValue: direction === 'next' ? -1 : 1, // Move para a esquerda ou direita
      duration: 300,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start(() => {
      action(); // Chama a função de mudança de mês real após a animação
      monthTranslateAnim.setValue(0); // Reseta para a próxima animação
    });
  };

  // Calcula os meses a serem exibidos
  const prevMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() - 1);
  const nextMonth = new Date(currentDisplayMonth.getFullYear(), currentDisplayMonth.getMonth() + 1);

  return (
    // O LinearGradient agora envolve o conteúdo do cabeçalho
    <LinearGradient
      colors={['rgba(173, 216, 230, 0.01)', 'rgba(135, 206, 250, 0.8)', 'rgba(100, 148, 237, 0)']} // 3 tons de azul com opacidade
      start={{ x: 0, y: 0 }} // Início do gradiente (canto superior esquerdo)
      end={{ x: 1, y: 1 }} // Fim do gradiente (canto inferior direito)
      style={styles.container} // Aplica os estilos do container ao LinearGradient
    >
      {/* Botão de voltar (removido da UI deste componente, mas a prop é mantida) */}
      {/* <TouchableOpacity onPress={routerBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={22} color="#2A72E7" />
      </TouchableOpacity> */}

      <View style={styles.monthSelector}>
        {/* Mês Anterior */}
        <TouchableOpacity
          onPress={() => handleMonthChange('prev', onPrevMonth)}
          style={styles.monthNavButton}
        >
          <Text style={styles.monthNavText}>
            {MONTH_NAMES_PT[prevMonth.getMonth()].slice(0, 3)} {/* Ex: Jan */}
          </Text>
        </TouchableOpacity>

        {/* Mês Atual (Centralizado e Destacado) */}
        <Animated.View
          style={[
            styles.currentMonthContainer,
            {
              transform: [
                {
                  translateX: monthTranslateAnim.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-50, 0, 50], // Deslocamento para a animação de slide
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(109, 179, 253, 0.9)', 'rgba(12, 88, 170, 0.8)']} // Cores roxas para o destaque (inspirado na Play Store)
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.currentMonthGradient}
          >
            <Text style={styles.currentMonthText}>
              {MONTH_NAMES_PT[currentDisplayMonth.getMonth()]}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Mês Próximo */}
        <TouchableOpacity
          onPress={() => handleMonthChange('next', onNextMonth)}
          style={styles.monthNavButton}
        >
          <Text style={styles.monthNavText}>
            {MONTH_NAMES_PT[nextMonth.getMonth()].slice(0, 3)} {/* Ex: Mar */}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    width: '95%',
    paddingHorizontal: 55,
    marginTop: 0, // Espaçamento superior para evitar sobreposição com a barra de status
    marginBottom: 30, // Espaçamento inferior para evitar sobreposição com o conteúdo abaixo
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Centraliza o seletor de mês
    // backgroundColor: '#fff', // REMOVIDO: O LinearGradient agora cuida do fundo
    borderRadius: 15, // Bordas arredondadas para o container do header
    overflow: 'hidden', // Garante que o gradiente e sombras não vazem
    // Removido marginTop e paddingBottom herdados do estilo anterior
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Espaçamento entre os botões de navegação
    width: '100%', // Ocupa toda a largura disponível
  },
  monthNavButton: {
    paddingHorizontal: 15, // Aumenta a área de toque
    paddingVertical: 8,
    borderRadius: 18,
    // Sombra sutil para os botões de navegação
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  monthNavText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666', // Cor mais suave para meses não selecionados
  },
  currentMonthContainer: {
    flex: 1, // Permite que o container do mês atual ocupe o espaço central
    alignItems: 'center', // Centraliza o texto dentro do gradiente
    marginHorizontal: 1, // Espaçamento entre os meses
  },
  currentMonthGradient: {
    paddingHorizontal: 5, // Padding horizontal para o texto do mês
    paddingVertical: 10, // Padding vertical para o texto do mês
    borderRadius: 18, // Bordas arredondadas para o destaque do mês
    // Sombra para o destaque do mês
    shadowColor: '#673AB7', // Cor da sombra baseada no gradiente
    shadowOffset: { width: 2, height: 4, },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  currentMonthText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF', // Texto branco para contraste
    textAlign: 'center',
  },
});

export default CalendarHeader;
