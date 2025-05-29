// LimpeJaApp/app/(common)/settings.tsx
import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Switch, 
    Alert, 
    ScrollView, 
    TouchableOpacity,
    Platform,
    Linking, // Para abrir URLs
    Animated, // Importar Animated para animações
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAppContext } from '../../contexts/AppContext'; // Ajuste o caminho se necessário
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants'; // Para pegar a versão do app

// Componente reutilizável para um item de configuração com switch
interface SettingSwitchItemProps {
  label: string;
  description?: string;
  iconName: keyof typeof Ionicons.glyphMap;
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
        <Animated.View style={[styles.settingItemWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.settingItem}>
                <Ionicons name={iconName} size={24} color={disabled ? '#CED4DA' : iconColor} style={styles.settingIcon} />
                <View style={styles.settingTextContainer}>
                    <Text style={[styles.settingLabel, disabled && styles.disabledText]}>{label}</Text>
                    {description && <Text style={[styles.settingDescription, disabled && styles.disabledText]}>{description}</Text>}
                </View>
                <Switch
                    trackColor={{ false: "#CED4DA", true: "#81b0ff" }} // Cores podem vir do tema
                    thumbColor={value ? "#007AFF" : "#f4f3f4"}
                    ios_backgroundColor="#E9ECEF"
                    onValueChange={onValueChange}
                    value={value}
                    disabled={disabled}
                />
            </View>
        </Animated.View>
    );
};

// Componente reutilizável para um item de navegação/link
interface SettingNavigationItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
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

    const onPressInButton = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };
    const onPressOutButton = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };

    return (
        <Animated.View style={[styles.settingItemWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <TouchableOpacity 
                style={styles.settingItem} 
                onPress={onPress}
                onPressIn={onPressInButton}
                onPressOut={onPressOutButton}
                activeOpacity={1}
            >
                <Ionicons name={iconName} size={24} color={iconColor} style={styles.settingIcon} />
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
  const { settings, updateSettings, toggleTheme } = useAppContext(); // Usando o AppContext

  // As preferências agora vêm do AppContext
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
        Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(mainTitleAnim, { toValue: 1, duration: 600, delay: 100, useNativeDriver: true }),
        Animated.timing(sectionCardAnim1, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
        Animated.timing(sectionCardAnim2, { toValue: 1, duration: 700, delay: 300, useNativeDriver: true }),
        Animated.timing(sectionCardAnim3, { toValue: 1, duration: 700, delay: 400, useNativeDriver: true }),
    ]).start();
  }, [headerAnim, mainTitleAnim, sectionCardAnim1, sectionCardAnim2, sectionCardAnim3]);


  const handleToggleNotifications = (value: boolean) => {
    updateSettings({ notificationsEnabled: value });
    // TODO: Se 'value' for true, registrar para push notifications se ainda não estiver.
    // Se for false, talvez cancelar o registro do dispositivo.
    Alert.alert("Preferência Salva (Simulado)", `Notificações ${value ? 'ativadas' : 'desativadas'}.`);
  };

  const handleToggleDarkMode = () => {
    toggleTheme(); // toggleTheme no AppContext deve lidar com a persistência
    Alert.alert("Preferência Salva (Simulado)", `Modo escuro ${!darkModeEnabled ? 'ativado' : 'desativado'}. (Reinicie o app para ver efeito completo se o tema não for dinâmico)`);
  };

  const appVersion = Constants.expoConfig?.version || 'N/A';
  const appBuildNumber = Platform.OS === 'ios' 
    ? Constants.expoConfig?.ios?.buildNumber 
    : Constants.expoConfig?.android?.versionCode;
  const versionString = `Versão ${appVersion}${appBuildNumber ? ` (Build ${appBuildNumber})` : ''}`;

  const openURL = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", `Não foi possível abrir este link: ${url}`);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configurações</Text>
          <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
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
          {/* <AnimatedSettingNavigationItem
              label="Idioma"
              iconName="language-outline"
              onPress={() => Alert.alert("WIP", "Tela de seleção de idioma.")}
              delay={150}
          /> */}
        </Animated.View>

        <Animated.View style={[styles.sectionCard, { opacity: sectionCardAnim2, transform: [{ translateY: sectionCardAnim2.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <AnimatedSettingNavigationItem
              label="Gerenciar Meus Dados"
              iconName="shield-checkmark-outline"
              onPress={() => Alert.alert("WIP", "Tela de gerenciamento de dados.")}
              delay={0}
          />
          <AnimatedSettingNavigationItem
              label="Excluir Minha Conta"
              iconName="trash-bin-outline"
              iconColor="#D32F2F" // Cor de perigo
              onPress={() => Alert.alert(
                  "Excluir Conta", 
                  "Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.",
                  [
                      {text: "Cancelar", style: "cancel"},
                      {text: "Excluir", style: "destructive", onPress: () => console.log("TODO: Implementar exclusão de conta")}
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
              onPress={() => openURL("https://seusite.com/termos")} // Substitua pela sua URL real
              delay={0}
          />
          <AnimatedSettingNavigationItem
              label="Política de Privacidade"
              iconName="lock-closed-outline"
              onPress={() => openURL("https://seusite.com/privacidade")} // Substitua pela sua URL real
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
    backgroundColor: '#F0F2F5', // Fundo geral da tela
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingBottom: 40, // Espaço no final
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  headerBackButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: { // Para alinhar o título no centro durante o loading
    width: 24, // Largura do ícone
    marginLeft: 15,
  },
  mainSectionHeader: {
    fontSize: 26,
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
    marginTop: 10, // Espaço entre os cards e o header
    marginBottom: 10, // Espaço entre os cards
    overflow: 'hidden', // Para garantir que as bordas internas funcionem bem
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
      android: { elevation: 2, borderWidth:0.5, borderColor: '#E0E0E0' },
    }),
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C757D',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 8,
    backgroundColor: '#F8F9FA', // Um fundo leve para o título da seção
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DEE2E6',
    textTransform: 'uppercase',
  },
  settingItemWrapper: { // Wrapper para a animação de cada item
    // Estilos de sombra e borda serão aplicados ao sectionCard
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14, // Um pouco mais de padding vertical
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth, // Borda apenas no topo, exceto o primeiro item
    borderTopColor: '#E9ECEF',
  },
  settingIcon: {
    marginRight: 18, // Mais espaço para o ícone
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
  infoItem: { // Para o item de "Versão do App" que não é um TouchableOpacity
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
  },
  appVersionText: {
      fontSize: 16,
      color: '#6C757D', // Cor mais suave para informação
  },
});