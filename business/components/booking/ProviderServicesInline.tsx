// app/components/booking/ProviderServicesInline.tsx
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '@/constants/appStyles';
import type { ProviderServiceOffering } from '@/types/backend/provider-service';

/**
 * Lista horizontal de serviços do mesmo provedor (upsell).
 * - Mostra preço quando existir; caso contrário, "A combinar".
 * - Não navega por conta própria: usa onSelect(serviceId).
 */
type OfferingSafe = ProviderServiceOffering & { price: number | null };

export default function ProviderServicesInline({
  data,
  onSelect,
  title = 'Outros serviços deste profissional',
}: {
  data: OfferingSafe[];
  onSelect: (serviceId: string) => void;
  title?: string;
}) {
  if (!data || data.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <FlatList
        horizontal
        data={data.slice(0, 10)}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onSelect(item.id)} activeOpacity={0.9}>
            <View style={styles.row}>
              <Ionicons name="sparkles-outline" size={18} color={AppColors.primaryInteractive} />
              <Text style={styles.name} numberOfLines={1}>
                {item.service?.name ?? 'Serviço'}
              </Text>
            </View>

            <Text style={styles.price}>
              {formatPriceOptional(item.price)}
            </Text>

            {item.service?.description ? (
              <Text style={styles.desc} numberOfLines={2}>
                {item.service.description}
              </Text>
            ) : null}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}

function formatPriceOptional(v: number | null) {
  if (typeof v === 'number' && Number.isFinite(v)) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return 'A combinar';
}

const styles = StyleSheet.create({
  wrap: { marginTop: 8, marginBottom: 16 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textBody,
    marginLeft: 16,
    marginBottom: 8,
  },
  card: {
    width: 160,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 12,
    // sombra premium suave
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: {
    marginLeft: 6,
    color: AppColors.textBody,
    fontWeight: '600',
    flex: 1,
  },
  price: {
    marginTop: 10,
    color: AppColors.primaryInteractive,
    fontWeight: '800',
    fontSize: 15,
  },
  desc: {
    marginTop: 6,
    color: AppColors.textAuxiliary,
    fontSize: 12,
    lineHeight: 18,
  },
});
