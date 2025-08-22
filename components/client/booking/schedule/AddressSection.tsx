import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, SetStateAction, useEffect } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Easing
} from 'react-native';
import { BookingAddress } from '../../../../types/backend/bookings';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AddressSectionProps {
    address: BookingAddress;
    setAddress: Dispatch<SetStateAction<BookingAddress>>;
    shineAnim: Animated.Value;
    isLoading?: boolean;
    isInputMode?: boolean;
    onEditAddress?: () => void;
}

const AddressSection: React.FC<AddressSectionProps> = ({ address, setAddress, shineAnim, isLoading, isInputMode, onEditAddress }) => {
    const trackerIconPulseAnim = new Animated.Value(1);
    const dottedLineShineAnim = new Animated.Value(0);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(trackerIconPulseAnim, {
                    toValue: 1.1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(trackerIconPulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(dottedLineShineAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(dottedLineShineAnim, {
                    toValue: 0,
                    duration: 0,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const formatAddressLine1 = (addr: BookingAddress): string => {
        return `${addr.street}, ${addr.number}`;
    };

    const formatAddressLine2 = (addr: BookingAddress): string => {
        const { neighborhood, city, state, cep } = addr;
        return `${neighborhood}, ${city}/${state} - ${cep}`;
    };

    if (isLoading) {
        return (
            <View style={styles.addressBriefSkeleton}>
                <View style={styles.mapIconSkeleton} />
                <View style={styles.skeletonLineAddress} />
            </View>
        );
    }

    if (isInputMode || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
        return (
            <View style={styles.addressInputContainer}>
                <Text style={styles.addressInputTitle}>Informe o Endereço da Faxina</Text>
                <View style={styles.inputGroup}>
                    <Ionicons name="location-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Rua"
                        value={address.street}
                        onChangeText={(text: string) => setAddress({ ...address, street: text })}
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Ionicons name="home-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Número"
                        value={address.number}
                        onChangeText={(text: string) => setAddress({ ...address, number: text })}
                        keyboardType="numeric"
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Ionicons name="flag-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Complemento (Opcional)"
                        value={address.complement || ''}
                        onChangeText={(text: string) => setAddress({ ...address, complement: text })}
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Ionicons name="map-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Bairro"
                        value={address.neighborhood}
                        onChangeText={(text: string) => setAddress({ ...address, neighborhood: text })}
                        placeholderTextColor="#888"
                    />
                </View>
                <View style={styles.inputRow}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Ionicons name="business-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="Cidade"
                            value={address.city}
                            onChangeText={(text: string) => setAddress({ ...address, city: text })}
                            placeholderTextColor="#888"
                        />
                    </View>
                    <View style={[styles.inputGroup, { width: 100 }]}>
                        <Ionicons name="bookmark-outline" size={20} color="#888" style={styles.inputIcon} />
                        <TextInput
                            style={styles.inputSmall}
                            placeholder="Estado (Ex: SP)"
                            value={address.state}
                            onChangeText={(text: string) => setAddress({ ...address, state: text })}
                            maxLength={2}
                            autoCapitalize="characters"
                            placeholderTextColor="#888"
                        />
                    </View>
                </View>
                <View style={styles.inputGroup}>
                    <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="CEP"
                        value={address.cep}
                        onChangeText={(text: string) => setAddress({ ...address, cep: text })}
                        keyboardType="numeric"
                        maxLength={9}
                        placeholderTextColor="#888"
                    />
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.addressCard} onPress={onEditAddress}>
            <View style={styles.addressTracker}>
                <Animated.Image
                    source={require('../../../../assets/images/woman.png')}
                    style={[styles.trackerIcon, { transform: [{ scale: trackerIconPulseAnim }] }]}
                />
                <View style={styles.dottedLineWrapper}>
                    <View style={styles.dottedLine} />
                    <Animated.View style={[
                        styles.dottedLineShine,
                        {
                            transform: [{
                                translateX: dottedLineShineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-SCREEN_WIDTH * 0.5, SCREEN_WIDTH * 0.5]
                                })
                            }]
                        }
                    ]}>
                        <LinearGradient
                            colors={['transparent', 'rgba(255,255,255,0.7)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                </View>
                <Animated.Image
                    source={require('../../../../assets/images/icons/residencial.png')}
                    style={[styles.trackerIcon, { transform: [{ scale: trackerIconPulseAnim }] }]}
                />
            </View>
            <View style={styles.addressContent}>
                {/* INÍCIO DAS ALTERAÇÕES PARA O ÍCONE E TEXTO DO ENDEREÇO */}
                <View style={styles.addressInfoWrapper}>
                    <Ionicons name="location-sharp" size={22} color="#2A72E7" style={styles.locationIcon} />
                    <View style={styles.addressTextWrapper}>
                        <Text style={styles.addressLine1}>
                            {formatAddressLine1(address)}
                        </Text>
                        <Text style={styles.addressLine2}>
                            {formatAddressLine2(address)}
                        </Text>
                    </View>
                </View>
                {/* FIM DAS ALTERAÇÕES */}
                <TouchableOpacity onPress={onEditAddress} style={styles.editButton}>
                    <Ionicons name="pencil-outline" size={15} color="#FFF" />
                </TouchableOpacity>
            </View>
            <Animated.View style={[styles.shineEffectContainer, { transform: [{ translateX: shineAnim }] }]}>
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shineGradient}
                />
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    addressCard: {
        backgroundColor: '#bfd4f7c3',
        borderRadius: 24,
        marginHorizontal: 36,
        paddingVertical: 15,
        marginTop: 1,
        marginBottom: 20,
        padding: 20,
        overflow: 'hidden',
    },
    addressTracker: {
        marginHorizontal: 4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    trackerIcon: {
        marginHorizontal: 5,
        width: 31,
        height: 31,
        tintColor: '#2A72E7',
    },
    dottedLineWrapper: {
        flex: 1,
        height: 2,
        overflow: 'hidden',
        marginHorizontal: 10,
        position: 'relative',
    },
    dottedLine: {
        height: '100%',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#2A72E7',
        position: 'absolute',
        width: '100%',
    },
    dottedLineShine: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
    },
    addressContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        flex: 1,
        zIndex: 1,
        marginHorizontal: 6,
        paddingTop: 15,
        borderTopColor: '#6ba0d9ff',
        borderTopWidth: 1,
    },
    // INÍCIO DOS NOVOS E MODIFICADOS ESTILOS
    locationIcon: {
        marginRight: 8, // Espaçamento entre o ícone e o texto
    },
    addressInfoWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Alinha o ícone com o topo do bloco de texto
        flex: 1, // Permite que o wrapper ocupe o espaço disponível
    },
    addressTextWrapper: {
        flex: 1, // Permite que o texto quebre linha dentro deste container
    },
    addressLine1: {
        fontSize: 14,
        color: '#373738ff', // Cor original do texto
        fontWeight: 'bold',
        flexShrink: 1,
    },
    addressLine2: {
        fontSize: 12,
        color: '#363535ff', // Cor original do texto
        flexShrink: 1,
        marginTop: 4, // Espaçamento entre as linhas
    },
    // FIM DOS NOVOS E MODIFICADOS ESTILOS

    // Estilos antigos removidos/substituídos:
    // textContainer
    // addressTextBold
    // addressTextNormal

    editButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#3753f0e1',
        marginLeft: 10,
    },
    shineEffectContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        width: SCREEN_WIDTH * 0.3,
        transform: [{ skewX: '-20deg' }],
        overflow: 'hidden',
        zIndex: 0,
        borderRadius: 4,
    },
    shineGradient: {
        height: '100%',
        width: '100%',
    },
    addressBriefSkeleton: {
        borderRadius: 24,
        marginHorizontal: 16,
        marginTop: 20,
        height: 100,
        backgroundColor: '#333',
        justifyContent: 'center',
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },
    mapIconSkeleton: {
        width: 44,
        height: 44,
        marginRight: 16,
        backgroundColor: '#555',
        borderRadius: 22,
    },
    skeletonLineAddress: {
        height: 12,
        width: '70%',
        backgroundColor: '#555',
        borderRadius: 8,
    },
    addressInputContainer: {
        backgroundColor: '#1E1E1E',
        padding: 24,
        marginHorizontal: 16,
        borderRadius: 24,
        marginTop: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
        elevation: 15,
    },
    addressInputTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 24,
        textAlign: 'center',
    },
    inputGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#333',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderColor: '#555',
        borderWidth: 1,
        height: 56,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#FFF',
        paddingLeft: 10,
    },
    inputSmall: {
        flex: 1,
        fontSize: 16,
        color: '#FFF',
        paddingLeft: 10,
    },
    inputIcon: {
        marginRight: 10,
        color: '#AAA',
    },
});

export default AddressSection;