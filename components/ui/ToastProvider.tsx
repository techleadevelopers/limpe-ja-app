import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {Animated, Easing, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {colors, radius} from '../../theme/ui';

type ToastType = 'success' | 'info' | 'error';
type ToastItem = {
  id: string;
  type: ToastType;
  title: string;
  subtitle?: string;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
};

type Ctx = { showToast: (t: Omit<ToastItem,'id'>) => void; };
const ToastCtx = createContext<Ctx>({ showToast: () => {} });
export const useToast = () => useContext(ToastCtx);

const iconByType: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle-outline',
  info: 'information-circle-outline',
  error: 'alert-circle-outline',
};

const bgByType: Record<ToastType, string> = {
  success: '#E8F7EE',
  info: '#E9F2FF',
  error: '#FDECEC',
};
const fgByType: Record<ToastType, string> = {
  success: '#1E7D42',
  info: colors.primary,
  error: '#B42318',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
  const [queue, setQueue] = useState<ToastItem[]>([]);
  const [current, setCurrent] = useState<ToastItem | null>(null);

  // animações
  const y = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const next = useCallback(() => {
    setCurrent(null);
    if (queue.length > 0) {
      const [n, ...rest] = queue;
      setQueue(rest);
      setCurrent(n);
    }
  }, [queue]);

  const showToast = useCallback((t: Omit<ToastItem,'id'>) => {
    const item: ToastItem = { id: String(Date.now() + Math.random()), duration: 2800, ...t };
    setQueue(q => [...q, item]);
    if (!current) setCurrent(item);
  }, [current]);

  // entra/saí com animação
  React.useEffect(() => {
    if (!current) return;
    y.setValue(-80); opacity.setValue(0);
    Animated.parallel([
      Animated.timing(y, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => dismiss(), current.duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(y, { toValue: -80, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => next());
  }, [next, y, opacity]);

  // swipe up para dispensar
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -10 || g.dy > 10,
      onPanResponderMove: (_, g) => { y.setValue(Math.min(g.dy, 0)); },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -20) {
          dismiss();
        } else {
          Animated.spring(y, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {current && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrapper, {opacity, transform:[{translateY: y}]}]}
          {...pan.panHandlers}
        >
          <View style={[styles.toast, { backgroundColor: bgByType[current.type], borderColor: fgByType[current.type] }]}>
            <Ionicons name={iconByType[current.type]} size={24} color={fgByType[current.type]} style={{marginRight:10}} />
            <View style={{flex:1}}>
              <Text style={[styles.title, {color: fgByType[current.type]}]} numberOfLines={1}>{current.title}</Text>
              {!!current.subtitle && <Text style={styles.subtitle} numberOfLines={2}>{current.subtitle}</Text>}
            </View>
            {!!current.actionLabel && current.onAction && (
              <TouchableOpacity onPress={() => { current.onAction?.(); dismiss(); }}>
                <Text style={[styles.action, {color: fgByType[current.type]}]}>{current.actionLabel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </ToastCtx.Provider>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position:'absolute', top: Platform.select({ios:60, android:30}), left:12, right:12,
  },
  toast: {
    flexDirection:'row', alignItems:'center',
    paddingVertical:12, paddingHorizontal:14,
    borderRadius: radius.lg, borderWidth: 1,
  },
  title: { fontWeight:'700', fontSize:14 },
  subtitle: { color: colors.textMed, fontSize:12, marginTop:2 },
  action: { fontSize:12, fontWeight:'800', marginLeft:12 },
});
