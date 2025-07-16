
import { api } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

interface SecurityConfig {
  biometricEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  lastSecurityCheck: string;
}

interface SecurityAlert {
  id: string;
  type: 'suspicious_login' | 'new_device' | 'payment_anomaly' | 'account_change';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  resolved: boolean;
}

export class SecurityService {
  private static readonly SECURITY_CONFIG_KEY = 'security_config';
  private static readonly SECURE_TOKEN_KEY = 'secure_auth_token';

  static async initSecurity(): Promise<void> {
    try {
      // Verificar se o dispositivo suporta biometria
      const biometricAvailable = await LocalAuthentication.hasHardwareAsync();
      const biometricEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (biometricAvailable && biometricEnrolled) {
        await this.enableBiometric();
      }

      // Configurar timeout de sessão
      this.setupSessionTimeout();
    } catch (error) {
      console.error('Erro ao inicializar segurança:', error);
    }
  }

  static async enableBiometric(): Promise<boolean> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Use sua biometria para acessar o LimpeJá',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha'
      });

      if (result.success) {
        await this.updateSecurityConfig({ biometricEnabled: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao ativar biometria:', error);
      return false;
    }
  }

  static async authenticateWithBiometric(): Promise<boolean> {
    try {
      const config = await this.getSecurityConfig();
      if (!config.biometricEnabled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade',
        cancelLabel: 'Cancelar'
      });

      return result.success;
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      return false;
    }
  }

  static async secureStoreToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.SECURE_TOKEN_KEY, token);
    } catch (error) {
      console.error('Erro ao armazenar token seguro:', error);
    }
  }

  static async getSecureToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.SECURE_TOKEN_KEY);
    } catch (error) {
      console.error('Erro ao recuperar token seguro:', error);
      return null;
    }
  }

  static async validateSession(): Promise<boolean> {
    try {
      const response = await api.get('/auth/validate-session');
      return response.data.valid;
    } catch (error) {
      console.error('Sessão inválida:', error);
      return false;
    }
  }

  static async getSecurityAlerts(): Promise<SecurityAlert[]> {
    try {
      const response = await api.get('/security/alerts');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar alertas de segurança:', error);
      return [];
    }
  }

  static async reportSuspiciousActivity(activity: string, details: any): Promise<void> {
    try {
      await api.post('/security/report', {
        activity,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao reportar atividade suspeita:', error);
    }
  }

  private static async getSecurityConfig(): Promise<SecurityConfig> {
    try {
      const config = await AsyncStorage.getItem(this.SECURITY_CONFIG_KEY);
      return config ? JSON.parse(config) : {
        biometricEnabled: false,
        twoFactorEnabled: false,
        sessionTimeout: 30, // minutos
        lastSecurityCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro ao obter configuração de segurança:', error);
      return {
        biometricEnabled: false,
        twoFactorEnabled: false,
        sessionTimeout: 30,
        lastSecurityCheck: new Date().toISOString()
      };
    }
  }

  private static async updateSecurityConfig(updates: Partial<SecurityConfig>): Promise<void> {
    try {
      const current = await this.getSecurityConfig();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem(this.SECURITY_CONFIG_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Erro ao atualizar configuração de segurança:', error);
    }
  }

  private static setupSessionTimeout(): void {
    // Implementar timeout de sessão baseado em inatividade
    let timeoutId: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        this.handleSessionTimeout();
      }, 30 * 60 * 1000); // 30 minutos
    };

    // Resetar timeout em atividade do usuário
    resetTimeout();
  }

  private static async handleSessionTimeout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.SECURE_TOKEN_KEY);
      // Redirecionar para login
    } catch (error) {
      console.error('Erro ao lidar com timeout de sessão:', error);
    }
  }
}
