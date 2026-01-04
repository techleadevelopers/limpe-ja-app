import React, { useMemo, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatBRL } from '../../utils/formatters';
import { AppColors } from '../../constants/appStyles';
import { InsurancePlanId, InsurancePlanProposal } from '../../types/backend/bookings';

type PlanTemplate = {
  id: InsurancePlanId;
  title: string;
  badge?: string;
  highlights: string[];
  detail: string;
};

const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: 'ESSENCIAL',
    title: 'Proteção Essencial',
    badge: 'Recomendado',
    highlights: ['Cobertura básica contra danos leves', 'Acionamento digital em minutos'],
    detail:
      'Ideal para residências com objetos eletrônicos e mobiliário. Garante suporte rápido e cobertura para pequenos incidentes.',
  },
  {
    id: 'PREMIUM',
    title: 'Proteção Premium',
    badge: 'Premium',
    highlights: ['Cobertura até R$350 mil', 'Dedutível reduzido', 'Atendimento prioritário'],
    detail:
      'Para clientes que precisam de maior tranquilidade: cobertura ampliada, dedutível reduzido e contato prioritário.',
  },
  {
    id: 'TOTAL',
    title: 'Proteção Completa',
    badge: 'Cobertura Máxima',
    highlights: ['Até R$1 milhão', 'Danos estruturais e pessoais decorrentes', 'Perícia especializada'],
    detail:
      'Cobertura topo de linha com suporte a eventos estruturais, pessoais e assistência especializada para cada etapa do sinistro.',
  },
];

const COMING_SOON_LABEL = 'Disponível em breve';
const NO_PROTECTION_TITLE = 'Sem proteção';
const NO_PROTECTION_DETAIL = 'Mantenha o orçamento sem custo adicional.';

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
  const [detailPlan, setDetailPlan] = useState<PlanTemplate | null>(null);
  const planMap = useMemo(() => {
    const map = new Map<InsurancePlanId, InsurancePlanProposal>();
    insuranceOptions.forEach((plan) => map.set(plan.id, plan));
    return map;
  }, [insuranceOptions]);

  const renderPlanCard = (template: PlanTemplate) => {
    const plan = planMap.get(template.id);
    const available = Boolean(plan && plan.eligible);
    const priceLabel = available
      ? `+${formatBRL((plan?.finalPriceCents ?? 0) / 100)}`
      : t('schedule_service.insurance_option_coming_soon', { defaultValue: COMING_SOON_LABEL });
    const isSelected = selectedPlanId === template.id;

    return (
      <TouchableOpacity
        key={template.id}
        activeOpacity={available ? 0.9 : 1}
        testID={`insurance-option-${template.id}`}
        style={[
          styles.planCard,
          isSelected && styles.planCardSelected,
          !available && styles.planCardDisabled,
        ]}
        onPress={() => available && onSelectPlan(template.id)}
      >
        <View style={styles.planCardHeader}>
          <Text style={styles.planCardTitle}>{template.title}</Text>
          {template.badge && (
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{template.badge}</Text>
            </View>
          )}
        </View>
        <Text style={styles.planPrice}>{priceLabel}</Text>
        <View style={styles.planHighlights}>
          {template.highlights.map((item) => (
            <View key={item} style={styles.planHighlightRow}>
              <View style={styles.planHighlightDot} />
              <Text style={styles.planHighlightText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={styles.planFooterRow}>
          <TouchableOpacity
            onPress={() => available && setDetailPlan(template)}
            disabled={!available}
          >
            <Text style={[styles.planDetailsText, !available && styles.planDetailsDisabled]}>
              {t('schedule_service.insurance_detail_action', { defaultValue: 'Ver detalhes' })}
            </Text>
          </TouchableOpacity>
          <View style={[styles.planSelectIndicator, isSelected && styles.planSelectIndicatorActive]}>
            {isSelected && <View style={styles.planSelectDot} />}
          </View>
        </View>
        {!available && (
          <Text style={styles.planComingSoon}>
            {t('schedule_service.insurance_option_coming_soon', { defaultValue: COMING_SOON_LABEL })}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

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
            defaultValue: 'Selecione o plano que melhor protege seu lar.',
          })}
        </Text>
      </View>

      <View style={styles.optionsList}>
        <TouchableOpacity
          testID="insurance-option-none"
          style={[styles.noneCard, selectedPlanId === null && styles.noneCardSelected]}
          onPress={() => onSelectPlan(null)}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.noneTitle}>{NO_PROTECTION_TITLE}</Text>
            <Text style={styles.noneDetail}>{NO_PROTECTION_DETAIL}</Text>
          </View>
          <View style={styles.planSelectIndicator}>
            {selectedPlanId === null && <View style={[styles.planSelectDot, styles.planSelectDotActive]} />}
          </View>
        </TouchableOpacity>
        {PLAN_TEMPLATES.map(renderPlanCard)}
      </View>

      <Modal
        visible={Boolean(detailPlan)}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailPlan(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{detailPlan?.title}</Text>
            <Text style={styles.modalBody}>{detailPlan?.detail}</Text>
            <Text style={styles.modalHighlightsTitle}>Coberturas inclusas</Text>
            {detailPlan?.highlights.map((highlight) => (
              <Text key={highlight} style={styles.modalHighlightText}>
                - {highlight}
              </Text>
            ))}
            <TouchableOpacity onPress={() => setDetailPlan(null)} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>{t('common.close', { defaultValue: 'Fechar' })}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginTop: 4,
  },
  optionsList: {
    marginTop: 8,
  },
  noneCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: AppColors.backgroundNeutral,
    borderRadius: 14,
    marginBottom: 12,
  },
  noneCardSelected: {
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive,
  },
  noneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody,
  },
  noneDetail: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
    marginTop: 4,
  },
  planCard: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  planCardSelected: {
    borderColor: AppColors.primaryInteractive,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textBody,
  },
  planBadge: {
    backgroundColor: AppColors.primaryInteractive,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  planBadgeText: {
    color: AppColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  planPrice: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primaryInteractive,
  },
  planHighlights: {
    marginTop: 10,
  },
  planHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planHighlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AppColors.primaryInteractive,
    marginRight: 8,
  },
  planHighlightText: {
    fontSize: 12,
    color: AppColors.textAuxiliary,
  },
  planFooterRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planDetailsText: {
    fontSize: 13,
    color: AppColors.primaryInteractive,
    fontWeight: '600',
  },
  planDetailsDisabled: {
    opacity: 0.4,
  },
  planSelectIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AppColors.borderNeutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSelectIndicatorActive: {
    borderColor: AppColors.primaryInteractive,
  },
  planSelectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primaryInteractive,
  },
  planSelectDotActive: {
    backgroundColor: AppColors.white,
  },
  planComingSoon: {
    marginTop: 10,
    fontSize: 12,
    color: AppColors.textAuxiliary,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.textBody,
  },
  modalBody: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.textBody,
  },
  modalHighlightsTitle: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textAuxiliary,
  },
  modalHighlightText: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.textBody,
  },
  modalCloseButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.primaryInteractive,
  },
});
