import { Ionicons } from '@expo/vector-icons';
import React, { useRef } from 'react';
import { Animated, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BookingDetails, BookingStatus } from '../../../types/backend/bookings'; // CORRIGIDO: Importação e uso de BookingDetails
import UpcomingServiceItem from './UpcomingServiceItem';

interface UpcomingServicesSectionProps {
  contentAnim: Animated.Value;
  upcomingServices: BookingDetails[]; // CORRIGIDO: Usar BookingDetails[]
  onServicePress: (bookingId: string) => void;
  onViewAllServicesPress: () => void;
  isLoading: boolean; // Adicionado prop para estado de carregamento
  onAcceptService: (bookingId: string) => void; // Passa a ação para o item
  onRejectService: (bookingId: string) => void; // Passa a ação para o item
  onContactClient: (clientId: string) => void; // Passa a ação para o item
}

const UpcomingServicesSection: React.FC<UpcomingServicesSectionProps> = ({
  contentAnim,
  upcomingServices,
  onServicePress,
  onViewAllServicesPress,
  isLoading,
  onAcceptService,
  onRejectService,
  onContactClient,
}) => {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const renderUpcomingServiceItem = ({ item }: { item: BookingDetails }) => {
    const isPendingRequest = item.status === BookingStatus.PENDING_PROVIDER_CONFIRMATION;
    const isConfirmed = item.status === BookingStatus.CONFIRMED;
    const badgeVariant = isPendingRequest ? 'pending' : 'confirmed';
    const badgeLabel = isPendingRequest ? 'Nova Solicitação' : 'Confirmado';
    return (
      <UpcomingServiceItem
        key={item.id}
        booking={item}
        onPress={onServicePress}
        onAcceptPress={onAcceptService}
        onRejectPress={onRejectService}
        onContactClient={onContactClient}
        showAcceptRejectActions={isPendingRequest}
        showChatAction={isConfirmed}
        statusBadgeLabel={badgeLabel}
        statusBadgeVariant={badgeVariant}
      />
    );
  };

  return (
    <Animated.View
      style={[
        styles.sectionContainer,
        { opacity: contentAnim, transform: [{ translateY: contentAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
      ]}
    >
      <Text style={styles.sectionTitle}>Próximos Serviços & Novas Solicitações</Text>

      {isLoading ? (
        <View style={{ padding: 15 }}>
          {[...Array(2)].map((_, i) => ( // Renderiza 2 placeholders de serviço
            <View key={i} style={[styles.skeletonItem, { backgroundColor: '#F8F8F8' }]}> {/* Adicionado BG para visibilidade */}
              <View style={styles.skeletonServiceInfo}>
                <View style={{ width: '80%', height: 20, borderRadius: 4, backgroundColor: '#E0E0E0' }} />
                <View style={{ width: '60%', height: 14, borderRadius: 4, marginTop: 8, backgroundColor: '#E0E0E0' }} />
                <View style={{ width: '70%', height: 14, borderRadius: 4, marginTop: 4, backgroundColor: '#E0E0E0' }} />
                <View style={{ width: '90%', height: 14, borderRadius: 4, marginTop: 4, backgroundColor: '#E0E0E0' }} />
              </View>
              <View style={styles.skeletonServiceActions}>
                <View style={{ width: 80, height: 20, borderRadius: 4, backgroundColor: '#E0E0E0' }} />
                <View style={{ width: 60, height: 10, borderRadius: 4, marginTop: 5, backgroundColor: '#E0E0E0' }} />
              </View>
            </View>
          ))}
        </View>
      ) : upcomingServices.length > 0 ? (
        <FlatList
          data={upcomingServices}
          renderItem={renderUpcomingServiceItem}
          keyExtractor={(item) => item.id}
          scrollEnabled={false} // Desabilitar rolagem interna se a seção for pequena e a rolagem for gerenciada pelo pai
          contentContainerStyle={styles.flatListContentContainer}
          // Adicionar props de otimização se a lista for potencialmente muito longa
          // initialNumToRender={5}
          // maxToRenderPerBatch={10}
          // windowSize={10}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="calendar-outline" size={60} color="#CED4DA" style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>Nenhum serviço agendado ou nova solicitação no momento.</Text>
          <Text style={styles.emptyStateSubText}>Mantenha sua disponibilidade atualizada para receber mais!</Text>
          <TouchableOpacity style={styles.emptyStateCta} onPress={() => {/* Navegar para Gerenciar Disponibilidade */}}>
            <Text style={styles.emptyStateCtaText}>Gerenciar Disponibilidade</Text>
            <Ionicons name="settings-outline" size={18} color="#007AFF" />
          </TouchableOpacity>
        </View>
      )}
      <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={onViewAllServicesPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          activeOpacity={1}
        >
          <Text style={styles.viewAllButtonText}>Ver Todos os Serviços</Text>
          <Ionicons name="arrow-forward-outline" size={18} color="#007AFF" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 0 },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C3A5F',
    marginBottom: 15,
  },
  flatListContentContainer: {
    // Adicione estilos aqui se precisar de padding ou margem para os itens da FlatList
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  emptyStateIcon: {
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#868E96',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 5,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#ADB5BD',
    textAlign: 'center',
    marginBottom: 15,
  },
  emptyStateCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  emptyStateCtaText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E9ECEF',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 5,
  },
  skeletonItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E9ECEF',
    marginBottom: 5,
    // Adicionar um background para o esqueleto ser visível
    backgroundColor: '#F0F0F0', // Cor clara para o fundo do item de esqueleto
  },
  skeletonServiceInfo: {
    flex: 3,
    marginRight: 8,
  },
  skeletonServiceActions: {
    flex: 1.5,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});

export default UpcomingServicesSection;
