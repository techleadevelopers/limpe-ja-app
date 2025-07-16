import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native'; // Importar Image e Dimensions
// MaterialCommunityIcons não é mais necessário se apenas `safe-icon.png` for usado.
// import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SecurityInfoSectionProps {
    successColor: string; // Embora a cor de sucesso ainda seja passada, o fundo será azul agora
}

// Constante para a largura da tela
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SecurityInfoSection({ successColor }: SecurityInfoSectionProps) {
    // Cores azuis com transparência equivalente ao verde suave anterior
    const blueBackgroundColor = 'rgba(196, 240, 255, 0.84)'; // Um azul médio-claro com 80% de opacidade
    const blueBorderColor = 'rgba(74, 144, 226, 0.3)'; // Um azul um pouco mais escuro para a borda, com transparência

    return (
        <View style={[styles.securitySection, {
            backgroundColor: blueBackgroundColor, // Aplicar o novo azul de fundo
            borderColor: blueBorderColor,        // Aplicar a nova cor de borda
            width: SCREEN_WIDTH * 0.85,           // AUMENTADO para 85% para ter um pouco mais de espaço
            alignSelf: 'center',                 // Centraliza horizontalmente
        }]}>
            {/* Substituir MaterialCommunityIcons por Image */}
            <Image
                source={require('../../../../assets/images/safe-icon.png')} // Caminho do ícone real
                style={styles.securityImage}
            />
            <Text style={styles.securityTextHeader}>Sua Segurança é Nossa Prioridade</Text>
            <Text style={styles.securityText}>
                Para sua tranquilidade, todos os nossos prestadores passam por um rigoroso processo de
                **verificação de antecedentes** e o serviço está coberto por **seguro**.
                Sua avaliação pós-serviço é fundamental para mantermos a qualidade e a segurança da comunidade.
                Em caso de qualquer problema ou disputa, entre em contato com nosso suporte imediatamente.
            </Text>
            <Text style={styles.securityTextSmall}>
                Seu agendamento foi registrado com segurança em nosso sistema.
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    securitySection: {
        marginTop: 20, // REDUZIDO: de 30 para 20
        padding: 15, // REDUZIDO: de 20 para 15
        borderRadius: 10, // REDUZIDO: de 12 para 10
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, // REDUZIDO: de 2 para 1
        shadowOpacity: 0.03, // REDUZIDO: de 0.05 para 0.03
        shadowRadius: 3, // REDUZIDO: de 5 para 3
        elevation: 2, // REDUZIDO: de 3 para 2
    },
    securityImage: { // Novo estilo para o ícone de imagem
        width: 120, // REDUZIDO: de 160 para 120
        height: 120, // REDUZIDO: de 160 para 120
        resizeMode: 'contain',
        marginBottom: 8, // REDUZIDO: de 10 para 8
    },
    securityTextHeader: {
        fontSize: 14, // REDUZIDO: de 16 para 14
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8, // REDUZIDO: de 10 para 8
        textAlign: 'center',
    },
    securityText: {
        fontSize: 11, // REDUZIDO: de 12 para 11
        color: '#555',
        textAlign: 'center',
        lineHeight: 16, // Aumentado um pouco para legibilidade com fonte menor (de 13 para 16)
        marginBottom: 10, // REDUZIDO: de 12 para 10
    },
    securityTextSmall: {
        fontSize: 10, // REDUZIDO: de 12 para 10
        color: '#777',
        textAlign: 'center',
        fontStyle: 'italic',
    },
});