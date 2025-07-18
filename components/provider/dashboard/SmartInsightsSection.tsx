
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SmartSuggestion {
  type: 'pricing' | 'availability' | 'service_improvement' | 'marketing';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: any;
}

interface SmartInsightsSectionProps {
  dashboardData: any;
  onViewInsights: () => void;
}

const SmartInsightsSection: React.FC<SmartInsightsSectionProps> = ({
  dashboardData,
  onViewInsights,
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      // Aqui você faria a chamada para o endpoint de sugestões IA
      // const response = await getSmartSuggestions();
      
      // Mock de sugestões por enquanto
      const mockSuggestions: SmartSuggestion[] = [
        {
          type: 'service_improvement',
          title: 'Melhore sua pontualidade',
          description: 'Clientes mencionaram atrasos. Chegue 5 min mais cedo para aumentar sua nota.',
          impact: 'high',
          actionable: true,
        },
        {
          type: 'pricing',
          title: 'Oportunidade de aumento',
          description: 'Seus preços estão 15% abaixo da média do mercado.',
          impact: 'medium',
          actionable: true,
        },
      ];
      
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Erro ao carregar sugestões:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#FF6B6B';
      case 'medium': return '#FFB946';
      case 'low': return '#4ECDC4';
      default: return '#6C757D';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pricing': return 'cash-outline';
      case 'availability': return 'calendar-outline';
      case 'service_improvement': return 'trending-up-outline';
      case 'marketing': return 'megaphone-outline';
      default: return 'bulb-outline';
    }
  };

  if (suggestions.length === 0 && !isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          <MaterialCommunityIcons name="brain" size={20} color="#007AFF" /> Insights Inteligentes
        </Text>
        <TouchableOpacity onPress={onViewInsights}>
          <Text style={styles.viewAllText}>Ver Todos</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity key={index} style={styles.suggestionCard}>
            <LinearGradient
              colors={['#FFFFFF', '#F8F9FD']}
              style={styles.cardGradient}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getImpactColor(suggestion.impact) }]}>
                  <Ionicons name={getTypeIcon(suggestion.type) as any} size={20} color="#FFFFFF" />
                </View>
                <View style={[styles.impactBadge, { backgroundColor: getImpactColor(suggestion.impact) }]}>
                  <Text style={styles.impactText}>{suggestion.impact.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
              <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
              {suggestion.actionable && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => Alert.alert('Ação', 'Funcionalidade em desenvolvimento')}
                >
                  <Text style={styles.actionButtonText}>Aplicar Sugestão</Text>
                  <Ionicons name="arrow-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 25,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A2538',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  suggestionsScroll: {
    marginHorizontal: -15,
    paddingHorizontal: 15,
  },
  suggestionCard: {
    width: 280,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 16,
    height: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  impactText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A2538',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
});

export default SmartInsightsSection;
