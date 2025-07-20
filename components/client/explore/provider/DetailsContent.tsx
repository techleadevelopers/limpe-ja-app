// components/DetailsContent.tsx
import React from 'react';
import { Text, View, StyleSheet } from 'react-native'; // Adicionado StyleSheet
// import { ProviderDetails } from '../../../../../types/types'; // REMOVER esta importação

// Definindo a interface para o serviço oferecido, conforme o DTO do backend
interface OfferedService {
  id: string;
  service: { // Detalhes do serviço em si
    id: string;
    name: string; // Nome do serviço (ex: "Corte de Cabelo")
    description?: string; // Descrição do serviço
  };
  price: number; // Preço do serviço
  // Outros campos relevantes para o serviço oferecido pelo provedor
}

// Definindo a interface ProviderDetails para espelhar a ProviderDetailsDto do backend
// Ajuste conforme a estrutura real do seu DTO de provedor.
interface ProviderDetails {
  id: string;
  // Outros campos do provedor...
  providerServices: OfferedService[]; // Alterado de 'servicosOferecidos' para 'providerServices'
  bio?: string; // Alterado de 'disponibilidadeObservacao' para 'bio' (ou outro campo para observações)
}

interface DetailsContentProps {
  provider: ProviderDetails;
}

const DetailsContent: React.FC<DetailsContentProps> = ({ provider }) => {
  return (
    <View style={styles.tabContentContainer}>
      <Text style={styles.sectionTitle}>Serviços Oferecidos</Text>
      {provider.providerServices && provider.providerServices.length > 0 ? (
        provider.providerServices.map((offeredService, index) => ( // Iterando sobre providerServices
          <View key={offeredService.id || index} style={styles.serviceItemCard}> {/* Usando offeredService.id como key */}
            <Text style={styles.serviceName}>{offeredService.service.name}</Text> {/* Acessando service.name */}
            {offeredService.service.description && <Text style={styles.serviceDescription}>{offeredService.service.description}</Text>} {/* Acessando service.description */}
            <Text style={styles.servicePriceTag}>R$ {offeredService.price.toFixed(2).replace('.', ',')}</Text> {/* Acessando price */}
          </View>
        ))
      ) : (<Text style={styles.noDetailsText}>Nenhum serviço específico detalhado.</Text>)}

      {provider.bio && ( // Usando provider.bio
        <>
          <Text style={[styles.sectionTitle, { marginTop: 25 }]}>Sobre o Profissional</Text>
          <Text style={styles.availabilityText}>{provider.bio}</Text>
        </>
      )}
    </View>
  );
};

// Estilos movidos para dentro do arquivo para auto-suficiência,
// ou você pode manter a importação de '../../styles/providerStyles' se for um arquivo compartilhado.
// Se 'styles' for importado de um arquivo externo, certifique-se de que ele contenha todos esses estilos.
const styles = StyleSheet.create({
  tabContentContainer: {
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  serviceItemCard: {
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E9EDF0',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  servicePriceTag: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2A72E7',
  },
  noDetailsText: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  availabilityText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
  },
});

export default DetailsContent;