Documentação da Área Comum (app/(common)) do LimpeJá App - Versão Atual
A área (common) do aplicativo LimpeJá é designada para hospedar funcionalidades e telas que são compartilhadas e reutilizadas entre diferentes perfis de usuário (como provedores e clientes), garantindo uma experiência consistente e eficiente no desenvolvimento.

1. Layout Principal da Área Comum (app/(common)/_layout.tsx)
Este arquivo define a estrutura de navegação em pilha (Stack Navigator) para todas as rotas contidas no diretório (common). Ele utiliza o Expo Router para gerenciar a pilha de telas, onde cada Stack.Screen representa uma tela que pode ser acessada dentro deste grupo.

import React from 'react';: Importa a biblioteca essencial do React para construir interfaces de usuário.
import { Stack } from 'expo-router';: Importa o componente Stack do expo-router, que é usado para criar uma navegação em pilha de telas.
export default function CommonLayout() { ... }: Declara o componente funcional CommonLayout que será o layout principal para as rotas comuns.
<Stack>: Este é o contêiner do navegador de pilha. Todas as telas definidas dentro dele serão gerenciadas como uma pilha, permitindo navegação "push" e "pop".
<Stack.Screen name="settings" options={{ title: 'Configurações' }} />: Define uma tela na pilha com o nome settings. O title da barra de navegação para esta tela será "Configurações". A rota correspondente seria /(common)/settings.
<Stack.Screen name="help" options={{ title: 'Ajuda e Suporte' }} />: Define uma tela na pilha com o nome help. O título exibido será "Ajuda e Suporte". A rota correspondente seria /(common)/help.
<Stack.Screen name="notifications" options={{ title: 'Notificações' }} />: Define uma tela para notifications com o título "Notificações". A rota seria /(common)/notifications.
<Stack.Screen name="feedback/[targetId]" options={{ title: 'Enviar Feedback' }} />: Define uma tela com um parâmetro de rota dinâmico [targetId]. O título é "Enviar Feedback". Exemplos de rotas seriam /(common)/feedback/123 ou /(common)/feedback/service_xyz.
{/* Adicione outras telas comuns aqui */}: Um comentário indicando um ponto de extensão para adicionar mais telas que são comuns a ambos os perfis de usuário.
Documentação da Versão Atual:

Rota Base: /(common)
Tipo de Navegação: Pilha (Stack Navigation)
Propósito: Fornecer um layout de navegação consistente para funcionalidades e informações que são acessíveis tanto por provedores quanto por clientes.
Telas Gerenciadas:
settings: Para configurações gerais do aplicativo.
help: Para a central de ajuda e FAQ.
notifications: Para a visualização de notificações do usuário.
feedback/[targetId]: Para envio de feedback, permitindo especificar o alvo do feedback.
Fluxo: As telas dentro de (common) operam de forma independente da estrutura de abas dos perfis de usuário, permitindo serem "empilhadas" sobre qualquer tela de perfil ou acessadas via router.push().
2. Tela de Notificações (app/(common)/notifications.tsx)
Esta tela exibe uma lista de notificações para o usuário, permitindo visualização, marcação de leitura e navegação para conteúdo relacionado.

import React, { useState, useEffect, useCallback, useRef } from 'react';: Importa hooks essenciais do React para gerenciamento de estado (useState), efeitos colaterais (useEffect), memorização de funções (useCallback) e referências a elementos DOM ou valores persistentes (useRef).
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform, Alert, Animated, } from 'react-native';: Importa componentes UI do React Native, incluindo contêineres (View), texto (Text), folha de estilos (StyleSheet), lista otimizada (FlatList), indicador de carregamento (ActivityIndicator), botão de toque (TouchableOpacity), plataforma específica (Platform), alertas (Alert) e API de animação (Animated).
import { Stack, useRouter, Link } from 'expo-router';: Importa Stack para controle do cabeçalho da pilha, useRouter para navegação programática e Link para navegação declarativa do Expo Router.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';: Importa conjuntos de ícones para uso visual.
Funções Globais/Utilitários:
formatNotificationTimestamp(isoTimestamp: string): string:
Propósito: Formatar um timestamp ISO para uma representação relativa e amigável (ex: "Agora mesmo", "Há 5 min", "Ontem", "26 Mai").
Lógica: Calcula a diferença entre o tempo atual e o timestamp da notificação em segundos, minutos, horas e dias para determinar a melhor representação.
interface NotificationItem { ... }:
Define a estrutura de dados para um item de notificação, incluindo id, type (agendamento, mensagem, pagamento, geral), title, body, timestamp (ISO String), isRead (boolean), MapsTo (rota opcional para navegação) e relatedId.
const MOCK_NOTIFICATIONS: NotificationItem[] = [ ... ];:
Array de dados mockados para simular notificações. Essencial para o desenvolvimento e testes sem a necessidade de um backend real.
getNotificationIcon(type: NotificationItem['type']): { name: keyof typeof Ionicons.glyphMap, color: string }:
Propósito: Retornar o ícone e a cor apropriados com base no type da notificação, tornando a visualização mais intuitiva.
Lógica: Utiliza uma instrução switch para mapear os tipos de notificação a ícones específicos da biblioteca Ionicons e cores.
Componentes Reutilizáveis:
AnimatedNotificationItem: React.FC<{ item: NotificationItem; onPress: (item: NotificationItem) => void; delay: number; }>:
Propósito: Renderizar um único item de notificação com efeitos de animação e feedback de toque.
Animações: Utiliza Animated.timing para opacity (fade-in) e translateY (slide-in) com um delay escalonado, criando um efeito de "cascata" na lista. Um scaleAnim é usado para feedback visual ao tocar no item.
Visual: Exibe um ponto azul (unreadDot) para notificações não lidas. O ícone, título, corpo e timestamp são formatados e exibidos. Um ícone de chevron é mostrado se a notificação tiver uma rota para navegação (MapsTo).
Interação: TouchableOpacity com onPress para lidar com a marcação de leitura e navegação, e onPressIn/onPressOut para as animações de escala.
Componente Principal: NotificationsScreen
router = useRouter();: Instância do hook useRouter do Expo Router para navegação programática.
[notifications, setNotifications]: Estado para armazenar a lista de notificações exibidas. Inicializado como um array vazio.
[isLoading, setIsLoading]: Estado booleano para gerenciar o indicador de carregamento da tela.
headerAnim, feedbackAnim, markAllButtonScaleAnim: Referências useRef para valores animados, usados para controlar as animações de entrada do cabeçalho, estados de feedback (carregando/vazio) e feedback de toque do botão "Marcar Todas como Lidas".
useEffect (inicialização):
Inicia a animação de entrada do cabeçalho.
Simula um carregamento de 1 segundo para as notificações, ordenando-as por timestamp decrescente.
Após o carregamento, inicia a animação do feedbackAnim para exibir o conteúdo (lista ou estado vazio).
handleNotificationPress(item: NotificationItem):
Propósito: Lidar com o toque em uma notificação individual.
Lógica: Se a notificação não foi lida, ela é marcada como lida no estado local. Em um ambiente de produção, isso acionaria uma chamada de API para o backend.
Se item.navigateTo estiver definido, o usuário é navegado para a rota especificada. Inclui tratamento de erros para a navegação.
handleMarkAllAsRead():
Propósito: Marcar todas as notificações como lidas.
Lógica: Atualiza o estado local para marcar todas as notificações como lidas e exibe um Alert de sucesso (simulado). Em produção, faria uma chamada de API.
Animações de Botão: onPressInMarkAll e onPressOutMarkAll controlam a animação de escala do botão "Marcar Todas como Lidas".
Renderização Condicional:
Se isLoading for true, exibe um ActivityIndicator e a mensagem "Carregando notificações...".
Se notifications.length === 0 após o carregamento, exibe uma mensagem de "Nenhuma notificação por aqui." com um ícone ilustrativo.
Caso contrário, renderiza a lista de notificações usando FlatList e o componente AnimatedNotificationItem, com um separador entre os itens.
Documentação da Versão Atual:

Rota: /(common)/notifications
Propósito: Gerenciar e exibir as notificações do usuário de forma clara e interativa.
Dados: Lista de objetos NotificationItem, mockados para demonstração.
Fluxo de Interação:
Ao entrar na tela, um indicador de carregamento é exibido enquanto as notificações são "carregadas".
As notificações são apresentadas em uma lista, com animações de entrada em cascata.
Notificações não lidas são visualmente distintas (ponto azul e fundo claro).
O usuário pode tocar em uma notificação para marcá-la como lida e ser redirecionado para a tela relacionada (se aplicável).
Um botão "Marcar Todas como Lidas" aparece se houver notificações não lidas, permitindo ao usuário limpar rapidamente a lista.
São exibidas mensagens claras para os estados de carregamento e lista vazia.
Animações:
Cabeçalho: translateY e opacity para entrada suave.
Itens da Lista: translateY e opacity escalonados (50ms de atraso entre itens) para um efeito de "cascata". scale para feedback ao toque.
Botão "Marcar Todas como Lidas": scale ao toque.
Estados de Feedback (Loading/Empty): opacity para transição suave.
3. Tela de Política de Privacidade (app/(common)/privacidade.tsx)
Esta tela serve como um placeholder para exibir a política de privacidade do aplicativo LimpeJá.

import React from 'react';: Importa a biblioteca React.
import { View, Text, ScrollView, StyleSheet } from 'react-native';: Importa componentes UI do React Native, incluindo View, Text, ScrollView (para conteúdo rolável) e StyleSheet.
import { Stack } from 'expo-router';: Importa Stack do Expo Router para definir opções de tela, como o título do cabeçalho.
export default function PrivacidadeScreen() { ... }: Declara o componente funcional PrivacidadeScreen.
<ScrollView style={styles.container}>: O conteúdo da tela é envolvido por um ScrollView para permitir rolagem se o texto for maior que a tela.
<Stack.Screen options={{ title: 'Política de Privacidade' }} />: Define o título da barra de navegação superior para "Política de Privacidade".
<Text style={styles.title}>Política de Privacidade do LimpeJá</Text>: Título principal da política de privacidade.
<Text style={styles.paragraph}> ... </Text>: Parágrafos de texto que contêm o conteúdo da política. Atualmente, o texto é um placeholder e um comentário indica onde o conteúdo real deve ser inserido.
<Text style={styles.subTitle}>1. Informações que Coletamos</Text>: Um subtítulo para seções da política.
const styles = StyleSheet.create({ ... });: Define os estilos visuais para a tela, incluindo container, title, subTitle e paragraph.
Documentação da Versão Atual:

Rota: /(common)/privacidade (esta rota é definida implicitamente no _layout.tsx comum ao ser referenciada, por exemplo, na tela de configurações).
Propósito: Apresentar a política de privacidade legal do aplicativo aos usuários.
Conteúdo: Atualmente um placeholder. O texto real da política de privacidade deve ser adicionado para cumprir os requisitos legais.
Componentes Principais: ScrollView, Text, Stack.Screen.
Fluxo de Interação: Somente visualização. Não há interação além da rolagem do conteúdo.
4. Tela de Configurações (app/(common)/settings.tsx)
Esta tela permite ao usuário configurar várias preferências do aplicativo, como notificações, tema e gerenciar sua conta, além de acessar informações sobre o aplicativo.

import React, { useState, useEffect, useRef } from 'react';: Importa hooks do React.
import { View, Text, StyleSheet, Switch, Alert, ScrollView, TouchableOpacity, Platform, Linking, Animated, } from 'react-native';: Importa componentes UI do React Native.
import { Stack, useRouter } from 'expo-router';: Importa Stack e useRouter do Expo Router.
import { useAppContext } from '../../contexts/AppContext';: Importa o AppContext, que é fundamental para gerenciar e persistir configurações globais do aplicativo (como o estado de notificações e o tema).
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';: Importa bibliotecas de ícones.
import Constants from 'expo-constants';: Importa Constants do expo-constants para acessar informações do manifesto do aplicativo, como a versão.
Componentes Reutilizáveis:
AnimatedSettingSwitchItem: React.FC<SettingSwitchItemProps>:
Propósito: Componente genérico para um item de configuração que contém um Switch (liga/desliga).
Props: label, description (opcional), iconName, iconColor, value (estado do switch), onValueChange (função de callback), disabled (opcional) e delay (para animação escalonada).
Animações: opacity (fade-in) e translateY (slide-in) com um delay escalonado para entrada suave.
Visual: Exibe um ícone, um rótulo e, opcionalmente, uma descrição. O Switch é estilizado.
AnimatedSettingNavigationItem: React.FC<SettingNavigationItemProps>:
Propósito: Componente genérico para um item de configuração que, ao ser tocado, navega para outra tela ou executa uma ação (como abrir um link).
Props: label, iconName, iconColor, onPress (função de callback) e delay.
Animações: opacity (fade-in), translateY (slide-in) com delay escalonado e scale para feedback de toque.
Visual: Exibe um ícone, um rótulo e um ícone de chevron para indicar navegação.
Componente Principal: SettingsScreen
router = useRouter();: Hook para navegação.
{ settings, updateSettings, toggleTheme } = useAppContext();: Desestruturação para obter as configurações atuais, função para atualizá-las e função para alternar o tema do contexto do aplicativo.
notificationsEnabled, darkModeEnabled: Estados derivados de settings do AppContext.
Animações (headerAnim, mainTitleAnim, sectionCardAnimX): Referências useRef para controlar a animação de entrada de vários elementos da tela em cascata (Animated.stagger).
useEffect (animação): Inicia as animações de entrada dos elementos da tela ao montar o componente.
handleToggleNotifications(value: boolean):
Propósito: Alternar o estado das notificações push.
Lógica: Atualiza o AppContext e exibe um Alert (simulado). Em um cenário real, integraria com serviços de push notification.
handleToggleDarkMode():
Propósito: Alternar o tema do aplicativo entre claro e escuro.
Lógica: Chama toggleTheme do AppContext e exibe um Alert (simulado).
appVersion, appBuildNumber, versionString: Obtém e formata a versão do aplicativo e o número de build usando Constants.expoConfig.
openURL(url: string):
Propósito: Abrir URLs externas (para Termos de Serviço e Política de Privacidade) usando a API Linking do React Native.
Lógica: Verifica se a URL pode ser aberta e, em seguida, tenta abri-la, exibindo um Alert em caso de erro.
Renderização:
Custom Header: Cabeçalho animado com título "Configurações" e um botão de voltar.
Título Principal: "Ajuste as suas preferências" com animação.
Seções de Configuração: Organizadas em "cartões" animados (sectionCard), cada um com um título de seção (sectionTitle):
"Preferências Gerais": Contém switches para notificações e modo escuro, e um item de navegação para "Preferências de Notificação" (placeholder).
"Conta": Inclui itens de navegação para "Gerenciar Meus Dados" (placeholder) e "Excluir Minha Conta" (com um Alert de confirmação).
"Sobre o LimpeJá": Contém links para "Termos de Serviço" e "Política de Privacidade" (abrem URLs externas), e exibe a "Versão do Aplicativo".
Documentação da Versão Atual:

Rota: /(common)/settings
Propósito: Centralizar o gerenciamento de configurações do aplicativo para todos os usuários.
Integração: Depende do AppContext para gerenciar e persistir o estado das configurações do aplicativo.
Fluxo de Interação:
A tela apresenta seções claras para diferentes categorias de configurações.
O usuário pode alternar facilmente as opções de notificação e tema através de switches.
Acesso rápido a documentos legais (Termos de Serviço, Política de Privacidade) e informações da versão do aplicativo.
Opções de gerenciamento de conta (gerenciar dados, excluir conta) com confirmações de segurança.
Animações:
Cabeçalho e Título Principal: Animação de entrada translateY e opacity.
Cartões de Seção: Animações de entrada translateY e opacity com um atraso escalonado para cada cartão.
Itens de Configuração (Switch/Navegação): Animações de entrada translateY e opacity com atraso escalonado dentro de cada seção, e scale para feedback ao toque em itens navegáveis.
5. Tela de Termos de Serviço (app/(common)/termos.tsx)
Esta tela é um placeholder para a exibição dos termos de serviço do aplicativo.

import React from 'react';: Importa a biblioteca React.
import { View, Text, ScrollView, StyleSheet } from 'react-native';: Importa componentes UI do React Native.
import { Stack } from 'expo-router';: Importa Stack do Expo Router para definir o título da tela.
export default function TermosScreen() { ... }: Declara o componente funcional TermosScreen.
<ScrollView style={styles.container}>: O conteúdo da tela é envolvido por um ScrollView para permitir rolagem.
<Stack.Screen options={{ title: 'Termos de Serviço' }} />: Define o título da barra de navegação superior para "Termos de Serviço".
<Text style={styles.title}>Termos de Serviço do LimpeJá</Text>: Título principal dos termos de serviço.
<Text style={styles.paragraph}> ... </Text>: Parágrafos de texto contendo o conteúdo dos termos. Atualmente, possui texto Lorem ipsum e um comentário para adicionar o conteúdo real.
<Text style={styles.subTitle}>1. Aceitação dos Termos</Text>: Um subtítulo para seções dos termos.
const styles = StyleSheet.create({ ... });: Define os estilos visuais para a tela, incluindo container, title, subTitle e paragraph.
Documentação da Versão Atual:

Rota: /(common)/termos (esta rota é definida implicitamente no _layout.tsx comum ao ser referenciada, por exemplo, na tela de configurações).
Propósito: Apresentar os termos de serviço legais do aplicativo aos usuários.
Conteúdo: Atualmente um placeholder. O texto real dos termos de serviço deve ser adicionado para cumprir os requisitos legais.
Componentes Principais: ScrollView, Text, Stack.Screen.
Fluxo de Interação: Apenas visualização do conteúdo.
6. Tela de Central de Ajuda (app/(common)/help.tsx)
Esta tela fornece uma seção de Perguntas Frequentes (FAQ) com funcionalidade de busca e opções de contato para suporte.

import React, { useState, useMemo, useEffect, useRef } from 'react';: Importa hooks do React, incluindo useState (estado), useMemo (memorização de valores), useEffect (efeitos colaterais) e useRef (referências).
import { View, Text, StyleSheet, Linking, ScrollView, TouchableOpacity, TextInput, Platform, Animated, Alert, } from 'react-native';: Importa componentes UI do React Native.
import { Stack, useRouter } from 'expo-router';: Importa Stack e useRouter do Expo Router.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';: Importa bibliotecas de ícones.
Funções Globais/Utilitários:
interface FAQItem { ... }:
Define a estrutura de dados para um item de FAQ, incluindo id, question, answer e keywords (opcional, para busca).
const ALL_FAQS: FAQItem[] = [ ... ];:
Array de dados mockados contendo perguntas e respostas frequentes.
Componentes Reutilizáveis:
AnimatedFaqItem: React.FC<{ faq: FAQItem; delay: number; }>:
Propósito: Renderizar uma única pergunta e resposta da FAQ com animação de entrada.
Animações: opacity (fade-in) e translateY (slide-in) com um delay escalonado.
Visual: Exibe a pergunta (faqQuestion) e a resposta (faqAnswer).
AnimatedContactButton: React.FC<{ label: string; iconName: keyof typeof Ionicons.glyphMap; onPress: () => void; delay: number; }>:
Propósito: Componente genérico para um botão de contato (e-mail, telefone, chat) com animação de entrada e feedback de toque.
Props: label, iconName, onPress e delay.
Animações: opacity (fade-in), translateY (slide-in) com delay escalonado e scale para feedback ao toque.
Visual: Exibe um ícone, um rótulo e um ícone de chevron.
Componente Principal: HelpScreen
router = useRouter();: Hook para navegação.
[searchTerm, setSearchTerm]: Estado para o termo de busca na FAQ.
Animações (headerAnim, searchAnim, sectionCardAnim): Referências useRef para controlar a animação de entrada de vários elementos da tela.
useEffect (animação): Inicia as animações de entrada dos elementos da tela ao montar o componente.
filteredFaqs = useMemo(() => { ... }, [searchTerm]);:
Propósito: Filtrar a lista de FAQs com base no searchTerm.
Lógica: Utiliza useMemo para otimizar o desempenho, recalculando a lista filtrada apenas quando searchTerm muda. A busca é feita no título, corpo e palavras-chave da FAQ.
handleContactSupportEmail():
Propósito: Abrir o aplicativo de e-mail padrão para enviar uma mensagem de suporte.
Lógica: Usa Linking.openURL com um URI mailto:.
handleContactSupportPhone():
Propósito: Iniciar uma chamada telefônica para o suporte.
Lógica: Usa Linking.openURL com um URI tel:. Exibe um Alert de confirmação.
Renderização:
Custom Header: Cabeçalho animado com título "Central de Ajuda" e um botão de voltar.
Título Principal: "Como podemos te ajudar?" com animação.
Seção de FAQ:
Título "Perguntas Frequentes (FAQ)".
Campo de TextInput (searchInput) com ícone de busca e animação, permitindo que o usuário digite um termo para filtrar as FAQs. Um botão "limpar" aparece se houver texto na busca.
Exibe a lista de AnimatedFaqItems filtrados.
Mensagem "Nenhuma pergunta encontrada..." se a busca não retornar resultados.
Seção de Contato:
Título "Ainda precisa de ajuda?".
Texto introdutório.
Botões de contato (AnimatedContactButton) para "Enviar E-mail para Suporte", "Ligar para o Suporte" e "Chat Online com Suporte" (o último é um placeholder).
Documentação da Versão Atual:

Rota: /(common)/help
Propósito: Oferecer aos usuários uma autoajuda através de perguntas frequentes e fornecer canais diretos para contato com o suporte.
Dados: Lista de FAQItems mockados.
Fluxo de Interação:
Ao acessar a tela, o usuário vê um cabeçalho animado e um campo de busca para FAQs.
Pode digitar para filtrar as perguntas frequentes em tempo real.
A lista de FAQs é exibida com animações de entrada.
Se a FAQ não for suficiente, o usuário pode escolher entre opções de contato direto (e-mail, telefone, chat).
Animações:
Cabeçalho, Título Principal e Campo de Busca: translateY e opacity para entrada suave.
Cartões de Seção: translateY e opacity com atraso escalonado.
Itens de FAQ e Botões de Contato: translateY e opacity com atraso escalonado, e scale para feedback ao toque nos botões.
7. Tela de Envio de Feedback (app/(common)/feedback/[targetId].tsx)
Esta tela permite que o usuário envie feedback, que pode incluir uma avaliação por estrelas e um comentário, para um alvo específico (serviço, perfil de provedor ou o próprio aplicativo).

import React, { useState } from 'react';: Importa useState para gerenciamento de estado.
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from 'react-native';: Importa componentes UI do React Native.
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';: Importa Stack para opções de tela, useLocalSearchParams para obter parâmetros da rota e useRouter para navegação.
import { Ionicons } from '@expo/vector-icons';: Importa ícones Ionicons.
Componentes Reutilizáveis:
StarRating: React.FC<StarRatingProps>:
Propósito: Componente reutilizável para permitir que o usuário selecione uma avaliação de estrelas (ex: 1 a 5 estrelas).
Props: rating (valor atual), onRate (função de callback para atualizar a avaliação), maxStars (número total de estrelas, padrão 5), starSize, activeColor e inactiveColor.
Visual: Renderiza maxStars ícones de estrela. As estrelas são preenchidas (star) ou contornadas (star-outline) com base na avaliação atual.
Interação: Cada estrela é um TouchableOpacity que, ao ser tocado, chama onRate com o número da estrela correspondente, atualizando a avaliação.
Componente Principal: FeedbackScreen
params = useLocalSearchParams<{ targetId: string; type?: 'service' | 'provider_profile' | 'app_feedback'; serviceName?: string; providerName?: string; }>();:
Propósito: Obter os parâmetros de rota, como o targetId (ID do item sendo avaliado/feedback), type (tipo de feedback) e nomes opcionais para contexto (e.g., serviceName, providerName).
{ targetId, type, serviceName, providerName } = params;: Desestruturação dos parâmetros da rota. type tem um valor padrão de 'app_feedback'.
router = useRouter();: Hook para navegação.
[rating, setRating]: Estado para armazenar a avaliação por estrelas (de 0 a 5).
[comment, setComment]: Estado para armazenar o texto do comentário/feedback.
[isLoading, setIsLoading]: Estado booleano para gerenciar o indicador de carregamento durante o envio do feedback.
handleSubmitFeedback():
Propósito: Lidar com o envio do formulário de feedback.
Validações:
Para service ou provider_profile feedback, exige que a avaliação (rating) seja diferente de 0.
Para service, provider_profile ou app_feedback, exige que o comment não esteja vazio.
Lógica (Simulada): Define isLoading como true, registra o feedback no console e simula um envio de 1.5 segundos. Em um ambiente real, faria uma chamada de API.
Pós-envio: Exibe um Alert de sucesso e tenta voltar para a tela anterior usando router.back(). Se não houver tela anterior, redireciona para uma tela padrão (/ para feedback do app, ou /client/bookings para feedback de serviço/provedor).
Títulos e Placeholders Dinâmicos: screenTitle, contextInfo e commentPlaceholder são definidos dinamicamente com base no type do feedback, proporcionando uma experiência de usuário mais contextual.
Renderização Condicional:
O componente StarRating é renderizado apenas se o type do feedback não for 'app_feedback'.
O botão de envio exibe um ActivityIndicator quando isLoading é true.
Documentação da Versão Atual:

Rota: /(common)/feedback/[targetId]
Parâmetros de Rota:
targetId: Obrigatório. O ID do item que está sendo avaliado (ex: ID de um serviço, ID de um provedor, ou um identificador genérico para feedback do app).
type: Opcional. Define o contexto do feedback ('service', 'provider_profile', 'app_feedback'). Padrão: 'app_feedback'.
serviceName: Opcional. Nome do serviço para contextualização.
providerName: Opcional. Nome do provedor para contextualização.
Propósito: Coletar feedback do usuário sobre diferentes aspectos do aplicativo ou serviços prestados, incluindo avaliações por estrelas e comentários textuais.
Componentes Principais: StarRating, TextInput, TouchableOpacity, ScrollView, ActivityIndicator.
Fluxo de Interação:
A tela se adapta dinamicamente com base no type de feedback (mudando título, contexto e placeholders).
Para feedback de serviço/provedor, o usuário seleciona uma avaliação de 1 a 5 estrelas.
O usuário insere um comentário no campo de texto, que é obrigatório para a maioria dos tipos de feedback.
Ao clicar em "Enviar Feedback", validações são realizadas.
Um indicador de carregamento é exibido durante o "envio".
Após o "envio" (simulado), uma mensagem de sucesso é exibida e o usuário é redirecionado.