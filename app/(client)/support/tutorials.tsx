// app/(client)/support/tutorials.tsx
// Central leve de tutoriais sob demanda (cards + modal).

import React, { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, AppShadows } from '../../../constants/appStyles';

type TutorialCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  body: string;
};

const TUTORIAL_CARDS: TutorialCard[] = [
  {
    id: 'how_to_book',
    title: 'Como agendar',
    subtitle: 'Passo a passo para fazer seu primeiro agendamento.',
    icon: 'calendar-outline',
    body:
      '1. Escolha um profissional na tela Explorar.\n\n' +
      '2. Toque em “Agendar” para abrir a tela de agendamento.\n\n' +
      '3. Selecione dia, horário e confirme os dados do endereço.\n\n' +
      '4. Finalize o pedido e acompanhe em “Meus agendamentos”.',
  },
  {
    id: 'safety',
    title: 'Segurança e pagamentos',
    subtitle: 'Entenda como o LimpeJá cuida da sua segurança.',
    icon: 'shield-checkmark-outline',
    body:
      'O pagamento é processado de forma segura e os profissionais passam por verificação básica de cadastro.\n\n' +
      'Use sempre o chat interno do app para combinar detalhes e evite pagamentos por fora da plataforma.',
  },
  {
    id: 'cashback',
    title: 'Cashback e pontos',
    subtitle: 'Veja como ganhar e usar benefícios.',
    icon: 'gift-outline',
    body:
      'Sempre que disponível, você verá informações de pontos e cashback na área de carteira e promoções.\n\n' +
      'Você pode usar os benefícios em novos agendamentos conforme as regras exibidas nas campanhas.',
  },
  {
    id: 'talk_to_provider',
    title: 'Como falar com o prestador',
    subtitle: 'Use o chat interno para combinar detalhes.',
    icon: 'chatbubble-ellipses-outline',
    body:
      'Após solicitar um agendamento, use o botão “Contatar” na tela de detalhes do agendamento para abrir o chat.\n\n' +
      'Combine horário de chegada, acesso ao local e dúvidas diretamente com o prestador dentro do app.',
  },
  {
    id: 'cancel_booking',
    title: 'Como cancelar corretamente',
    subtitle: 'Saiba quando e como cancelar um serviço.',
    icon: 'close-circle-outline',
    body:
      'Na tela “Meus agendamentos”, toque no agendamento desejado e use a opção “Cancelar agendamento”.\n\n' +
      'Verifique sempre as regras de cancelamento e possíveis taxas antes de confirmar a ação.',
  },
];

export default function TutorialsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [active, setActive] = useState<TutorialCard | null>(null);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#1A2538" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Tutoriais e ajuda
          </Text>
          <View style={styles.iconRightWrap}>
            <Ionicons name="help-buoy-outline" size={22} color="#3B82F6" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Comece por aqui</Text>
        {TUTORIAL_CARDS.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => setActive(item)}
          >
            <View style={styles.cardIconCircle}>
              <Ionicons name={item.icon} size={20} color={AppColors.white} />
            </View>
            <View style={styles.cardTextWrapper}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={!!active}
        transparent
        animationType="slide"
        onRequestClose={() => setActive(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalIconCircle}>
                {active ? (
                  <Ionicons name={active.icon} size={22} color={AppColors.white} />
                ) : null}
              </View>
              <Text style={styles.modalTitle} numberOfLines={2}>
                {active?.title ?? ''}
              </Text>
            </View>
            <Text style={styles.modalBody}>
              {active?.body ?? ''}
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              activeOpacity={0.9}
              onPress={() => setActive(null)}
            >
              <Text style={styles.modalButtonText}>Entendi</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: '#1A2538',
  },
  iconRightWrap: {
    width: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: AppColors.white,
    marginBottom: 10,
    ...AppShadows.small,
  },
  cardIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextWrapper: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12.5,
    color: '#6B7280',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppColors.primaryInteractive,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
    marginBottom: 16,
  },
  modalButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: AppColors.primaryInteractive,
  },
  modalButtonText: {
    color: AppColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

