// LimpeJaApp/app/services/locationService.ts
import * as Location from 'expo-location';

let locationWatchSubscription: Location.LocationSubscription | null = null;

/**
 * Garante que as permissões de localização em primeiro plano estejam concedidas.
 * @returns {Promise<boolean>} True se a permissão foi concedida, false caso contrário.
 */
export async function ensureLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.warn('Permissão de localização negada.');
    return false;
  }
  return true;
}

/**
 * Obtém a posição geográfica atual do dispositivo.
 * @returns {Promise<Location.LocationObjectCoords | null>} As coordenadas atuais ou null se houver erro/permissão negada.
 */
export async function getCurrentPosition(): Promise<Location.LocationObjectCoords | null> {
  const hasPermission = await ensureLocationPermission();
  if (!hasPermission) {
    return null;
  }
  try {
    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return location.coords;
  } catch (error) {
    console.error('Erro ao obter localização atual:', error);
    return null;
  }
}

/**
 * Inicia o monitoramento da posição geográfica do dispositivo.
 * @param {function} handler Função de callback que será chamada com as novas coordenadas.
 * @param {number} interval Intervalo mínimo em milissegundos entre as atualizações (padrão: 5000ms).
 * @returns {Promise<void>}
 */
export async function watchPosition(handler: (coords: Location.LocationObjectCoords) => void, interval: number = 5000): Promise<void> {
  const hasPermission = await ensureLocationPermission();
  if (!hasPermission) {
    return;
  }

  // Se já houver uma inscrição, pare-a primeiro para evitar duplicação
  if (locationWatchSubscription) {
    locationWatchSubscription.remove();
    locationWatchSubscription = null;
  }

  locationWatchSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: interval,
      distanceInterval: 1, // Atualiza a cada 1 metro de mudança de distância
    },
    (locationUpdate) => {
      handler(locationUpdate.coords);
    }
  );
  console.log(`Monitoramento de localização iniciado com intervalo de ${interval / 1000}s.`);
}

/**
 * Para o monitoramento da posição geográfica do dispositivo.
 */
export function stopWatchingPosition(): void {
  if (locationWatchSubscription) {
    locationWatchSubscription.remove();
    locationWatchSubscription = null;
    console.log('Monitoramento de localização parado.');
  }
}