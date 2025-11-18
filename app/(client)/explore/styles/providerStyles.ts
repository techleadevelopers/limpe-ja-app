import { StyleSheet, Dimensions, Platform } from 'react-native';
import { AppColors, AppShadows, SCREEN_WIDTH, SCREEN_HEIGHT } from '../../../../constants/appStyles'; // Importe AppColors e AppShadows

// Definir FONT_FAMILY aqui para que seja acessível em todo o arquivo de estilos
const FONT_FAMILY = Platform.select({ ios: 'System', android: 'Roboto', default: 'System' });

const IMAGE_HEIGHT = 380; // Altura da imagem de perfil do profissional

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
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: AppColors.textAuxiliary, // Usando AppColors
  },
  errorText: {
    fontSize: 17,
    color: AppColors.errorRed, // Usando AppColors
    textAlign: 'center',
    marginBottom: 25,
  },
  errorBackButton: {
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBackButtonText: {
    color: AppColors.white, // Usando AppColors
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContentContainer: {
    paddingBottom: 30, // Ajuste para dar espaço ao botão fixo "Agendar Serviço"
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
    backgroundColor: AppColors.white, // Usando AppColors
    borderRadius: 30,
    padding: 10,
    ...AppShadows.small, // Usando AppShadows
  },

  // Content Area Styles (REVERTIDO PARA O FUNDO BRANCO SÓLIDO)
  contentArea: {
    paddingTop: 20,
    backgroundColor: AppColors.white, // Usando AppColors
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    minHeight: Dimensions.get('window').height * 0.5,
    paddingBottom: 20,
   
  },

  // Botões de navegação (header)
  iconButtonBackground: {
    backgroundColor: 'rgba(0,0,0,0.3)', // Cor de fundo original para botões de ícone
    padding: 10,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: 45,
    height: 45,
    
  },

  // --- NOVOS ESTILOS PARA O CABEÇALHO (HEADER) ---
  headerContainer: {
    backgroundColor: AppColors.white, // Usando AppColors
    ...AppShadows.medium, // Usando AppShadows
    
  },
  headerTitle: {
    color: AppColors.textBody, // Usando AppColors
    fontSize: 18,
    fontWeight: '600',
  },
  // --- FIM DOS NOVOS ESTILOS PARA O CABEÇALHO ---

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
    marginTop: 10,
  },
  providerNameWhiteCard: {
    fontSize: 23,
    fontWeight: '700',
    color: AppColors.textBody, // Usando AppColors
    flexShrink: 1,
    marginRight: 10,
  },
  locationContainerWhiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    
  },
  locationTextWhiteCard: {
    fontSize: 14.5,
    color: AppColors.textAuxiliary, // Usando AppColors
    marginLeft: 5,
  },
  priceTextWhiteCard: {
    fontSize: 21,
    fontWeight: '700',
    color: AppColors.primaryInteractive, // Usando AppColors
    marginBottom: -2,
    left: 5,
  },

  // StarRating
  robustStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    left: 50,
  },
  robustReviewsText: {
    fontSize: 9,
    color: AppColors.mediumGray, // Usando AppColors
    marginLeft: 4,
    top: 15,
    right: 70,
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
    gap: 4,
    marginBottom: 15,
    marginTop: -1,
    paddingHorizontal: 10,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 20,

  },
  priceDropContainer: {
  position: 'absolute',
  right: 20,
  top: 110, // Ajustado para flutuar na lateral superior da imagem (altura header ~60 + offset 50 para topo da foto)
  zIndex: 10,
  alignItems: 'center',
  justifyContent: 'center',
},

priceDropContent: {
  width: 90,
  height: 90,
  alignItems: 'center',
  justifyContent: 'center',
  transform: [{ rotate: '0deg' }],
},

priceDropInner: {
  position: 'absolute',
  top: 24,
  alignItems: 'center',
  justifyContent: 'center',
},

priceDropLogo: {
  width: 26,
  height: 26,
  resizeMode: 'contain',
  marginBottom: 2,
},

priceDropText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '700',
  textAlign: 'center',
  textShadowColor: 'rgba(0,0,0,0.25)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
},

  
  infoChipText: {
    fontSize: 11,
    color: AppColors.textAuxiliary, // Usando AppColors
    marginLeft: 6,
    fontWeight: '500',
  },

  tabContentContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    
  },
  sectionTitle: {
      fontSize: 20,
      left: 4,
      paddingHorizontal: 6,
      fontWeight: '700',
      color: AppColors.textBody, // Usando AppColors
      
      marginBottom: 10,
     marginTop: 25,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 23,
    color: AppColors.textAuxiliary, // Usando AppColors
    textAlign: 'left',
    marginBottom: 15,
    // --- INJETADO: Estilos para a descrição do provedor ---
    paddingHorizontal: 10, // Adicionado padding horizontal de 10px
    fontFamily: 'Montserrat-Regular', // Definido a fonte Montserrat-Regular
    // --- FIM DA INJEÇÃO ---
  },
  noReviewsText: {
    fontSize: 14,
    color: AppColors.mediumGray, // Usando AppColors
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 30,
    marginBottom: 20,
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    borderRadius: 15,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  noReviewsIcon: {
    marginBottom: 10,
    opacity: 0.6,
    
  },
  noDetailsText: {
    fontSize: 14,
    color: AppColors.mediumGray, // Usando AppColors
    fontStyle: 'italic',
    marginVertical: 10,
  },
  availabilityText: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textAuxiliary, // Usando AppColors
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
    backgroundColor: AppColors.white, // Usando AppColors
    marginLeft: 5,
    borderRadius: 15,
    width: (SCREEN_WIDTH - 50 - 30) / 4,
    height: 60,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
  },
  actionButtonText: {
    fontSize: 10,
    color: AppColors.textAuxiliary, // Usando AppColors
    marginTop: 5,
    fontWeight: '600',
  },
  disabledActionButton: {
    backgroundColor: AppColors.backgroundNeutral, // Usando AppColors
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  disabledActionButtonText: {
    color: AppColors.mediumGray, // Usando AppColors
  },

  reviewCard: {
    backgroundColor: AppColors.white, // Usando AppColors
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
    
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    
  },
  reviewerImage: {
    width: 75,
    height: 75,
    borderRadius: 22.5,
    marginRight: 12,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  reviewerImagePlaceholder: {
    width: 65,
    height: 65,
    borderRadius: 22.5,
    marginRight: 12,
    backgroundColor: AppColors.borderNeutral, // Usando AppColors
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewHeaderText: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody, // Usando AppColors
  },
  reviewRatingDate: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: AppColors.mediumGray, // Usando AppColors
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 22,
    color: AppColors.textAuxiliary, // Usando AppColors
    fontFamily: 'Montserrat-Regular', // ADICIONADO: Fonte para o comentário
  },

  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: AppColors.primaryInteractive + '20', // Usando AppColors
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: AppColors.primaryInteractive + '50', // Usando AppColors
  },
  addReviewButtonText: {
    color: AppColors.primaryInteractive, // Usando AppColors
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  serviceItemCard: {
    backgroundColor: AppColors.white, // Usando AppColors
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: AppColors.textAuxiliary, // Usando AppColors
    marginBottom: 6,
  },
  servicePriceTag: {
    fontSize: 10,
    fontWeight: '700',
    color: AppColors.primaryInteractive, // Usando AppColors
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
    backgroundColor: AppColors.white, // Usando AppColors
    borderTopWidth: 1,
    borderTopColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.medium, // Usando AppColors
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
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
  },
  bookServiceButtonText: {
    color: AppColors.white, // Usando AppColors
    fontSize: 18,
    fontWeight: '700',
  },
  noServicesMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: AppColors.warningYellow + '20', // Usando AppColors
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: AppColors.warningYellow + '50', // Usando AppColors
    elevation: 5,
  },
  noServicesMessageText: {
    color: AppColors.textBody, // Usando AppColors
    fontSize: 14,
    textAlign: 'center',
  },

  photoSectionContainer: {
    backgroundColor: AppColors.white, // Usando AppColors
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
  priceBackgroundWrapper: {
  alignSelf: 'flex-start',
  marginTop: 4,
  marginBottom: 6,
},

priceWrapper: {
  marginTop: 6,
  marginBottom: 4,
},

priceValue: {
  fontSize: 22,
  fontWeight: '800',
  color: AppColors.primaryInteractive,
},

priceUnit: {
  marginTop: 6,
  fontSize: 14,
  fontWeight: '600',
  color: AppColors.textAuxiliary,
},

locationDistanceText: {
  color: '#7C8590',
  fontSize: 14,
  fontWeight: '500',
},


priceBackground: {
  paddingVertical: 8,
  paddingHorizontal: 19,
  borderRadius: 14,
  right: 30,
  backgroundColor: '#EAF4FF',
  ...Platform.select({
    ios: {
      shadowColor: '#A2CFFF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
},

  photoSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textBody, // Usando AppColors
  },
  photoSectionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  photoSectionRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textAuxiliary, // Usando AppColors
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
    borderColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  offerCard: {
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: AppColors.textBody, // Usando AppColors
    marginBottom: 5,
  },
  offerDescription: {
    fontSize: 14,
    color: AppColors.textAuxiliary, // Usando AppColors
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
    color: AppColors.errorRed, // Usando AppColors
  },
  copyCouponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryInteractive, // Usando AppColors
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  copyCouponButtonText: {
    color: AppColors.white, // Usando AppColors
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
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  recMoreBadge: {
    width: 60, // Aumentado de 28 para 40
    height: 60, // Aumentado de 28 para 40
    borderRadius: 30, // Ajustado para 50% do novo width/height (40/2)
    backgroundColor: AppColors.textBody, // Usando AppColors
    alignItems: 'center',
    justifyContent: 'center',
  },
  recMoreBadgeTxt: {
    color: AppColors.white, // Usando AppColors
    fontSize: 14, // Aumentado de 10 para 14
    fontWeight: '700',
  },
  recStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  recReviewsTxt: {
    marginLeft: 5,
    fontSize: 19, // Aumentado de 12 para 16
    color: AppColors.mediumGray, // Usando AppColors
  },

    avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12, // Mantido o marginTop para espaçamento original
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
  },
  moreBadge: {
    width: 34,
    height: 34,
    borderRadius: 14,
    backgroundColor: AppColors.textBody, // Usando AppColors
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBadgeTxt: {
    color: AppColors.white, // Usando AppColors
    fontSize: 10,
    fontWeight: '700',
    fontFamily: FONT_FAMILY, // Agora FONT_FAMILY está definido
  },
  sectionSeparator: {
        borderBottomWidth: 1,
        borderBottomColor: AppColors.borderNeutral, // Usando AppColors
        marginVertical: 5, // Espaçamento vertical para a linha
        // Ajuste o `marginHorizontal` para alinhar com o padding do conteúdo principal,
        // ou use `width: 'auto'` e ajuste o `paddingHorizontal` do container pai se necessário.
        // O `right: 21` parece um ajuste específico, talvez seja melhor usar `marginHorizontal` ou `paddingHorizontal`
        // no container que envolve as seções para consistência.
        // Para este exemplo, vou ajustar para que fique centralizado e com margens laterais.
        marginHorizontal: 20, // Exemplo: ajuste conforme o padding do seu contentArea
    },

  // --- NOVOS ESTILOS PARA A SEÇÃO DE AVALIAÇÕES DETALHADAS ---
  reviewsDetailContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  averageRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -2,
    left: 10,
   
  },
    likeIcon: {
    width: 45,
    height: 45,
    fontWeight: '700',
    color: AppColors.textBody, // Usando AppColors
    marginRight: 0,
    marginTop: -4,
    bottom: 20,
  },
  averageRatingText: {
    fontSize: 15,
    
    
    fontWeight: '700',
    color: AppColors.textBody, // Usando AppColors
    marginRight: 8,
  },
  totalReviewsText: {
    fontSize: 13,
    color: AppColors.mediumGray, // Usando AppColors
    
  },
  viewAllReviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: AppColors.backgroundLight, // Usando AppColors
    marginTop: 10,
    borderWidth: 1,
    borderColor: AppColors.borderNeutral, // Usando AppColors
    ...AppShadows.small, // Usando AppShadows
  },
  viewAllReviewsButtonText: {
    color: AppColors.primaryInteractive, // Usando AppColors
    fontSize: 6,
    fontWeight: '600',
    marginRight: 8,
  },
  // --- FIM DOS NOVOS ESTILOS PARA A SEÇÃO DE AVALIAÇÕES DETALHADAS ---

  // --- ESTILOS DO FUNDO COM EFEITO REMOVIDOS ---
});
