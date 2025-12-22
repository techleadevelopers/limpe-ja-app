1. Componentes de UI Fundamentais/Genéricos
Cards:
Card.tsx (components/common/Card.tsx): Um componente de cartão genérico, reutilizável para agrupar conteúdo com estilos de sombra e tema.
Card.tsx (LimpeJaApp/src/components/ui/Card.tsx): Um componente de cartão básico com temática e estado de pressionar.
GlassmorphicCard.tsx: Um cartão com efeito glassmorphic (vidro fosco), usado para exibir dados com um visual moderno e animado.
Botões:
Button.tsx (components/common/Button.tsx): Um botão genérico com variantes (primary, secondary, ghost) e suporte a tema.
Button.tsx (LimpeJaApp/src/components/ui/Button.tsx): Um botão personalizável com variantes, estado de carregamento e suporte a ícones.
PrimaryButton.tsx: Um botão principal com gradiente e animações de feedback ao toque.
ButtonPositive.tsx: Um botão positivo (com ícone de adição) com gradiente e sombra.
SaveChangesButton.tsx: Um botão para salvar alterações, com indicadores de carregamento e sucesso.
AnimatedQuickActionButton.tsx: Um botão animado para ações rápidas, usado em dashboards.
ConfirmBookingButton.tsx: Um botão para confirmar agendamento com animações de pulso e brilho.
BookServiceButton.tsx: Um botão para agendar serviço, com gradiente e animações.
Inputs:
Input.tsx (LimpeJaApp/src/components/ui/Input.tsx): Um componente de input de texto personalizável com label, mensagem de erro e ícones.
InputWithIcon.tsx: Um campo de entrada de texto com um ícone decorativo e opcionalmente um ícone de "olho" para senhas.
StandardInput.tsx: Um componente de input de texto padrão com label e mensagem de erro, incluindo animação de entrada.
TextInputWithIcon.tsx: Um campo de input de texto com ícone, animações de foco e botão de limpar.
NotesInputSection.tsx: Uma seção para entrada de observações (campo de texto multiline).
DatePickerInput.tsx: Um campo de entrada para seleção de datas com um seletor de data e animação de entrada.
Ícones:
IconSymbol.tsx (expo-symbols MaterialIcons fallback): Um componente para renderizar ícones, usando SF Symbols no iOS e Material Icons no Android/web.
IconSymbol.ios.tsx: A implementação específica para iOS do IconSymbol, utilizando expo-symbols.
Icon3D.tsx: Um componente para renderizar ícones 3D com animações sutis ao toque.
CustomSvgIcons.tsx: Contém ícones SVG personalizados com estilo 3D para diferentes categorias (Residencial, Comercial, Pós-Obra, Vidros).
Texto:
ThemedText.tsx: Um componente de texto que se adapta ao tema (claro/escuro).
typography.ts: Define estilos de texto padronizados (tamanhos de fonte, pesos, cores) para uso em toda a aplicação.
Views/Layouts:
ThemedView.tsx: Um componente de view que se adapta ao tema (claro/escuro).
ScreenContainer.tsx: Um contêiner de tela que gerencia a área segura, rolagem e barra de status.
ParallaxScrollView.tsx: Um componente de scroll view com um efeito parallax para o cabeçalho.
Collapsible.tsx: Um componente de UI que permite expandir e recolher conteúdo.
Outros:
Chip.tsx: Um "chip" acessível com variantes de estilo (sólido, suave, contorno) e suporte a tema, usado para tags ou rótulos.
ProgressBar.tsx: Um componente de barra de progresso simples com label opcional.
KPIValue.tsx: Exibe um valor numérico com animação de contagem, ideal para Key Performance Indicators.
EmptyState.tsx: Um componente para exibir um estado vazio (sem dados) com um título, subtítulo e um botão de ação opcional.
SLAResponseChip.tsx: Um chip que exibe a taxa de resposta de SLA (Service Level Agreement) e o tempo médio de resposta.
RankingBadge.tsx: Um badge para exibir conquistas de ranking (ex: "Top do bairro", "10 no mês").
2. Componentes de Animação/Efeitos Visuais
Ícones Animados 3D:
EyeIcon.tsx: Um ícone de olho 3D animado.
CheckmarkIcon.tsx: Um ícone de marca de seleção 3D animado.
XMarkIcon.tsx: Um ícone de X 3D animado.
SliderPickerIcon.tsx: Um ícone de seletor de slider 3D animado.
RightArrowIcon.tsx: Um ícone de seta para a direita 3D animado.
ProgressCircleIcon.tsx: Um ícone de círculo de progresso 3D animado.
InfoIcon.tsx: Um ícone de informação 3D animado.
Efeitos de Fundo:
ParticlesBubble.tsx: Um efeito de fundo com partículas em forma de bolhas usando Skia.
Bubble.tsx: Um componente de bolha animada para efeitos de fundo.
Outros:
HelloWave.tsx: Um pequeno componente animado para um emoji de mão acenando.
3. Componentes de Notificação e Mensagens Inteligentes (Nudges)
Toasts:
Toast.tsx (LimpeJaApp/app/components/Toast.tsx): Componente principal para exibir mensagens de notificação temporárias e não intrusivas, utilizando a biblioteca react-native-toast-message. Permite diferentes tipos de toast (sucesso, erro, info, aviso) e um tipo customizado (loginSuccess).
NoticeToast.tsx: Outro componente de toast/notificação, com um design ligeiramente diferente (barra lateral colorida) e a capacidade de incluir um título, subtítulo e um botão de ação.
ToastProvider.tsx: Um provedor para um sistema de toast customizado, gerenciando a fila e exibição de mensagens.
ToastMessage.tsx: Um componente de mensagem de toast customizado, provavelmente usado em conjunto com ToastProvider.tsx.
Nudges:
SmartNudge.tsx: O componente fundamental para exibir "mensagens inteligentes" ou "nudges". Ele gerencia a lógica de exibição (atraso, throttling, rotas permitidas) e persistência (armazenamento local para não mostrar repetidamente). É genérico e pode ser configurado com ícone, cor, título, mensagem e ação.
IncentiveNudge.tsx: Uma implementação específica do SmartNudge focada em incentivos, como ganhar pontos por concluir serviços.
SecurityNudge.tsx: Uma implementação específica do SmartNudge para alertar sobre questões de segurança, como a configuração de contatos de emergência.
CouponNudge.tsx: Uma implementação específica do SmartNudge para exibir cupons de forma estratégica, utilizando o HtmlCouponCard como conteúdo.
MissionReminderCard.tsx: Exibe um lembrete para missões que estão prontas para serem resgatadas, com um visual de "fita" e CTA.
MissionProgressSnack.tsx: Exibe o progresso de uma missão em um formato de "snack" (mini-toast), com barra de progresso e informações de economia.
ProviderNudgeContainer.tsx: Um contêiner que agrupa e gerencia a exibição de nudges específicos para provedores.
Modais/Splashes:
CouponModal.tsx: Um modal que exibe uma imagem de cupom e um botão para usá-lo. É mais intrusivo que um toast, mas serve para apresentar uma "mensagem inteligente" de forma destacada.
GiftSplash.tsx: Uma tela de splash animada em tela cheia para anunciar um presente, geralmente exibida no início de uma sessão ou após uma ação específica.
Pílulas:
CouponPill.tsx: Uma "pílula" flutuante que, ao ser clicada, geralmente reabre um modal ou exibe uma oferta de cupom.
PersistentCouponPill.tsx: Uma pílula de cupom persistente, projetada para ficar visível e ser um ponto de acesso rápido a ofertas.
Orquestradores:
MessagesOrchestrator.tsx: Orquestra a exibição de diferentes tipos de mensagens em sequência, como um splash de presente seguido por um modal de cupom.
IncentiveHub.tsx: Um "hub" para exibir várias mensagens relacionadas a incentivos (cupons de boas-vindas, cupons de retorno, banners de indicação) usando um BottomSlideInCard para apresentá-las.
4. Componentes de Navegação e Cabeçalhos
Cabeçalhos:
UnifiedHeader.tsx: Um cabeçalho unificado com título e botões de voltar/ícone direito, incluindo animações de entrada.
Header.tsx: Um cabeçalho genérico com título e botão de voltar opcional.
NewHeader.tsx: Um novo cabeçalho com saudação personalizada, avatar do usuário e ícone de categoria.
HeaderSuperior.tsx: Um cabeçalho com gradiente, saudação, perfil de usuário, e campo de busca (comentado).
DashboardHeader.tsx: Cabeçalho para o dashboard do provedor, com saudação, nome do provedor e ícones de notificação/perfil.
ScheduleHeader.tsx: Cabeçalho para a tela de agendamento, com título, botão de voltar e abas decorativas.
SuccessHeader.tsx: Cabeçalho para a tela de sucesso, exibindo o logo com animações.
CalendarHeader.tsx: Cabeçalho para o calendário, com navegação entre meses e destaque do mês atual.
Barras de Navegação:
NavBar.tsx (components/client/explore/home/NavBar.tsx): Barra de navegação inferior com ícones e texto, usada na tela de exploração.
NavBar2.tsx: Uma barra de navegação inferior com ícones e um botão central de ação, com gradiente de fundo.
Menus:
DrawerMenu.tsx: Um menu lateral (drawer) com informações do usuário, estatísticas e opções de navegação.
Botões de Ação Fixos:
FAB_SOS.tsx: Um Floating Action Button (FAB) para emergências SOS, com animações de pulso e glow.
DEFENSE_SOS.tsx: Um Floating Action Button (FAB) para funcionalidades de defesa, com animações de pulso e glow.
Links:
ExternalLink.tsx: Um componente para abrir links externos no navegador.
Abas:
HapticTab.tsx: Um botão de aba inferior com feedback háptico.
TabBarBackground.tsx: Um shim para o background da barra de abas (genérico).
TabBarBackground.ios.tsx: Implementação específica para iOS do background da barra de abas, usando BlurView.
5. Componentes Específicos de Listagem e Cards de Dados
Listagens de Prestadores/Serviços:
CategoryProviderCard.tsx: Um cartão para exibir informações de um provedor dentro de uma categoria, com animações de entrada e feedback ao toque.
ProviderCard.tsx: Um cartão para exibir informações de um provedor, incluindo avatar, nome, descrição, avaliação e preço mínimo.
PrestadorCard.tsx: Um cartão para exibir informações de um provedor com animações de entrada e feedback ao toque, similar ao CategoryProviderCard.
ServiceCategoryCard.tsx: Um cartão para exibir provedores em uma categoria de serviço, com imagem, nome, avaliação e preço.
ListaPrestadores.tsx: Um componente que renderiza uma lista de PrestadorCards.
ServiceCard.tsx: Um cartão para exibir detalhes de um serviço, incluindo nome, descrição e preço.
Seções de Listagem:
SecaoPrestadores.tsx: Uma seção genérica para exibir listas de prestadores (rolagem horizontal ou vertical) com título e botão "Ver Tudo".
SecaoRecomendacoes.tsx: Uma seção para exibir recomendações, com título e botão "Ver Tudo".
SecaoContainer.tsx: Um contêiner genérico para seções com rolagem horizontal de itens.
Cards de Dados Diversos:
BadgeMissionCard.tsx: Um cartão para exibir uma missão de badge, com título, progresso e recompensa.
ReviewCard.tsx: Um cartão para exibir uma avaliação de serviço, incluindo nome do avaliador, imagem, avaliação e comentário.
RankingCard.tsx: Um cartão para exibir a posição de um usuário no ranking, com animações de entrada e destaque para o usuário atual.
UpcomingServiceItem.tsx: Um item para um serviço futuro ou solicitação pendente, com detalhes do serviço e ações rápidas (aceitar/recusar/chat).
AnimatedTransactionItem.tsx: Um item animado para exibir detalhes de uma transação financeira, com capacidade de expansão.
Skeletons:
ServiceItemSkeleton.tsx (components/skeletons/ServiceItemSkeleton.tsx): Um skeleton loader para itens de serviço, com efeito shimmer.
ServiceItemSkeleton.tsx (app/(provider)/schedule/components/ServiceItemSkeleton.tsx): Um skeleton loader para itens de serviço, também com efeito shimmer, usado em contexto de agendamento do provedor.
Skeleton.tsx: Um componente de skeleton genérico com animação de brilho.
6. Componentes de Agendamento e Reserva
Calendário:
ScheduleCalendar.tsx: Um componente de calendário para seleção de datas em agendamentos, com navegação entre meses e animações.
CalendarGrid.tsx: O grid de dias do calendário, exibindo dias do mês atual, anterior e próximo, com estilos para dias selecionados/passados.
Horários:
TimeSlotButton.tsx: Um botão para seleção de horários, com estados de selecionado/indisponível e animações de pulso/brilho.
TimeSlotsSection.tsx: Uma seção para exibir e selecionar horários disponíveis, com indicadores de carregamento.
AnimatedTimeSlot.tsx: Um componente animado para exibir um slot de tempo individual, com botões para editar e remover.
Seções de Agendamento:
AddressSection.tsx: Uma seção para exibir ou inserir informações de endereço, com animações e ícones.
ServiceDetailsInput.tsx: Um componente para entrada de detalhes do serviço (duração, área) com base no tipo de precificação.
BlockDateSection.tsx: Uma seção para bloquear datas específicas na agenda do provedor.
7. Componentes de Dashboard e Visão Geral (Provedor)
Seções de Visão Geral:
WelcomeSection.tsx: Uma seção de boas-vindas para o dashboard do provedor.
ProviderOverviewSection.tsx: Uma seção de visão geral para o dashboard do provedor, incluindo solicitações pendentes, próximos serviços e link para mensagens.
QuickActionsSection.tsx: Uma seção que exibe botões de ações rápidas para o provedor.
UpcomingServicesSection.tsx: Uma seção que lista os próximos serviços e novas solicitações para o provedor.
RecentReviewsSection.tsx: Uma seção que exibe as avaliações mais recentes recebidas pelo provedor.
SmartInsightsSection.tsx: Uma seção que exibe sugestões inteligentes (AI-driven) para o provedor.
Seções de Ganhos:
EarningsSummaryCard.tsx: Um cartão que resume os ganhos do provedor (saldo disponível, saque pendente, ganhos do mês).
EarningsSnapshotSection.tsx: Uma seção que exibe um resumo dos ganhos do provedor (hoje, semanal, mensal) com um gradiente de fundo.
MainEarningsChartSection.tsx: A seção principal do gráfico de ganhos, exibindo vendas brutas e ganhos semanais/mensais.
RecentTransactionsSection.tsx: Uma seção que lista as transações financeiras recentes do provedor.
EarningsChartSection.tsx: Uma seção que exibe um gráfico de linha dos ganhos do provedor ao longo do tempo.
Indicadores de Carregamento:
DashboardLoadingIndicator.tsx: Um indicador de carregamento para o dashboard do provedor, com um cabeçalho animado.
8. Componentes de Sucesso de Agendamento
Cards de Resumo:
BookingSummaryCard.tsx: Um cartão que resume os detalhes de um agendamento bem-sucedido, com efeito de blur e gradiente.
Seções de Detalhes:
ProviderInfoSection.tsx: Uma seção que exibe informações do provedor (avatar, nome, avaliação) na tela de sucesso.
BookingDetailSection.tsx: Uma seção que exibe detalhes do agendamento (serviço, local, observações) na tela de sucesso.
DateTimeCards.tsx: Cartões separados para exibir a data e a hora formatadas do agendamento.
AdditionalBookingDetails.tsx: Uma seção que exibe detalhes adicionais do agendamento, como ID, valor total e método de pagamento.
Ações Pós-Agendamento:
ImmediateActionButtons.tsx: Botões de ação imediata (adicionar ao calendário, contatar provedor) na tela de sucesso.
MainActionButtons.tsx: Botões de ação principais (ver agendamentos, voltar para o início) na tela de sucesso.
Erros/Carregamento:
SuccessLoadingError.tsx: Um componente para gerenciar estados de carregamento e erro na tela de sucesso.
9. Componentes de Fidelidade e Recompensa
Resumo de Fidelidade:
LoyaltySummaryCard.tsx: Um cartão que exibe o status de fidelidade do usuário, pontos atuais, próximo nível e progresso.
Itens de Recompensa/Missão:
RewardItem.tsx: Um item para exibir uma recompensa de fidelidade, com pontos necessários e botão de resgate.
MissionItem.tsx: Um item para exibir uma missão, com progresso, recompensa e botão de resgate.
MissionList.tsx: Uma lista de missões, com tratamento de estados de carregamento, erro e vazio.
Seções de Ganhos:
HowToEarnSection.tsx: Uma seção que explica como ganhar pontos de fidelidade.
10. Componentes de Pagamento
Seleção de Método:
PaymentMethodSelection.tsx: Um componente para selecionar o método de pagamento (ex: PIX).
Detalhes PIX:
PixPaymentDetails.tsx: Uma seção detalhada para exibir informações de pagamento via PIX, incluindo QR Code e código copia e cola.
SuccessPixInfo.tsx: Uma seção que exibe informações de pagamento PIX em uma tela de sucesso, focando no QR Code e na opção de copiar o código.
11. Componentes de Segurança
Banners:
PanicBanner.tsx: Um banner para funcionalidades de pânico/SOS, com botões de ação rápida e indicadores de status.
Referências:
SecurityRef.tsx: Uma seção que destaca a segurança do provedor através de ícones e uma mensagem animada.
12. Componentes de Utilitário/Hooks
Hooks de Animação:
useFadeSlideIn.ts: Um hook para aplicar animações de fade e slide-in.
usePressScale.ts: Um hook para aplicar animações de escala ao pressionar.
useReducedMotion.ts: Um hook para detectar a preferência de movimento reduzido do sistema.
Outros:
sentry.ts: Configuração para integração com Sentry (monitoramento de erros).
query-client-provider.tsx: Um provedor para o React Query, gerenciando o cache de dados.
colors.ts: Define a paleta de cores da aplicação.
shadows.ts: Define estilos de sombra padronizados.
13. Componentes de Referência
Banners:
ReferralBanner.tsx: Um banner para programas de indicação, exibindo códigos e recompensas.
Sheets:
ReferralSheet.tsx: Um sheet/modal que exibe detalhes do programa de indicação, incluindo o ReferralBanner.
14. Outros Componentes
SearchComponent.tsx: Um componente de barra de pesquisa com input e botão de busca.
HorizontalMiniGrid.tsx: Um grid horizontal de mini-cards com ícones 3D para navegação rápida.
Points.tsx: Um componente que exibe um resumo de pontos de fidelidade, ranking e missões.
OverviewContent.tsx: Conteúdo da aba de visão geral do perfil do provedor, incluindo avaliações e informações.
InfoChip.tsx: Um chip simples que exibe um ícone e um texto informativo.
HeaderSection.tsx: Uma seção de cabeçalho para o perfil do provedor, com imagem de fundo e botões de navegação.
DetailsContent.tsx: Conteúdo da aba de detalhes do perfil do provedor, listando serviços oferecidos e informações adicionais.
StarRating.tsx: Um componente para exibir uma avaliação em estrelas.
PulsingRing.tsx: Um componente para criar um efeito de anel pulsante animado.
SupportTicketStatus.tsx: Um componente para exibir o status de um ticket de suporte.
CarouselBannerItem.tsx: Um item de carrossel para exibir banners promocionais com animações de imagem e texto.
MainCategoryButton.tsx: Um botão de categoria principal com ícone, título e animações ao toque.
SaudacaoContainer.tsx: Um contêiner que exibe uma saudação personalizada e uma barra de busca com efeito neumorphic/glassmorphic.