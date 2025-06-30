// LimpeJaApp/app/(client)/bookings/components/success/SuccessHeader.tsx
import React from 'react';
import { View, StyleSheet, Platform, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons'; // REMOVIDO: Ionicons não é mais necessário

// --- DEFINIÇÕES DE CORES (RECEBIDAS VIA PROPS) ---
// As cores não serão mais usadas para o texto ou ícone de check,
// mas podem ser mantidas se forem usadas em outros lugares no futuro
interface SuccessHeaderProps {
    // onBackPress: () => void; // REMOVIDO: Não há mais botão de voltar
    // headerTickOpacity: Animated.Value; // REMOVIDO: Não há mais ícone de check animado
    // headerTickScale: Animated.Value; // REMOVIDO: Não há mais ícone de check animado
    successColor: string; // Pode ser mantido, mas não é usado neste componente diretamente
    headerPrimaryColor: string; // Pode ser mantido, mas não é usado neste componente diretamente
    headerSecondaryColor: string; // Pode ser mantido, mas não é usado neste componente diretamente
}

export default function SuccessHeader({
    // onBackPress, // REMOVIDO
    // headerTickOpacity, // REMOVIDO
    // headerTickScale, // REMOVIDO
    // successColor, // Não usado diretamente no novo layout
    // headerPrimaryColor, // Não usado diretamente no novo layout
    // headerSecondaryColor, // Não usado diretamente no novo layout
}: SuccessHeaderProps) {
    // const CHECK_ICON_COLOR = headerPrimaryColor; // REMOVIDO: Ícone de check removido

    return (
        <View style={styles.headerContainer}>
            {/* REMOVIDO: Botão de voltar */}
            {/* REMOVIDO: View com headerContent, headerTitle e headerTick */}

            {/* NOVO: Apenas a imagem do logo como header */}
            <Image
                source={require('../../../../../assets/images/logo2.png')} // Caminho para a imagem do logo
                style={styles.logoImage}
                resizeMode="contain" // Garante que a imagem se ajuste sem cortar
            />
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        paddingTop: Platform.OS === 'android' ? 40 : 10, // Ajuste para status bar
        paddingBottom: 10,
        paddingHorizontal: 20,
        flexDirection: 'row', // Para centralizar o logo
        justifyContent: 'center', // Centraliza o logo horizontalmente
        alignItems: 'center', // Centraliza o logo verticalmente
        backgroundColor: 'transparent', // Fundo transparente
    },
    // REMOVIDO: backButton
    // REMOVIDO: headerContent
    // REMOVIDO: headerTitle
    // REMOVIDO: headerTick
    // REMOVIDO: checkIconImage
    // REMOVIDO: emptySpace
    logoImage: {
        width: 150, // Ajuste o tamanho conforme necessário para o seu logo
        height: 50, // Ajuste a altura conforme necessário
        top: 0,
        right: 5,
    },
});
