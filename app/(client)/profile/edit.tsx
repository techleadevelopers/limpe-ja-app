// LimpeJaApp/app/(client)/profile/edit.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert as ReactNativeAlert,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// <--- CORREÇÕES: Importações de serviços e tipagens
import { updateClientProfile } from '../../../app/services/clientService'; // Apenas a função
import { UserProfile } from '../../types/backend/users'; // UserProfile vem de users.ts
import { BookingAddress } from '../../types/backend/bookings'; // BookingAddress vem de bookings.ts (usado para o endereço do usuário)
import { UpdateClientProfileDto } from '../../types/backend/clients'; // <--- CORREÇÃO: Importa UpdateClientProfileDto do caminho correto

// <--- CORREÇÕES: Importar funções utilitárias
import { formatDate, isValidPhoneNumber, formatPhoneNumber } from '../../../utils/helpers'; // Importar formatDate e outras utils

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

export default function EditClientProfileScreen() {
    const { user, updateUser } = useAuth();
    const router = useRouter();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [address, setAddress] = useState<BookingAddress>(user?.address || {
        street: '',
        number: '',
        complement: null,
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
    });
    const [phone, setPhone] = useState(user?.phone || '');

    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl || null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [nameError, setNameError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentAnim = useRef(new Animated.Value(0)).current;
    const avatarScaleAnim = useRef(new Animated.Value(1)).current;
    const saveButtonScaleAnim = useRef(new Animated.Value(1)).current;
    const linkButtonScaleAnim = useRef(new Animated.Value(1)).current;

    const nameBorderAnim = useRef(new Animated.Value(0)).current;
    const phoneBorderAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (user) {
            setName(user.name || '');
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
                useNativeDriver: true,
            }),
            Animated.timing(contentAnim, {
                toValue: 1,
                duration: 800,
                delay: 200,
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


    const handlePickImage = async () => {
        setIsUploadingAvatar(true);
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                ReactNativeAlert.alert("Permissão Necessária", "Você precisa permitir o acesso à galeria para escolher uma foto.");
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
                setAvatarUri(newAvatarUri);
                console.log("[EditProfile] Imagem selecionada:", newAvatarUri);
                ReactNativeAlert.alert("Sucesso", "Foto selecionada. (Upload real ainda não implementado)");
            }
        } catch (error) {
            console.error("[EditProfile] Erro ao selecionar imagem:", error);
            ReactNativeAlert.alert("Erro", "Não foi possível selecionar a imagem.");
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleSaveChanges = async () => {
        let isValid = true;

        if (!name.trim()) {
            setNameError('O nome completo é obrigatório.');
            isValid = false;
        } else {
            setNameError(null);
        }

        if (!isValidPhoneNumber(phone)) {
            setPhoneError('Telefone inválido. Formato esperado (XX) XXXXX-XXXX.');
            isValid = false;
        } else {
            setPhoneError(null);
        }

        if (!address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
            ReactNativeAlert.alert("Campos Inválidos", "Por favor, preencha todos os campos do endereço.");
            isValid = false;
        }

        if (!isValid) {
            ReactNativeAlert.alert("Campos Inválidos", "Por favor, corrija os erros antes de salvar.");
            return;
        }

        setIsLoading(true);
        try {
            const updateData: UpdateClientProfileDto = {
                fullName: name,
                phone: phone.replace(/\D/g, ''),
                address: {
                    street: address.street,
                    number: address.number,
                    complement: address.complement,
                    neighborhood: address.neighborhood,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode // Inclua zipCode se o backend esperar
                }
            };
            
            const updatedProfile = await updateClientProfile(updateData);

            updateUser({
                ...user,
                name: updatedProfile.name,
                phone: updatedProfile.phone,
                avatarUrl: avatarUri ?? undefined,
                address: updatedProfile.address,
            });

            ReactNativeAlert.alert("Sucesso", "Perfil atualizado com sucesso!");
            router.back();
        } catch (error: any) {
            console.error("[EditProfile] Erro ao salvar alterações:", error);
            ReactNativeAlert.alert("Erro", error.message || "Não foi possível atualizar o perfil. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePhoneChange = (text: string) => {
        const formatted = formatPhoneNumber(text);
        setPhone(formatted);
        setPhoneError(null);
    };


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
                            onPress={handlePickImage}
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
                            onPress={handlePickImage}
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
                        <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(nameBorderAnim, !!nameError) as any }]}>
                            <Ionicons name="person-outline" size={18} color="#8A8A8E" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                onBlur={() => { setNameError(name.trim() ? null : 'O nome completo é obrigatório.'); animateInputBorder(nameBorderAnim, false, !!nameError); }}
                                onFocus={() => animateInputBorder(nameBorderAnim, true, !!nameError)}
                                placeholder="Seu nome como aparecerá no app"
                                placeholderTextColor="#ADB5BD"
                                textContentType="name"
                                autoComplete="name"
                            />
                        </Animated.View>
                        <AnimatedErrorMessage message={nameError} />

                        <Text style={styles.label}>Email</Text>
                        <View style={[styles.inputContainer, styles.disabledInputContainer]}>
                            <Ionicons name="mail-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, styles.disabledInput]}
                                value={email}
                                editable={false}
                                placeholderTextColor="#ADB5BD"
                            />
                        </View>

                        <Text style={styles.label}>Telefone *</Text>
                        <Animated.View style={[styles.inputContainer, { borderColor: getInputBorderColor(phoneBorderAnim, !!phoneError) as any }]}>
                            <Ionicons name="call-outline" size={20} color="#8A8A8E" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={phone}
                                onChangeText={handlePhoneChange}
                                onBlur={() => { setPhoneError(isValidPhoneNumber(phone) ? null : 'Telefone inválido. Formato esperado (XX) XXXXX-XXXX.'); animateInputBorder(phoneBorderAnim, false, !!phoneError); }}
                                onFocus={() => animateInputBorder(phoneBorderAnim, true, !!phoneError)}
                                placeholder="(XX) XXXXX-XXXX"
                                placeholderTextColor="#ADB5BD"
                                keyboardType="phone-pad"
                                maxLength={15}
                                textContentType="telephoneNumber"
                            />
                        </Animated.View>
                        <AnimatedErrorMessage message={phoneError} />

                        {/* Campos de Endereço (NOVO) */}
                        <Text style={styles.label}>Endereço</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Rua"
                            placeholderTextColor="#ADB5BD"
                            value={address.street}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, street: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Número"
                            placeholderTextColor="#ADB5BD"
                            value={address.number}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, number: text }))}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Complemento (Opcional)"
                            placeholderTextColor="#ADB5BD"
                            value={address.complement || ''}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, complement: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Bairro"
                            placeholderTextColor="#ADB5BD"
                            value={address.neighborhood}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, neighborhood: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Cidade"
                            placeholderTextColor="#ADB5BD"
                            value={address.city}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, city: text }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Estado (Ex: SP)"
                            placeholderTextColor="#ADB5BD"
                            value={address.state}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, state: text }))}
                            maxLength={2}
                            autoCapitalize="characters"
                        />
                        {/* Se tiver CEP no UserProfile/BookingAddress */}
                        {/* <TextInput
                            style={styles.input}
                            placeholder="CEP"
                            placeholderTextColor="#ADB5BD"
                            value={address.zipCode || ''}
                            onChangeText={(text) => setAddress(prev => ({ ...prev, zipCode: text }))}
                            keyboardType="numeric"
                            maxLength={9} // 99999-999
                        /> */}

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
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    keyboardAvoidingContainer: {
        flex: 1,
        backgroundColor: '#F8F9FA',
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
        backgroundColor: '#007AFF',
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
        borderColor: '#CED4DA', // Cor da borda padrão
        borderRadius: 10,
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
});