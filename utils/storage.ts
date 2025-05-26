// LimpeJaApp/src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_PREFIX = '@LimpeJa:';

export const storeData = async <T>(key: string, value: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(`${APP_PREFIX}${key}`, jsonValue);
  } catch (e) {
    console.error('Error storing data in AsyncStorage', key, e);
    // Tratar erro de gravação
  }
};

export const getData = async <T>(key: string): Promise<T | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(`${APP_PREFIX}${key}`);
    return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
  } catch (e) {
    console.error('Error retrieving data from AsyncStorage', key, e);
    // Tratar erro de leitura
    return null;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${APP_PREFIX}${key}`);
  } catch (e) {
    console.error('Error removing data from AsyncStorage', key, e);
    // Tratar erro de remoção
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    // Cuidado: Isso remove TUDO do AsyncStorage prefixado
    // Se você tiver chaves não prefixadas importantes, elas não serão afetadas.
    // Para remover TUDO do app, você precisaria de uma lógica mais específica ou AsyncStorage.clear()
    const keys = await AsyncStorage.getAllKeys();
    const appKeys = keys.filter(key => key.startsWith(APP_PREFIX));
    await AsyncStorage.multiRemove(appKeys);
    console.log('All app-specific data cleared from AsyncStorage.');
  } catch (e) {
    console.error('Error clearing all app data from AsyncStorage', e);
  }
};

// SecureStore é geralmente usado para tokens de autenticação, como já feito no AuthContext.
// Este AsyncStorage é para dados menos sensíveis como preferências do usuário, cache, etc.