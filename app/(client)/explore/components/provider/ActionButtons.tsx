// components/ActionButtons.tsx
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View, Linking, Alert, Platform } from 'react-native'; // Importado Linking e Alert
import { styles } from '../../styles/providerStyles'; // Assumindo que este caminho está correto

// Definindo a interface para as props do componente
interface ActionButtonsProps {
  providerPhone?: string; // Telefone do provedor
  providerUserId?: string; // ID do usuário para chat (se o chat for interno)
  providerAddress?: { // Objeto de endereço para o mapa
    street: string;
    number: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number; // Latitude para mapa
    longitude?: number; // Longitude para mapa
  };
  // Outras props conforme necessário
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  providerPhone,
  providerUserId,
  providerAddress,
}) => {

  const handleCall = () => {
    if (providerPhone) {
      Linking.openURL(`tel:${providerPhone}`);
    } else {
      Alert.alert('Erro', 'Número de telefone do provedor não disponível.');
    }
  };

  const handleChat = () => {
    if (providerUserId) {
      // Lógica para iniciar o chat com o provedor.
      // Pode ser uma navegação para uma tela de chat, ou uma integração com um SDK de chat.
      Alert.alert('Chat', `Iniciando chat com o provedor (ID: ${providerUserId}).`);
      // Exemplo: router.push(`/chat/${providerUserId}`);
    } else {
      Alert.alert('Erro', 'ID do provedor para chat não disponível.');
    }
  };

  const handleMap = () => {
    if (providerAddress && (providerAddress.latitude && providerAddress.longitude)) {
      const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
      const latLng = `${providerAddress.latitude},${providerAddress.longitude}`;
      const label = encodeURIComponent(`${providerAddress.street}, ${providerAddress.number} - ${providerAddress.city}`);
      const url = Platform.select({
        ios: `${scheme}${label}@${latLng}`,
        android: `${scheme}${latLng}(${label})`
      });
      if (url) {
        Linking.openURL(url).catch(err => console.error('An error occurred', err));
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o mapa.');
      }
    } else if (providerAddress && providerAddress.street && providerAddress.city) {
        // Fallback para abrir o mapa por endereço se lat/lng não estiverem disponíveis
        const addressQuery = encodeURIComponent(`${providerAddress.street}, ${providerAddress.number}, ${providerAddress.city}, ${providerAddress.state}, ${providerAddress.zipCode}`);
        const url = Platform.select({
            ios: `maps:0,0?q=${addressQuery}`,
            android: `geo:0,0?q=${addressQuery}`
        });
        if (url) {
            Linking.openURL(url).catch(err => console.error('An error occurred', err));
        } else {
            Alert.alert('Erro', 'Endereço do provedor para mapa não disponível.');
        }
    } else {
      Alert.alert('Erro', 'Endereço do provedor para mapa não disponível.');
    }
  };

  const handleShare = () => {
    // Lógica para compartilhar o perfil do provedor ou o serviço
    Alert.alert('Compartilhar', 'Funcionalidade de compartilhamento em desenvolvimento.');
  };

  return (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
        <Ionicons name="call-outline" size={22} color="#666" />
        <Text style={styles.actionButtonText}>Ligar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleChat}>
        <Ionicons name="chatbox-ellipses-outline" size={22} color="#666" />
        <Text style={styles.actionButtonText}>Chat</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleMap}>
        <Ionicons name="map-outline" size={22} color="#666" />
        <Text style={styles.actionButtonText}>Mapa</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
        <Ionicons name="share-social-outline" size={22} color="#666" />
        <Text style={styles.actionButtonText}>Share</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ActionButtons;