// app/services/notificationUIService.ts
import RNToast from 'react-native-toast-message'; // Renamed to avoid conflict with 'Toast' component

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

class NotificationUIService {
  show(options: ToastOptions) {
    RNToast.show({
      type: options.type,
      text1: options.title,
      text2: options.message,
      visibilityTime: 4000,
      position: 'top', // Default position, can be overridden if needed
    });
  }

  showSuccess(message: string, title: string = 'Sucesso!') {
    this.show({ type: 'success', title, message });
  }

  showInfo(message: string, title: string = 'Aviso') {
    this.show({ type: 'info', title, message });
  }

  // Centralizes humanized error messages
  showError(error: any, title: string = 'Ops! Algo deu errado.') {
    let message = 'Por favor, verifique sua conexão e tente novamente.'; // Default message
    
    if (typeof error === 'string') {
      message = error;
    } else if (error?.response?.data?.message) {
      // Handles backend-specific errors
      message = error.response.data.message;
    } else if (error instanceof Error) {
      // General JavaScript errors
      message = error.message;
    }

    // Add a helpful suffix for critical errors
    if (error?.response?.status >= 500) {
      message += ' Se o problema persistir, entre em contato com o suporte. 😊';
    }

    this.show({ type: 'error', title, message });
  }
}

export default new NotificationUIService();