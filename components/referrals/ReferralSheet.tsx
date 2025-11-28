// components/referrals/ReferralSheet.tsx
// ================================================
import React from 'react';
import { View, Text, StyleSheet, useColorScheme, StyleProp, ViewStyle } from 'react-native';
import { Sheet } from '../../components/Sheet';
import { ReferralBanner } from './ReferralBanner';
import Button from '../common/Button';
import Colors from '../../constants/Colors';

// Hook para acessar as cores do tema atual (reutilizado dos outros componentes)
function useTheme() {
  const scheme = useColorScheme?.() || 'light';
  const theme = (Colors as any)[scheme] || (Colors as any).light;
  return theme as typeof Colors.light;
}

interface ReferralSheetProps {
  visible: boolean;
  onClose: () => void;
  code: string;
  rewardReferrer: string;
  rewardReferred: string;
  onShare: () => void;
}

export const ReferralSheet: React.FC<ReferralSheetProps> = ({
  visible,
  onClose,
  code,
  rewardReferrer,
  rewardReferred,
  onShare,
}) => {
  const theme = useTheme();

  return (
    <Sheet visible={visible} onClose={onClose} title="Indique amigos">
      <View style={styles.contentContainer}>
        <ReferralBanner
          code={code}
          rewardReferrer={rewardReferrer}
          rewardReferred={rewardReferred}
          onShare={onShare}
          onHowItWorks={() => {
            // log removido para performance
          }}
        />
        <Text style={[styles.antiFraudText, { color: theme.textMuted }]}>
          Anti‑fraude: convites limitados, validação por CPF/PIX/telefone/device/IP. Regras de uso e LGPD disponíveis
          nos termos.
        </Text>
        <Button title="Compartilhar agora" onPress={onShare} style={styles.shareButton} />
      </View>
    </Sheet>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
  },
  antiFraudText: {
    marginTop: 12,
    fontSize: 12,
    textAlign: 'center',
  },
  shareButton: {
    marginTop: 12,
  },
});
