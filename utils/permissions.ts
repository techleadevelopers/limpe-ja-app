// LimpeJaApp/src/utils/permissions.ts
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
// import * as Notifications from 'expo-notifications'; // Se for usar notificações push

export const requestCameraPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    // const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Para salvar/selecionar da galeria
    if (cameraStatus !== 'granted' /*&& mediaLibraryStatus !== 'granted'*/) {
      alert('Desculpe, precisamos de permissão para acessar a câmera (e galeria) para isso funcionar!');
      return false;
    }
    return true;
  }
  return false; // Permissões de câmera não são tipicamente gerenciadas assim na web
};

export const requestMediaLibraryPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Desculpe, precisamos de permissão para acessar sua galeria de mídia!');
      return false;
    }
    return true;
  }
  return false;
};


export const requestLocationPermissions = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permissão para acessar a localização foi negada.');
    return false;
  }
  return true;
};

export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) {
    return null;
  }
  try {
    const location = await Location.getCurrentPositionAsync({});
    return location;
  } catch (error) {
    console.error("Error getting current location:", error);
    alert("Não foi possível obter a localização atual.");
    return null;
  }
};

// export const requestNotificationPermissions = async (): Promise<boolean> => {
//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
//   if (existingStatus !== 'granted') {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }
//   if (finalStatus !== 'granted') {
//     alert('Falha ao obter token push para notificação push!');
//     return false;
//   }
//   return true;
// };

// Adicione mais funções de permissão conforme necessário