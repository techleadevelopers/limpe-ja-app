// LimpeJaApp/app/(common)/settings.tsx
import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Switch, 
    Alert, 
    ScrollView, 
    TouchableOpacity,
    Platform,
    Linking // Para abrir URLs
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
}

const SettingSwitchItem: React.FC<SettingSwitchItemProps> = ({
  label,
  description,
  iconName,
  iconColor = "#495057",
  value,
  onValueChange,
  disabled = false,
}) => (
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
);

// Componente reutilizável para um item de navegação/link
interface SettingNavigationItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onPress: () => void;
}
const SettingNavigationItem: React.FC<SettingNavigationItemProps> = ({
    label,
    iconName,
    iconColor = "#495057",
    onPress,
}) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
        <Ionicons name={iconName} size={24} color={iconColor} style={styles.settingIcon} />
        <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>{label}</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={22} color="#ADB5BD" />
    </TouchableOpacity>
);


export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings, toggleTheme } = useAppContext(); // Usando o AppContext

  // As preferências agora vêm do AppContext
  const notificationsEnabled = settings.notificationsEnabled;
  const darkModeEnabled = settings.themeMode === 'dark';

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
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Configurações' }} />
      
      <Text style={styles.headerTitle}>Configurações</Text>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Preferências Gerais</Text>
        <SettingSwitchItem
          label="Ativar Notificações Push"
          iconName="notifications-outline"
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
        />
        <SettingSwitchItem
          label="Modo Escuro"
          description={`Tema atual: ${darkModeEnabled ? 'Escuro' : 'Claro'}`}
          iconName={darkModeEnabled ? "moon-outline" : "sunny-outline"}
          value={darkModeEnabled}
          onValueChange={handleToggleDarkMode}
        />
        <SettingNavigationItem
            label="Preferências de Notificação"
            iconName="options-outline"
            onPress={() => Alert.alert("WIP", "Tela de preferências de notificação detalhadas.")}
        />
        {/* <SettingNavigationItem
            label="Idioma"
            iconName="language-outline"
            onPress={() => Alert.alert("WIP", "Tela de seleção de idioma.")}
        /> */}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Conta</Text>
        <SettingNavigationItem
            label="Gerenciar Meus Dados"
            iconName="shield-checkmark-outline"
            onPress={() => Alert.alert("WIP", "Tela de gerenciamento de dados.")}
        />
        <SettingNavigationItem
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
        />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Sobre o LimpeJá</Text>
        <SettingNavigationItem
            label="Termos de Serviço"
            iconName="document-text-outline"
            onPress={() => openURL("https://seusite.com/termos")} // Substitua pela sua URL real
        />
        <SettingNavigationItem
            label="Política de Privacidade"
            iconName="lock-closed-outline"
            onPress={() => openURL("https://seusite.com/privacidade")} // Substitua pela sua URL real
        />
        <View style={styles.infoItem}>
            <Ionicons name="information-circle-outline" size={24} color="#495057" style={styles.settingIcon} />
            <View style={styles.settingTextContainer}>
                <Text style={styles.settingLabel}>Versão do Aplicativo</Text>
                <Text style={styles.appVersionText}>{versionString}</Text>
            </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral da tela
  },
  container: {
    paddingBottom: 40, // Espaço no final
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1C3A5F',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10, // Menos espaço se não houver subtítulo
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 10, // Espaço entre os cards e o header
    marginBottom: 10, // Espaço entre os cards
    overflow: 'hidden', // Para garantir que as bordas internas funcionem bem
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5 },
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
  // Removido saveButtonContainer pois não há mais botão de salvar explícito
});