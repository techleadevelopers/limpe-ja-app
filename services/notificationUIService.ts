// app/services/notificationUIService.ts
import i18n from '../i18n';
import { showOverlay } from '../hooks/useOverlayMessage';
import Toast from 'react-native-toast-message';

interface ToastOptions {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  position?: 'top' | 'bottom';
  overlay?: boolean;
}

class NotificationUIService {
  private safeString(v: unknown, fallback = ''): string {
    if (typeof v === 'string') return v;
    if (v == null) return fallback;
    try {
      return String(v);
    } catch {
      return fallback;
    }
  }

  private dedupeHistory = new Map<string, number>();
  private readonly dedupeWindowMs = 15_000;

  private shouldDeduplicate(dedupeKey?: string): boolean {
    if (!dedupeKey) return false;
    const now = Date.now();
    const last = this.dedupeHistory.get(dedupeKey) ?? 0;
    if (now - last < this.dedupeWindowMs) {
      return true;
    }
    this.dedupeHistory.set(dedupeKey, now);
    return false;
  }

  show(options: ToastOptions) {
    const type = options.type;
    const title = this.safeString(options.title);
    const message = this.safeString(options.message);

    const msgLower = message.toLowerCase();
    const titleLower = title.toLowerCase();

    // Supressão existente: schedule/time
    if (type === 'success' && msgLower.includes('horário')) {
      console.warn('[NotificationUIService] suppressed schedule success toast:', message);
      // continue to show premium overlay; suppress only legacy toast
    }

    // Supressão existente: PIX
    if (type === 'success' && (
      msgLower.includes('pix') ||
      msgLower.includes('gerado') ||
      msgLower.includes('sucesso') ||
      titleLower.includes('pix') ||
      titleLower.includes('gerado') ||
      titleLower.includes('sucesso')
    )) {
      console.warn('[NotificationUIService] suppressed PIX success toast:', title, message);
      // continue to show premium overlay; suppress only legacy toast
    }

    // Supressão existente: PIX info
    if (type === 'info' && (
      msgLower.includes('pix') ||
      msgLower.includes('copiado') ||
      msgLower.includes('código')
    )) {
      console.warn('[NotificationUIService] suppressed PIX info toast:', message);
      // continue to show premium overlay; suppress only legacy toast
    }

    // Chaves de i18n para supressão
    const scheduleSuccessKeys = [
      'schedule_service.booking_success_message',
      'schedule_service.found_available_date',
      'common.success',
      'schedule_service.searching_next_available'
    ];
    const scheduleErrorKeys = [
      'schedule_service.step1_validation_error',
      'schedule_service.booking_error_message',
      'schedule_service.service_not_available',
      'schedule_service.no_available_nearby',
      'schedule_service.error_fetching_slots_day',
      'schedule_service.navigation_error_essential_data',
      'common.error',
      'common.network_error'
    ];
    const successPageKeys = [
      'bookings.success_title',
      'bookings.confirmation_message',
      'common.confirm'
    ];

    // Segurança: obter strings traduzidas de forma defensiva
    const translatedScheduleSuccess = scheduleSuccessKeys.map(k => {
      try { return i18n.t(k).toLowerCase(); } catch { return ''; }
    });
    const translatedScheduleError = scheduleErrorKeys.map(k => {
      try { return i18n.t(k).toLowerCase(); } catch { return ''; }
    });
    const translatedSuccessPage = successPageKeys.map(k => {
      try { return i18n.t(k).toLowerCase(); } catch { return ''; }
    });

    if (type === 'success' && (
      translatedScheduleSuccess.some(s => s && msgLower.includes(s)) ||
      msgLower.includes('agendamento realizado') ||
      msgLower.includes('horários encontrados') ||
      msgLower.includes('sucesso')
    )) {
      console.warn('[NotificationUIService] suppressed schedule/success toast (success):', message);
      // continue to show premium overlay; suppress only legacy toast
    }

    if ((type === 'error' || type === 'info') && (
      translatedScheduleError.some(s => s && msgLower.includes(s)) ||
      msgLower.includes('selecione data') ||
      msgLower.includes('horário não disponível') ||
      msgLower.includes('procurando próximo') ||
      msgLower.includes('endereço necessário') ||
      translatedSuccessPage.some(s => s && msgLower.includes(s))
    )) {
      console.warn(`[NotificationUIService] suppressed schedule/success toast (${type}):`, message);
      // continue to show premium overlay; suppress only legacy toast
    }

    // Supressão para erros de UI/render
    if (type === 'error') {
      const BLOCKLIST = [
        'Text strings must be rendered within a <Text> component',
      ];
      const shouldSuppress = BLOCKLIST.some((frag) =>
        typeof message === 'string' && message.toLowerCase().includes(frag.toLowerCase())
      );
      if (shouldSuppress) {
        console.warn('[NotificationUIService] suppressed UI error toast:', message);
      // continue to show premium overlay; suppress only legacy toast
      }
    }

    // Exibir toast (garantindo text1/text2 sejam strings)
    // Premium overlay com fundo escuro e auto-hide ~5s
    const variant = type === 'success' ? 'success' : type === 'error' ? 'error' : type === 'info' ? 'info' : 'warning';
    const useOverlay = options.overlay ?? true;
    if (useOverlay) {
      showOverlay({ title, subtitle: message, variant, durationMs: 2000 });
      return;
    }

    Toast.show({
      type: variant,
      text1: title,
      text2: message,
      position: options.position ?? 'bottom',
      visibilityTime: 2000,
      autoHide: true,
    });
  }

  showSuccess(message: string, title: string = i18n.t('common.success')) {
    this.show({ type: 'success', title, message });
  }

  showInfo(message: string, title: string = i18n.t('common.info')) {
    this.show({ type: 'info', title, message });
  }

  showError(error: unknown, title: string = i18n.t('common.error')) {
    let message = this.safeString(i18n.t('errors.network.retry_saved', { defaultValue: '' })) || '';
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
    let finalMessage = this.safeString(translated, this.safeString(i18n.t('errors.network.retry_saved', { defaultValue: '' })));
    finalMessage = finalMessage.trim();

    if (status && status >= 500) {
      const supportCopy = this.safeString(i18n.t('errors.network.contact_support', { defaultValue: '' }));
      finalMessage = `${finalMessage} ${supportCopy}`.trim();
    }

    this.show({ type: 'error', title, message: finalMessage });
  }

  showAppEvent(event: {
    dedupeKey?: string;
    title: string;
    message: string;
    type?: ToastOptions['type'];
    deepLink?: string;
    overlay?: boolean;
    position?: 'top' | 'bottom';
  }) {
    if (this.shouldDeduplicate(event.dedupeKey)) {
      return;
    }
    this.show({
      type: event.type ?? 'info',
      title: event.title,
      message: event.message,
      overlay: event.overlay,
      position: event.position,
    });
  }
}

export default new NotificationUIService();
