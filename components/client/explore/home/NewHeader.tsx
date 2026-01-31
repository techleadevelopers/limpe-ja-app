import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMyNotifications } from '../../../../services/notificationService';
import { api } from '../../../../services/api';
import { useAuth } from '../../../../hooks/useAuth';
import { useAndroidDialog } from '../../../../hooks/useAndroidDialog';

interface NewHeaderProps {
  userName: string;
  userAvatarUrl?: string | null;
  userAddress?: string | null;
  hasNotifications?: boolean;
  isVisitor?: boolean;
}

const NewHeader: React.FC<NewHeaderProps> = ({
  userName,
  userAvatarUrl,
  userAddress,
  hasNotifications,
  isVisitor,
}) => {
  const router = useRouter();
  const { isAuthenticated, updateUser, user } = useAuth();
  const insets = useSafeAreaInsets?.() || { top: 0 } as any;

  const displayName =
    userName && userName.trim().length > 0 ? userName : 'Visitante';

  const avatarScale = useRef(new Animated.Value(1)).current;
  const notifyScale = useRef(new Animated.Value(1)).current;
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingUnread, setIsLoadingUnread] = useState(false);

  const pressIn = (anim: Animated.Value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(anim, { toValue: 0.94, useNativeDriver: true }).start();
  };

  const pressOut = (anim: Animated.Value) => {
    Animated.spring(anim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 120,
    }).start();
  };

  const handleProfilePress = () =>
    router.push('/client/profile' as any);

  const effectiveVisitor = isVisitor || !isAuthenticated;

  const { showDialog, dialogElement } = useAndroidDialog();

  const handleAvatarPress = async () => {
    if (effectiveVisitor) {
      handleProfilePress();
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permissão necessária', 'Habilite o acesso às fotos para trocar sua imagem de perfil.');
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (pickerResult.canceled || !pickerResult.assets?.length) return;

      const uri = pickerResult.assets[0].uri;
      const filename = uri.split('/').pop() || `avatar-${Date.now()}.jpg`;
      const ext = filename.split('.').pop()?.toLowerCase();
      const mime =
        ext === 'png' ? 'image/png' : ext === 'heic' ? 'image/heic' : 'image/jpeg';

      const form = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        const webFile = new File([blob], filename, { type: blob.type || mime });
        form.append('file', webFile);
      } else {
        form.append('file' as any, { uri, name: filename, type: mime } as any);
      }

      const uploadResp = await api.post<{ url?: string }>('/upload/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = uploadResp.data?.url || uri;
      await api.patch('/users/me', { avatarUrl: uploadedUrl });
      await updateUser?.({ avatarUrl: uploadedUrl });
      Alert.alert('Foto atualizada', 'Sua imagem de perfil foi enviada com sucesso.');
    } catch (error: any) {
      Alert.alert('Não foi possível atualizar a foto', error?.message || 'Tente novamente em instantes.');
    }
  };

  const handleNotificationPress = () => {
    if (effectiveVisitor) {
      if (Platform.OS === 'android') {
        showDialog({
          title: 'Cadastro necessário',
          message: 'Crie seu cadastro para agendar serviços de limpeza',
          cancelLabel: 'Cancelar',
          confirmLabel: 'Continuar',
          onConfirm: () => router.push('/auth/client-register' as any),
        });
      } else {
        Alert.alert(
          'Cadastro necessário',
          'Crie seu cadastro para agendar serviços de limpeza',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
              onPress: () => router.push('/auth/client-register' as any),
            },
          ]
        );
      }
      return;
    }
    router.push('/client/notifications' as any);
  };

  const fetchUnread = useCallback(async () => {
    // Visitante não deve disparar chamadas protegidas
    if (effectiveVisitor) {
      setUnreadCount(0);
      setIsLoadingUnread(false);
      return;
    }
    setIsLoadingUnread(true);
    try {
      const list = await getMyNotifications();
      const unread = list.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      // mantém último valor em caso de erro
    } finally {
      setIsLoadingUnread(false);
    }
  }, [effectiveVisitor]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  useFocusEffect(
    useCallback(() => {
      fetchUnread();
      // nenhuma cleanup necessária
      return undefined;
    }, [fetchUnread])
  );

  return (
    <>
      <LinearGradient
        colors={['transparent', 'transparent']}
        style={[styles.container, { marginTop: insets.top - 29 }]}
      >
      {/* ESQUERDA – PERFIL */}
      <View style={styles.leftContent}>
        <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
          <TouchableOpacity
            onPress={handleAvatarPress}
            onPressIn={() => pressIn(avatarScale)}
            onPressOut={() => pressOut(avatarScale)}
            style={[
              styles.fixedCircle,
              {
                marginRight: 4,
                width: Platform.OS === 'android' ? 38 : 37,
                height: Platform.OS === 'android' ? 38 : 37,
              },
            ]}
            activeOpacity={0.9}
          >
            {userAvatarUrl || user?.avatarUrl ? (
              <Image
                source={{ uri: userAvatarUrl || (user as any)?.avatarUrl }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons
                name="camera-outline"
                size={Platform.OS === 'android' ? 18 : 18}
                color="#4c8fd1ff"
              />
            )}
          </TouchableOpacity>
        </Animated.View>

        <View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userNameText}>{displayName}</Text>
          <Text style={styles.subtleText} numberOfLines={1}>
            {userAddress || 'Escolha o endereço ideal'}
          </Text>
        </View>
      </View>

      {/* DIREITA – CATEGORY → NOTIFICATIONS */}
      <View style={styles.rightContent}>
        {/* CATEGORY 
        <Animated.View style={{ transform: [{ scale: categoryScale }] }}>
          <TouchableOpacity
            onPress={handleCategoryPress}
            onPressIn={() => pressIn(categoryScale)}
            onPressOut={() => pressOut(categoryScale)}
            style={[styles.iconBare, { marginRight: 6 }]}
            activeOpacity={0.9}
          >
            <Image
              source={require('../../../../assets/images/category2.png')}
              style={{
                width: Platform.OS === 'android' ? 20 : 20,
                height: Platform.OS === 'android' ? 20 : 20,
                marginLeft: Platform.OS === 'android' ? 21 : 15,
                marginTop: Platform.OS === 'android' ? 4 : 6,
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Animated.View>*/}

        {/* NOTIFICATIONS */}
        <Animated.View style={{ transform: [{ scale: notifyScale }] }}>
          <TouchableOpacity
            onPress={handleNotificationPress}
            onPressIn={() => pressIn(notifyScale)}
            onPressOut={() => pressOut(notifyScale)}
            style={styles.iconBare}
            activeOpacity={0.9}
          >
            <Image
              source={require('../../../../assets/images/notifi2.png')}
              style={{
                width: Platform.OS === 'android' ? 36 : 36,
                height: Platform.OS === 'android' ? 36 : 36,
                marginTop: Platform.OS === 'android' ? 4 : 6,
              }}
              resizeMode="contain"
            />

            <View style={[styles.badge, unreadCount > 0 && styles.badgePill]}>
              {unreadCount > 0 && (
                <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
      </LinearGradient>

      {dialogElement}
    </>
  );
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Platform.OS === 'android' ? 20 : -180,
    left: 3,
    top: Platform.OS === 'android' ? 2 : 0,
    marginTop: Platform.OS === 'android' ? 16 : 0,
    marginHorizontal: Platform.OS === 'android' ? 10 : 12,
    paddingHorizontal: Platform.OS === 'android' ? 7 : 9,
    borderBottomEndRadius: 40,
    borderBottomStartRadius: 40,
    borderTopEndRadius: 40,
    borderTopStartRadius: 40,
    marginBottom: Platform.OS === 'android' ? -1 : -2,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconBare: {
    width: Platform.OS === 'android' ? 30 : 40,
    height: Platform.OS === 'android' ? 30 : 40,
    borderRadius: 20,
    justifyContent: 'center',
    gap: 9,
    alignItems: 'center',
  },

  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  /* 🔥 NOVO ESTILO: IGUAL FUNDO DOS CARDS */
  fixedCircle: {
    width: Platform.OS === 'android' ? 36 : 38,
    height: Platform.OS === 'android' ? 36 : 38,
    borderRadius: 20,

    backgroundColor: '#e0e8f5ff', // mesmo fundo dos cards
    borderWidth: 1,
    borderColor: '#afd0f1ff',

    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  badge: {
    position: 'absolute',
    bottom: 14,
    right: 2,
    minWidth: 13,
    height: 12,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#ff3030be',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    minWidth: 16,
    height: 12,
     bottom: 10,
    paddingHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#ff3b30',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },

  greetingText: {
    fontSize: Platform.OS === 'android' ? 12 : 12,
    fontFamily: 'Roboto', // 👈 OBRIGATÓRIO AQUI!
    marginLeft: Platform.OS === 'android' ? 2 : 5,
    marginBottom: Platform.OS === 'android' ? -2 : -1,
    color: '#8d9fafff',
    fontWeight: Platform.select({ ios: '300', android: '300' }),
  },

  subtleText: {
    fontSize: 10,
    color: '#8d9fafff',
    marginLeft: Platform.OS === 'android' ? 2 : 5,
    marginBottom: Platform.OS === 'android' ? -2 : -1,
  },

  userNameText: {
    fontSize: Platform.OS === 'android' ? 16 : 17.5,
    marginLeft: Platform.OS === 'android' ? 2 : 5,
    fontFamily: Platform.select({
      ios: 'Roboto',
      android: 'Montserrat-Regular',
    }),
    color: '#7398b9ff',
    fontWeight: Platform.select({
      ios: '400',
      android: '600',
    }),
  },
});

export default NewHeader;
