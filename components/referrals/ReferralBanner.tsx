// components/referrals/ReferralBanner.tsx
import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'; // Adicionado Pressable e useColorScheme
import Colors from '../../constants/Colors';
import Button from '../common/Button'; // Assuming you have a Button component

// Hook para acessar as cores do tema atual
function useTheme() {
    const scheme = useColorScheme?.() || 'light';
    const theme = (Colors as any)[scheme] || (Colors as any).light;
    return theme as typeof Colors.light;
}

interface ReferralBannerProps {
    code: string;
    rewardReferrer: string;
    rewardReferred: string;
    onShare: () => void;
    onHowItWorks: () => void;
    onDismiss?: () => void; // NOVO: Adiciona a prop onDismiss
    style?: any; // Para permitir estilos externos
}

export const ReferralBanner: React.FC<ReferralBannerProps> = ({
    code,
    rewardReferrer,
    rewardReferred,
    onShare,
    onHowItWorks,
    onDismiss, // Desestrutura onDismiss
    style,
}) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.cardBackground }, style]}>
            {onDismiss && ( // Renderiza o botão de fechar condicionalmente
                <Pressable onPress={onDismiss} style={styles.closeButton} accessibilityLabel="Fechar">
                    <Text style={[styles.closeButtonText, { color: theme.textMuted }]}>✕</Text>
                </Pressable>
            )}
            <Text style={[styles.title, { color: theme.text }]}>Indique e ganhe</Text>
            <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Você: {rewardReferrer} • Amigo: {rewardReferred}
            </Text>
            <View style={styles.buttonsContainer}>
                <View style={[styles.codeContainer, { backgroundColor: '#EEF6FF', borderColor: '#CCE4FF' }]}>
                    <Text style={[styles.codeText, { color: theme.primary }]}>{code}</Text>
                </View>
                <Button title="Compartilhar" onPress={onShare} style={styles.shareButton} />
            </View>
            <TouchableOpacity onPress={onHowItWorks} style={styles.howItWorksButton}>
                <Text style={[styles.howItWorksText, { color: theme.primary }]}>Como funciona</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 0,
        position: 'relative', // Necessário para o posicionamento absoluto do botão de fechar
        width: '100%', // Ocupa toda a largura do pai (BottomSlideInCard)
        maxWidth: 400, // Largura máxima para o conteúdo do card
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 15,
        zIndex: 1,
        padding: 5,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666', // Ajuste a cor conforme necessário
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    buttonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    codeContainer: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginRight: 10,
    },
    codeText: {
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    shareButton: {
        flex: 1, // Ocupa o espaço restante
    },
    howItWorksButton: {
        alignSelf: 'flex-start',
    },
    howItWorksText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});