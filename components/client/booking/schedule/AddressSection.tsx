import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, SetStateAction } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
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
                <Image
                    source={require('../../../../assets/images/woman.png')}
                    style={styles.trackerIcon}
                />
                <View style={styles.dottedLine} />
                <Image
                    source={require('../../../../assets/images/icons/residencial.png')}
                    style={styles.trackerIcon}
                />
            </View>
            <View style={styles.addressContent}>
                <View style={styles.textContainer}>
                    <Text style={styles.addressTextBold}>
                        {formatAddressLine1(address)}
                        <Text style={styles.addressTextNormal}>
                        {formatAddressLine2(address)}
                    </Text>
                    </Text>
                   
                </View>
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
        marginHorizontal: 46,
        paddingVertical: 15,
        marginTop: 20,
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
    dottedLine: {
        height: 2,
        flex: 1,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#2A72E7',
        marginHorizontal: 10,
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
    textContainer: {
        flex: 1,
    },
    addressTextBold: {
        fontSize: 14,
        color: '#373738ff',
        fontWeight: 'bold',
        flexShrink: 1,
    },
    addressTextNormal: {
        fontSize: 12,
        color: '#363535ff',
        flexShrink: 1,
        marginTop: 4,
    },
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
        borderRadius: 24,
    },
    shineGradient: {
        height: '100%',
        width: '100%',
    },
    // Estilos do Skeleton (adaptados para o novo design)
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
    // Estilos para o modo de input (adaptados para o novo design)
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