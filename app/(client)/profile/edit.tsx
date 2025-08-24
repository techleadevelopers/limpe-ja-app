// LimpeJaApp/app/(client)/profile/edit.tsx
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'; // Adicionado useMemo
import { // Adicionado useColorScheme, StyleProp, ViewStyle, TextStyle
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
    Pressable, // Adicionado Pressable
    useColorScheme, // Adicionado useColorScheme
    StyleProp, // Adicionado StyleProp
    ViewStyle, // Adicionado ViewStyle
    TextStyle, // Adicionado TextStyle
} from 'react-native';
import { useAuth } from '../../../hooks/useAuth';

import { updateClientProfile } from '../../../services/clientService';
import { BookingAddress } from '../../../types/backend/bookings';
import { UpdateClientProfileDto } from '../../../types/backend/clients';

import { UploadResponseDto } from '../../../types/backend/upload';
import { uploadImageToCloud, FilePurpose } from '../../../services/uploadService';

import { UserProfile } from '../../../types/backend/users';

import { formatPhoneNumber, isValidPhoneNumber } from '../../../utils/helpers';

import Toast from '../../../components/Toast'; // Importar Toast (assumindo NoticeToast)
import { Sheet } from '../../../components/Sheet'; // Importar Sheet
import { EmptyState } from '../../../components/EmptyState'; // Importar EmptyState
import Colors from '../../../constants/Colors'; // Importe Colors para o Button interno

// Componente para exibir mensagens de erro inline com animação
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

// ================================================
// INÍCIO DO CÓDIGO DO COMPONENTE BUTTON (MOVIDO PARA DENTRO DESTE ARQUIVO)
// ================================================

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

// Hook para acessar as cores do tema atual (copiado de Button.tsx)
function useThemeForButton() { // Renomeado para evitar conflito com outros useTheme
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
  const theme = useThemeForButton(); // Usando o hook renomeado

  const variantStyles = useMemo(() => {
    switch (kind) {
      case 'secondary':
        return {
          button: {
            backgroundColor: theme.secondary,
            borderColor: theme.secondary,
            borderWidth: 1,
          },
          text: {
            color: '#FFF',
          },
        };
      case 'ghost':
        return {
          button: {
            backgroundColor: 'transparent',
            borderColor: theme.interactivePrimary || theme.primary,
            borderWidth: 1,
          },
          text: {
            color: theme.interactivePrimary || theme.primary,
          },
        };
      case 'primary':
      default:
        return {
          button: {
            backgroundColor: theme.primary,
            borderColor: theme.primary,
            borderWidth: 1,
          },
          text: {
            color: '#FFF',
          },
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
        buttonStyles.baseButton, // Usando buttonStyles
        variantStyles.button,
        pressed && buttonStyles.buttonPressed, // Usando buttonStyles
        disabled && buttonStyles.buttonDisabled, // Usando buttonStyles
        style,
      ]}
    >
      <Text style={[
        buttonStyles.baseButtonText, // Usando buttonStyles
        variantStyles.text,
        textStyle,
      ]}>
        {title}
      </Text>
    </Pressable>
  );
};

const buttonStyles = StyleSheet.create({ // Renomeado para evitar conflito com styles
  baseButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  baseButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

// ================================================
// FIM DO CÓDIGO DO COMPONENTE BUTTON
// ================================================


export default function EditClientProfileScreen() {
    const { user, updateUser } = useAuth() as { user: UserProfile | null, updateUser: (user: Partial<UserProfile>) => void };

    const router = useRouter();

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

    // Estado para controlar a visibilidade do Sheet de avatar
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
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(contentAnim, {
                toValue: 1,
                duration: 800,
                delay: 200,
                easing: Easing.out(Easing.ease),
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
            outputRange: ['#CED4DA', '#007AFF'],
        });
    };

    const onPressInAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 0.95, useNativeDriver: true }).start(); };
    const onPressOutAvatar = () => { Animated.spring(avatarScaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };

    const onPressInButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 0.96, useNativeDriver: true }).start(); };
    const onPressOutButton = (anim: Animated.Value) => { Animated.spring(anim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start(); };


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
                    updateUser({
                        avatarUrl: uploadResponse.url,
                    });
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
                    updateUser({
                        avatarUrl: uploadResponse.url,
                    });
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

    // Verifica se o endereço está incompleto para exibir o EmptyState
    const isAddressSectionIncomplete = !address.street || !address.number || !address.neighborhood || !address.city || !address.state || !address.cep;

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingContainer}
        >
            <Stack.Screen options={{ headerShown: false }} />

            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Meu Perfil</Text>
                <View style={styles.headerActionIconPlaceholder} />
            </Animated.View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
                <Animated.View style={[styles.animatedContentWrapper, { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            onPress={() => setShowAvatarSheet(true)} // Abre o Sheet ao invés de handlePickImage direto
                            onPressIn={onPressInAvatar}
                            onPressOut={onPressOutAvatar}
                            style={[styles.avatarContainer, { transform: [{ scale: avatarScaleAnim }] }]}
                            disabled={isUploadingAvatar}
                        >
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person-circle-outline" size={80} color="#CED4DA" />
                                </View>
                            )}
                            {isUploadingAvatar ? (
                                <ActivityIndicator size="small" color="#fff" style={styles.cameraIconContainer} />
                            ) : (
                                <View style={styles.cameraIconContainer}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => setShowAvatarSheet(true)} // Abre o Sheet ao invés de handlePickImage direto
                            onPressIn={() => onPressInButton(linkButtonScaleAnim)}
                            onPressOut={() => onPressOutButton(linkButtonScaleAnim)}
                            style={{ transform: [{ scale: linkButtonScaleAnim }] }}
                            disabled={isUploadingAvatar}
                        >
                            <Text style={styles.changePhotoButtonText}>Alterar Foto</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.label}>Nome Completo *</Text>
                        <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(fullNameBorderAnim, !!fullNameError) as any }]}>
                            <Ionicons name="person-outline" size={18} color="#6C757D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={fullName}
                                onChangeText={setFullName}
                                onBlur={() => { setFullNameError(fullName.trim() ? null : 'O nome completo é obrigatório.'); animateInputBorder(fullNameBorderAnim, false, !!fullNameError); }}
                                onFocus={() => animateInputBorder(fullNameBorderAnim, true, !!fullNameError)}
                                placeholder="Seu nome como aparecerá no app"
                                placeholderTextColor="#ADB5BD"
                                textContentType="name"
                                autoComplete="name"
                            />
                        </Animated.View>
                        <AnimatedErrorMessage message={fullNameError} />

                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.inputContainer, styles.disabledInputContainer]}>
                            <Ionicons name="mail-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                                placeholderTextColor="#ADB5BD"
                            />
                        </View>

                        <Text style={styles.label}>Telefone *</Text>
                        <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(phoneBorderAnim, !!phoneError) as any }]}>
                            <Ionicons name="call-outline" size={20} color="#6C757D" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                onBlur={() => { setPhoneError(isValidPhoneNumber(phone) ? null : 'Telefone inválido. Formato esperado (XX) XXXXX-XXXX.'); animateInputBorder(phoneBorderAnim, false, !!phoneError); }}
                                onFocus={() => animateInputBorder(phoneBorderAnim, true, !!phoneError)}
                                placeholder="(XX) XXXXX-XXXX"
                                placeholderTextColor="#ADB57D"
                                keyboardType="phone-pad"
                                maxLength={15}
                                textContentType="telephoneNumber"
                            />
                        </Animated.View>
                        <AnimatedErrorMessage message={phoneError} />

                        {/* Campos de Endereço */}
                        <Text style={styles.label}>Endereço</Text>
                        {isAddressSectionIncomplete && (
                            <EmptyState
                                title="Endereço Incompleto"
                                subtitle="Por favor, preencha seu endereço para completar seu perfil."
                                ctaLabel="Completar Endereço"
                                onPress={() => { /* Poderia focar no primeiro campo de endereço, ou apenas alertar */ }}
                                style={{ marginBottom: 20 }}
                            />
                        )}
                        <TextInput
                            style={styles.inputField} // Usar estilo de input individual
                            placeholder="Rua"
                            placeholderTextColor="#ADB5BD"
                            value={address.street}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, street: text }))}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Número"
                            placeholderTextColor="#ADB5BD"
                            value={address.number}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, number: text }))}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Complemento (Opcional)"
                            placeholderTextColor="#ADB5BD"
                            value={address.complement || ''}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, complement: text }))}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Bairro"
                            placeholderTextColor="#ADB5BD"
                            value={address.neighborhood}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, neighborhood: text }))}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Cidade"
                            placeholderTextColor="#ADB5BD"
                            value={address.city}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, city: text }))}
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="Estado (Ex: SP)"
                            placeholderTextColor="#ADB5BD"
                            value={address.state}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, state: text }))}
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                        <TextInput
                            style={styles.inputField}
                            placeholder="CEP (Ex: 99999-999)"
                            placeholderTextColor="#ADB5BD"
                            value={address.cep || ''}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, cep: text }))}
                            keyboardType="numeric"
                            maxLength={9}
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
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="save-outline" size={20} color="#fff" style={styles.saveButtonIcon}/>
                                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>

            {/* Sheet para ações do avatar */}
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
        backgroundColor: '#F0F8FF', // --background-light-blue
    },
    scrollView: {
        flex: 1,
    },
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    animatedContentWrapper: {
    },
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#223355', // Cor do cabeçalho alinhada com Print 2
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 50 : 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    headerBackButton: {
        marginRight: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        flex: 1,
        textAlign: 'center',
    },
    headerActionIconPlaceholder: {
        width: 24,
        marginLeft: 15,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 10,
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.15)',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E9ECEF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#007AFF',
        padding: 6,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#fff',
    },
    changePhotoButtonText: {
        fontSize: 15,
        color: '#007AFF',
        fontWeight: '600',
        marginTop: 5,
    },
    formSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#495057',
        marginBottom: 8,
        marginTop: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 10, // Bordas mais suaves
        paddingHorizontal: 12,
        height: 52,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputField: { // Novo estilo para inputs de endereço para melhor alinhamento
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CED4DA',
        borderRadius: 10,
        paddingHorizontal: 15,
        height: 52,
        fontSize: 16,
        color: '#212529',
        marginBottom: 10, // Espaçamento entre os inputs
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,0,0,0.05)',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#212529',
    },
    disabledInputContainer: {
        backgroundColor: '#F0F2F5',
        borderColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    disabledInput: {
        color: '#6C757D',
    },
    errorMessage: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 4,
        marginBottom: 10,
        marginLeft: 5,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 25,
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
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
        ...Platform.select({
            ios: {
                shadowColor: 'rgba(0,122,255,0.3)',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    saveButtonDisabled: {
        backgroundColor: '#A0CFFF',
        elevation: 0,
        shadowOpacity: 0,
    },
    saveButtonIcon: {
        marginRight: 10,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    sheetContent: {
        paddingVertical: 10,
    },
    sheetButton: {
        marginBottom: 10,
    }
});