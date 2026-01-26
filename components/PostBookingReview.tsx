import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    Alert,
} from 'react-native';

// Importe sua API aqui (exemplo: import api from '../../services/api')

interface Props {
    bookingId?: string; // OBRIGATÓRIO para a trava funcionar
    providerName: string;
    providerAvatar?: string | null;
    navigation: any;
    visible?: boolean;
    onClose?: () => void;
}

export default function PostBookingReview({ 
    bookingId, 
    providerName, 
    providerAvatar, 
    navigation, 
    visible = true, 
    onClose 
}: Props) {
    const [rating, setRating] = useState(0); 
    const [comment, setComment] = useState('');
    const hasAvatar = !!providerAvatar;
    
    const providerInitial = useMemo(
        () => (providerName ? providerName.charAt(0).toUpperCase() : '?'),
        [providerName],
    );

    const fade = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert("Ops!", "Por favor, selecione uma nota antes de enviar.");
            return;
        }

        try {
            // ENVIA PARA O BACKEND USANDO O ID DO AGENDAMENTO (Target ID)
            // await api.post(`/bookings/${bookingId}/review`, { rating, comment });
            
            console.log(`Sucesso: Booking ${bookingId} avaliado com ${rating} estrelas.`);
            
            if (onClose) onClose();
            else navigation.goBack();
        } catch (error) {
            Alert.alert("Erro", "Não conseguimos salvar sua avaliação. Tente novamente.");
        }
    };

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.overlay}>
                <Animated.View style={[styles.container, { opacity: fade }]}>
                    <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
                        
                        <View style={styles.avatarWrap}>
                            {hasAvatar ? (
                                <Image source={{ uri: providerAvatar }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarFallback]}>
                                    <Text style={styles.avatarInitial}>{providerInitial}</Text>
                                </View>
                            )}
                        </View>

                        <Text style={styles.title}>O que achou do serviço?</Text>
                        <Text style={styles.subtitle}>com **{providerName}**</Text>

                        <View style={styles.starsContainer}>
                            {[1, 2, 3, 4, 5].map((s) => (
                                <TouchableOpacity 
                                    key={s} 
                                    onPress={() => setRating(s)} 
                                    activeOpacity={0.6}
                                    style={styles.starTouch}
                                >
                                    <Ionicons
                                        name={s <= rating ? 'star' : 'star-outline'}
                                        size={42}
                                        color={s <= rating ? '#FFC300' : '#E0E0E0'} 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TextInput
                            placeholder="Conte um pouco mais (opcional)..."
                            placeholderTextColor="#A0A0A0"
                            multiline
                            style={styles.input}
                            value={comment}
                            onChangeText={setComment}
                        />

                        <TouchableOpacity
                            style={[styles.button, { opacity: rating > 0 ? 1 : 0.6 }]}
                            onPress={handleSubmit}
                            disabled={rating === 0}
                        >
                            <LinearGradient
                                colors={['#107FBF', '#0B598F']}
                                style={styles.buttonGradient}
                            >
                                <Text style={styles.buttonText}>Confirmar Avaliação</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.closeAction}>
                            <Text style={styles.closeText}>Pular</Text>
                        </TouchableOpacity>

                    </Animated.View>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    card: { width: '100%', maxWidth: 400, padding: 24, borderRadius: 32, backgroundColor: '#FFFFFF', alignItems: 'center', elevation: 10 },
    avatarWrap: { marginBottom: 12 },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 4, borderColor: '#F0F0F0' },
    avatarFallback: { backgroundColor: '#E8F4FA', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 36, fontWeight: 'bold', color: '#107FBF' },
    title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
    subtitle: { fontSize: 16, color: '#666666', marginTop: 4, marginBottom: 20 },
    starsContainer: { flexDirection: 'row', marginBottom: 20 },
    starTouch: { padding: 5 },
    input: { width: '100%', minHeight: 100, borderRadius: 16, backgroundColor: '#F8F9FA', padding: 16, fontSize: 16, textAlignVertical: 'top', marginBottom: 20, borderWidth: 1, borderColor: '#EEEEEE' },
    button: { width: '100%', borderRadius: 18, overflow: 'hidden' },
    buttonGradient: { paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    closeAction: { marginTop: 15, padding: 10 },
    closeText: { color: '#A0A0A0', fontSize: 14, fontWeight: '500' }
});
