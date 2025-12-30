import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppColors } from '../../../../constants/appStyles';
import { VerificationStatus } from '../../../../types/backend/auth';

interface VerificationNoticeProps {
  status?: VerificationStatus;
  onLearnMore: () => void;
}

const VerificationNotice: React.FC<VerificationNoticeProps> = ({ status, onLearnMore }) => {
  const { t } = useTranslation();

  const label = useMemo(() => {
    if (!status) {
      return t('common.verification_pending', { defaultValue: 'Em verificação' });
    }
    const isPending = status.startsWith('PENDING');
    return isPending
      ? t('common.verification_pending', { defaultValue: 'Em verificação' })
      : t('common.verification_waiting_approval', { defaultValue: 'Aguardando aprovação' });
  }, [status, t]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>
        {t('schedule_service.provider_pending_message', {
          defaultValue: 'Este profissional ainda está em verificação. Aguarde aprovação para agendar.',
        })}
      </Text>
      <TouchableOpacity style={styles.cta} onPress={onLearnMore} activeOpacity={0.8}>
        <Text style={styles.ctaText}>
          {t('common.verification_learn_more', { defaultValue: 'Entenda a verificação' })}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F3F5F8',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  description: {
    marginTop: 4,
    fontSize: 12,
    color: AppColors.textBody,
    textAlign: 'center',
  },
  cta: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive,
  },
  ctaText: {
    color: AppColors.primaryInteractive,
    fontWeight: '700',
    fontSize: 12,
  },
});

export default VerificationNotice;
