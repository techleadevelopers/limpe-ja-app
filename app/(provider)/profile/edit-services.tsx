// LimpeJaApp/app/(provider)/profile/edit-services.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    FlatList,
    TouchableOpacity,
    Platform,
    Animated, // Importar Animated para animações
    KeyboardAvoidingView, // Para lidar com o teclado
    ScrollView, // Para o formulário
    ActivityIndicator,
} from 'react-native';
// CORREÇÃO: Importar Picker de @react-native-picker/picker
import { Picker } from '@react-native-picker/picker';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
 
// Import PricingType from shared types
import { PricingType } from '../../../types/backend/services';
 
interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  price: number; // CORREÇÃO: Alterado para number para consistência com o backend
  duration?: string; // ex: '2 horas', 'varia'
  pricingType: PricingType; // NEW: Pricing type
  pricePerSquareMeter?: number; // NEW: Price per square meter (as number)
  pricePerRoom?: number; // NEW: Price per room (as number)
}
 
// Componente para cada item de serviço com animações
const AnimatedServiceItem: React.FC<{
    item: ServiceOffering;
    onEdit: (service: ServiceOffering) => void;
    onDelete: (serviceId: string) => void;
    delay: number; // Para animação escalonada
}> = ({ item, onEdit, onDelete, delay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current; // Para feedback de toque
 
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                delay: delay,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim, delay]);
 
    const onPressInItem = () => {
        Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
    };
 
    const onPressOutItem = () => {
        Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }).start();
    };
 
    const handleDelete = () => {
        Alert.alert(
            "Excluir Serviço",
            `Tem certeza que deseja excluir "${item.name}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { text: "Excluir", style: "destructive", onPress: () => onDelete(item.id) }
            ]
        );
    };

    // Função auxiliar para formatar o preço baseado no tipo de precificação
    const formatPriceDisplay = (service: ServiceOffering) => {
        switch (service.pricingType) {
            case PricingType.FIXED_PRICE:
                return `R$ ${service.price.toFixed(2).replace('.', ',')}`;
            case PricingType.HOURLY:
                return `R$ ${service.price.toFixed(2).replace('.', ',')}/hora`;
            case PricingType.BY_SIZE:
                let sizePrice = '';
                if (service.pricePerSquareMeter) {
                    sizePrice += `R$ ${service.pricePerSquareMeter.toFixed(2).replace('.', ',')}/m²`;
                }
                if (service.pricePerRoom) {
                    sizePrice += (sizePrice ? ' / ' : '') + `R$ ${service.pricePerRoom.toFixed(2).replace('.', ',')}/cômodo`;
                }
                return sizePrice || 'A definir';
            default:
                return 'Preço a consultar';
        }
    };
 
    return (
        <Animated.View
            style={[
                styles.serviceItemWrapper,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }
            ]}
        >
            <TouchableOpacity
                onPressIn={onPressInItem}
                onPressOut={onPressOutItem}
                activeOpacity={1} // Desativa o activeOpacity padrão
                style={styles.serviceItem}
            >
                <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{item.name}</Text>
                    {item.description ? <Text style={styles.serviceDescription} numberOfLines={2}>{item.description}</Text> : null}
                    <Text style={styles.servicePrice}>Preço: {formatPriceDisplay(item)}</Text> {/* Usar a função de formatação */}
                    {item.duration && item.pricingType !== PricingType.BY_SIZE ? <Text style={styles.serviceDuration}>Duração: {item.duration}</Text> : null}
                </View>
                <View style={styles.serviceActions}>
                    <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionButton}>
                        <Ionicons name="create-outline" size={24} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                        <Ionicons name="trash-outline" size={24} color="#D32F2F" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};
 
 
export default function EditProviderServicesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Estados para adicionar/editar serviço
  const [isEditing, setIsEditing] = useState<ServiceOffering | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState(''); // Manter como string para input
  const [pricingType, setPricingType] = useState<PricingType>(PricingType.FIXED_PRICE); // Default to FIXED_PRICE
  const [pricePerSquareMeter, setPricePerSquareMeter] = useState('');
  const [pricePerRoom, setPricePerRoom] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');
 
  // Animações
  const headerAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const listHeaderAnim = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0)).current;
 
  useEffect(() => {
    // Animações de entrada do cabeçalho
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
 
    console.log("[EditProviderServicesScreen] Carregando serviços...");
    setIsLoading(true); // Set loading to true initially
    // TODO: Chamar providerService para carregar serviços oferecidos pelo provedor
    // const fetchServices = async () => { /* ... */ }
    // fetchServices(); // Call your actual fetch function here
    // Simulação
    setTimeout(() => {
      setServices([
        // CORREÇÃO: Adicionar pricingType e outros campos aos dados mockados
        { id: 's1', name: 'Limpeza Padrão Residencial', description: 'Limpeza de rotina para casas e apartamentos, incluindo aspiração, varrição, lavagem de banheiros e cozinha.', price: 60, pricingType: PricingType.HOURLY, duration: 'Mín. 2 horas' },
        { id: 's2', name: 'Limpeza Pesada (Pós-Obra/Mudança)', description: 'Limpeza profunda e detalhada, ideal para após reformas, construções ou mudanças. Inclui remoção de resíduos, limpeza de rejuntes e vidros.', price: 90, pricingType: PricingType.HOURLY, duration: 'Mín. 3 horas' },
        { id: 's3', name: 'Limpeza de Estofados', description: 'Higienização e lavagem a seco de sofás, cadeiras e tapetes, removendo manchas e odores.', price: 150, pricingType: PricingType.FIXED_PRICE, duration: 'Varia' },
        { id: 's4', name: 'Limpeza por Metragem', description: 'Limpeza baseada na área total, ideal para grandes espaços.', price: 0, pricingType: PricingType.BY_SIZE, pricePerSquareMeter: 10.50, pricePerRoom: 50.00 },
      ]);
      setIsLoading(false); // Set loading to false after data is fetched/simulated
      // Animação para o formulário, cabeçalho da lista e botão de salvar
      Animated.stagger(150, [
          Animated.timing(formAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(listHeaderAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(saveButtonAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }, 1000);
  }, [headerAnim, formAnim, listHeaderAnim, saveButtonAnim]);
 
  const handleSaveServices = async () => {
    setIsLoading(true);
    // TODO: Chamar providerService para salvar todas as alterações nos serviços no backend
    console.log("[EditProviderServicesScreen] Salvando serviços:", services);
    setTimeout(() => {
        Alert.alert("Sucesso", "Seus serviços foram atualizados com sucesso!");
        setIsLoading(false);
        // router.back(); // Pode voltar para a tela de perfil após salvar
    }, 1500);
  };
 
  const handleAddOrUpdateService = () => {
    // Validação básica
    if (!serviceName) {
      Alert.alert("Erro", "Nome do serviço é obrigatório.");
      return;
    }
 
    let finalPrice: number = 0;
    let finalPricePerSquareMeter: number | undefined = undefined;
    let finalPricePerRoom: number | undefined = undefined;
 
    if (pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) {
        if (!servicePrice || isNaN(parseFloat(servicePrice))) {
            Alert.alert("Erro", "Preço é obrigatório e deve ser um número.");
            return;
        }
        finalPrice = parseFloat(servicePrice);
    } else if (pricingType === PricingType.BY_SIZE) {
        if (!pricePerSquareMeter && !pricePerRoom) {
            Alert.alert("Erro", "Pelo menos um preço (por m² ou por cômodo) é obrigatório para serviços por metragem/cômodo.");
            return;
        }
        if (pricePerSquareMeter) {
            if (isNaN(parseFloat(pricePerSquareMeter))) {
                Alert.alert("Erro", "Preço por m² deve ser um número.");
                return;
            }
            finalPricePerSquareMeter = parseFloat(pricePerSquareMeter);
        }
        if (pricePerRoom) {
            if (isNaN(parseFloat(pricePerRoom))) {
                Alert.alert("Erro", "Preço por cômodo deve ser um número.");
                return;
            }
            finalPricePerRoom = parseFloat(pricePerRoom);
        }
    }
 
    const newService: ServiceOffering = {
      id: isEditing ? isEditing.id : String(Date.now()), // Reutiliza ID se estiver editando
      name: serviceName,
      description: serviceDesc,
      price: finalPrice, // Usar o preço final calculado/parseado
      duration: serviceDuration,
      pricingType: pricingType,
      pricePerSquareMeter: finalPricePerSquareMeter,
      pricePerRoom: finalPricePerRoom,
    };
 
    if (isEditing) {
      setServices(prev => prev.map(s => s.id === isEditing.id ? newService : s));
    } else {
      setServices(prev => {
        const updatedServices = [...prev, newService];
        return updatedServices.sort((a,b) => a.name.localeCompare(b.name)); // Sort alphabetically
      });
    }
    // Limpar formulário
    setIsEditing(null);
    setServiceName('');
    setServiceDesc('');
    setServicePrice('');
    setServiceDuration('');
    setPricingType(PricingType.FIXED_PRICE);
    setPricePerSquareMeter('');
    setPricePerRoom('');
  };
 
  const startEdit = (service: ServiceOffering) => {
    setIsEditing(service);
    setServiceName(service.name);
    setServiceDesc(service.description);
    setServicePrice(service.price.toString()); // Converter number para string para o TextInput
    setPricingType(service.pricingType);
    setPricePerSquareMeter(service.pricePerSquareMeter?.toString() || '');
    setPricePerRoom(service.pricePerRoom?.toString() || '');
    setServiceDuration(service.duration || '');
  };
 
  const deleteService = (serviceId: string) => {
    setServices(prev => prev.filter(s => s.id !== serviceId));
    Alert.alert("Serviço Excluído", "O serviço foi removido da sua lista.");
  };
 
  if (isLoading) {
    return (
        // << CORREÇÃO: Alterado styles.container para styles.outerContainer >>
        <View style={styles.outerContainer}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Custom Header para o estado de loading */}
            <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
                <Text style={styles.headerTitle}>Editar Serviços</Text>
                <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
            </Animated.View>
            <View style={styles.centeredFeedback}>
                {/* << CORREÇÃO: ActivityIndicator é agora importado e pode ser usado >> */}
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Carregando seus serviços...</Text>
            </View>
        </View>
    );
  }
 
  return (
    <KeyboardAvoidingView
        style={styles.outerContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} // Ajuste conforme a altura do cabeçalho
    >
      <Stack.Screen options={{ headerShown: false }} />
 
      {/* Custom Header */}
      <Animated.View style={[styles.customHeader, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Meus Serviços</Text>
          <View style={styles.headerActionIconPlaceholder} /> {/* Placeholder para alinhar */}
      </Animated.View>
 
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <Animated.View style={[styles.formContainer, { opacity: formAnim, transform: [{ translateY: formAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <Text style={styles.formTitle}>{isEditing ? 'Editar Serviço Existente' : 'Adicionar Novo Serviço'}</Text>
            <TextInput
                style={styles.input}
                placeholder="Nome do Serviço (ex: Limpeza Padrão)"
                placeholderTextColor="#ADB5BD"
                value={serviceName}
                onChangeText={setServiceName}
            />
            <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Descrição Detalhada (ex: Inclui aspiração, lavagem de banheiros...)"
                placeholderTextColor="#ADB5BD"
                value={serviceDesc}
                onChangeText={setServiceDesc}
                multiline
            />
 
            <Text style={styles.inputLabel}>Tipo de Precificação</Text>
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={pricingType}
                    onValueChange={(itemValue: PricingType) => { // CORREÇÃO: Tipar itemValue
                        setPricingType(itemValue);
                        // Limpar campos de preço específicos ao mudar o tipo
                        setServicePrice('');
                        setPricePerSquareMeter('');
                        setPricePerRoom('');
                        setServiceDuration('');
                    }}
                    style={styles.picker}
                >
                    <Picker.Item label="Preço Fixo por Serviço" value={PricingType.FIXED_PRICE} />
                    <Picker.Item label="Por Hora" value={PricingType.HOURLY} />
                    <Picker.Item label="Por Metragem/Cômodo" value={PricingType.BY_SIZE} />
                    {/* <Picker.Item label="Orçamento Personalizado" value={PricingType.CUSTOM_QUOTE} /> */}
                </Picker>
            </View>
 
            {/* Render inputs based on pricingType */}
            {(pricingType === PricingType.FIXED_PRICE || pricingType === PricingType.HOURLY) && (
                <>
                    <TextInput
                        style={styles.input}
                        placeholder={pricingType === PricingType.FIXED_PRICE ? "Preço Fixo (ex: R$ 250,00)" : "Valor por Hora (ex: R$ 60,00)"}
                        placeholderTextColor="#ADB5BD"
                        value={servicePrice}
                        onChangeText={setServicePrice}
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Duração (ex: 2 horas, Varia)"
                        placeholderTextColor="#ADB5BD"
                        value={serviceDuration}
                        onChangeText={setServiceDuration}
                    />
                </>
            )}
 
            {pricingType === PricingType.BY_SIZE && (
                <>
                    <TextInput style={styles.input} placeholder="Preço por m² (ex: R$ 10,50)" placeholderTextColor="#ADB5BD" value={pricePerSquareMeter} onChangeText={setPricePerSquareMeter} keyboardType="numeric" />
                    <TextInput style={styles.input} placeholder="Preço por Cômodo (ex: R$ 50,00)" placeholderTextColor="#ADB5BD" value={pricePerRoom} onChangeText={setPricePerRoom} keyboardType="numeric" />
                    <Text style={styles.inputHint}>Preencha um ou ambos. O cliente escolherá como informar o tamanho.</Text>
                </>
            )}
 
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleAddOrUpdateService}>
                <Text style={styles.actionButtonPrimaryText}>{isEditing ? "Atualizar Serviço" : "Adicionar Novo Serviço"}</Text>
            </TouchableOpacity>
            {isEditing && (
                <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => { setIsEditing(null); setServiceName(''); setServiceDesc(''); setServicePrice(''); setServiceDuration(''); setPricingType(PricingType.FIXED_PRICE); setPricePerSquareMeter(''); setPricePerRoom(''); }}>
                    <Text style={styles.actionButtonSecondaryText}>Cancelar Edição</Text>
                </TouchableOpacity>
            )}
        </Animated.View>
 
        <Animated.Text style={[styles.listHeader, { opacity: listHeaderAnim, transform: [{ translateY: listHeaderAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            Serviços Cadastrados:
        </Animated.Text>
 
        {services.length === 0 ? (
            <View style={styles.emptyListContainer}>
                <Ionicons name="pricetags-outline" size={50} color="#CED4DA" />
                <Text style={styles.emptyListText}>Você ainda não adicionou nenhum serviço.</Text>
                <Text style={styles.emptyListSubText}>Use o formulário acima para começar!</Text>
            </View>
        ) : (
            <FlatList
                data={services}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <AnimatedServiceItem
                        item={item}
                        onEdit={startEdit}
                        onDelete={deleteService}
                        delay={index * 50 + 200} // Atraso para cada item
                    />
                )}
                contentContainerStyle={styles.flatListContent}
                ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
                scrollEnabled={false} // Desabilita o scroll da FlatList para que o ScrollView pai gerencie
            />
        )}
 
        <Animated.View style={[styles.saveButtonContainer, { opacity: saveButtonAnim, transform: [{ translateY: saveButtonAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleSaveServices}>
                <Text style={styles.actionButtonPrimaryText}>Salvar Todas as Alterações</Text>
            </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
 
const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F0F2F5', // Fundo geral da tela
  },
  scrollViewContent: {
    paddingBottom: 40, // Espaço no final
    paddingHorizontal: 15,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF', // Cor primária do app
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 50 : 20, // Ajuste para status bar iOS
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
  headerActionIconPlaceholder: { // Para alinhar o título no centro
    width: 24, // Largura do ícone
    marginLeft: 15,
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
      marginTop: 15,
      fontSize: 16,
      color: '#6C757D',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 20, // Espaço do cabeçalho
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 4 },
    }),
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#212529',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 8,
    marginTop: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 15,
    overflow: 'hidden', // Ensures the picker content respects border radius
  },
  picker: {
    height: 50,
    width: '100%',
  },
  actionButtonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionButtonSecondary: {
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionButtonSecondaryText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginTop: 10,
    marginBottom: 15,
  },
  flatListContent: {
    // Não precisa de padding aqui, o wrapper já tem
  },
  serviceItemWrapper: { // Wrapper para a animação de cada item
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 10, // Espaço entre os itens
    overflow: 'hidden',
    ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
        android: { elevation: 2 },
    }),
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  servicePrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 13,
    color: '#868E96',
  },
  inputHint: {
    fontSize: 12,
    color: '#6C757D',
    marginBottom: 15,
    textAlign: 'center',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: '#F8F9FA',
  },
  listSeparator: {
    height: 1,
    backgroundColor: '#E9ECEF',
    marginVertical: 5, // Espaço extra para a linha
  },
  saveButtonContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  emptyListContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  emptyListText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#343A40',
    marginTop: 15,
    marginBottom: 5,
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#6C757D',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});