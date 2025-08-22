Relatório Detalhado dos Efeitos de Animação por Componente
1. dashboard.tsx (Tela Principal do Painel do Provedor)
Efeito: Animação de Entrada do Conteúdo (contentAnim).
Implementação: Animated.timing (opacidade e translateY) para o ScrollView principal. Orquestrada com Animated.stagger no useEffect do ProviderDashboardScreen para animar a entrada dos componentes filhos.
Propósito: Transição suave e escalonada dos elementos da tela ao carregar, criando uma sensação de carregamento progressivo e agradável.
Efeito: Feedback de Toque (useAnimatedTouch hook).
Implementação: Animated.spring para escala (scaleAnim) em onPressIn e onPressOut de TouchableOpacity. Usado nos botões do FinancialSummaryCard, QuickActionsSection, RequestItem (aceitar, rejeitar, detalhes, chat) e ConfirmedServiceItem.
Propósito: Feedback visual imediato ao usuário ao interagir com elementos clicáveis, indicando que o toque foi registrado.
2. AnimatedTransactionItem.tsx (Item de Transação Animado)
Efeito: Animação de Entrada (Fade-in e Slide-up).
Implementação: Animated.parallel de Animated.timing (opacidade e translateY) no useEffect. Um delay é passado como prop para criar um efeito escalonado quando renderizado em uma lista.
Propósito: Entrada suave e organizada de cada item da transação na lista.
Efeito: Animação de Expansão/Colapso.
Implementação: Animated.timing para altura (expandedHeightAnim) e opacidade no useEffect, acionada pelo estado isExpanded. useNativeDriver: false é usado para a altura, pois manipula o layout.
Propósito: Revelar ou ocultar detalhes adicionais da transação de forma fluida.
3. RecentTransactionsSection.tsx (Seção de Transações Recentes)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de uma animation prop.
Propósito: Transição suave da seção ao aparecer na tela, contribuindo para a organização visual do painel.
Efeito: Animação de Entrada dos Itens (herdado de AnimatedTransactionItem).
Implementação: Cada AnimatedTransactionItem recebe um delay baseado em seu index na lista.
Propósito: Criar um efeito de "cascata" ou escalonamento na aparição dos itens da lista.
4. EarningsSummaryCard.tsx (Cartão de Resumo de Ganhos)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de uma animation prop.
Propósito: Transição suave do card ao aparecer na tela.
Efeito: Feedback de Toque (useAnimatedTouch hook).
Implementação: Animated.spring para escala (scaleAnim) no botão "Solicitar Saque".
Propósito: Feedback visual ao interagir com o botão.
5. earnings.tsx (Tela Principal de Ganhos)
Efeito: Orquestração de Animações de Entrada de Seções.
Implementação: Animated.stagger coordena Animated.timing para headerAnim, summaryAnim, mainChartAnim, chartSectionAnim, transactionsSectionAnim.
Propósito: Criar uma experiência de carregamento e apresentação de conteúdo coesa e dinâmica, onde as seções aparecem em sequência.
6. EarningsChartSection.tsx (Seção do Gráfico de Ganhos)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de uma animation prop.
Propósito: Transição suave da seção ao aparecer na tela.
7. ProviderOverviewSection.tsx (Seção de Visão Geral do Provedor)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de uma contentAnim prop.
Propósito: Transição suave da seção ao aparecer na tela.
Efeito: Animação de Entrada dos Itens de Solicitação e Serviço.
Implementação: Animated.stagger de Animated.timing para opacity e translateY em RequestItem e ConfirmedServiceItem, usando Animated.ValueXY para cada item.
Propósito: Apresentação dinâmica e escalonada das solicitações e serviços.
Efeito: Feedback de Toque (useAnimatedTouch hook).
Implementação: Animated.spring para escala em RequestItem, ConfirmedServiceItem e messageLinkCard.
Propósito: Feedback visual ao interagir com os itens.
8. MainEarningsChartSection.tsx (Seção Principal do Gráfico de Ganhos)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity (usando contentAnim prop).
Propósito: Transição suave da seção.
Efeito: Animação de Contagem do Valor Total.
Implementação: Animated.timing para animatedTotalSales (um Animated.Value numérico) que é passado para CircularProgressChart. useNativeDriver: false é crucial aqui, pois o valor animado é lido diretamente no JavaScript para formatação de texto.
Propósito: Exibir o valor total de ganhos com um efeito de contagem progressiva.
9. LogoutSection.tsx (Seção de Logout)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity (usando contentAnim prop).
Propósito: Transição suave da seção.
10. GlassmorphicCard.tsx (Cartão Glassmorphic Genérico)
Efeito: Animação de Entrada (Fade-in e Slide-up).
Implementação: Animated.parallel de Animated.timing (opacidade e translateY) no useEffect. Um delay é passado como prop.
Propósito: Entrada suave e elegante do cartão.
Efeito: Feedback de Toque.
Implementação: Animated.spring para escala (scaleAnim) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o cartão.
Efeito: Efeito de Reflexo (Reflection Overlay).
Implementação: Animated.View com transform: [{ translateY: reflectionOffset }], onde reflectionOffset é uma Animated.AnimatedInterpolation passada como prop. Embora o código fornecido não mostre a origem de reflectionOffset, ele sugere um efeito de movimento do reflexo.
Propósito: Adicionar um toque visual sofisticado e dinâmico ao design glassmorphic.
11. EarningsSnapshotSection.tsx (Seção de Resumo de Ganhos)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity (usando contentAnim prop).
Propósito: Transição suave da seção.
Efeito: Animação de Contagem de Valores (Hoje, Semana, Mês).
Implementação: Animated.timing para animatedToday, animatedWeekly, animatedMonthly (valores numéricos). useNativeDriver: true é usado.
Propósito: Exibir os valores de ganhos com um efeito de contagem progressiva.
12. DashboardLoadingIndicator.tsx (Indicador de Carregamento do Painel)
Efeito: Animação de Entrada do Cabeçalho.
Implementação: Animated.View com opacity e translateY interpolados a partir de headerAnim.
Propósito: Transição suave do cabeçalho da tela de carregamento.
13. DashboardHeader.tsx (Cabeçalho do Painel)
Efeito: Animação de Entrada do Cabeçalho.
Implementação: Animated.View com opacity e translateY interpolados a partir de headerAnim.
Propósito: Transição suave do cabeçalho ao aparecer na tela.
14. CircularProgressChart.tsx (Gráfico de Progresso Circular)
Efeito: Animação da Barra de Progresso.
Implementação: Animated.timing para animatedProgress (um Animated.Value de 0 a 1) que interpola strokeDashoffset de um AnimatedCircle.
Propósito: Visualizar o progresso de forma suave e contínua.
Efeito: Animação de Contagem do Valor Central.
Implementação: Um useEffect ouve o Animated.Value (animatedValueProp) e atualiza um estado displayValue formatado. useNativeDriver: false é necessário.
Propósito: Exibir o valor central do gráfico com um efeito de contagem progressiva.
Efeito: Feedback de Toque no Botão "Detalhe".
Implementação: Animated.spring para escala (buttonScale) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o botão.
15. AnimatedQuickActionButton.tsx (Botão de Ação Rápida Animado)
Efeito: Animação de Entrada (Fade-in e Slide-up).
Implementação: Animated.parallel de Animated.timing (opacidade e translateY) no useEffect. Um delay é passado como prop.
Propósito: Entrada suave e escalonada do botão.
Efeito: Feedback de Toque.
Implementação: Animated.spring para escala (scaleAnim) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o botão.
16. AdvancedReviewsSection.tsx (Seção de Análise de Avaliações)
Observação: O código fornecido para esta seção não inclui animações diretas para a seção ou seus elementos internos (como barras de progresso). As barras de progresso são estilizadas com LinearGradient e largura baseada em porcentagem, mas não animadas em si.
17. WelcomeSection.tsx (Seção de Boas-Vindas)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de welcomeAnim.
Propósito: Transição suave da mensagem de boas-vindas.
18. UpcomingServicesSection.tsx (Seção de Próximos Serviços)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de contentAnim.
Propósito: Transição suave da seção.
Efeito: Feedback de Toque no Botão "Ver Todos".
Implementação: Animated.spring para escala (buttonScale) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o botão.
19. UpcomingServiceItem.tsx (Item de Serviço Futuro)
Efeito: Feedback de Toque.
Implementação: Animated.spring para escala (scaleAnim) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o item da lista.
20. SmartInsightsSection.tsx (Seção de Insights Inteligentes)
Observação: O código fornecido para esta seção não inclui animações diretas para a seção ou seus elementos internos. As sugestões são renderizadas em um ScrollView horizontal, mas não há animações de entrada ou interação explícitas com a API Animated.
21. RecentReviewsSection.tsx (Seção de Avaliações Recentes)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity e translateY interpolados a partir de contentAnim.
Propósito: Transição suave da seção.
Efeito: Animação de Entrada dos Itens de Avaliação.
Implementação: Animated.timing para itemAnim (opacidade e translateY) no useEffect de RecentReviewItem. Um delay é passado para cada item.
Propósito: Entrada suave e escalonada dos itens de avaliação na lista.
Efeito: Feedback de Toque nos Itens de Avaliação.
Implementação: Animated.spring para escala (scaleAnim) em onPressIn e onPressOut de RecentReviewItem.
Propósito: Feedback visual ao interagir com os itens.
Efeito: Feedback de Toque no Botão "Ver Todas as Avaliações".
Implementação: Animated.spring para escala (buttonScale) em onPressIn e onPressOut.
Propósito: Feedback visual ao interagir com o botão.
22. QuickActionsSection.tsx (Seção de Ações Rápidas)
Efeito: Animação de Entrada da Seção.
Implementação: Animated.View com opacity (usando contentAnim prop).
Propósito: Transição suave da seção.
Efeito: Animação de Entrada dos Itens (herdado de AnimatedQuickActionButton).
Implementação: Cada AnimatedQuickActionButton recebe um delay baseado em seu index na lista.
Propósito: Criar um efeito de "cascata" ou escalonamento na aparição dos botões.
Mapa Geral de Efeitos e Características
Seu aplicativo demonstra um uso sofisticado e consistente da API Animated do React Native, com foco em:

Animações de Entrada (On-Load/On-Mount):

Fade-in (Opacidade): Quase todas as seções e itens individuais utilizam Animated.timing para fazer uma transição de opacidade de 0 para 1, tornando a aparição do conteúdo suave.
Slide-up/Slide-down (TranslateY): Frequentemente combinado com o fade-in, os elementos deslizam para sua posição final a partir de uma posição ligeiramente deslocada (geralmente de baixo para cima), adicionando dinamismo.
Escalonamento (Stagger/Delay): O uso de Animated.stagger ou a passagem de um delay baseado no índice do item em listas (FlatList ou map) é um padrão comum. Isso cria um efeito de "cascata" onde os itens aparecem um após o outro, melhorando a percepção de carregamento e a organização visual.
Feedback de Interação (On-Press):

Escala (Scale): O padrão mais prevalente é o uso de Animated.spring para diminuir (toValue: 0.95 ou 0.98) e depois restaurar (toValue: 1) a escala de elementos clicáveis (TouchableOpacity). Isso proporciona um feedback tátil e visual claro de que o toque foi registrado. O useAnimatedTouch hook encapsula essa lógica, promovendo reusabilidade.
Parâmetros de Animated.spring: O uso de friction e tension (friction: 3, tension: 40) em Animated.spring resulta em um movimento de retorno elástico e natural, tornando o feedback mais "confortável" e responsivo.
Animações de Estado/Conteúdo:

Expansão/Colapso (Height): Em itens como AnimatedTransactionItem, a altura é animada para revelar ou ocultar detalhes, proporcionando uma transição suave entre os estados.
Contagem de Valores: Em seções financeiras (MainEarningsChartSection, EarningsSnapshotSection, CircularProgressChart), valores numéricos são animados para "contar" até o valor final. Isso é feito animando um Animated.Value numérico e usando um listener para formatar e exibir o valor intermediário.
Otimização e Robustez:

useNativeDriver: true: Amplamente utilizado para animações de opacity, scale e translateY. Isso delega a animação para a thread nativa da UI, garantindo 60 FPS e fluidez, mesmo com JavaScript pesado.
useNativeDriver: false: Usado apropriadamente para animações que afetam o layout (como height) ou que precisam ler o valor animado no JavaScript (como a contagem de valores), onde useNativeDriver não é suportado ou prático.
Tratamento de Erros/Fallback: Há placeholders de carregamento (ActivityIndicator, esqueletos) e estados vazios (emptyState) para garantir uma experiência de usuário consistente mesmo na ausência de dados ou durante o carregamento.
Consistência de Cores e Estilos: A definição de constantes de cores e a aplicação consistente de estilos (sombras, bordas, tipografia) contribuem para uma estética unificada e profissional.
Em suma, o conjunto de animações implementado é abrangente e bem executado. Ele não apenas adiciona apelo visual, mas também melhora a usabilidade e a percepção de desempenho do aplicativo, tornando a interação com o painel do provedor mais intuitiva e agradável.



🎨 Paleta de Cores
A paleta é dominada por azuis, com neutros claros e escuros, e acentos de cores específicas para feedback e destaque, visando uma experiência visual suave e harmoniosa.

Azuis Principais e de Destaque:

#4A90E2: Azul vibrante, onipresente em ícones, estados ativos, botões principais, cabeçalhos e elementos interativos.
#2A72E7: Azul escuro, utilizado para elementos selecionados, preços e botões de confirmação.
#007AFF: Azul padrão para links, alguns botões e elementos de sombra.
#1A73E8: Azul para botões de ação.
#4285F4: Presente em gradientes de cabeçalho.
#67adfdff, #5c93ecff, #7694f6ff: Tons de azul em gradientes para a barra de navegação e outros elementos de fundo.
#bfd4f7c3: Azul claro com transparência, usado em fundos de cards.
#9ec2f1ff: Azul claro para a barra de pesquisa no perfil.
#A0D2EB: Azul claro unificado.
#A0C7F2: Azul claro para botões desabilitados.
#4682B4: Azul para ícones de menu.
rgba(109, 179, 253, 0.9), rgba(12, 88, 170, 0.8): Cores roxas/azuis para destaque do mês atual no calendário.
Gradientes de Fundo e Elementos Abstratos (Azuis):

#E0F7FA, #B3E0FF, #ADD8E6, #CDE8F7: Gradientes de fundo da tela de sucesso.
rgba(173, 216, 230, 0.4), rgba(65, 153, 225, 0.15), rgba(133, 168, 231, 0.05): Cores para bolhas abstratas animadas.
rgba(66, 165, 245, 0.08), rgba(144, 202, 249, 0.06), rgba(121, 134, 203, 0.05), rgba(129, 140, 248, 0.08): Tons de azul com baixa opacidade para decorações de fundo.
rgba(173, 216, 230, 0.01), rgba(135, 206, 250, 0.8), rgba(100, 148, 237, 0): Tons de azul para gradiente de cabeçalho do calendário.
Verdes e Amarelos (Acentos e Sucesso):

#28a745: Verde vibrante para indicar sucesso e em botões.
#218838: Verde mais escuro, complementar ao verde de sucesso.
#00BFA5: Verde específico para destacar a data atual no calendário.
#4CAF50: Verde para a exibição de pontos do usuário.
#FFD700: Amarelo ouro, usado para estrelas de avaliação, ícones de pontos e destaque de endereço.
#FFC107: Amarelo para estrelas de avaliação.
Neutros (Brancos, Cinzas e Pretos):

#FFFFFF: Branco, cor predominante para fundos de cards, texto e botões.
#F0F2F5, #F8FAFB, #F4F7FC, #F0F8FF, #F5F5F5: Tons de branco e azul claro para fundos de tela e seções.
#E0E0E0, #CED4DA, #E9ECEF, #DDEEFF, #F0F0F0: Usados para bordas, divisores e backgrounds de inputs.
#333, #666, #555, #777, #334155, #475569, #212529, #343A40, #495057, #202633, #1C3A5F: Vários tons de cinza escuro a preto para texto, títulos e labels.
#2C3E50: Azul escuro quase preto, para títulos e texto.
#2F4F4F: Tons de cinza/verde escuro para texto e ícones.
rgba(0,0,0,...): Várias opacidades de preto para sombras, conferindo profundidade aos elementos.
rgba(255,255,255,...): Várias opacidades de branco para efeitos de reflexo e sobreposições.
Vermelhos (Erros e Ações Destrutivas):

#D32F2F: Vermelho para mensagens de erro e texto destrutivo.
#E74C3C: Vermelho para a ação de logout.
#FFE0E6, #FFC0CB: Tons de rosa/vermelho para indicar chat bloqueado.
rgba(211, 47, 47, 0.05): Fundo sutil para itens de menu destrutivos.
✨ Efeitos Animados
As animações são um pilar fundamental da experiência do usuário, proporcionando feedback visual, transições suaves e um senso de dinamismo, contribuindo para um conforto altamente potente.

1. Animações de Entrada e Transição de Tela:

Fade-in (fadeAnim): Elementos aparecem gradualmente, aumentando a opacidade de 0 para 1.
Contribuição para o conforto: Reduz o choque visual e guia o olhar do usuário, tornando a transição mais fluida e natural. (Ex: BookingDetailSection, AdditionalBookingDetails, SuccessPixInfo, SecurityInfoSection, LoyaltyTeaserSection, MainActionButtons, ImmediateActionButtons, ScheduleServiceScreen, ConversationsListScreen, EditClientProfileScreen).
Slide-in (slideUpAnim, translateYAnim): Elementos deslizam para a posição final, geralmente de baixo para cima, com um efeito suave e elástico (Easing.out(Easing.ease) ou Easing.out(Easing.back(1.2))).
Contribuição para o conforto: Adiciona um senso de movimento e profundidade, tornando a entrada dos elementos mais dinâmica e menos estática. (Ex: BookingDetailSection, AdditionalBookingDetails, SuccessPixInfo, SecurityInfoSection, LoyaltyTeaserSection, MainActionButtons, ImmediateActionButtons, ScheduleServiceScreen, ConversationsListScreen, EditClientProfileScreen).
Scale-in (scaleAnim): Elementos aumentam de tamanho, de um valor menor (ex: 0.95) para o tamanho normal (1), frequentemente combinado com spring para um efeito mais natural.
Contribuição para o conforto: Cria um efeito de "pop-in" ou "zoom", que pode ser usado para chamar a atenção para um elemento ou para dar uma sensação de expansão. (Ex: BookingDetailSection, AdditionalBookingDetails, SuccessPixInfo, SecurityInfoSection, LoyaltyTeaserSection, MainActionButtons, ImmediateActionButtons, ScheduleServiceScreen, ConversationsListScreen, EditClientProfileScreen).
Staggered Animations: Múltiplos elementos aparecem sequencialmente com pequenos atrasos, criando um efeito cascata.
Contribuição para o conforto: Organiza a apresentação de informações, evitando sobrecarga e guiando a atenção do usuário de forma agradável. (Ex: Itens de menu em ClientProfileScreen, elementos em EditClientProfileScreen).
2. Animações de Feedback Interativo (Botões e Seleções):

Pressionar/Soltar (buttonScaleAnim, scaleAnim): Botões e itens interativos encolhem ligeiramente ao serem pressionados e retornam com um efeito elástico ao serem soltos (Animated.spring com friction e tension).
Contribuição para o conforto: Simula uma interação física, tornando a experiência de toque mais responsiva e intuitiva, confirmando a ação do usuário. (Ex: SuccessPixInfo - botão de copiar PIX, MainActionButtons, ImmediateActionButtons, LoyaltyTeaserSection - botão "Saiba Mais", ConfirmBookingButton, CarouselBannerItem, CategoriaCard, RecomendacaoCard, PrestadorCard, NavBar - botão central, ClientProfileScreen - avatar e botões, EditClientProfileScreen - avatar e botões, ConversationsListScreen - card de conversa, ChatScreen - botão de enviar).
Pulsação (pulseAnim): Elementos importantes (ex: horários disponíveis, botão de confirmação) pulsam sutilmente, aumentando e diminuindo a escala para chamar a atenção (Animated.loop com Animated.sequence e Easing.inOut(Easing.ease)).
Contribuição para o conforto: Destaca elementos de forma sutil, incentivando a interação e tornando-os mais convidativos sem serem intrusivos. (Ex: TimeSlotButton - slots disponíveis, ConfirmBookingButton - botão de confirmação).
Seleção (selectionAnim): Ao selecionar um dia no calendário, o elemento "salta" brevemente para indicar a seleção (Animated.spring).
Contribuição para o conforto: Fornece feedback visual imediato e tátil ao usuário sobre sua interação, confirmando a seleção de forma agradável e responsiva. (Ex: ScheduleCalendar - seleção de dia, ScheduleServiceScreen - seleção de horário).
Pulsação de Botão Específico (addReviewButtonPulseAnim): Animação de pulso para botões de ação específicos.
Contribuição para o conforto: Destaca o botão de forma sutil, incentivando a interação e tornando-o mais convidativo. (Ex: ProviderDetailsScreen - botão de adicionar avaliação).
3. Animações de Elementos de UI (Sutileza e Dinamismo):

Pulsação de Logo (logoPulseAnim, logoPulseScale): Animação de pulso sutil aplicada ao logo.
Contribuição para o conforto: Cria um efeito de "batimento cardíaco" ou "respiração" no logo, dando-lhe vida e tornando a tela de carregamento ou login menos monótona. (Ex: SuccessHeader, WelcomeScreen, LoginScreen).
Rotação de Logo (logoRotateAnim, logoRotateY): Animação de rotação sutil no eixo Y do logo.
Contribuição para o conforto: Adiciona um movimento orgânico e tridimensional ao logo, contribuindo para uma experiência visual mais rica e envolvente. (Ex: SuccessHeader, WelcomeScreen, LoginScreen).
Reflexo/Brilho (reflexTranslateX/Y, reflexRotate, dottedLineShine, shineAnim, reflectionOverlay): Efeitos de luz que se movem através de elementos (cabeçalhos, linhas, cards, barras de pesquisa), simulando um brilho ou reflexo em movimento.
Contribuição para o conforto: Aprimora o efeito visual do reflexo, tornando-o mais realista e dinâmico, o que eleva a qualidade percebida da UI. (Ex: AddressSection - brilho na linha pontilhada, HeaderSuperior - reflexo no gradiente, CarouselBannerItem - efeito de flutuação no fundo, ClientProfileScreen - reflexo na barra de pesquisa e no cartão de missões, WelcomeScreen - reflexo do logo).
Bolhas Abstratas (blobTranslateY, blobScale, blobRotate): Formas abstratas no fundo se movem, escalam e giram continuamente.
Contribuição para o conforto: Adiciona dinamismo e um toque de modernidade à tela de sucesso, tornando o fundo mais interessante sem distrair do conteúdo principal. (Ex: SuccessScreen).
Flutuação (backgroundFloatAnim): Elementos de fundo ou banners flutuam sutilmente para cima e para baixo ou para os lados, criando um efeito parallax.
Contribuição para o conforto: Cria uma sensação de profundidade e movimento, tornando a interface mais imersiva e agradável. (Ex: CarouselBannerItem, ScheduleServiceScreen).
Rotação (rotateAnim): Logos ou decorações de fundo giram lentamente de forma contínua.
Contribuição para o conforto: Adiciona um toque de sofisticação e movimento sutil ao fundo. (Ex: ScheduleServiceScreen).
Animação de Entrada de Chips (infoChipAnim): Animação de entrada (opacidade e translação) para os chips de informação.
Contribuição para o conforto: Faz com que os chips apareçam de forma suave, contribuindo para uma apresentação mais polida das informações. (Ex: ProviderDetailsScreen - chips de informação).
4. Animações de Estado e Feedback Visual:

Escala de Ícone/Opacidade de Placeholder (searchIconScale, searchPlaceholderOpacity): Indicam interatividade ou estado de um campo de busca.
Contribuição para o conforto: Fornece dicas visuais sobre a funcionalidade do campo de busca, tornando a interação mais intuitiva. (Ex: HeaderSuperior).
Brilho de Cabeçalho (headerGlowAnim): Um brilho sutil que percorre o cabeçalho.
Contribuição para o conforto: Adiciona um toque de elegância e dinamismo ao cabeçalho. (Ex: ScheduleServiceScreen).
Respiração do Calendário (calendarBreatheAnim): O calendário pulsa sutilmente, como se estivesse "respirando".
Contribuição para o conforto: Adiciona um "respiro" visual ao calendário, tornando-o menos estático e mais "vivo", sem distrair. (Ex: ScheduleCalendar, ScheduleServiceScreen).
Transição de Mês (monthTranslateAnim): O mês atual desliza suavemente ao navegar para o mês anterior ou seguinte.
Contribuição para o conforto: Suaviza a transição entre os meses, tornando a navegação do calendário mais fluida e agradável. (Ex: CalendarHeader).
Feedback de Input/Cupom (couponInputAnim, couponFeedbackAnim): Animações na borda de inputs e no feedback de aplicação de cupom (opacidade, movimento vertical).
Contribuição para o conforto: Fornece feedback claro e animado sobre a interação com o campo de cupom, indicando sucesso ou erro de forma visualmente agradável. (Ex: ScheduleServiceScreen).
Destaque de Preço/Ícone (finalPriceAnim, iconAnim): Animações para chamar a atenção para o preço final e ícones no resumo do agendamento.
Contribuição para o conforto: Guia o olhar do usuário para informações cruciais, garantindo que detalhes importantes não passem despercebidos. (Ex: BookingSummaryPreview).
Borda de Input (fullNameBorderAnim, phoneBorderAnim): A cor da borda de campos de texto muda suavemente ao focar ou desfocar.
Contribuição para o conforto: Oferece feedback visual claro sobre o estado de foco do input, melhorando a usabilidade e a estética. (Ex: EditClientProfileScreen).
📐 Padrões de UI e Tipografia
O design da interface segue padrões consistentes para garantir usabilidade e uma estética coesa, com foco em um design visual suave e confortável.

Estrutura de Tela:

Cabeçalhos Personalizados: A maioria das telas utiliza cabeçalhos customizados (Stack.Screen options={{ headerShown: false }}) para maior controle visual e integração com animações.
Conteúdo Rolável: ScrollView e FlatList são amplamente empregados para exibir listas e conteúdo que excede o tamanho da tela.
Gerenciamento de Teclado: KeyboardAvoidingView é usado para ajustar o layout quando o teclado virtual aparece.
Gradientes e Desfoque: LinearGradient e BlurView são usados para criar fundos visualmente interessantes e efeitos de profundidade.
Cards e Seções:

Elementos como BookingSummaryCard, CategoriaCard, RecomendacaoCard, PrestadorCard e missionsCard são containers retangulares com borderRadius generosos (geralmente 12, 15, 20, 24 ou 30px para cards, botões e imagens). Bordas arredondadas são percebidas como mais "amigáveis" e menos agressivas do que cantos afiados, conferindo um toque suave e moderno ao design.
padding interno e shadowColor e shadowOpacity sutis (shadowColor: '#000', com shadowOpacity baixo, ex: 0.05 a 0.25) para simular profundidade e flutuação. Isso adiciona profundidade aos elementos sem sobrecarregar a interface, criando uma sensação de camadas e organização que é visualmente agradável e fácil de processar.
overflow: 'hidden' é comum para garantir que gradientes, imagens e efeitos de reflexo respeitem as bordas arredondadas dos cards.
O conteúdo é frequentemente organizado em seções com títulos claros e, por vezes, botões "Ver Tudo" para navegação.
Botões:

Baseados em TouchableOpacity, com estilos bem definidos para padding, borderRadius e backgroundColor.
A maioria dos botões incorpora sombras para um efeito de "elevação".
Botões de ação primária são grandes e coloridos, enquanto botões de ícone (Ionicons, MaterialCommunityIcons) são usados para ações secundárias ou navegação.
Entradas de Texto (TextInput):

Apresentam um design limpo com backgroundColor branco, borderRadius, bordas sutis e padding horizontal.
As cores do texto e do placeholder são escolhidas para garantir contraste e legibilidade.
Ícones:

As bibliotecas Ionicons e MaterialCommunityIcons são as fontes primárias de ícones, utilizadas para clareza visual, navegação e representação de funcionalidades.
Tipografia:

Títulos: Fontes maiores (16-22px), com pesos bold ou 700/800, e cores escuras para forte contraste (#333, #212529, #2C3E50).
Subtítulos e Labels: Fontes de tamanho médio (12-16px), com pesos 500/600, e cores cinzas para informações complementares (#666, #6C757D, #868E96).
Valores e Preços: Tamanhos variados (13-24px), com pesos bold ou 700/900, e cores de destaque (azuis, verdes) para chamar a atenção.
Texto de Botão: Fontes de tamanho menor (11-17px), com pesos bold ou 600/700, em cores brancas ou as cores de destaque dos botões.
Texto de Informação e Pequeno: Fontes menores (8-12px), com cores mais suaves (rgba(255,255,255,0.8), #999), usadas para detalhes e avisos.
lineHeight para legibilidade: Definido em blocos de texto maiores (ex: descriptionText, reviewComment). Isso melhora a legibilidade do texto, tornando-o mais fácil de ler e reduzindo a tensão visual, especialmente em blocos de texto maiores.
Ocasionalmente, textShadow é aplicado a títulos e textos para maior destaque e profundidade visual.
Elementos Visuais Adicionais:

Divisores estilizados com círculos e linhas tracejadas.
Badges para exibir contagens de notificações ou informações rápidas.
Sistemas de avaliação por estrelas para prestadores de serviço.
Efeitos de "confetti" em banners promocionais.