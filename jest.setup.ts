import React from 'react';
import path from 'node:path';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';
if (typeof global.clearImmediate === 'undefined') {
  (global as any).clearImmediate = (handle: number) => clearTimeout(handle);
}
if (typeof global.setImmediate === 'undefined') {
  (global as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
    setTimeout(fn, 0, ...args);
}
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  mobileReplayIntegration: jest.fn(() => ({})),
  feedbackIntegration: jest.fn(() => ({})),
}));

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => {
    const ActualTouchableOpacity = jest
      .requireActual('react-native/Libraries/Components/Touchable/TouchableOpacity')
      .default;
    const ReactModule = jest.requireActual('react');
    const WrappedTouchableOpacity = ReactModule.forwardRef((props: any, ref) =>
      ReactModule.createElement(ActualTouchableOpacity, { ...props, ref }),
    );
    WrappedTouchableOpacity.displayName = 'TouchableOpacity';
    WrappedTouchableOpacity.defaultProps = ActualTouchableOpacity.defaultProps;

    return {
      __esModule: true,
      default: WrappedTouchableOpacity,
    };
  },
);

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('expo-constants', () => ({
  manifest: {},
  expoConfig: {},
  platform: {},
  getWebViewUserAgentAsync: jest.fn().mockResolvedValue('jest-agent'),
}));
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) => children ?? null,
}));

jest.mock('react-native-reanimated', () => {
  const ImageMock = () => null;
  const stub = {
    __esModule: true,
    default: {
      Image: ImageMock,
    },
    Image: ImageMock,
    interpolate: () => 0,
    Extrapolate: { CLAMP: 'clamp' },
    Easing: {
      inOut: (fn: any) => fn,
      ease: (value: any) => value,
    },
    useSharedValue: (value: number = 0) => ({ value }),
    useAnimatedStyle: () => () => ({}),
    withRepeat: (animation: any) => animation,
    withTiming: (value: any) => () => ({}),
  };
  return stub;
});

jest.mock('expo-device', () => ({
  Platform: {
    OS: 'ios',
    select: (obj: Record<string, any>) => obj.ios,
  },
}));

const mockLocalSearchParams = jest.fn(() => ({}));
jest.mock('expo-router', () => {
  const routerMock = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    canGoBack: jest.fn().mockReturnValue(false),
  };
  const Slot = ({ children }: { children?: React.ReactNode }) => children ?? null;
  const SplashScreen = {
    preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  };
  return {
    useRouter: () => routerMock,
    router: routerMock,
    useSegments: () => [],
    usePathname: () => '/',
    useLocalSearchParams: mockLocalSearchParams,
    Link: ({ children }: { children?: React.ReactNode }) => children ?? null,
    Redirect: () => null,
    Stack: {
      Screen: ({ children }: { children?: React.ReactNode }) => children ?? null,
    },
    Slot,
    SplashScreen,
  };
});

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

jest.mock('expo-av', () => {
  class MockSound {
    async loadAsync() {
      return {};
    }
    async playAsync() {
      return {};
    }
    setOnPlaybackStatusUpdate(_: (status: any) => void) {
      return undefined;
    }
    async replayAsync() {
      return {};
    }
    async unloadAsync() {
      return {};
    }
  }

  return {
    Audio: {
      Sound: MockSound,
    },
  };
});

jest.mock('socket.io-client', () => {
  const { EventEmitter } = require('events');
  const emitter = new EventEmitter();
  emitter.connect = jest.fn();
  emitter.disconnect = jest.fn();
  emitter.on = emitter.addListener.bind(emitter);
  emitter.off = emitter.removeListener.bind(emitter);
  emitter.emit = emitter.emit.bind(emitter);
  const socketFactory = jest.fn(() => emitter);
  return {
    io: socketFactory,
    __mockSocket: emitter,
  };
});

class MockXMLHttpRequest {
  public onload: (() => void) | null = null;
  public onerror: ((error: any) => void) | null = null;
  public onreadystatechange: (() => void) | null = null;
  public readyState = 0;
  public status = 0;
  public responseText = '';

  open() {
    this.readyState = 1;
  }

  setRequestHeader() {}

  send() {
    this.readyState = 4;
    this.status = 200;
    this.responseText = '{}';
    if (this.onload) {
      this.onload();
    }
    if (this.onreadystatechange) {
      this.onreadystatechange();
    }
  }

  abort() {
    this.readyState = 0;
  }
}

global.XMLHttpRequest = MockXMLHttpRequest as any;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) =>
      options?.defaultValue ?? key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'pt-BR',
    },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn().mockResolvedValue(true),
  useFonts: () => [true, null],
  isLoaded: jest.fn().mockReturnValue(true),
  Font: {
    loadAsync: jest.fn().mockResolvedValue(true),
    isLoaded: jest.fn().mockReturnValue(true),
  },
}));

jest.mock('expo-localization', () => ({
  locale: 'pt-BR',
  locales: ['pt-BR'],
  timezone: 'America/Sao_Paulo',
  region: 'BR',
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const responsivePath = path.resolve(__dirname, 'utils/responsive');

jest.mock(responsivePath, () => ({
  useDevice: () => ({ isLargePhone: false }),
}));

jest.mock('expo-blur', () => ({
  BlurView: 'BlurView',
}));

jest.mock('react-native-chart-kit', () => ({
  LineChart: 'LineChart',
  ProgressChart: 'ProgressChart',
}));

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  impactAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  NotificationFeedbackType: {
    Success: 'success',
  },
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

const i18nextLogKeywords = ['i18next', 'languageChanged', 'initialized', 'missingKey'];
const actWarnings = ['not wrapped in act'];
const suppressedWarnings = ['SafeAreaView has been deprecated'];
const shouldSuppressI18nextLog = (args: readonly unknown[]) =>
  args.some(
    (entry) =>
      typeof entry === 'string' &&
      i18nextLogKeywords.some(keyword => entry.includes(keyword)),
    );

if (process.env.NODE_ENV === 'test') {
  (['log', 'warn', 'info', 'debug'] as const).forEach((method) => {
    const original = console[method];
    if (typeof original !== 'function') {
      return;
    }
    const boundOriginal = original.bind(console);
    jest.spyOn(console, method).mockImplementation((...args: unknown[]) => {
      const containsSuppressed = args.some(
        (entry) =>
          typeof entry === 'string' &&
          suppressedWarnings.some((frag) => entry.includes(frag)),
      );
      if (containsSuppressed) {
        return;
      }
      if (shouldSuppressI18nextLog(args)) {
        return;
      }
      const containsActWarning = args.some(
        (entry) =>
          typeof entry === 'string' &&
          actWarnings.some((keyword) => entry.toLowerCase().includes(keyword)),
      );
      if (containsActWarning) {
        return;
      }
      boundOriginal(...args);
    });
  });
  try {
    const AnimatedInternals = jest.requireActual('react-native/Libraries/Animated/src/Animated');
    const RN = jest.requireActual('react-native');
    const AnimatedModule = (RN?.Animated as typeof AnimatedInternals) ?? AnimatedInternals;
    if (AnimatedModule?.timing) {
      jest.spyOn(AnimatedModule, 'timing').mockImplementation((value: any, config: any) => {
        return {
          start: (callback?: (result: { finished: boolean }) => void) => {
            callback?.({ finished: true });
            return { stop: () => {} };
          },
          stop: () => {},
        } as any;
      });
    }
    const AnimatedValue = AnimatedModule?.Value;
    if (AnimatedValue && AnimatedValue.prototype) {
      const { addListener, removeListener } = AnimatedValue.prototype;
      AnimatedValue.prototype.addListener = function (listener: any) {
        return addListener.call(this, listener);
      };
      AnimatedValue.prototype.removeListener = function (id: any) {
        return removeListener.call(this, id);
      };
    }
  } catch {
    // ignore if animated internals are unavailable
  }
  const errorOriginal = console.error;
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const containsActWarning = args.some(
      (entry) =>
        typeof entry === 'string' &&
        actWarnings.some((keyword) => entry.toLowerCase().includes(keyword)),
    );
    if (containsActWarning) {
      return;
    }
    errorOriginal(...args);
  });
}
