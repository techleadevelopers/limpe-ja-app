import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

interface Header2TestProps {
  userName: string;
  userAvatarUrl?: string | null;
  userAddress?: string | null;
  hasNotifications?: boolean;
  isVisitor?: boolean;
}

const Header2Test: React.FC<Header2TestProps> = ({
  userName,
  userAvatarUrl,
  userAddress,
  hasNotifications,
  isVisitor,
}) => {
  const router = useRouter();
  const { isAuthenticated, updateUser, user } = useAuth();
  const insets = useSafeAreaInsets?.() || ({ top: Constants.statusBarHeight } as any);
  const { showDialog, dialogElement } = useAndroidDialog();

  const displayName = userName?.trim() ? userName : 'Visitante';
  const effectiveVisitor = isVisitor || !isAuthenticated;

  const avatarScale = useRef(new Animated.Value(1)).current;
  const notifyScale = useRef(new Animated.Value(1)).current;
  const actionScale = useRef(new Animated.Value(1)).current;

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

  const handleProfilePress = () => router.push('/client/profile' as any);
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
  const handleCTA = () => router.push('/client/bookings/schedule-service' as any);

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
            { text: 'Continuar', onPress: () => router.push('/auth/client-register' as any) },
          ],
        );
      }
      return;
    }
    router.push('/client/notifications' as any);
  };

  const fetchUnread = useCallback(async () => {
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
      // mantém último valor conhecido
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
      return undefined;
    }, [fetchUnread]),
  );

  return (
    <>
      <LinearGradient
        colors={['rgba(224, 232, 245, 0)', 'rgba(224, 232, 245, 0)']}
        style={[styles.wrapper, { paddingTop: insets.top + 10, }]}
      >
        <View style={styles.card}>
          <View style={styles.cardTop}>
            {/* Perfil e saudação */}
            <View style={styles.left}>
              <Animated.View style={{ transform: [{ scale: avatarScale }] }}>
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  onPressIn={() => pressIn(avatarScale)}
                  onPressOut={() => pressOut(avatarScale)}
                  style={styles.avatarButton}
                  activeOpacity={0.9}
                >
                  {userAvatarUrl || user?.avatarUrl ? (
                    <Image source={{ uri: userAvatarUrl || (user as any)?.avatarUrl }} style={styles.avatarImage} />
                  ) : (
                    <Ionicons name="camera-outline" size={28} color="#4c8fd1ff" />
                  )}
                  <View style={styles.cameraBadge}>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              <View>
                <Text style={styles.greetingText}>{getGreeting()}</Text>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.subtleText} numberOfLines={1}>
                  {userAddress || 'Escolha o endereço ideal'}
                </Text>
              </View>
            </View>

            {/* Notificações */}
            <Animated.View style={{ transform: [{ scale: notifyScale }] }}>
              <TouchableOpacity
                onPress={handleNotificationPress}
                onPressIn={() => pressIn(notifyScale)}
                onPressOut={() => pressOut(notifyScale)}
                style={styles.notifyButton}
                activeOpacity={0.9}
              >
                <Ionicons name="notifications" size={22} color="#4c8fd1ff" />
                <View style={[styles.badge, unreadCount > 0 && styles.badgePill]}>
                  {unreadCount > 0 && (
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* CTA principal */}
          <Animated.View style={{ transform: [{ scale: actionScale }] }}>
            <TouchableOpacity
              onPress={handleCTA}
              onPressIn={() => pressIn(actionScale)}
              onPressOut={() => pressOut(actionScale)}
              style={styles.ctaCard}
              activeOpacity={0.92}
            >
              <View style={styles.ctaIconCircle}>
                <Image
                  source={require('../../../../assets/images/safe.png')}
                  style={styles.ctaBadgeIcon}
                  resizeMode="contain"
                />
              </View>
              <View style={{ flex: 1, paddingHorizontal: 10, }}>
                
                <Text style={styles.ctaSubtitle}>
                  Profissionais com verificação de identidade, antecedentes e monitoramento ativo.
                </Text>
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
  wrapper: {
    width: '100%',
    bottom: Platform.OS === 'android' ? 29 : 0,
    paddingHorizontal: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 0,
    borderBottomEndRadius: 22,
    borderBottomStartRadius: 22,
  },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 0,
    borderColor: '#afd0f1ff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#e0e8f5ff',
    borderWidth: 1,
    borderColor: '#afd0f1ff',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 4,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  cameraBadgePlus: {
    color: '#4c8fd1ff',
    fontSize: 16,
    bottom: 6,
    fontWeight: '700',
  },
  greetingText: {
    fontSize: 11,
    color: '#8d9fafff',
    marginBottom: 2,
  },
  userNameText: {
    fontSize: 14,
    color: '#7398b9ff',
    fontWeight: Platform.select({ ios: '700', android: '700' }),
  },
  subtleText: {
    fontSize: 10,
    color: '#8d9fafff',
  },
  notifyButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#e0e8f5ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 6,
    minWidth: 10,
    bottom: 10,
    height: 10,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#ff3b30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    minWidth: 16,
    height: 14,
   
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  ctaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    backgroundColor: 'transparent',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    marginBottom: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  ctaSubtitle: {
    fontSize: 10,
    color: '#8d9fafff',
    lineHeight: 18,
     
  },
  ctaIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaBadgeIcon: {
    width: 16,
    height: 16,
  },
});

export default Header2Test;
