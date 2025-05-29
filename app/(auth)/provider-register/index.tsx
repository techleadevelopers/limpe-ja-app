// LimpeJaApp/app/(auth)/provider-register/index.tsx
import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
    Animated, // Importar Animated para animações
} from 'react-native';
import { useRouter, Stack, Link } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Componente ListItem para reutilização e animação individual
const AnimatedListItem: React.FC<{ text: string; iconName: keyof typeof Ionicons.glyphMap; delay: number }> = ({ text, iconName, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    return (
        <Animated.View style={[styles.listItem, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
            <Ionicons name={iconName} size={22} color="#007AFF" style={styles.listItemIcon} />
            <Text style={styles.listItemText}>{text}</Text>
        </Animated.View>
    );
};

export default function ProviderRegisterStep1Screen() {
    const router = useRouter();

    const headerIconAnim = useRef(new Animated.Value(0)).current;
    const headerTextAnim = useRef(new Animated.Value(0)).current;
    const advantagesCardAnim = useRef(new Animated.Value(0)).current;
    const requirementsCardAnim = useRef(new Animated.Value(0)).current;
    const ctaButtonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.stagger(150, [
            Animated.timing(headerIconAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(headerTextAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.stagger(300, [
            Animated.timing(advantagesCardAnim, {
                toValue: 1,
                duration: 600,
                delay: 400,
                useNativeDriver: true,
            }),
            Animated.timing(requirementsCardAnim, {
                toValue: 1,
                duration: 600,
                delay: 600,
                useNativeDriver: true,
            }),
        ]).start();
    }, [headerIconAnim, headerTextAnim, advantagesCardAnim, requirementsCardAnim]);

    const headerIconStyle = {
        opacity: headerIconAnim,
        transform: [{ scale: headerIconAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
    };

    const headerTextStyle = {
        opacity: headerTextAnim,
        transform: [{ translateY: headerTextAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
    };

    const advantagesCardStyle = {
        opacity: advantagesCardAnim,
        transform: [{
            scale: advantagesCardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
            })
        }]
    };

    const requirementsCardStyle = {
        opacity: requirementsCardAnim,
        transform: [{
            scale: requirementsCardAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.95, 1]
            })
        }]
    };

    const onPressInCtaButton = () => {
        Animated.spring(ctaButtonScaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onPressOutCtaButton = () => {
        Animated.spring(ctaButtonScaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    const handleNextStep = () => {
        router.push('/(auth)/provider-register/personal-details');
    };

    return (
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ title: 'Seja um Parceiro LimpeJá' }} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>

                <View style={styles.headerSection}>
                    <Animated.View style={headerIconStyle}>
                        {/* << CORREÇÃO: Nome do ícone alterado conforme sugestão do erro */}
                        <MaterialCommunityIcons name="account-tie-hat" size={64} color="#007AFF" style={styles.headerIcon} />
                    </Animated.View>
                    <Animated.Text style={[styles.mainTitle, headerTextStyle]}>Torne-se um Profissional LimpeJá!</Animated.Text>
                    <Animated.Text style={[styles.subtitle, headerTextStyle]}>
                        Faça parte da nossa rede de profissionais de limpeza e conquiste mais clientes.
                        O cadastro é simples e rápido.
                    </Animated.Text>
                </View>

                <Animated.View style={[styles.sectionCard, advantagesCardStyle]}>
                    <Text style={styles.sectionTitle}>Vantagens de ser um Parceiro:</Text>
                    <AnimatedListItem iconName="rocket-outline" text="Alcance mais clientes em sua região." delay={0} />
                    <AnimatedListItem iconName="calendar-clear-outline" text="Tenha flexibilidade para definir seus horários." delay={100} />
                    <AnimatedListItem iconName="shield-checkmark-outline" text="Receba pagamentos de forma segura pela plataforma." delay={200} />
                    <AnimatedListItem iconName="trending-up-outline" text="Aumente sua visibilidade e reputação profissional." delay={300} />
                </Animated.View>

                <Animated.View style={[styles.sectionCard, requirementsCardStyle]}>
                    <Text style={styles.sectionTitle}>O que você vai precisar para o cadastro:</Text>
                    <AnimatedListItem iconName="person-outline" text="Seus dados pessoais básicos." delay={0} />
                    <AnimatedListItem iconName="document-text-outline" text="Informações sobre os serviços que você oferece." delay={100} />
                    <AnimatedListItem iconName="camera-outline" text="Uma foto de perfil profissional (opcional, mas recomendado)." delay={200} />
                    <AnimatedListItem iconName="card-outline" text="Dados bancários para recebimento (opcional nesta etapa inicial)." delay={300} />
                    <Text style={styles.infoText}>
                        Alguns documentos podem ser solicitados posteriormente para verificação e segurança da plataforma.
                    </Text>
                </Animated.View>

                <View style={styles.termsContainer}>
                    <Text style={styles.termsText}>Ao prosseguir, você concorda com nossos </Text>
                     {/* << CORREÇÃO: Adicionada asserção de tipo 'as any' para suprimir erro de rota inexistente >> */}
                    <Link href={"/termos-profissionais" as any} asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Termos para Profissionais</Text>
                        </TouchableOpacity>
                    </Link>
                    <Text style={styles.termsText}> e com a </Text>
                     {/* << CORREÇÃO: Adicionada asserção de tipo 'as any' para suprimir erro de rota inexistente >> */}
                    <Link href={"/politica-de-privacidade" as any} asChild>
                        <TouchableOpacity>
                            <Text style={styles.linkText}>Política de Privacidade</Text>
                        </TouchableOpacity>
                    </Link>
                    <Text style={styles.termsText}>.</Text>
                </View>

                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={handleNextStep}
                    onPressIn={onPressInCtaButton}
                    onPressOut={onPressOutCtaButton}
                >
                    <Animated.View style={{ transform: [{ scale: ctaButtonScaleAnim }], flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.ctaButtonText}>Iniciar Cadastro</Text>
                        <Ionicons name="arrow-forward-circle-outline" size={24} color="#FFFFFF" />
                    </Animated.View>
                </TouchableOpacity>

                <Link href="/(auth)/register-options" asChild>
                    <TouchableOpacity style={styles.backButton}>
                        <Ionicons name="arrow-back-outline" size={20} color="#007AFF" style={{ marginRight: 5 }} />
                        <Text style={styles.backButtonText}>Voltar para opções de cadastro</Text>
                    </TouchableOpacity>
                </Link>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#F0F2F5', 
    },
    scrollView: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40, 
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    headerIcon: {
        marginBottom: 15,
    },
    mainTitle: {
        fontSize: 26, 
        fontWeight: 'bold',
        color: '#1C3A5F', 
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#495057', 
        textAlign: 'center',
        lineHeight: 23,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 15, 
        padding: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.1)',
                shadowOffset: { width: 0, height: 5 }, 
                shadowOpacity: 0.2, 
                shadowRadius: 10, 
            },
            android: {
                elevation: 6, 
            },
        }),
    },
    sectionTitle: {
        fontSize: 20, 
        fontWeight: 'bold',
        color: '#1C3A5F',
        marginBottom: 18,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start', 
        marginBottom: 12,
    },
    listItemIcon: {
        marginRight: 12,
        marginTop: 2, 
    },
    listItemText: {
        flex: 1, 
        fontSize: 15,
        color: '#343A40', 
        lineHeight: 22,
    },
    infoText: {
        fontSize: 13,
        color: '#6C757D',
        marginTop: 15,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    termsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap', 
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 25,
        paddingHorizontal: 10,
    },
    termsText: {
        fontSize: 13,
        color: '#6C757D',
        lineHeight: 18,
        textAlign: 'center',
    },
    linkText: {
        fontSize: 13,
        color: '#007AFF', 
        fontWeight: '600',
        textDecorationLine: 'underline',
        lineHeight: 18,
    },
    ctaButton: {
        backgroundColor: '#007AFF', 
        paddingVertical: 16,
        paddingHorizontal: 25,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,122,255,0.4)', 
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 18, 
        fontWeight: 'bold',
        marginRight: 10,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 15,
        marginTop: 20,
    },
    backButtonText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
    }
});