// LimpeJaApp/app/(client)/bookings/components/success/SuccessHeader.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from 'react-native'; // Importar Image
// LinearGradient não é mais necessário para fundo transparente
// import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; // Mantido caso queira usar Ionicons para o botão de voltar

interface SuccessHeaderProps {
    onBackPress: () => void;
    headerTickOpacity: Animated.Value;
    headerTickScale: Animated.Value;
    // headerPrimaryColor e headerSecondaryColor não são mais usados para o gradiente
    // successColor, se usado para o tick, pode ser mantido ou alterado diretamente
    successColor: string; // Mantido, pode ser usado para a cor do check (se aplicável)
}

export default function SuccessHeader({
    onBackPress,
    headerTickOpacity,
    headerTickScale,
    // headerPrimaryColor, // Removido das props, não mais usado
    // headerSecondaryColor, // Removido das props, não mais usado
    successColor,
}: SuccessHeaderProps) {
    // Definindo a cor azul escura diretamente
    const darkBlueColor = '#2A72E7'; // Um azul escuro usado em outras partes do seu app

    return (
        <View style={styles.headerContainerTransparent}> {/* Novo estilo para o container transparente */}
            {/* Botão de voltar (se necessário) - mantido para estrutura completa, mas a imagem não o mostra */}
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
                 <Ionicons name="arrow-back" size={24} color={darkBlueColor} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: darkBlueColor }]}>Agendamento Confirmado!</Text> {/* Texto em azul escuro */}
                <Animated.View style={[
                    styles.headerTick,
                    { opacity: headerTickOpacity, transform: [{ scale: headerTickScale }] }
                ]}>
                    {/* Para que a imagem do check seja azul escura, você precisa ter uma imagem em PNG/SVG que permita isso ou um SVG com a cor já definida */}
                    {/* Se check.png for um ícone que aceita tintColor, use: */}
                    <Image
                        source={require('../../../../../assets/images/icons/check.png')} // Caminho real do ícone
                        style={[styles.checkIconImage, { tintColor: darkBlueColor }]} // Aplicando tintColor para a imagem
                    />
                    {/* Se não aceitar tintColor e for um PNG preto/branco, você pode considerar usar Ionicons com a cor: */}
                    {/* <Ionicons name="checkmark-circle" size={28} color={darkBlueColor} style={styles.checkIconImage} /> */}
                </Animated.View>
            </View>
            {/* Um View vazio para balancear o layout se o botão de voltar não for exibido */}
            <View style={styles.emptySpace} /> 
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainerTransparent: { // Novo estilo para o container raiz
        paddingTop: Platform.OS === 'android' ? 20 : 30,
        paddingBottom: 1,
        paddingHorizontal: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 0,
        backgroundColor: 'transparent', // Fundo transparente
        // Removido borderBottomLeftRadius e borderBottomRightRadius
        // Removida qualquer sombra, pois o fundo é transparente
    },
    backButton: { // Estilo para o botão de voltar
        padding: 5,
        position: 'absolute', // Para posicionar no canto superior esquerdo
        top: Platform.OS === 'android' ? 20 : 30, // Ajustar conforme o padding superior
        left: 20,
        zIndex: 10,
    },
    headerTitleContainer: {
        flex: 1, // Permite que o container de título ocupe o espaço disponível
        alignItems: 'center', // Centraliza o conteúdo horizontalmente
        flexDirection: 'row', // Para colocar título e tick na mesma linha
        justifyContent: 'center', // Centraliza o texto e o tick
        paddingTop: Platform.OS === 'ios' ? 20 : 10, // Ajuste para alinhar com o botão de voltar
        left: 25,
    },
    headerTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        // A cor será sobrescrita pela prop, mas manter um padrão aqui é bom
        color: '#FFFFFF', 
        letterSpacing: 0.8,
        bottom: 10, // Mantido do seu código original
    },
    headerTick: {
        marginLeft: 0, // Ajuste do espaçamento, agora controlado pela imagem
        // Removido estilos de sombra para combinar com o fundo transparente
    },
    checkIconImage: { // Estilo para a imagem do ícone de check
        width: 28,
        height: 28,
        resizeMode: 'contain',
        bottom: 10, // Mantido do seu código original
        marginLeft: 10, // Espaçamento entre o título e o ícone
        // tintColor será aplicado via prop inline para mudar a cor da imagem
    },
    emptySpace: {
        width: 24, // Para simular o espaço do botão de voltar, se ele não for visível
    }
});