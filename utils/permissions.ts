// LimpeJaApp/src/utils/permissions.ts
import { Platform, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications'; // Importar Notifications

/**
 * Abre as configurações do aplicativo para o usuário.
 * Útil quando as permissões são negadas e o usuário precisa habilitá-las manualmente.
 */
const openAppSettings = () => {
  if (Platform.OS === 'ios') {
    Linking.openURL('app-settings:');
  } else if (Platform.OS === 'android') {
    Linking.openSettings();
  }
};

/**
 * Exibe um alerta padrão para permissões negadas, com opção de ir para as configurações.
 * @param {string} permissionName - O nome da permissão (ex: "Câmera", "Localização").
 */
const showPermissionDeniedAlert = (permissionName: string) => {
  Alert.alert(
    `Permissão de ${permissionName} Necessária`,
    `Para usar esta funcionalidade, precisamos da sua permissão para acessar a ${permissionName}. Por favor, habilite-a nas configurações do aplicativo.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Abrir Configurações', onPress: openAppSettings },
    ],
    { cancelable: false }
  );
};

/**
 * Verifica o status atual da permissão da câmera.
 * @returns {Promise<ImagePicker.PermissionStatus>} O status da permissão.
 */
export const checkCameraPermissions = async (): Promise<ImagePicker.PermissionStatus> => {
  // << CORREÇÃO: Usar o valor correto do enum para web >>
  if (Platform.OS === 'web') return ImagePicker.PermissionStatus.GRANTED;
  const { status } = await ImagePicker.getCameraPermissionsAsync();
  return status;
};

/**
 * Solicita permissão para acessar a câmera.
 * @returns {Promise<boolean>} `true` se a permissão for concedida, `false` caso contrário.
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;

  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== ImagePicker.PermissionStatus.GRANTED) {
    showPermissionDeniedAlert('Câmera');
    return false;
  }
  return true;
};

/**
 * Verifica o status atual da permissão da biblioteca de mídia (galeria).
 * @returns {Promise<ImagePicker.PermissionStatus>} O status da permissão.
 */
export const checkMediaLibraryPermissions = async (): Promise<ImagePicker.PermissionStatus> => {
  // << CORREÇÃO: Usar o valor correto do enum para web >>
  if (Platform.OS === 'web') return ImagePicker.PermissionStatus.GRANTED;
  const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
  return status;
};

/**
 * Solicita permissão para acessar a biblioteca de mídia (galeria).
 * @returns {Promise<boolean>} `true` se a permissão for concedida, `false` caso contrário.
 */
export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;

  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== ImagePicker.PermissionStatus.GRANTED) {
    showPermissionDeniedAlert('Galeria de Mídia');
    return false;
  }
  return true;
};

/**
 * Verifica o status atual da permissão de localização (foreground).
 * @returns {Promise<Location.PermissionStatus>} O status da permissão.
 */
export const checkLocationPermissions = async (): Promise<Location.PermissionStatus> => {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
};

/**
 * Solicita permissão para acessar a localização (foreground).
 * @returns {Promise<boolean>} `true` se a permissão for concedida, `false` caso contrário.
 */
export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    showPermissionDeniedAlert('Localização');
    return false;
  }
  return true;
};

/**
 * Obtém a localização atual do dispositivo.
 * Requer permissão de localização (foreground).
 * @returns {Promise<Location.LocationObject | null>} O objeto de localização ou `null` se a permissão for negada ou ocorrer um erro.
 */
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    return null;
  }
  try {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return location;
  } catch (error) {
    console.error("Erro ao obter a localização atual:", error);
    Alert.alert("Erro de Localização", "Não foi possível obter sua localização atual. Verifique se o GPS está ativado.");
    return null;
  }
};

/**
 * Verifica o status atual da permissão de notificações.
 * @returns {Promise<Notifications.PermissionStatus>} O status da permissão.
 */
export const checkNotificationPermissions = async (): Promise<Notifications.PermissionStatus> => {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
};

/**
 * Solicita permissão para enviar notificações.
 * @returns {Promise<boolean>} `true` se a permissão for concedida, `false` caso contrário.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== Notifications.PermissionStatus.GRANTED) {
    Alert.alert(
      "Permissão de Notificação Necessária",
      "Para receber atualizações importantes sobre seus serviços, precisamos da sua permissão para enviar notificações. Por favor, habilite-as nas configurações do aplicativo.",
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Configurações', onPress: openAppSettings },
      ],
      { cancelable: false }
    );
    return false;
  }
  return true;
};

// Adicione mais funções de permissão conforme necessário, por exemplo:
// export const requestBackgroundLocationPermissions = async (): Promise<boolean> => { /* ... */ };
// export const requestContactsPermissions = async (): Promise<boolean> => { /* ... */ };