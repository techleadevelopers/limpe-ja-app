// LimpeJaApp/src/contexts/AppContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Importe seu tipo de tema de constants/theme.ts se tiver
// import { AppTheme, lightTheme, darkTheme } from '../constants/theme';

interface AppSettings {
  themeMode: 'light' | 'dark';
  notificationsEnabled: boolean;
  // Outras configurações globais do app
}

interface AppContextData {
  settings: AppSettings;
  isLoadingSettings: boolean;
  toggleTheme: () => void;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>; // Mantido como async por causa do saveSettings
}

const defaultSettings: AppSettings = {
  themeMode: 'light',
  notificationsEnabled: true,
};

export const AppContext = createContext<AppContextData>({} as AppContextData);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedSettings = await AsyncStorage.getItem('@LimpeJa:appSettings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Validação extra para garantir que os dados do storage são válidos
          if (
            parsedSettings &&
            (parsedSettings.themeMode === 'light' || parsedSettings.themeMode === 'dark') &&
            typeof parsedSettings.notificationsEnabled === 'boolean'
          ) {
            setSettings(parsedSettings as AppSettings);
          } else {
            // Se os dados armazenados estiverem malformados, usa o padrão e salva
            console.warn("AppContext: Malformed settings found in storage, using defaults.");
            setSettings(defaultSettings);
            await saveSettings(defaultSettings);
          }
        } else {
          // Se não houver nada no storage, salva os padrões
          await saveSettings(defaultSettings);
        }
      } catch (error) {
        console.error("AppContext: Failed to load settings from storage", error);
        setSettings(defaultSettings); // Fallback em caso de erro
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, []);

  // Garante que o newSettingsToSave seja do tipo AppSettings
  const saveSettings = async (newSettingsToSave: AppSettings) => {
    try {
      await AsyncStorage.setItem('@LimpeJa:appSettings', JSON.stringify(newSettingsToSave));
    } catch (error) {
      console.error("AppContext: Failed to save settings to storage", error);
    }
  };

  const toggleTheme = () => {
    setSettings((prevSettings): AppSettings => { // Tipo de retorno explícito para a função de atualização
      const newThemeMode = prevSettings.themeMode === 'light' ? 'dark' : 'light';
      // Tipagem explícita para newSettings garante a conformidade
      const newSettings: AppSettings = { ...prevSettings, themeMode: newThemeMode };
      saveSettings(newSettings); // saveSettings espera AppSettings
      return newSettings;
    });
  };

  const updateSettings = async (newPartialSettings: Partial<AppSettings>) => {
    setSettings((prevSettings): AppSettings => { // Tipo de retorno explícito
      // Tipagem explícita para updatedSettings
      const updatedSettings: AppSettings = { ...prevSettings, ...newPartialSettings };
      saveSettings(updatedSettings); // saveSettings espera AppSettings
      return updatedSettings;
    });
  };

  // const currentTheme = settings.themeMode === 'light' ? lightTheme : darkTheme; // Se você usar um objeto de tema

  return (
    <AppContext.Provider value={{ settings, isLoadingSettings, toggleTheme, updateSettings }}>
      {/* Se você usar react-navigation ThemeProvider ou similar: */}
      {/* <NavigationContainer theme={currentTheme}> */}
      {/* <PaperProvider theme={currentTheme}> // Exemplo com react-native-paper */}
            {children}
      {/* </PaperProvider> */}
      {/* </NavigationContainer> */}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};