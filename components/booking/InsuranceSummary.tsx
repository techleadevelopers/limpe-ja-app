import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { AppColors } from '../../constants/appStyles';
import { formatBRL } from '../../utils/formatters';
import { BookingInsuranceSnapshot } from '../../types/backend/bookings';
interface InsuranceSummaryProps {
  insurance: BookingInsuranceSnapshot;
}

export default function InsuranceSummary({ insurance }: InsuranceSummaryProps) {
  const price = formatBRL(insurance.priceCents / 100);
  const coverage = formatBRL(insurance.coverageCents / 100);
  const deductible = formatBRL(insurance.deductibleCents / 100);

  return (
    <View style={styles.container} testID="insurance-summary">
      <Ionicons
        name="shield-checkmark-outline"
        size={20}
        color={AppColors.primaryInteractive}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.title}>Proteção Residencial</Text>
        <Text style={styles.planName}>{insurance.planId}</Text>
        <Text style={styles.details}>
          {`${price} • Cobertura ${coverage} • Franquia ${deductible}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -2,
    marginBottom: 17,
    paddingVertical: 6,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Platform.OS === 'android' ? 12 : 14,
    fontWeight: '700',
    color: AppColors.textBody,
  },
  planName: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
    marginTop: 2,
  },
  details: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    marginTop: 2,
    lineHeight: 18,
  },
});
