// app/services/notificationUIService.ts
import RNToast from 'react-native-toast-message';
import i18n from '../i18n';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  visibilityTime?: number;
  position?: 'top' | 'bottom';
}

class NotificationUIService {
  show(options: ToastOptions) {
    RNToast.show({
      type: options.type,
      text1: options.title,
      text2: options.message,
      visibilityTime: options.visibilityTime ?? 4000,
      position: options.position ?? 'top',
    });
  }

  showSuccess(message: string, title: string = i18n.t('common.success')) {
    this.show({ type: 'success', title, message });
  }

  showInfo(message: string, title: string = i18n.t('common.info')) {
    this.show({ type: 'info', title, message });
  }

  showError(error: unknown, title: string = i18n.t('common.error')) {
    let message = i18n.t('errors.network.retry_saved');
    let messageKey: string | undefined;
    let status: number | undefined;

    if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object') {
      const anyError = error as Record<string, any>;
      if (typeof anyError.messageKey === 'string') {
        messageKey = anyError.messageKey;
      }
      if (anyError.response) {
        status = anyError.response.status;
        const data = anyError.response.data ?? {};
        if (typeof data.messageKey === 'string') {
          messageKey = data.messageKey;
        }
        if (typeof data.message === 'string') {
          message = data.message;
        }
      }
      if (anyError.message && typeof anyError.message === 'string') {
        message = anyError.message;
      }
    }

    const translated = messageKey ? i18n.t(messageKey, { defaultValue: message }) : message;
    let finalMessage = translated || i18n.t('errors.network.retry_saved');

    if (status && status >= 500) {
      const supportCopy = i18n.t('errors.network.contact_support');
      finalMessage = `${finalMessage} ${supportCopy}`.trim();
    }

    this.show({ type: 'error', title, message: finalMessage });
  }
}

export default new NotificationUIService();
