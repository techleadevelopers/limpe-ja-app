import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatBRL } from '../../../../utils/formatters';
import { AppColors } from '../../../../constants/appStyles';
import {
  InsurancePlanId,
  InsurancePlanProposal,
} from '../../../../types/backend/bookings';

export interface InsuranceOptionsCardProps {
  insuranceOptions: InsurancePlanProposal[];
  selectedPlanId: InsurancePlanId | null;
  onSelectPlan: (planId: InsurancePlanId | null) => void;
}

export const InsuranceOptionsCard = ({
  insuranceOptions,
  selectedPlanId,
  onSelectPlan,
}: InsuranceOptionsCardProps) => {
  const { t } = useTranslation();
  const hasOptions = insuranceOptions.length > 0;

  const handlePlanPress = (planId: InsurancePlanId | null, eligible: boolean) => {
    if (!eligible) return;
    onSelectPlan(planId);
  };

  const formatCoverage = (value: number) => formatBRL(value / 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('schedule_service.insurance_section_title', {
            defaultValue: 'Proteção Residencial (opcional)',
          })}
        </Text>
        <Text style={styles.subtitle}>
          {t('schedule_service.insurance_card_subtitle', {
            defaultValue: 'Proteja seus bens com cobertura adicional.',
          })}
        </Text>
      </View>

      <View style={styles.optionsList}>
        <TouchableOpacity
          testID="insurance-option-none"
          style={[
            styles.option,
            selectedPlanId === null && styles.optionSelected,
          ]}
          onPress={() => handlePlanPress(null, true)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.radioOuter,
              selectedPlanId === null && styles.radioOuterSelected,
            ]}
          >
            {selectedPlanId === null && <View style={styles.radioInner} />}
          </View>
          <View style={styles.optionDetails}>
            <Text style={styles.optionName}>
              {t('schedule_service.insurance_option_none', { defaultValue: 'Sem proteção' })}
            </Text>
            <Text style={styles.optionDetail}>
              {t('schedule_service.insurance_option_none_subtitle', {
                defaultValue: 'Receba o orçamento normal sem custo adicional.',
              })}
            </Text>
          </View>
        </TouchableOpacity>

        {hasOptions ? (
          insuranceOptions.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              testID={`insurance-option-${plan.id}`}
              style={[
                styles.option,
                selectedPlanId === plan.id && styles.optionSelected,
                !plan.eligible && styles.optionDisabled,
              ]}
              onPress={() => handlePlanPress(plan.id, plan.eligible)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.radioOuter,
                  selectedPlanId === plan.id && styles.radioOuterSelected,
                ]}
              >
                {selectedPlanId === plan.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.optionDetails}>
                <Text style={styles.optionName}>{plan.name}</Text>
                <Text style={styles.optionPrice}>{formatBRL(plan.finalPriceCents / 100)}</Text>
                <Text style={styles.optionDetail}>
                  {`Cobertura ${formatCoverage(plan.coverageCents)} • Franquia ${formatCoverage(
                    plan.deductibleCents,
                  )}`}
                </Text>
                {!plan.eligible && plan.reasons.length > 0 && (
                  <Text style={styles.reasonText}>{plan.reasons.join(' • ')}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {t('schedule_service.insurance_card_empty', {
              defaultValue: 'Selecione data, horário e endereço para liberar as opções.',
            })}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 18,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  subtitle: {
    fontSize: 13,
    color: AppColors.textAuxiliary,
    marginTop: 2,
  },
  optionsList: {
    marginTop: 6,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.borderNeutral,
  },
  optionSelected: {
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive,
    borderRadius: 14,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AppColors.borderNeutral,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: AppColors.primaryInteractive,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primaryInteractive,
  },
  optionDetails: {
    flex: 1,
  },
  optionName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryInteractive,
    marginTop: 2,
  },
  optionDetail: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    marginTop: 2,
  },
  reasonText: {
    fontSize: 11,
    color: AppColors.errorRed,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: AppColors.textAuxiliary,
    paddingVertical: 12,
  },
});
