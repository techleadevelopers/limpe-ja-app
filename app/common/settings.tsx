import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants'; // Para pegar a versão do app
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Alert, // Para abrir URLs
    Animated, // Importar Animated para animações
    Easing,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAppContext } from '../../contexts/AppContext'; // Usando o AppContext

// Componente reutilizável para um item de configuração com switch
interface SettingSwitchItemProps {
    label: string;
    description?: string;
    // <--- CORREÇÃO: Tipo de ícone mais abrangente para incluir MaterialCommunityIcons
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor?: string;
    value: boolean;
    onValueChange: (newValue: boolean) => void;
    disabled?: boolean;
    delay: number; // Para animação escalonada
}

const AnimatedSettingSwitchItem: React.FC<SettingSwitchItemProps> = ({
    label,
    description,
    iconName,
    iconColor = "#495057",
    value,
    onValueChange,
    disabled = false,
    delay,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease), // Adicionado Easing
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease), // Adicionado Easing
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInItem = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const onPressOutItem = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    // Determine which icon component to render
    const IconComponent = iconName.includes('material') ? MaterialCommunityIcons : Ionicons;
    const resolvedIconName = iconName as any; // Cast to 'any' for flexibility with combined types

    return (
        <Animated.View style={[styles.settingItemWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity // Adicionado TouchableOpacity para feedback de toque no item inteiro
                onPress={() => onValueChange(!value)} // Passa o valor invertido para o switch
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={1}
                disabled={disabled}
            >
                <View style={styles.settingItem}>
                    {/* Corrected: Render the chosen icon component */}
                    <IconComponent name={resolvedIconName} size={24} color={disabled ? '#CED4DA' : iconColor} style={styles.settingIcon} />
                    <View style={styles.settingTextContainer}>
                        <Text style={[styles.settingLabel, disabled && styles.disabledText]}>{label}</Text>
                        {description && <Text style={[styles.settingDescription, disabled && styles.disabledText]}>{description}</Text>}
                    </View>
                    <Switch
                        trackColor={{ false: "#CED4DA", true: "#81b0ff" }}
                        thumbColor={value ? "#007AFF" : "#f4f3f4"}
                        ios_backgroundColor="#E9ECEF"
                        onValueChange={onValueChange}
                        value={value}
                        disabled={disabled}
                    />
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Componente reutilizável para um item de navegação/link
interface SettingNavigationItemProps {
    label: string;
    // <--- CORREÇÃO: Tipo de ícone mais abrangente para incluir MaterialCommunityIcons
    iconName: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
    iconColor?: string;
    onPress: () => void;
    delay: number; // Para animação escalonada
}
const AnimatedSettingNavigationItem: React.FC<SettingNavigationItemProps> = ({
    label,
    iconName,
    iconColor = "#495057",
    onPress,
    delay,
}) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease), // Adicionado Easing
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                easing: Easing.out(Easing.ease), // Adicionado Easing
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);

    const onPressInButton = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const onPressOutButton = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    // Determine which icon component to render
    const IconComponent = iconName.includes('material') ? MaterialCommunityIcons : Ionicons;
    const resolvedIconName = iconName as any; // Cast to 'any' for flexibility with combined types

    return (
        <Animated.View style={[styles.settingItemWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity
                style={styles.settingItem}
                onPress={onPress}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                activeOpacity={1}
            >
                {/* Corrected: Render the chosen icon component */}
                <IconComponent name={resolvedIconName} size={24} color={iconColor} style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                    <Text style={styles.settingLabel}>{label}</Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={22} color="#ADB5BD" />
            </TouchableOpacity>
        </Animated.View>
    );
};


export default function SettingsScreen() {
    const router = useRouter();
    const { settings, updateSettings, toggleTheme } = useAppContext();

    const notificationsEnabled = settings.notificationsEnabled;
    const darkModeEnabled = settings.themeMode === 'dark';

    // Animações
    const headerAnim = useRef(new Animated.Value(0)).current;
    const mainTitleAnim = useRef(new Animated.Value(0)).current;
    const sectionCardAnim1 = useRef(new Animated.Value(0)).current;
    const sectionCardAnim2 = useRef(new Animated.Value(0)).current;
    const sectionCardAnim3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animações de entrada
        Animated.stagger(200, [
            Animated.timing(headerAnim, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }), // Adicionado Easing
            Animated.timing(mainTitleAnim, { toValue: 1, duration: 600, delay: 100, easing: Easing.out(Easing.ease), useNativeDriver: true }), // Adicionado Easing
            Animated.timing(sectionCardAnim1, { toValue: 1, duration: 700, delay: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }), // Adicionado Easing
            Animated.timing(sectionCardAnim2, { toValue: 1, duration: 700, delay: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }), // Adicionado Easing
            Animated.timing(sectionCardAnim3, { toValue: 1, duration: 700, delay: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }), // Adicionado Easing
        ]).start();
    }, [headerAnim, mainTitleAnim, sectionCardAnim1, sectionCardAnim2, sectionCardAnim3]);


    const handleToggleNotifications = (value: boolean) => {
        updateSettings({ notificationsEnabled: value });
        // TODO: Integração real com serviço de push notifications aqui
        Alert.alert("Preferência Salva (Simulado)", `Notificações ${value ? 'ativadas' : 'desativadas'}.`);
    };

    const handleToggleDarkMode = () => {
        toggleTheme();
        Alert.alert("Preferência Salva (Simulado)", `Modo escuro ${!darkModeEnabled ? 'ativado' : 'desativado'}. (Reinicie o app para ver efeito completo se o tema não for dinâmico)`);
    };

    const appVersion = Constants.expoConfig?.version || 'N/A';
    // <--- CORREÇÃO: Converter appBuildNumber para string antes de usar no template literal
    const appBuildNumber = Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.buildNumber?.toString() || '' // Convert to string
        : Constants.expoConfig?.android?.versionCode?.toString() || ''; // Convert to string
    // <--- CORREÇÃO: Usar aspas na parte 'Build' para ser um literal de string
    const versionString = `Versão ${appVersion}${appBuildNumber ? ` (Build ${appBuildNumber})` : ''}`;

    const openURL = async (url: string) => {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
        } else {
            Alert.alert("Erro", `Não foi possível abrir este link: ${url}`);
        }
    };

    // Animação para o botão de voltar do header
    const headerBackButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const onPressInHeaderButton = () => { Animated.spring(headerBackButtonScaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
    const onPressOutHeaderButton = () => { Animated.spring(headerBackButtonScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };


    return (
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.headerBackButton, { transform: [{ scale: headerBackButtonScaleAnim }] }]}
                    onPressIn={onPressInHeaderButton}
                    onPressOut={onPressOutHeaderButton}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Configurações</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
                <Animated.Text style={[styles.mainSectionHeader, { opacity: mainTitleAnim, transform: [{ translateY: mainTitleAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    Ajuste as suas preferências
                </Animated.Text>

                <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim1, transform: [{ translateY: sectionCardAnim1.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Preferências Gerais</Text>
                    <AnimatedSettingSwitchItem
                        label="Ativar Notificações Push"
                        iconName="notifications-outline"
                        value={notificationsEnabled}
                        onValueChange={handleToggleNotifications}
                        delay={0}
                    />
                    <AnimatedSettingSwitchItem
                        label="Modo Escuro"
                        description={`Tema atual: ${darkModeEnabled ? 'Escuro' : 'Claro'}`}
                        iconName={darkModeEnabled ? "moon-outline" : "sunny-outline"}
                        value={darkModeEnabled}
                        onValueChange={handleToggleDarkMode}
                        delay={50}
                    />
                    <AnimatedSettingNavigationItem
                        label="Preferências de Notificação"
                        iconName="options-outline"
                        onPress={() => Alert.alert("WIP", "Tela de preferências de notificação detalhadas.")}
                        delay={100}
                    />
                </Animated.View>

                <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim2, transform: [{ translateY: sectionCardAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Conta</Text>
                    <AnimatedSettingNavigationItem
                        label="Gerenciar Meus Dados"
                        iconName="shield-checkmark-outline"
                        onPress={() => router.push('/client/profile/edit' as any)} // Rota real para editar perfil
                        delay={0}
                    />
                    <AnimatedSettingNavigationItem
                        label="Excluir Minha Conta"
                        iconName="trash-bin-outline"
                        iconColor="#D32F2F"
                        onPress={() => Alert.alert(
                            "Excluir Conta",
                            "Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.",
                            [
                                { text: "Cancelar", style: "cancel" },
                                { text: "Excluir", style: "destructive", onPress: () => console.log("TODO: Implementar exclusão de conta") }
                            ]
                        )}
                        delay={50}
                    />
                </Animated.View>

                <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim3, transform: [{ translateY: sectionCardAnim3.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <Text style={styles.sectionTitle}>Sobre o LimpeJá</Text>
                    <AnimatedSettingNavigationItem
                        label="Termos de Serviço"
                        iconName="document-text-outline"
                        onPress={() => openURL("https://seusite.com/termos")}
                        delay={0}
                    />
                    <AnimatedSettingNavigationItem
                        label="Política de Privacidade"
                        iconName="lock-closed-outline"
                        onPress={() => openURL("https://seusite.com/privacidade")}
                        delay={50}
                    />
                    <Animated.View style={[styles.infoItem, { opacity: sectionCardAnim3, transform: [{ translateY: sectionCardAnim3.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                        <Ionicons name="information-circle-outline" size={24} color="#495057" style={styles.settingIcon} />
                        <View style={styles.settingTextContainer}>
                            <Text style={styles.settingLabel}>Versão do Aplicativo</Text>
                            <Text style={styles.appVersionText}>{versionString}</Text>
                        </View>
                    </Animated.View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#F0F2F5',
        paddingVertical: 20,
    },
    scrollView: {
        flex: 1,
    },
    container: {
        paddingBottom: 40,
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#007AFF',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 50 : 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 0,
    },
    headerBackButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    headerActionIconPlaceholder: {
        width: 24,
        marginLeft: 15,
    },
    mainSectionHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1C3A5F',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        textAlign: 'center',
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
        overflow: 'hidden',
        ...Platform.select({
            ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
            android: { elevation: 0, borderWidth: 0.5, borderColor: '#E0E0E0' },
        }),
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6C757D',
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 8,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#DEE2E6',
        textTransform: 'uppercase',
    },
    settingItemWrapper: {
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E9ECEF',
    },
    settingIcon: {
        marginRight: 18,
    },
    settingTextContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 16,
        color: '#212529',
    },
    settingDescription: {
        fontSize: 13,
        color: '#6C757D',
        marginTop: 2,
    },
    disabledText: {
        color: '#ADB5BD',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E9ECEF',
    },
    appVersionText: {
        fontSize: 16,
        color: '#6C757D',
    },
});
