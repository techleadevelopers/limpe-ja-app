// LimpeJaApp/styles/providerStyles.ts
import { StyleSheet, Dimensions, Platform } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_HEIGHT = 280; // Defina uma altura para a imagem para o card. Ajuste conforme necessário.

export const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  centeredFeedback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F8F9FA' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#555' },
  errorText: { fontSize: 17, color: '#D32F2F', textAlign: 'center', marginBottom: 25 },
  errorBackButton: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, flexDirection: 'row', alignItems: 'center' },
  errorBackButtonText: { color: '#fff', fontSize: 16, marginLeft: 8, fontWeight: '600' },
  scrollContentContainer: { paddingBottom: 110 },

  // HeaderSection Styles
  // **** ALTERAÇÃO APLICADA AQUI PARA O ESPAÇAMENTO E BORDAS ARREDONDADAS ****
  headerImage: {
    width: SCREEN_WIDTH - 30, // Largura total da tela menos 15 de margem horizontal em cada lado (15*2 = 30)
    height: IMAGE_HEIGHT,     // Altura da imagem, use a constante definida acima
    borderRadius: 15,         // Arredonda as bordas
    overflow: 'hidden',       // Garante que o conteúdo (ImageBackground) respeite o borderRadius
    marginTop: 15,            // Margem superior para afastar do topo
    marginHorizontal: 15,     // Margem nas laterais
    alignSelf: 'center',      // Centraliza a imagem/container na tela
    justifyContent: 'flex-end', // Mantém o conteúdo (overlay) na parte inferior da imagem
    
    // Adicionando uma sombra leve para o efeito de "card flutuante", como na imagem de exemplo
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8, // Para Android
  },
  // **************************************************************************
  headerImageOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.30)', paddingHorizontal: 15, paddingTop: Platform.OS === 'ios' ? 50 : 25, paddingBottom: 15, justifyContent: 'space-between' },
  topNavContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconButtonBackground: { backgroundColor: 'rgba(0,0,0,0.35)', padding: 10, borderRadius: 20 },

  // Content Area Styles (for main component)
  contentArea: {
    paddingHorizontal: 0,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 24,
    minHeight: Dimensions.get('window').height * 0.5,
  },

  // NOVOS ESTILOS para as informações do provedor na área branca
  providerInfoWhiteCard: {
    paddingHorizontal: 30,
    marginBottom: 20, // Espaço entre as informações e o conteúdo abaixo
  },
  providerNameWhiteCard: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 5,
  },
  locationContainerWhiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationTextWhiteCard: {
    fontSize: 12.5,
    color: '#666',
    marginLeft: 5,
  },
  priceTextWhiteCard: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: -45,
  },

  // O tabContentContainer será reutilizado para o padding geral do conteúdo
  tabContentContainer: { paddingHorizontal: 20, paddingTop: 15 },


  // StarRating Styles
  robustStarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
    borderRadius: 8,
    left: 290,
    bottom: 73, // sobe o container sem colapsar altura
  },

  robustReviewsText: {
    fontSize: 11,
    fontFamily: 'sans-serif',
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
    position:'relative',
    top: 18,
    right: 98,
  },

  starIcon: {
    marginRight: 6, // Ajuste este valor para o espaçamento desejado
  },

  starRatingContainer: { flexDirection: 'row' }, // Used in ReviewCard too

  // InfoChip Styles
  infoChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  infoChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F0F0', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 16 },
  infoChipText: { fontSize: 12, color: '#333333', marginLeft: 6, fontWeight: '500' },

  // OverviewContent & DetailsContent Common Styles
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111111', marginBottom: 12 },
  descriptionText: { fontSize: 15, lineHeight: 24, color: '#555555', textAlign: 'left', marginBottom: 25 },
  noReviewsText: { fontSize: 14, color: '#6C757D', fontStyle: 'italic', textAlign: 'center', paddingVertical: 15 },
  noDetailsText: { fontSize: 14, color: '#6C757D', fontStyle: 'italic', marginVertical: 10 },
  availabilityText: { fontSize: 14, lineHeight: 21, color: '#495057' },

  // ActionButtons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 1,
    marginBottom: 25,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    paddingTop: 15,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    width: (SCREEN_WIDTH - (20 * 2) - (15 * 3)) / 4,
    height: 70,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontWeight: '500',
  },

  // ReviewCard Styles
  reviewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerImage: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  reviewerImagePlaceholder: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#CED4DA', justifyContent: 'center', alignItems: 'center' },
  reviewHeaderText: { flex: 1 },
  reviewerName: { fontSize: 15, fontWeight: '600', color: '#343A40' },
  reviewRatingDate: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  reviewDate: { fontSize: 12, color: '#6C757D' },
  reviewComment: { fontSize: 14, lineHeight: 20, color: '#495057' },
  
  addReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#E9F5FF',
    marginTop: 10,
    marginBottom: 15,
  },
  addReviewButtonText: { 
    color: '#007AFF', 
    fontSize: 15, 
    fontWeight: '600', 
    marginLeft: 8 
  },

  // Service Item Card Styles (for DetailsContent)
  serviceItemCard: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E9ECEF' },
  serviceName: { fontSize: 16, fontWeight: '600', color: '#343A40', marginBottom: 4 },
  serviceDescription: { fontSize: 14, color: '#6C757D', marginBottom: 6 },
  servicePriceTag: { fontSize: 14, fontWeight: '700', color: '#007AFF', alignSelf: 'flex-end' },

  // BookServiceButton Styles
  bookNowButtonWrapper: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 50, // Apenas o padding superior base, o paddingBottom será dinâmico no componente
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  bookServiceButtonGradient: {
    borderRadius: 12,
  },
  bookServiceButton: {
    paddingBottom: 20,
    paddingTop: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  bookServiceButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // NOVOS ESTILOS PARA MENSAGEM DE AUSÊNCIA DE SERVIÇOS
  noServicesMessage: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF3CD',
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFECB3',
    elevation: 5,
  },
  noServicesMessageText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
});