// LimpeJaApp/app/(client)/explore/[providerId].tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  // Button, // Usamos TouchableOpacity para botões mais estilizados
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { formatDate } from '../../../utils/helpers'; // Assumindo que este helper existe e funciona

interface ProviderDetails {
  id: string;
  nome: string;
  especialidade: string;
  avaliacao: number;
  precoHora: string;
  imagemUrl: string;
  numeroAvaliacoes?: number;
  isVerificado?: boolean;
  descricaoCompleta?: string;
  servicosOferecidos?: Array<{ nome: string; preco?: string; descricao?: string }>;
  cidade?: string;
  anosExperiencia?: number;
  disponibilidadeObservacao?: string;
}

const TODOS_OS_PRESTADORES_DETALHES: ProviderDetails[] = [
  { id: 'provider1', nome: 'Ana Oliveira', especialidade: 'Limpeza Residencial Especializada', avaliacao: 4.8, precoHora: 'R$ 60-80/h', imagemUrl: 'https://via.placeholder.com/150/ADD8E6/1E3A5F?text=Ana+O', numeroAvaliacoes: 125, isVerificado: true, descricaoCompleta: 'Com mais de 5 anos de experiência, ofereço uma limpeza residencial detalhada e personalizada, utilizando produtos de alta qualidade e ecológicos. Meu foco é transformar sua casa em um ambiente impecável, fresco e acolhedor, cuidando de cada canto com atenção e profissionalismo. Sua satisfação é minha prioridade!', servicosOferecidos: [{nome: 'Limpeza Padrão Completa', descricao: 'Pisos, móveis, banheiros, cozinha.'}, {nome: 'Limpeza Pesada Detalhada', preco: 'Sob consulta', descricao: 'Pós-festa, pré-mudança, faxina geral.'}, {nome: 'Organização de Armários', preco: 'R$ 70/h'}], cidade: 'Campinas, SP', anosExperiencia: 5, disponibilidadeObservacao: 'Agenda aberta para próxima semana' },
  { id: 'provider2', nome: 'Carlos Silva', especialidade: 'Higienização Comercial e Escritórios', avaliacao: 4.9, precoHora: 'R$ 75/h', imagemUrl: 'https://via.placeholder.com/150/E0F7FA/006400?text=Carlos+S', numeroAvaliacoes: 88, isVerificado: false, descricaoCompleta: 'Serviços de limpeza e higienização para ambientes comerciais, escritórios e lojas. Equipe treinada, discrição e eficiência para manter seu local de trabalho sempre apresentável e saudável. Horários flexíveis para não atrapalhar sua rotina.', servicosOferecidos: [{nome: 'Limpeza de Manutenção (Escritório)'}, {nome: 'Higienização Profunda (Comercial)'}], cidade: 'Valinhos, SP', anosExperiencia: 8, disponibilidadeObservacao: 'Disponível para contratos mensais' },
  { id: 'provider3', nome: 'Mariana Costa', especialidade: 'Expert em Limpeza Pós-Obra', avaliacao: 4.7, precoHora: 'A partir de R$ 90/h', imagemUrl: 'https://via.placeholder.com/150/B3E5FC/01579B?text=Mariana+C', numeroAvaliacoes: 55, isVerificado: true, descricaoCompleta: 'Especializada na remoção de sujeira pesada, respingos de tinta, cimento e outros resíduos de construção e reforma. Deixo seu imóvel novo ou recém-reformado impecável e pronto para uso, com equipamento e produtos específicos para cada tipo de material.', servicosOferecidos: [{nome: 'Limpeza Pós-Reforma (Residencial)'}, {nome: 'Limpeza Pós-Construção (Comercial)'}], cidade: 'Campinas, SP', anosExperiencia: 3 },
];

const fetchProviderDetailsFromAPI = async (id: string): Promise<ProviderDetails | undefined> => {
  console.log(`[ProviderDetailsScreen] Buscando detalhes para provider ID: ${id}`);
  await new Promise(resolve => setTimeout(resolve, 800));
  return TODOS_OS_PRESTADORES_DETALHES.find(p => p.id === id);
};


export default function ProviderDetailsScreen() {
  const params = useLocalSearchParams<{ providerId: string }>();
  const providerId = params.providerId;
  const router = useRouter();
  
  const [provider, setProvider] = useState<ProviderDetails | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerId && typeof providerId === 'string') {
      setIsLoading(true); setError(null); setProvider(undefined);
      fetchProviderDetailsFromAPI(providerId)
        .then(data => { setProvider(data || null); if (!data) setError(`Profissional com ID "${providerId}" não encontrado.`); })
        .catch(err => { console.error("[ProviderDetailsScreen] Erro ao buscar detalhes do profissional:", err); setError(err.message || "Erro ao carregar."); setProvider(null); })
        .finally(() => setIsLoading(false));
    } else {
      console.error("[ProviderDetailsScreen] ID do profissional inválido ou não fornecido:", providerId);
      setError("ID do profissional inválido ou não fornecido."); setIsLoading(false); setProvider(null);
    }
  }, [providerId]);

  if (isLoading) {
    return (
        <View style={styles.centered}>
          <Stack.Screen options={{ title: "Carregando Perfil..." }} />
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando perfil do profissional...</Text>
        </View>
      );
  }
  if (error || !provider) {
    return (
        <View style={styles.centered}>
          <Stack.Screen options={{ title: "Erro no Perfil" }} />
          <Ionicons name="alert-circle-outline" size={48} color="#D32F2F" />
          <Text style={styles.errorText}>{error || `Profissional "${providerId || 'desconhecido'}" não encontrado.`}</Text>
          <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#757575', width: '80%'}]} onPress={() => router.back()}>
              <Ionicons name="arrow-back-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      );
  }

  return (
    <View style={styles.outerContainer}>
      <Stack.Screen 
        options={{ 
          title: provider.nome,
        }} 
      />
      <ScrollView style={styles.scrollViewContainer} contentContainerStyle={styles.scrollContentContainer}>
        
        <View style={styles.profileHeader}>
          <Image source={{ uri: provider.imagemUrl }} style={styles.profileImage} />
          <Text style={styles.providerName}>{provider.nome}</Text>
          <Text style={styles.providerSpecialty}>{provider.especialidade}</Text>
          <View style={styles.ratingAndVerifiedContainer}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={18} color="#FFC107" />
              <Text style={styles.providerRating}> {provider.avaliacao.toFixed(1)}</Text>
              {provider.numeroAvaliacoes !== undefined && (
                <Text style={styles.reviewsCount}> ({provider.numeroAvaliacoes} avaliações)</Text>
              )}
            </View>
            {provider.isVerificado && (
              <View style={styles.verifiedBadge}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#4CAF50" />
                <Text style={styles.verifiedText}>Verificado</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.mainActionsContainer}>
            <TouchableOpacity 
            style={[styles.actionButton, styles.primaryActionButton]} 
            onPress={() => {
                if (provider) {
                    router.push({
                        pathname: `/(client)/bookings/schedule-service`,
                        params: { 
                            providerId: provider.id, 
                            providerName: provider.nome, 
                            providerImageUrl: provider.imagemUrl || '', 
                            serviceType: provider.especialidade 
                        }
                    });
                } else {
                    Alert.alert("Erro", "Não foi possível iniciar o agendamento. Detalhes do provedor ausentes.");
                }
            }}>
                <Ionicons name="calendar-outline" size={22} color="#fff" />
                <Text style={styles.actionButtonText}>Agendar Serviço</Text>
            </TouchableOpacity>
            
            {/* //vvv--- ESTA É A PARTE CORRIGIDA PARA O CHATID ---vvv */}
            <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryActionButton]} 
            onPress={() => {
                if (provider) {
                const tempNewChatId = `new_${provider.id}`;
                console.log(`[ProviderDetailsScreen] Navegando para iniciar novo chat com chatId temporário: ${tempNewChatId}, recipientId: ${provider.id}`);
                router.push({
                    pathname: '/(client)/messages/[chatId]', // USA O TEMPLATE DA ROTA DINÂMICA
                    params: { 
                        chatId: tempNewChatId,          // Passa o chatId construído
                        recipientId: provider.id,       // Passa o ID do destinatário
                        recipientName: provider.nome    // Passa o nome do destinatário
                    }
                });
                } else {
                Alert.alert("Erro", "Detalhes do provedor não disponíveis para iniciar mensagem.");
                }
            }} 
            >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={styles.secondaryActionButtonText.color} />
                <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>Enviar Mensagem</Text>
            </TouchableOpacity>
            {/* //^^^--- FIM DA PARTE CORRIGIDA PARA O CHATID ---^^^ */}
        </View>

        <View style={styles.detailsSectionCard}>
          <Text style={styles.sectionTitle}>Sobre {provider.nome.split(' ')[0]}</Text>
          {/* ... resto do JSX para detalhes, serviços, preço, avaliações ... */}
          <Text style={styles.description}>{provider.descricaoCompleta || "Nenhuma descrição detalhada fornecida."}</Text>
          <View style={styles.infoChipsContainer}>
            {provider.cidade && <View style={styles.infoChip}><Ionicons name="location-outline" size={15} style={styles.chipIcon} /> <Text style={styles.chipText}>Atende em: {provider.cidade}</Text></View>}
            {provider.anosExperiencia !== undefined && <View style={styles.infoChip}><Ionicons name="briefcase-outline" size={15} style={styles.chipIcon} /> <Text style={styles.chipText}>{provider.anosExperiencia}+ anos de exp.</Text></View>}
          </View>
        </View>

        {provider.servicosOferecidos && provider.servicosOferecidos.length > 0 && (
          <View style={styles.detailsSectionCard}>
            <Text style={styles.sectionTitle}>Serviços Oferecidos</Text>
            {provider.servicosOferecidos.map((serv, index) => (
              <View key={index} style={styles.serviceItemContainer}>
                  <View>
                    <Text style={styles.serviceItemName}>- {serv.nome}</Text>
                    {serv.descricao && <Text style={styles.serviceItemDescription}>{serv.descricao}</Text>}
                  </View>
                  {serv.preco && <Text style={styles.serviceItemPrice}>{serv.preco}</Text>}
              </View>
            ))}
          </View>
        )}
         
        <View style={styles.detailsSectionCard}>
          <Text style={styles.sectionTitle}>Preço Base</Text>
          <Text style={styles.price}>{provider.precoHora}</Text>
           {provider.disponibilidadeObservacao && 
                <Text style={styles.availabilityNote}><Ionicons name="time-outline" size={15} style={styles.chipIcon} /> {provider.disponibilidadeObservacao}</Text>
            }
        </View>

        <View style={styles.detailsSectionCard}>
            <Text style={styles.sectionTitle}>Avaliações de Clientes</Text>
            <Text style={styles.placeholderText}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</Text>
            <TouchableOpacity style={[styles.actionButton, styles.secondaryActionButton, {marginTop: 15, alignSelf:'center'}]}>
                 <Ionicons name="add-circle-outline" size={20} color={styles.secondaryActionButtonText.color} />
                 <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>Deixar uma Avaliação</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

// Seus estilos completos como definidos anteriormente
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#f0f2f5' },
  scrollViewContainer: { flex: 1 },
  scrollContentContainer: { paddingBottom: 30 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f2f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#555' },
  errorText: { fontSize: 16, color: '#D32F2F', textAlign: 'center', marginBottom: 20 },
  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 25, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomLeftRadius: 30, borderBottomRightRadius: 30, marginBottom: 10, ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.1)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 10 }, android: { elevation: 5 }, }), },
  profileImage: { width: 130, height: 130, borderRadius: 65, marginBottom: 15, borderWidth: 4, borderColor: '#007AFF' },
  providerName: { fontSize: 26, fontWeight: 'bold', color: '#1A2533', marginBottom: 5, textAlign: 'center' },
  providerSpecialty: { fontSize: 17, color: '#586069', marginBottom: 10, textAlign: 'center' },
  ratingAndVerifiedContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 15, marginBottom: 10},
  ratingContainer: { flexDirection: 'row', alignItems: 'center' },
  providerRating: { fontSize: 16, color: '#333', marginLeft: 5, fontWeight: 'bold' },
  reviewsCount: { fontSize: 14, color: 'gray', marginLeft: 5 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
  verifiedText: { marginLeft: 6, color: '#388E3C', fontSize: 13, fontWeight: '600' },
  mainActionsContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 15, paddingVertical: 15, },
  actionButton: { flex: 1, flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 5, minHeight: 50, },
  primaryActionButton: { backgroundColor: '#007AFF', ...Platform.select({  ios: { shadowColor: 'rgba(0,122,255,0.4)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5 }, android: { elevation: 3 }, }), },
  secondaryActionButton: { backgroundColor: '#EFEFF4', borderWidth: 1, borderColor: '#D1D1D6', },
  actionButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', marginLeft: 10, textAlign: 'center' },
  secondaryActionButtonText: { color: '#007AFF', },
  detailsSectionCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, marginHorizontal: 15, marginTop: 15, ...Platform.select({ ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 5 }, android: { elevation: 2 }, }), },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1A2533', marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#f0f2f5', paddingBottom: 12 },
  description: { fontSize: 16, lineHeight: 24, color: '#3A3A3C', marginBottom: 15 },
  detailItem: { fontSize: 16, color: '#3A3A3C', marginBottom: 12, flexDirection: 'row', alignItems: 'center', lineHeight: 23 },
  detailIcon: { marginRight: 10, color: '#8A8A8E' },
  infoChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFF4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 15 },
  chipIcon: { color: '#8A8A8E' },
  chipText: { fontSize: 14, color: '#3A3A3C', marginLeft: 5 },
  serviceItemContainer: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f2f5', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceItemName: { fontSize: 16, color: '#333', fontWeight: '500' },
  serviceItemDescription: { fontSize: 13, color: 'gray', marginTop: 2},
  serviceItemPrice: { fontSize: 16, color: '#333', fontWeight: '500'},
  price: { fontSize: 22, fontWeight: 'bold', color: '#007AFF', marginBottom: 5 },
  availabilityNote: { fontSize: 14, color: '#586069', fontStyle: 'italic', marginTop: 5, flexDirection: 'row', alignItems: 'center'},
  placeholderText: { fontSize: 15, color: 'gray', textAlign: 'center', paddingVertical: 20 },
});