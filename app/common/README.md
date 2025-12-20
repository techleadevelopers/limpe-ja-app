Documentação do Fluxo da Área Comum (LimpeJá App)
Esta documentação detalha a estrutura de rotas, o fluxo de navegação e as funcionalidades presentes na área comum do aplicativo LimpeJá, acessível por diferentes perfis de usuário (cliente, provedor), baseando-se nos arquivos React Native fornecidos.

Estrutura de Diretórios e Rotas
A área (common) agrupa funcionalidades e telas que são compartilhadas entre diferentes tipos de usuários (clientes e provedores). A estrutura de rotas é gerenciada pelo Expo Router.

stylus

Copiar
(common)/
├── active-booking/
│   └── [bookingId].tsx
├── feedback/
│   ├── dispute/
│   │   ├── [bookingId].tsx
│   │   └── index.tsx
│   └── [targetId].tsx
├── safety/
│   ├── _layout.tsx
│   ├── defense.tsx
│   ├── incident-report.tsx
│   ├── index.tsx
│   └── panic.tsx
├── support/
│   ├── _layout.tsx
│   ├── [ticketId].tsx
│   ├── create-ticket.tsx
│   └── index.tsx
├── _layout.tsx
├── help.tsx
├── loyalty.tsx
├── notifications.tsx
├── privacidade.tsx
├── referrals.tsx
├── settings.tsx
└── termos.tsx
1. Layout Principal da Área Comum (app/(common)/_layout.tsx)
O arquivo _layout.tsx na raiz de (common) define a estrutura de navegação em pilha (Stack) para as telas comuns que não possuem um layout de abas próprio ou que são acessadas de forma modal/secundária.

Componente Principal: CommonLayout

Apresentação: Utiliza expo-router's Stack para criar uma navegação hierárquica entre as telas comuns.

Rotas Definidas:

Configurações (settings)
Rota: /(common)/settings
Título Padrão: 'Configurações'
Ajuda e Suporte (help)
Rota: /(common)/help
Título Padrão: 'Ajuda e Suporte'
Notificações (notifications)
Rota: /(common)/notifications
Título Padrão: 'Notificações'
Feedback Dinâmico (feedback/[targetId])
Rota: /(common)/feedback/[targetId]
Título Padrão: 'Enviar Feedback'
Termos de Serviço (termos)
Rota: /(common)/termos
Título Padrão: 'Termos de Serviço'
Política de Privacidade (privacidade)
Rota: /(common)/privacidade
Título Padrão: 'Política de Privacidade'
Indique e Ganhe (referrals)
Rota: /(common)/referrals
Título Padrão: 'Indique e Ganhe'
Programa de Fidelidade (loyalty)
Rota: /(common)/loyalty
Título Padrão: 'Programa de Fidelidade'
Detalhes de Reserva Ativa (active-booking/[bookingId])
Rota: /(common)/active-booking/[bookingId]
Título Padrão: (Não definido explicitamente no _layout.tsx raiz, provavelmente definido na tela individual).
2. Detalhes das Telas Comuns
2.1. Detalhes de Reserva Ativa (app/(common)/active-booking/[bookingId].tsx)
Esta tela é um placeholder para exibir detalhes de uma reserva ativa específica.

Rota: /(common)/active-booking/[bookingId]
Parâmetro de Rota: bookingId (ID da reserva).
Dados Exibidos: O ID da reserva passado como parâmetro.
Componentes/Seções Principais:
View e Text simples para exibir o ID.
Animações:
fadeAnim e translateYAnim: Animações de fade-in e slide-in para o texto principal na montagem da tela, com duração de 800ms.
Interação: A tela é puramente de exibição, sem interações complexas.
2.2. Feedback Dinâmico (app/(common)/feedback/[targetId].tsx)
Esta tela permite ao usuário enviar feedback e avaliações para diferentes alvos (serviço, perfil de provedor, ou o próprio aplicativo).

Rota: /(common)/feedback/[targetId]
Parâmetros de Rota: targetId (ID do item a ser avaliado), type (tipo de feedback: 'service', 'provider_profile', 'app_feedback'), serviceName, providerName, providerId.
Dados Exibidos:
Informações do alvo do feedback (nome do serviço/provedor).
Avaliação em estrelas (rating).
Comentário do usuário (comment).
Status de carregamento (isLoading).
ID do usuário logado (user.id) via useAuth.
Componentes/Seções Principais:
StarRating: Componente customizado para seleção de estrelas.
TextInput: Para o campo de comentário.
TouchableOpacity com ActivityIndicator: Botão de envio com feedback de carregamento.
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
setRating: Atualiza a avaliação em estrelas.
setComment: Atualiza o texto do comentário.
handleSubmitFeedback: Envia o feedback para o serviço submitFeedback. Realiza validações (usuário logado, avaliação/comentário obrigatórios). Exibe Alert de sucesso ou erro. Navega de volta ou para uma tela inicial após o envio.
2.3. Disputas - Lista (app/(common)/feedback/dispute/index.tsx)
Esta tela exibe uma lista das disputas abertas ou resolvidas do usuário.

Rota: /(common)/feedback/dispute
Dados Exibidos (Mockados): mockDisputes (ID, bookingId, assunto, status, data).
Componentes/Seções Principais:
Header: Cabeçalho da tela.
FlatList: Para renderizar a lista de disputas.
DisputeListItem: Componente para cada item da lista, exibindo detalhes da disputa e seu status.
Card: Utilizado para o layout de cada item da disputa.
PrimaryButton: Botão para "Abrir Nova Disputa".
Icon: Para ícones de status e navegação.
EmptyStateContainer: Exibido quando não há disputas.
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
handleCreateNewDispute: Placeholder para iniciar o fluxo de criação de uma nova disputa.
onPress em DisputeListItem: Navega para a tela de detalhes da disputa específica (/(common)/feedback/dispute/[bookingId]).
2.4. Disputas - Detalhes (app/(common)/feedback/dispute/[bookingId].tsx)
Esta tela exibe os detalhes completos de uma disputa específica, incluindo histórico de mensagens e anexos.

Rota: /(common)/feedback/dispute/[bookingId]
Parâmetro de Rota: bookingId (ID da reserva associada à disputa).
Dados Exibidos (Mockados): mockDisputeDetails (assunto, status, descrição, anexos, mensagens).
Componentes/Seções Principais:
Header: Cabeçalho da tela.
ScrollView: Para o conteúdo rolável.
Card: Para agrupar seções como "Detalhes da Disputa", "Anexos" e "Histórico de Mensagens".
TextInputWithIcon: Para digitar novas mensagens.
TouchableOpacity com Icon: Botões para anexar arquivos e enviar mensagens.
Mensagens: Renderizadas em bolhas (messageBubble) com estilos diferentes para remetente (userMessage, adminMessage).
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
handleSendMessage: Simula o envio de uma mensagem, limpando o campo de texto e exibindo um Alert.
handleUploadFile: Placeholder para a funcionalidade de upload de arquivo.
Navegação de volta via Header.
2.5. Ajuda e Suporte (app/(common)/help.tsx)
Esta tela serve como uma central de ajuda, oferecendo FAQs e opções de contato.

Rota: /(common)/help
Dados Exibidos:
Perguntas Frequentes (faqs) carregadas do serviço faqService.
Termo de busca (searchTerm) para filtrar FAQs.
Status de carregamento (isLoadingFaqs).
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão de voltar.
TextInput com Ionicons: Campo de busca de FAQs.
AnimatedFaqItem: Componente animado para cada item da FAQ (pergunta e resposta).
AnimatedContactButton: Componente animado para botões de contato (e-mail, telefone, chat).
Skeleton: Exibido durante o carregamento das FAQs.
Toast: Para exibir mensagens de erro/sucesso.
Animações:
headerAnim, mainHeaderAnim, searchAnim, sectionCardAnim: Animações de entrada escalonadas para o cabeçalho, título principal, barra de busca e cartões de seção.
AnimatedFaqItem e AnimatedContactButton: Cada um possui suas próprias animações de fade, slide e escala no momento da montagem, com atrasos escalonados para um efeito de lista.
headerBackButtonScaleAnim: Animação de escala para feedback visual ao tocar no botão de voltar do cabeçalho.
Interação:
setSearchTerm: Filtra as FAQs exibidas.
loadFaqs: Função assíncrona para buscar as FAQs.
handleContactSupportEmail: Abre o cliente de e-mail padrão.
handleContactSupportPhone: Abre o discador de telefone.
Alert: Para informar sobre funcionalidades em desenvolvimento (chat).
Navegação de volta via Custom Header.
2.6. Programa de Fidelidade (app/(common)/loyalty.tsx)
Esta tela apresenta o programa de fidelidade do usuário, incluindo pontos, nível e recompensas.

Rota: /(common)/loyalty
Dados Exibidos (Mockados): mockLoyaltyData (pontos atuais, pontos para o próximo nível, nível atual, próximo nível, pontos ganhos no mês, recompensas disponíveis, como ganhar pontos).
Componentes/Seções Principais:
Header: Cabeçalho da tela.
ScrollView: Para o conteúdo rolável.
LoyaltySummaryCard: Componente customizado para exibir o resumo dos pontos e níveis.
RewardItem: Componente customizado para cada recompensa disponível.
HowToEarnSection: Componente customizado para exibir as regras de como ganhar pontos.
AnimatedCardWrapper: Um wrapper para aplicar animações de entrada em seções.
Animações:
AnimatedCardWrapper: Aplica animações de fade-in e slide-in (translateY) para as seções (LoyaltySummaryCard, rewardsCard, HowToEarnSection) com atrasos escalonados.
RewardItem: Possui um delay próprio para animações escalonadas dentro da lista de recompensas.
Interação:
handleRedeemReward: Simula o resgate de uma recompensa. Verifica pontos, exibe Alert de confirmação, e atualiza o estado local (reduz pontos, remove recompensa). Em um ambiente real, faria uma chamada API.
2.7. Notificações (app/(common)/notifications.tsx)
Esta tela exibe uma lista das notificações do usuário, permitindo marcá-las como lidas e navegar para o conteúdo relacionado.

Rota: /(common)/notifications
Dados Exibidos:
Lista de notificações (notifications) carregadas do serviço notificationService.
Status de carregamento (isLoading, isRefreshing).
ID do usuário logado (user.id) via useAuth.
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão "Marcar Todas como Lidas" (se houver notificações não lidas).
FlatList: Para exibir a lista de notificações.
AnimatedNotificationItem: Componente animado para cada notificação, exibindo título, corpo, timestamp e ícone.
RefreshControl: Para puxar para atualizar a lista.
ActivityIndicator: Para feedback de carregamento.
Ionicons, MaterialCommunityIcons: Para os ícones das notificações.
EmptyState: Exibido quando não há notificações.
Animações:
headerAnim: Animação de entrada para o cabeçalho.
feedbackAnim: Animação de fade para o feedback de carregamento ou estado vazio.
AnimatedNotificationItem: Cada item possui animações de fade, slide e escala na montagem, com atrasos escalonados.
markAllButtonScaleAnim: Animação de escala para feedback visual ao tocar no botão "Marcar Todas como Lidas".
Interação:
loadNotifications: Função assíncrona para buscar e ordenar notificações.
handleNotificationPress: Marca a notificação como lida (no frontend e backend via markNotificationAsRead) e navega para a rota navigateTo se especificada.
handleMarkAllAsRead: Marca todas as notificações como lidas (no frontend e backend via markAllNotificationsAsRead).
onRefresh: Aciona loadNotifications para atualizar a lista.
2.8. Política de Privacidade (app/(common)/privacidade.tsx)
Esta tela exibe o texto completo da Política de Privacidade do aplicativo.

Rota: /(common)/privacidade
Dados Exibidos: Conteúdo estático da política de privacidade.
Componentes/Seções Principais:
ScrollView: Para o conteúdo rolável.
Stack.Screen: Para definir o título da tela.
Text: Para exibir o texto.
Animações:
titleAnim: Animação de fade-in e slide-in para o título principal da política.
contentAnim: Animação de fade-in e slide-in para o corpo do texto da política, iniciando após o título.
Interação: Nenhuma.
2.9. Indique e Ganhe (app/(common)/referrals.tsx)
Esta tela permite ao usuário gerenciar seu programa de indicações, compartilhar seu código e ver seus ganhos.

Rota: /(common)/referrals
Dados Exibidos (Mockados): mockReferralData (código de indicação, total de indicações, indicações concluídas, ganhos, usuários indicados, como funciona).
Componentes/Seções Principais:
Header: Cabeçalho da tela.
ScrollView: Para o conteúdo rolável.
AnimatedCard: Componente customizado para aplicar animações de entrada em cada seção (código, estatísticas, como funciona, usuários indicados).
PrimaryButton: Botão para "Compartilhar Código".
Icon: Para ícones de copiar e de status.
Animações:
AnimatedCard: Aplica animações de fade-in e slide-in (translateY) para as seções com atrasos escalonados.
buttonScaleAnim: Animação de escala para feedback visual ao tocar nos botões de copiar e compartilhar.
Interação:
handleShareCode: Utiliza a API Share do React Native para compartilhar o código de indicação.
handleCopyCode: Copia o código de indicação para a área de transferência usando expo-clipboard.
Exibe Alert para informar sobre o sucesso da cópia ou erros no compartilhamento.
2.10. Configurações (app/(common)/settings.tsx)
Esta tela permite ao usuário ajustar as preferências do aplicativo e acessar informações da conta e legais.

Rota: /(common)/settings
Dados Exibidos:
Preferências do usuário (settings) via AppContext (notificações, modo escuro).
Versão e build do aplicativo via expo-constants.
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão de voltar.
ScrollView: Para o conteúdo rolável.
AnimatedSettingSwitchItem: Componente animado para itens de configuração com um Switch (ex: notificações, modo escuro).
AnimatedSettingNavigationItem: Componente animado para itens de navegação (ex: gerenciar dados, termos de serviço).
Ionicons, MaterialCommunityIcons: Para os ícones dos itens de configuração.
Animações:
headerAnim, mainTitleAnim, sectionCardAnim1, sectionCardAnim2, sectionCardAnim3: Animações de entrada escalonadas para o cabeçalho, título principal e os cartões de seção.
AnimatedSettingSwitchItem e AnimatedSettingNavigationItem: Cada item possui suas próprias animações de fade, slide e escala na montagem, com atrasos escalonados.
headerBackButtonScaleAnim: Animação de escala para feedback visual ao tocar no botão de voltar do cabeçalho.
Interação:
handleToggleNotifications: Atualiza a preferência de notificações via AppContext e exibe um Alert simulado.
handleToggleDarkMode: Alterna o tema via AppContext e exibe um Alert simulado.
openURL: Abre URLs externas (para termos e política de privacidade).
router.push: Navega para outras telas (ex: editar perfil).
Alert: Para ações como exclusão de conta (placeholder) e funcionalidades em desenvolvimento.
2.11. Termos de Serviço (app/(common)/termos.tsx)
Esta tela exibe o texto completo dos Termos de Serviço do aplicativo.

Rota: /(common)/termos
Dados Exibidos: Conteúdo estático dos termos de serviço.
Componentes/Seções Principais:
ScrollView: Para o conteúdo rolável.
Stack.Screen: Para definir o título da tela.
Text: Para exibir o texto.
Animações: Nenhuma animação explícita definida neste arquivo.
Interação: Nenhuma.
3. Seção de Segurança (app/(common)/safety)
3.1. Layout da Seção de Segurança (app/(common)/safety/_layout.tsx)
Este layout define a pilha de navegação para todas as telas relacionadas à segurança.

Rota: /(common)/safety
Componente Principal: SafetyLayout
Apresentação: Utiliza expo-router's Stack para gerenciar a navegação entre as telas de segurança. Todos os cabeçalhos são desativados (headerShown: false) pois as telas internas implementam seus próprios cabeçalhos customizados.
Rotas Definidas:
Índice de Segurança (index)
Rota: /(common)/safety
Título Padrão: 'Segurança e Emergência'
Botão de Pânico (panic)
Rota: /(common)/safety/panic
Título Padrão: 'Botão de Pânico'
Relatar Incidente (incident-report)
Rota: /(common)/safety/incident-report
Título Padrão: 'Relatar Incidente'
3.2. Índice de Segurança (app/(common)/safety/index.tsx)
Esta tela serve como um hub central para funcionalidades de segurança e emergência.

Rota: /(common)/safety
Dados Exibidos: Nenhuns dados específicos são exibidos, apenas links para outras funcionalidades.
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão de voltar.
ScrollView: Para o conteúdo rolável.
SectionCard: Um cartão para agrupar os recursos de segurança.
AnimatedMenuItem: Componente customizado para os botões de navegação (Botão de Pânico, Relatar Incidente), com ícones 2D e sobreposição sutil de ícones 3D.
Icon3D: Componente para renderizar ícones 3D.
Animações:
headerAnim e contentAnim: Animações de entrada escalonadas para o cabeçalho e o conteúdo principal.
AnimatedMenuItem: Cada item de menu possui animações de fade, slide e escala na montagem, com atrasos escalonados e feedback de toque.
Interação:
router.push: Navega para as telas de "Botão de Pânico" e "Relatar Incidente".
3.3. Botão de Pânico (app/(common)/safety/panic.tsx)
Esta tela implementa um botão de pânico com contagem regressiva e envio de localização.

Rota: /(common)/safety/panic
Dados Exibidos:
Contagem regressiva (countdown).
Status da contagem (isCounting).
Informações de localização (location).
Textos traduzidos via useTranslation.
Componentes/Seções Principais:
Text: Para cabeçalho, descrição, status da localização, contagem regressiva e aviso.
TouchableOpacity: Para os botões de pânico e cancelar.
ActivityIndicator: Para feedback de carregamento (localização e envio).
Animações:
headerAnim, descriptionAnim, locationStatusAnim, buttonAnim, warningTextAnim: Animações de entrada escalonadas para os elementos da tela.
panicButtonScaleAnim e cancelButtonScaleAnim: Animações de escala para feedback visual ao tocar nos botões.
countdownPulseAnim: Animação de pulsação para o texto da contagem regressiva.
Interação:
Location.requestForegroundPermissionsAsync e Location.getCurrentPositionAsync: Solicita e obtém a permissão e a localização do usuário.
handleInitiatePanic: Inicia a contagem regressiva para o envio do alerta de pânico.
handleCancelPanic: Cancela a contagem regressiva e o envio do alerta.
handleSendPanic: Envia o alerta de pânico (com localização) para o serviço reportPanic. Lida com erros e exibe Alert de sucesso/erro. Navega de volta após o envio.
3.4. Defesa (app/(common)/safety/defense.tsx)
Esta tela oferece informações sobre as garantias de segurança do aplicativo, um banner de proteção, o sistema SOS e contatos de emergência.

Rota: /(common)/safety/defense
Dados Exibidos (Mockados): panicStatus (para simular o PanicBanner).
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão de voltar.
ScrollView: Para o conteúdo rolável.
LinearGradient: Para o banner de proteção.
Icon3D: Componente para renderizar ícones 3D (escudo, cadeado, dinheiro, telefone 911, fogo, ambulância).
Card: Para agrupar seções como "O que o app entrega", "SOS & Acompanhamento" e "Contatos de emergência".
PanicBanner: Componente para exibir o status do pânico.
Button: Botões de ação (ex: "Abrir central de pânico", "Ver políticas").
TouchableOpacity com Icon3D: Botões de contato de emergência (Polícia, Bombeiros, SAMU).
Animações:
headerAnim e contentAnim: Animações de entrada para o cabeçalho e o conteúdo principal.
float1 e float2: Animações de flutuação para ícones decorativos no banner.
Interação:
onCall: Abre o discador para números de emergência.
onPanic: Simula o acionamento do pânico e atualiza o panicStatus do PanicBanner.
router.push: Navega para a tela de pânico e políticas legais.
3.5. Relatar Incidente (app/(common)/safety/incident-report.tsx)
Esta tela permite ao usuário relatar um incidente, fornecendo tipo, descrição e anexos.

Rota: /(common)/safety/incident-report
Dados Exibidos:
Tipo de incidente (incidentType).
Descrição (description).
ID da reserva (bookingId).
Anexos (attachments).
Componentes/Seções Principais:
Custom Header: Cabeçalho animado com botão de voltar.
ScrollView: Para o formulário rolável.
Picker: Para selecionar o tipo de incidente.
TextInput: Para descrição e ID da reserva.
TouchableOpacity: Para selecionar imagens e enviar o relatório.
ActivityIndicator: Para feedback de carregamento.
Animações:
headerAnim e formContentAnim: Animações de entrada escalonadas para o cabeçalho e o conteúdo do formulário.
submitButtonScaleAnim: Animação de escala para feedback visual ao tocar nos botões de anexar e enviar.
Interação:
setIncidentType, setDescription, setBookingId, setAttachments: Atualizam o estado do formulário.
pickImage: Abre a galeria de imagens para seleção, usando expo-image-picker.
handleSubmit: Envia o relatório de incidente para o serviço reportIncident. Realiza validações, lida com carregamento e exibe Alert de sucesso/erro. Navega de volta após o envio.
4. Seção de Suporte (app/(common)/support)
4.1. Layout da Seção de Suporte (app/(common)/support/_layout.tsx)
Este layout define a pilha de navegação para todas as telas relacionadas ao suporte ao cliente.

Rota: /(common)/support
Componente Principal: SupportLayout
Apresentação: Utiliza expo-router's Stack para gerenciar a navegação entre as telas de suporte. Todos os cabeçalhos são desativados (headerShown: false) pois as telas internas implementam seus próprios cabeçalhos customizados.
Rotas Definidas:
Lista de Tickets (index)
Rota: /(common)/support
Título Padrão: 'Meus Tickets de Suporte'
Criar Ticket (create-ticket)
Rota: /(common)/support/create-ticket
Título Padrão: 'Abrir Novo Ticket'
Detalhes do Ticket ([ticketId])
Rota: /(common)/support/[ticketId]
Título Padrão: 'Detalhes do Ticket'
4.2. Lista de Tickets de Suporte (app/(common)/support/index.tsx)
Esta tela exibe uma lista dos tickets de suporte do usuário.

Rota: /(common)/support
Dados Exibidos:
Lista de tickets (tickets) carregada do serviço supportService.
Status de carregamento (loading).
Componentes/Seções Principais:
Custom Header: Cabeçalho com botão de voltar.
ScrollView: Para o conteúdo rolável.
TouchableOpacity: Botão "Abrir Novo Ticket".
TicketCard: Componente para cada ticket, exibindo assunto, prévia da última mensagem e data de atualização.
ActivityIndicator: Para feedback de carregamento.
Ionicons: Para ícones e estado vazio.
EmptyStateContainer: Exibido quando não há tickets.
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
fetchTickets: Função assíncrona para buscar os tickets de suporte.
router.push: Navega para a tela de "Criar Novo Ticket" ou para os "Detalhes do Ticket" específico.
Alert: Para mensagens de erro.
4.3. Criar Novo Ticket (app/(common)/support/create-ticket.tsx)
Esta tela permite ao usuário abrir um novo ticket de suporte.

Rota: /(common)/support/create-ticket
Dados Exibidos:
Assunto do ticket (subject).
Mensagem inicial (message).
Status de carregamento (loading).
Componentes/Seções Principais:
Custom Header: Cabeçalho com botão de voltar.
TextInput: Para o assunto e a mensagem.
TouchableOpacity: Botão "Enviar Ticket".
ActivityIndicator: Para feedback de carregamento.
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
setSubject e setMessage: Atualizam o estado do formulário.
handleCreateTicket: Envia o novo ticket para o serviço supportService.createTicket. Realiza validações, lida com carregamento e exibe Alert de sucesso/erro. Navega de volta para a lista de tickets após o sucesso.
4.4. Detalhes do Ticket (app/(common)/support/[ticketId].tsx)
Esta tela exibe o histórico de mensagens de um ticket de suporte específico e permite ao usuário enviar novas mensagens.

Rota: /(common)/support/[ticketId]
Parâmetro de Rota: ticketId (ID do ticket).
Dados Exibidos:
Detalhes do ticket (ticket) carregados do serviço supportService.
Nova mensagem a ser enviada (newMessage).
ID do usuário logado (user.id) via AuthContext.
Status de carregamento (loading, sending).
Componentes/Seções Principais:
KeyboardAvoidingView: Para ajustar o layout quando o teclado aparece.
Custom Header: Cabeçalho com botão de voltar e o assunto do ticket.
ScrollView: Para o histórico de mensagens.
TextInput: Para digitar novas mensagens.
TouchableOpacity: Botão de enviar mensagem.
ActivityIndicator: Para feedback de carregamento.
Ionicons: Para ícones e estado vazio do chat.
MessageBubble: Componentes para exibir as mensagens, com estilos diferentes para remetente (usuário atual vs. outros).
Animações: Nenhuma animação explícita definida neste arquivo.
Interação:
fetchTicketDetails: Função assíncrona para buscar os detalhes do ticket e suas mensagens.
handleSendMessage: Envia uma nova mensagem para o ticket via supportService.addMessageToTicket. Atualiza otimisticamente a UI e lida com erros.
scrollViewRef: Garante que o chat role automaticamente para o final ao carregar ou enviar novas mensagens.
getMessageAlignment, getMessageBubbleStyle, getMessageTextStyle: Funções auxiliares para estilizar as bolhas de mensagem com base no remetente.