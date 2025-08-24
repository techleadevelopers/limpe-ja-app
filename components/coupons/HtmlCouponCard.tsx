// components/coupons/HtmlCouponCard.tsx
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable, useColorScheme } from 'react-native'; // Removido Animated
import * as Clipboard from 'expo-clipboard';
import Toast from '../Toast'; // Importa o componente Toast
// Removido useFadeSlideIn
import Colors from '../../constants/Colors'; // Importa as cores do tema
import Button from '../common/Button'; // Importa um componente Button genérico

// Hook para acessar as cores do tema atual (reutilizado)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface HtmlCouponCardProps {
    code: string;
    title: string; // Corresponde à primeira linha do h3
    subtitle?: string; // Corresponde à segunda linha do h3 (descrição da oferta)
    expiresAt?: string | null; // Data de expiração
    logoUrl?: string; // URL da imagem do logo
    onUseNow: (code: string) => void; // Função para usar o cupom
    onDismiss: () => void; // Função para fechar/dispensar o card
}

export const HtmlCouponCard: React.FC<HtmlCouponCardProps> = ({
    code,
    title,
    subtitle, // Esta será a descrição da oferta
    expiresAt,
    logoUrl = 'https://i.postimg.cc/KvTqpZq9/uber.png', // Logo padrão
    onUseNow,
    onDismiss,
}) => {
    const [copyButtonText, setCopyButtonText] = useState("COPY CODE");
    const theme = useTheme();
    // Removido { opacity, translateY } = useFadeSlideIn(true); // Animação de entrada

    const copyToClipboard = async () => {
        try {
            await Clipboard.setStringAsync(code);
            setCopyButtonText("COPIED");
            Toast.show({
                type: 'info',
                text1: 'Código Copiado!',
                text2: 'Cole no seu aplicativo para usar.',
            });
            setTimeout(() => {
                setCopyButtonText("COPY CODE");
            }, 3000);
        } catch (e) {
            console.error('Falha ao copiar para a área de transferência', e);
            Toast.show({
                type: 'error',
                text1: 'Erro ao Copiar',
                text2: 'Tente novamente.',
            });
        }
    };

    const formattedExpiresAt = useMemo(() => {
        if (!expiresAt) return '';
        const date = new Date(expiresAt);
        // Formata para "20 Dec, 2021"
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    }, [expiresAt]);

    return (
        // Removido Animated.View wrapper
        <View style={styles.couponCard}>
            {/* Botão de fechar (X) */}
            <Pressable onPress={onDismiss} style={styles.closeButton} accessibilityLabel="Fechar">
                <Text style={[styles.closeButtonText, { color: '#fff' }]}>✕</Text>
            </Pressable>

            {/* Logo */}
            <Image source={{ uri: logoUrl }} style={styles.logo} />

            {/* Título e Subtítulo */}
            <Text style={styles.h3}>
                {title}
                {subtitle ? <Text style={styles.h3Subtitle}>{'\n'}{subtitle}</Text> : null}
            </Text>

            {/* Linha do código do cupom e botão de copiar */}
            <View style={styles.couponRow}>
                <Text style={styles.cpnCode}>{code}</Text>
                <TouchableOpacity onPress={copyToClipboard} style={styles.cpnBtn}>
                    <Text style={styles.cpnBtnText}>{copyButtonText}</Text>
                </TouchableOpacity>
            </View>

            {/* Data de validade */}
            <Text style={styles.p}>Valid Till: {formattedExpiresAt}</Text>

            {/* Botão "Usar agora" para manter a lógica */}
            <Button title="Usar agora" onPress={() => onUseNow(code)} style={styles.useNowButton} />

            {/* Círculos decorativos */}
            <View style={[styles.circle, styles.circle1, { backgroundColor: theme.background }]} />
            <View style={[styles.circle, styles.circle2, { backgroundColor: theme.background }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    // Removido container style
    couponCard: {
        backgroundColor: '#7158fe', // Cor inicial do gradiente do CSS original
        // Para um gradiente real, seria necessário uma biblioteca como 'react-native-linear-gradient'
        paddingVertical: 40,
        paddingHorizontal: 30,
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10, // Sombra para Android
        position: 'relative',
        width: '100%', // Ocupa toda a largura do pai (BottomSlideInCard)
        maxWidth: 400, // Largura máxima para o conteúdo do card
        alignItems: 'center', // Centraliza o conteúdo horizontalmente
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#fff', // Cor branca para o X, para visibilidade no fundo escuro
    },
    logo: {
        width: 80,
        height: 80, // Altura necessária para Image
        borderRadius: 8,
        marginBottom: 20,
    },
    h3: {
        fontSize: 22, // Ajustado para mobile
        fontWeight: 'bold',
        lineHeight: 28,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    h3Subtitle: {
        fontSize: 18, // Um pouco menor para o subtítulo
        fontWeight: 'normal',
        lineHeight: 24,
        color: '#fff',
    },
    p: {
        fontSize: 14, // Ajustado para mobile
        color: '#fff',
        marginBottom: 20, // Margem antes do botão "Usar agora"
    },
    couponRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 25,
    },
    cpnCode: {
        borderWidth: 1,
        borderColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopLeftRadius: 5, // Bordas arredondadas
        borderBottomLeftRadius: 5,
        borderRightWidth: 0, // Sem borda direita
        color: '#fff',
        backgroundColor: 'rgba(255,255,255,0.1)', // Fundo ligeiramente transparente
        overflow: 'hidden', // Garante que o border-radius seja aplicado corretamente
    },
    cpnBtn: {
        borderWidth: 1,
        borderColor: '#fff',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderTopRightRadius: 5, // Bordas arredondadas
        borderBottomRightRadius: 5,
    },
    cpnBtnText: {
        color: '#7158fe', // Cor do texto do botão
        fontWeight: 'bold',
    },
    circle: {
        width: 50,
        height: 50,
        borderRadius: 25, // Metade da largura/altura para um círculo perfeito
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -25 }], // Move para cima pela metade da altura
    },
    circle1: {
        left: -25, // Metade da largura para fora do card
    },
    circle2: {
        right: -25, // Metade da largura para fora do card
    },
    useNowButton: {
        marginTop: 10,
        width: '80%', // Largura responsiva para o botão
    },
});