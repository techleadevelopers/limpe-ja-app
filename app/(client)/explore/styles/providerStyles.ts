import { StyleSheet, Dimensions, Platform } from 'react-native';

// Definir FONT_FAMILY aqui para que seja acessível em todo o arquivo de estilos
const FONT_FAMILY = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height; // Adicionado para o fundo com efeito
const IMAGE_HEIGHT = 380; // Altura da imagem de perfil do profissional

// --- Nova Paleta de Cores (Inspirada no Print 2) ---
const COLOR_PRIMARY = '#4A90E2'; // Um azul vibrante para ações principais e destaques (mantido)
const COLOR_ACCENT = '#ADD8E6'; // Um vermelho/rosa vibrante para o preço e coração (inspirado no Print 2)
const COLOR_BACKGROUND = '#E0F2F7'; // Fundo geral da tela, um azul muito claro e suave
const COLOR_CARD_BACKGROUND = '#FFFFFF'; // Fundo de cards e seções principais, branco puro
const COLOR_TEXT_DARK = '#212529'; // Texto principal escuro, para títulos e nomes
const COLOR_TEXT_MEDIUM = '#495057'; // Texto secundário, para descrições e informações
const COLOR_TEXT_LIGHT = '#6C757D'; // Texto terciário, para detalhes menores e datas
const COLOR_BORDER_LIGHT = '#E9ECEF'; // Bordas sutis para elementos
const COLOR_SHADOW = 'rgba(0, 0, 0, 0.08)'; // Sombra suave e discreta (reduzida)
const COLOR_ERROR = '#D32F2F'; // Cor para mensagens de erro
const COLOR_SUCCESS = '#28A745'; // Cor para status de sucesso/verificado
const COLOR_WARNING = '#FFC107'; // Cor para avisos

// Exporta os estilos
export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
 
  },
  centeredFeedback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLOR_BACKGROUND,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLOR_TEXT_MEDIUM,
  },
  errorText: {
    fontSize: 17,
    color: COLOR_ERROR,
    textAlign: 'center',
    marginBottom: 25,
  },
  errorBackButton: {
    backgroundColor: COLOR_PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBackButtonText: {
    color: COLOR_CARD_BACKGROUND,
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContentContainer: {
    paddingBottom: 100, // Ajuste para dar espaço ao botão fixo "Agendar Serviço"
  },

  // --- Estilos para a Imagem do Provedor e o Card Principal (inspirado no Print 2) ---
  providerImageContainer: {
    width: SCREEN_WIDTH, // Ocupa a largura total para a imagem principal
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    marginTop: 0,
    marginBottom: 0,
    alignSelf: 'center',
  },
  providerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
    backgroundColor: COLOR_CARD_BACKGROUND,
    borderRadius: 30,
    padding: 10,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  // Content Area Styles (REVERTIDO PARA O FUNDO BRANCO SÓLIDO)
  contentArea: {
    paddingTop: 20,
    backgroundColor: COLOR_CARD_BACKGROUND, // Fundo branco sólido
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: Dimensions.get('window').height * 0.5,
    paddingBottom: 20,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    // 'overflow: hidden' removido
  },

  // Botões de navegação (header)
  iconButtonBackground: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 45,
  },

  // Informações do provedor (Paddings mantidos)
  providerInfoWhiteCard: {
    paddingHorizontal: 25,
    marginBottom: 10,
    marginTop: -10,
  },
  providerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  providerNameWhiteCard: {
    fontSize: 18,
    fontWeight: '700',
    color: COLOR_TEXT_DARK,
    flexShrink: 1,
    marginRight: 10,
  },
  locationContainerWhiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationTextWhiteCard: {
    fontSize: 14,
    color: COLOR_TEXT_LIGHT,
    marginLeft: 5,
  },
  priceTextWhiteCard: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4A90E2',
    marginBottom: 10,
  },

  // StarRating
  robustStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  robustReviewsText: {
    fontSize: 9,
    color: COLOR_TEXT_LIGHT,
    marginLeft: 4,
    fontWeight: '500',
  },
  starIcon: {
    marginRight: 2,
  },
  starRatingContainer: {
    flexDirection: 'row',
  },

  infoChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 5,
    paddingHorizontal: 0,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
  },
  infoChipText: {
    fontSize: 9,
    color: COLOR_TEXT_MEDIUM,
    marginLeft: 6,
    fontWeight: '500',
  },

  tabContentContainer: {
    paddingHorizontal: 25,
    paddingTop: 15,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLOR_TEXT_DARK,
    marginBottom: 10,
    marginTop: 15,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 23,
    color: COLOR_TEXT_MEDIUM,
    textAlign: 'left',
    marginBottom: 25,
  },
  noReviewsText: {
    fontSize: 14,
    color: COLOR_TEXT_LIGHT,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
    backgroundColor: COLOR_BACKGROUND,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
  },
  noReviewsIcon: {
    marginBottom: 10,
    opacity: 0.6,
  },
  noDetailsText: {
    fontSize: 14,
    color: COLOR_TEXT_LIGHT,
    fontStyle: 'italic',
    marginVertical: 10,
  },
  availabilityText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLOR_TEXT_MEDIUM,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 0,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_CARD_BACKGROUND,
    marginLeft: 5,
    borderRadius: 15,
    width: (SCREEN_WIDTH - 50 - 30) / 4,
    height: 60,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 10,
    color: COLOR_TEXT_MEDIUM,
    marginTop: 5,
    fontWeight: '600',
  },
  disabledActionButton: {
    backgroundColor: '#F1F3F5',
    borderColor: '#DEE2E6',
  },
  disabledActionButtonText: {
    color: '#ADB5BD',
  },

  reviewCard: {
    backgroundColor: COLOR_CARD_BACKGROUND,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewerImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
  },
  reviewerImagePlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 12,
    backgroundColor: COLOR_BORDER_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_TEXT_DARK,
  },
  reviewRatingDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: COLOR_TEXT_LIGHT,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: COLOR_TEXT_MEDIUM,
  },

  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLOR_PRIMARY + '20',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLOR_PRIMARY + '50',
  },
  addReviewButtonText: {
    color: COLOR_PRIMARY,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  serviceItemCard: {
    backgroundColor: COLOR_CARD_BACKGROUND,
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLOR_TEXT_DARK,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: COLOR_TEXT_MEDIUM,
    marginBottom: 6,
  },
  servicePriceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLOR_PRIMARY,
    alignSelf: 'flex-end',
  },

  bookNowButtonWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingTop: 15,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: COLOR_CARD_BACKGROUND,
    borderTopWidth: 1,
    borderTopColor: COLOR_BORDER_LIGHT,
    shadowColor: COLOR_SHADOW,
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  bookServiceButtonGradient: {
    borderRadius: 15,
  },
  bookServiceButton: {
    paddingVertical: 16,
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLOR_PRIMARY,
  },
  bookServiceButtonText: {
    color: COLOR_CARD_BACKGROUND,
    fontSize: 18,
    fontWeight: '700',
  },
  noServicesMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLOR_WARNING + '20',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLOR_WARNING + '50',
    elevation: 5,
  },
  noServicesMessageText: {
    color: COLOR_TEXT_DARK,
    fontSize: 14,
    textAlign: 'center',
  },

  photoSectionContainer: {
    backgroundColor: COLOR_CARD_BACKGROUND,
    paddingVertical: 35,
    paddingBottom: 10,
    marginBottom: 20,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    left: 4,
    paddingHorizontal: 25,
    marginBottom: 10,
    bottom: 20,
  },
  photoSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLOR_TEXT_DARK,
  },
  photoSectionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLOR_BACKGROUND,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoSectionRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLOR_TEXT_MEDIUM,
    marginLeft: 5,
  },
  photoScrollView: {
    paddingLeft: 15,
  },
  thumbnailContainer: {
    width: 70,
    height: 70,
    left: 15,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 7,
    borderWidth: 1,
    borderColor: COLOR_BORDER_LIGHT,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  offerCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  offerDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerDiscount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E53935',
  },
  copyCouponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  copyCouponButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },

  recAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    left: 10,
  },
  recAvatarImg: {
    width: 80, // Aumentado de 28 para 40
    height: 80, // Aumentado de 28 para 40
    borderRadius: 30, // Ajustado para 50% do novo width/height (40/2)
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  recMoreBadge: {
    width: 50, // Aumentado de 28 para 40
    height: 50, // Aumentado de 28 para 40
    borderRadius: 30, // Ajustado para 50% do novo width/height (40/2)
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recMoreBadgeTxt: {
    color: '#FFF',
    fontSize: 14, // Aumentado de 10 para 14
    fontWeight: '700',
  },
  recStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recReviewsTxt: {
    marginLeft: 8,
    fontSize: 16, // Aumentado de 12 para 16
    color: '#9CA3AF',
  },

    avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // Mantido o marginTop para espaçamento original
  },
  avatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  moreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeTxt: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY, // Agora FONT_FAMILY está definido
  },

  // --- ESTILOS DO FUNDO COM EFEITO REMOVIDOS ---
});