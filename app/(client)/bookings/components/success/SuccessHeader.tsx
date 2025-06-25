// LimpeJaApp/app/(client)/bookings/components/success/SuccessHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// --- DEFINIÇÕES DE CORES (RECEBIDAS VIA PROPS) ---
// Em vez de definir localmente, as cores virão do componente pai (success.tsx)
interface SuccessHeaderProps {
    onBackPress: () => void;
    headerTickOpacity: Animated.Value;
    headerTickScale: Animated.Value;
    successColor: string;
    headerPrimaryColor: string; // Adicionado: Cor primária do header (para fundo)
    headerSecondaryColor: string; // Adicionado: Cor secundária do header (para gradiente, se for o caso)

    // As outras constantes de cor (WHITE, TEXT_DARK, etc.) não são necessárias diretamente neste header,
    // mas podem ser passadas se elementos internos as utilizarem.
    // Para simplificar, focaremos nas cores que afetam o header em si.
}

export default function SuccessHeader({
    onBackPress,
    headerTickOpacity,
    headerTickScale,
    successColor,
    headerPrimaryColor, // Usado para o fundo principal do header
    
    // headerSecondaryColor, // Não será usado diretamente para o fundo, mas pode ser se houver um gradiente complexo
}: SuccessHeaderProps) {
    // Definindo as cores diretamente das props para maior clareza aqui.
    // O `headerPrimaryColor` será o azul principal.
    const CHECK_ICON_COLOR = headerPrimaryColor; // O check será da cor principal do header

    return (
        // O headerContainer deve ser flexível para o restante do conteúdo da tela.
        // O fundo da tela principal (success.tsx) já é BACKGROUND_ALT.
        // O header aqui será mais um "overlay" ou uma seção superior.
        <View style={styles.headerContainer}>
            {/* Botão de voltar */}
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={headerPrimaryColor} /> {/* Ícone da cor principal */}
            </TouchableOpacity>

            <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: headerPrimaryColor }]}>Agendamento Confirmado!</Text>
                <Animated.View style={[
                    styles.headerTick,
                    { opacity: headerTickOpacity, transform: [{ scale: headerTickScale }] }
                ]}>
                    <Ionicons name="checkmark-circle" size={38} color={CHECK_ICON_COLOR} /> {/* Ícone grande de check */}
                </Animated.View>
            </View>
            
            {/* Um View vazio para balancear o layout */}
            <View style={styles.emptySpace} /> 
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        // Este container é o cabeçalho superior que flutua/se integra com o restante da tela.
        // Não terá background próprio (será transparente ou usará o background da tela pai).
        paddingTop: Platform.OS === 'android' ? 30 : 50, // Ajuste para status bar
        paddingBottom: 20, // Mais padding para "respiro"
        paddingHorizontal: 20, // Padding horizontal
        flexDirection: 'row', // Horizontal
        justifyContent: 'space-between', // Alinha conteúdo nas pontas
        alignItems: 'flex-start', // Alinha itens ao topo (para o botão de voltar)
        backgroundColor: 'transparent', // Fundo transparente
        // Removida qualquer sombra ou border-radius, pois a tela inteira terá um fundo consistente.
    },
    backButton: {
        // Posicionado absoluto para não interferir no fluxo principal do título
        position: 'absolute',
        top: Platform.OS === 'android' ? 30 : 50, // Alinha com o paddingTop do container
        left: 20, // Distância da esquerda
        zIndex: 10, // Garante que esteja acima de outros elementos
        padding: 5, // Área de clique
    },
    headerContent: {
        flex: 1, // Permite que ocupe o espaço restante
        flexDirection: 'column', // Título e tick em coluna
        alignItems: 'center', // Centraliza conteúdo horizontalmente
        justifyContent: 'center', // Centraliza conteúdo verticalmente
        paddingTop: 10, // Um pequeno ajuste para alinhar
    },
    headerTitle: {
        fontSize: 22, // Um pouco maior
        fontWeight: 'bold',
        textAlign: 'center', // Garante que o texto fique centralizado
        marginBottom: 10, // Espaço entre o título e o tick
    },
    headerTick: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent', // O tick é apenas o ícone, não um fundo separado
    },
    checkIconImage: { // Este estilo não será mais usado, pois estamos usando Ionicons diretamente
        width: 38, // Tamanho do ícone para o Ionicons
        height: 38,
        resizeMode: 'contain',
        // tintColor é aplicado via prop para Ionicons
    },
    emptySpace: {
        width: 24, // Espaço para balancear, se o botão de voltar não for visível em algumas telas
    }
});