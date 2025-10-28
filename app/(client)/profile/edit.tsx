import i18n from '../../../i18n';
// LimpeJaApp/app/(client)/profile/edit.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Easing,
  Pressable,
  useColorScheme,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste o path se necessário

import { updateClientProfile } from '../../../services/clientService';
import { BookingAddress } from '../../../types/backend/bookings';
import { UpdateClientProfileDto } from '../../../types/backend/clients';
import { UploadResponseDto } from '../../../types/backend/upload';
import { uploadImageToCloud, FilePurpose } from '../../../services/uploadService';
import { UserProfile } from '../../../types/backend/users';
import { formatPhoneNumber, isValidPhoneNumber } from '../../../utils/helpers';

import Toast from '../../../components/Toast';
import { Sheet } from '../../../components/Sheet';
import { EmptyState } from '../../../components/EmptyState';
import Colors from '../../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

/* Animated error message (kept) */
const AnimatedErrorMessage: React.FC<{ message: string | null }> = ({ message }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (message) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [message, fadeAnim]);

  if (!message) return null;

  return (
    <Animated.Text style={[styles.errorMessage, { opacity: fadeAnim }]}>
      {message}
    </Animated.Text>
  );
};

/* Button component (kept, minor cosmetic) */
interface ButtonProps {
  title: string;
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  kind?: 'primary' | 'secondary' | 'ghost';
}

function useThemeForButton() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  onPressIn,
  onPressOut,
  style,
  textStyle,
  disabled,
  kind = 'primary',
}) => {
  const theme = useThemeForButton();

  const variantStyles = useMemo(() => {
    switch (kind) {
      case 'secondary':
        return {
          button: {
            backgroundColor: '#666666',
            borderColor: '#666666',
            borderWidth: 1,
          },
          text: { color: '#FFFFFF' },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: theme.primary || '#007AFF',
            borderWidth: 1,
          },
          text: { color: theme.primary || '#007AFF' },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: '#007AFF',
            borderColor: '#007AFF',
            borderWidth: 1,
          },
          text: { color: '#FFFFFF' },
        };
    }
  }, [kind, theme]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyles.baseButton,
        variantStyles.button,
        pressed && buttonStyles.buttonPressed,
        disabled && buttonStyles.buttonDisabled,
        style,
      ]}
      accessibilityLabel={title}
    >
      <Text style={[buttonStyles.baseButtonText, variantStyles.text, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
};

const buttonStyles = StyleSheet.create({
  baseButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.5 },
  baseButtonText: { fontSize: 16, fontWeight: '600' },
});

export default function EditClientProfileScreen() {
  const { user, updateUser } = useAuth() as { user: UserProfile | null, updateUser: (user: Partial<UserProfile>) => void };
  const router = useRouter();
  const theme = useThemeForButton();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [address, setAddress] = useState<BookingAddress>(user?.address || {
    cep: '',
    street: '',
    number: '',
    complement: null,
    neighborhood: '',
    city: '',
    state: '',
  });
  const [phone, setPhone] = useState(user?.phone || '');

  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [showAvatarSheet, setShowAvatarSheet] = useState(false);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const avatarScaleAnim = useRef(new Animated.Value(1)).current;
  const saveButtonScaleAnim = useRef(new Animated.Value(1)).current;
  const linkButtonScaleAnim = useRef(new Animated.Value(1)).current;

  const fullNameBorderAnim = useRef(new Animated.Value(0)).current;
  const phoneBorderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarUri(user.avatarUrl || null);
      if (user.address) {
        setAddress(user.address);
      }
    }
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        delay: 100,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }),
    ]).start();
  }, [user, headerAnim, contentAnim]);

  const animateInputBorder = (animationValue: Animated.Value, isFocused: boolean, hasError: boolean) => {
    if (hasError) return;
    Animated.timing(animationValue, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getInputBorderColor = (animationValue: Animated.Value, hasError: boolean) => {
    if (hasError) return '#D32F2F';
    return animationValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['#E5E5E5', '#007AFF'],
    });
  };

  const onPressInAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
  const onPressOutAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start(); };

  const onPressInButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start(); };
  const onPressOutButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start(); };

  const pickImageFromLibrary = async () => {
    setIsUploadingAvatar(true);
    setShowAvatarSheet(false);
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Toast.show({
          type: 'error',
          text1: 'Permissão Necessária',
          text2: 'Você precisa permitir o acesso à galeria para escolher uma foto.',
        });
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const newAvatarUri = pickerResult.assets[0].uri;
        const uploadResponse: UploadResponseDto = await uploadImageToCloud(newAvatarUri, 'avatar' as FilePurpose);
        if (uploadResponse && uploadResponse.url) {
          setAvatarUri(uploadResponse.url);
          Toast.show({
            type: 'success',
            text1: 'Sucesso',
            text2: 'Foto de perfil atualizada!',
          });
          updateUser({ avatarUrl: uploadResponse.url });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erro no Upload',
            text2: 'Não foi possível enviar a imagem para o servidor.',
          });
        }
      }
    } catch (error) {
      console.error("[EditProfile] Erro ao selecionar ou enviar imagem:", error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível selecionar ou enviar a imagem.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const takePhotoFromCamera = async () => {
    setIsUploadingAvatar(true);
    setShowAvatarSheet(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Toast.show({
          type: 'error',
          text1: 'Permissão Necessária',
          text2: 'Você precisa permitir o acesso à câmera para tirar uma foto.',
        });
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        const newAvatarUri = pickerResult.assets[0].uri;
        const uploadResponse: UploadResponseDto = await uploadImageToCloud(newAvatarUri, 'avatar' as FilePurpose);
        if (uploadResponse && uploadResponse.url) {
          setAvatarUri(uploadResponse.url);
          Toast.show({
            type: 'success',
            text1: 'Sucesso',
            text2: 'Foto de perfil atualizada!',
          });
          updateUser({ avatarUrl: uploadResponse.url });
        } else {
          Toast.show({
            type: 'error',
            text1: 'Erro no Upload',
            text2: 'Não foi possível enviar a imagem para o servidor.',
          });
        }
      }
    } catch (error) {
      console.error("[EditProfile] Erro ao tirar ou enviar foto:", error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: 'Não foi possível tirar ou enviar a foto.',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = useCallback(() => {
    setShowAvatarSheet(false);
    setAvatarUri(null);
    updateUser({ avatarUrl: null });
    Toast.show({
      type: 'info',
      text1: 'Foto removida',
      text2: 'Sua foto de perfil foi removida.',
    });
  }, [updateUser]);

  const handleSaveChanges = async () => {
    let isValid = true;

    if (!fullName.trim()) {
      setFullNameError('O nome completo é obrigatório.');
      isValid = false;
    } else {
      setFullNameError(null);
    }

    if (!isValidPhoneNumber(phone)) {
      setPhoneError('Telefone inválido. Formato esperado (XX) XXXXX-XXXX.');
      isValid = false;
    } else {
      setPhoneError(null);
    }

    const isAddressComplete = address.street && address.number && address.neighborhood && address.city && address.state && address.cep;
    if (!isAddressComplete) {
      Toast.show({
        type: 'error',
        text1: 'Campos Inválidos',
        text2: 'Por favor, preencha todos os campos do endereço, incluindo o CEP.',
      });
      isValid = false;
    }

    if (!isValid) {
      Toast.show({
        type: 'error',
        text1: 'Campos Inválidos',
        text2: 'Por favor, corrija os erros antes de salvar.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateClientProfileDto = {
        fullName: fullName,
        phone: phone.replace(/\D/g, ''),
        address: {
          street: address.street,
          number: address.number,
          complement: address.complement,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          cep: address.cep
        }
      };

      const updatedProfile = await updateClientProfile(updateData);

      updateUser({
        fullName: updatedProfile.fullName,
        phone: updatedProfile.phone,
        avatarUrl: avatarUri ?? undefined,
        address: updatedProfile.address,
      });

      Toast.show({
        type: 'success',
        text1: 'Sucesso',
        text2: 'Perfil atualizado com sucesso!',
      });
      router.back();
    } catch (error: any) {
      console.error("[EditProfile] Erro ao salvar alterações:", error);
      Toast.show({
        type: 'error',
        text1: 'Erro',
        text2: error.message || "Não foi possível atualizar o perfil. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    setPhoneError(null);
  };

  const isAddressSectionIncomplete = !address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.cep;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header premium - glass variant */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
        <LinearGradient colors={[theme.primaryLight || '#EAF3FF', theme.background || '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.headerGradient}>
          {Platform.OS !== 'web' && <BlurView intensity={12} tint="light" style={styles.headerBlur} />}
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color="#274B63" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Meu Perfil</Text>
          <View style={styles.headerActionIconPlaceholder} />
        </LinearGradient>
      </Animated.View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.animatedContentWrapper, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          {/* Avatar section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              onPress={() => setShowAvatarSheet(true)}
              onPressIn={onPressInAvatar}
              onPressOut={onPressOutAvatar}
              style={[
                styles.avatarContainer,
                { transform: [{ scale: avatarScaleAnim }] },
                !avatarUri && styles.dashedBorder
              ]}
              disabled={isUploadingAvatar}
              accessibilityLabel="Alterar foto de perfil"
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera-outline" size={40} color="#A0D2EB" />
                  <Text style={styles.uploadText}>Toque para adicionar sua foto</Text>
                </View>
              )}
              {isUploadingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={styles.cameraIconContainer} />
              ) : (
                <View style={styles.cameraIconContainer}>
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowAvatarSheet(true)}
              onPressIn={() => onPressInButton(linkButtonScaleAnim)}
              onPressOut={() => onPressOutButton(linkButtonScaleAnim)}
              style={{ transform: [{ scale: linkButtonScaleAnim }] }}
              disabled={isUploadingAvatar}
              accessibilityLabel="Alterar foto"
            >
              <Text style={styles.changePhotoButtonText}>
                {avatarUri ? 'Alterar Foto' : 'Adicionar Foto'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Form section */}
          <View style={styles.formSection}>
            <Text style={styles.label}>Nome Completo *</Text>
            <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(fullNameBorderAnim, !!fullNameError) }]}>
              <Ionicons name="person-outline" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                onBlur={() => { setFullNameError(fullName.trim() ? null : 'O nome completo é obrigatório.'); animateInputBorder(fullNameBorderAnim, false, !!fullNameError); }}
                onFocus={() => animateInputBorder(fullNameBorderAnim, true, !!fullNameError)}
                placeholder="Seu nome como aparecerá no app"
                placeholderTextColor="#999999"
                textContentType="name"
                autoComplete="name"
                accessibilityLabel="Nome completo"
              />
            </Animated.View>
            <AnimatedErrorMessage message={fullNameError} />

            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputContainer, styles.disabledInputContainer]}>
              <Ionicons name="mail-outline" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={email}
                editable={false}
                placeholderTextColor="#999999"
                accessibilityLabel="Email (não editável)"
              />
            </View>

            <Text style={styles.label}>Telefone *</Text>
            <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(phoneBorderAnim, !!phoneError) }]}>
              <Ionicons name="call-outline" size={20} color="#666666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={handlePhoneChange}
                onBlur={() => { setPhoneError(isValidPhoneNumber(phone) ? null : 'Telefone inválido. Formato esperado (XX) XXXXX-XXXX.'); animateInputBorder(phoneBorderAnim, false, !!phoneError); }}
                onFocus={() => animateInputBorder(phoneBorderAnim, true, !!phoneError)}
                placeholder="(XX) XXXXX-XXXX"
                placeholderTextColor="#999999"
                keyboardType="phone-pad"
                maxLength={15}
                textContentType="telephoneNumber"
                accessibilityLabel="Telefone"
              />
            </Animated.View>
            <AnimatedErrorMessage message={phoneError} />

            <Text style={styles.label}>Endereço</Text>
            {isAddressSectionIncomplete && (
              <EmptyState
                title="Endereço Incompleto"
                subtitle="Por favor, preencha seu endereço para completar seu perfil."
                ctaLabel="Completar Endereço"
                onPress={() => { /* Focar no primeiro input ou scroll */ }}
                style={{ marginBottom: 20 }}
              />
            )}
            <TextInput
              style={styles.inputField}
              placeholder="Rua"
              placeholderTextColor="#999999"
              value={address.street}
              onChangeText={(text) => setAddress(prev => ({ ...prev, street: text }))}
              accessibilityLabel="Rua"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Número"
              placeholderTextColor="#999999"
              value={address.number}
              onChangeText={(text) => setAddress(prev => ({ ...prev, number: text }))}
              keyboardType="numeric"
              accessibilityLabel="Número"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Complemento (Opcional)"
              placeholderTextColor="#999999"
              value={address.complement || ''}
              onChangeText={(text) => setAddress(prev => ({ ...prev, complement: text }))}
              accessibilityLabel="Complemento"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Bairro"
              placeholderTextColor="#999999"
              value={address.neighborhood}
              onChangeText={(text) => setAddress(prev => ({ ...prev, neighborhood: text }))}
              accessibilityLabel="Bairro"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Cidade"
              placeholderTextColor="#999999"
              value={address.city}
              onChangeText={(text) => setAddress(prev => ({ ...prev, city: text }))}
              accessibilityLabel="Cidade"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Estado (Ex: SP)"
              placeholderTextColor="#999999"
              value={address.state}
              onChangeText={(text) => setAddress(prev => ({ ...prev, state: text }))}
              maxLength={2}
              autoCapitalize="characters"
              accessibilityLabel="Estado"
            />
            <TextInput
              style={styles.inputField}
              placeholder="CEP (Ex: 99999-999)"
              placeholderTextColor="#999999"
              value={address.cep || ''}
              onChangeText={(text) => setAddress(prev => ({ ...prev, cep: text }))}
              keyboardType="numeric"
              maxLength={9}
              accessibilityLabel="CEP"
            />
          </View>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              onPressInButton(linkButtonScaleAnim);
              router.push('/(auth)/forgot-password' as any);
            }}
            onPressIn={() => onPressInButton(linkButtonScaleAnim)}
            onPressOut={() => onPressOutButton(linkButtonScaleAnim)}
            disabled={isLoading}
            accessibilityLabel="Alterar senha"
          >
            <MaterialCommunityIcons name="lock-reset" size={20} color="#007AFF" style={styles.linkIcon} />
            <Text style={styles.linkButtonText}>Alterar Senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled, { transform: [{ scale: saveButtonScaleAnim }] }]}
            onPress={handleSaveChanges}
            onPressIn={() => onPressInButton(saveButtonScaleAnim)}
            onPressOut={() => onPressOutButton(saveButtonScaleAnim)}
            disabled={isLoading}
            accessibilityLabel="Salvar alterações"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" style={styles.saveButtonIcon} />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Sheet
        visible={showAvatarSheet}
        onClose={() => setShowAvatarSheet(false)}
        title="Foto de Perfil"
      >
        <View style={styles.sheetContent}>
          <Button
            title="Tirar Foto"
            onPress={takePhotoFromCamera}
            style={styles.sheetButton}
          />
          <Button
            title="Escolher da Galeria"
            onPress={pickImageFromLibrary}
            style={styles.sheetButton}
          />
          {avatarUri && (
            <Button
              title="Remover Foto"
              onPress={removeAvatar}
              kind="ghost"
              style={styles.sheetButton}
            />
          )}
        </View>
      </Sheet>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  animatedContentWrapper: {},
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  headerGradient: {
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderRadius: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  headerBlur: { ...StyleSheet.absoluteFillObject },
  headerBackButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#274B63',
    flex: 1,
    textAlign: 'center',
  },
  headerActionIconPlaceholder: {
    width: 24,
    marginLeft: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 6 },
    }),
  },
  dashedBorder: {
    borderStyle: 'dashed',
    borderColor: '#A0D2EB',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#A0D2EB',
    marginTop: 8,
    textAlign: 'center',
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  changePhotoButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
  },
  formSection: {
    marginBottom: 24,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.02,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#333333',
  },
  disabledInputContainer: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5E5',
  },
  disabledInput: {
    color: '#999999',
  },
  errorMessage: {
    color: '#D32F2F',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 12,
    marginLeft: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  linkIcon: {
    marginRight: 8,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
      },
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: {
    backgroundColor: '#B3D9FF',
  },
  saveButtonIcon: {
    marginRight: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sheetContent: {
    paddingVertical: 16,
  },
  sheetButton: {
    marginBottom: 12,
  }
});
