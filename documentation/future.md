CleaningApp/
├── app/
│   ├── (auth)/ # Fluxo de Autenticação
│   │   ├── api/
│   │   ├── components/
│   │   ├── provider-register/ # Processo de Registro do Prestador (Será Aprimorado)
│   │   │   ├── components/
│   │   │   ├── index.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── personal-details.tsx
│   │   │   ├── service-details.tsx
│   │   │   └── verification/            # <-- NOVA PASTA: Para telas de verificação (documentos, facial)
│   │   │       ├── document-upload.tsx  # Tela para upload de documentos (RG, comprovante de residência)
│   │   │       ├── facial-recognition.tsx # Tela para reconhecimento facial (se aplicável)
│   │   │       └── background-check-status.tsx # Tela para status da verificação de antecedentes
│   │   ├── client-register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── layout.tsx
│   │   ├── login.tsx
│   │   ├── README.md
│   │   ├── register-options.tsx
│   │   └── test-connection.tsx
│   │
│   ├── (client)/ # Funcionalidades do Cliente
│   │   ├── bookings/ # Agendamentos do Cliente (Foco na Praticidade de Agendamento)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [bookingId].tsx
│   │   │   ├── index.tsx
│   │   │   ├── schedule-service.tsx      # <-- PRINCIPAL PONTO DE MELHORIA: Agendamento Inteligente
│   │   │   │   ├── steps/                # Ex: Pasta para múltiplos passos do agendamento
│   │   │   │   │   ├── service-type-selection.tsx
│   │   │   │   │   ├── date-time-picker.tsx
│   │   │   │   │   ├── address-details.tsx
│   │   │   │   │   └── payment-method-selection.tsx # Para futuras diversificações (assinatura, etc.)
│   │   │   │   └── confirmation-summary.tsx
│   │   │   └── success.tsx
│   │   │
│   │   ├── explore/ # Explorar Serviços/Profissionais (Foco em UI Rica e Recomendações)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── styles/
│   │   │   ├── [providerId].tsx          # Perfil detalhado do prestador (com avaliações, badges)
│   │   │   ├── index.tsx                 # Tela principal de exploração/home
│   │   │   ├── search-results.tsx        # <--- Antigo resultados-busca.tsx
│   │   │   ├── service-category.tsx      # <--- Antigo servicos-por-categoria.tsx
│   │   │   ├── all-categories.tsx        # <--- Antigo todas-categorias.tsx
│   │   │   ├── nearby-providers.tsx      # <--- Antigo todos-prestadores-proximos.tsx
│   │   │   └── featured-services.tsx     # <-- NOVA: Sugestões de serviços/prestadores (IA)
│   │   │
│   │   ├── messages/ # Mensagens do Cliente (Chat - Comunicação Direta)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   ├── index.tsx
│   │   │   └── attachments/              # <-- NOVA: Para funcionalidades como envio de fotos
│   │   │       ├── photo-upload.tsx
│   │   │       └── file-preview.tsx
│   │   │
│   │   ├── offers/ # Ofertas do Cliente
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── [ofertaId].tsx
│   │   │
│   │   ├── feedback/                     # <-- MOVIDO/CONSOLIDADO: Sistema de Avaliações (Recíprocas)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── create-review.tsx         # Tela para cliente avaliar prestador
│   │   │   ├── respond-review.tsx        # Tela para prestador responder avaliação
│   │   │   └── [targetId].tsx            # Tela de visualização de reviews (para cliente ou provedor)
│   │   │
│   │   └── profile/ # Perfil do Cliente
│   │       ├── api/
│   │       ├── components/
│   │       ├── edit.tsx
│   │       ├── index.tsx
│   │       ├── layout.tsx
│   │       └── payment-methods.tsx       # <-- NOVA: Para gestão de métodos de pagamento (futuras diversificações)
│   │
│   ├── (provider)/ # Funcionalidades do Provedor
│   │   ├── api/
│   │   ├── components/
│   │   ├── messages/ # Mensagens do Provedor (Chat - Comunicação Direta)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [chatId].tsx
│   │   │   ├── index.tsx
│   │   │   └── attachments/              # <-- NOVA: Para funcionalidades como envio de fotos
│   │   │       ├── photo-upload.tsx
│   │   │       └── file-preview.tsx
│   │   │
│   │   ├── profile/ # Perfil do Provedor (Foco em Ferramentas de Gestão)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── edit-services.tsx
│   │   │   ├── index.tsx
│   │   │   ├── earnings-details.tsx      # <-- NOVA: Detalhamento de ganhos e comissões
│   │   │   ├── service-offerings.tsx     # Gerenciamento de serviços/preços
│   │   │   ├── quality-badges.tsx        # <-- NOVA: Exibição e progresso de badges de qualidade
│   │   │   └── training-center.tsx       # <-- NOVA: Acesso a guias de boas práticas/treinamentos
│   │   │
│   │   ├── schedule/ # Agenda/Disponibilidade do Provedor (Otimização)
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   └── index.tsx                 # Calendário intuitivo para bloquear/liberar horários
│   │   │
│   │   ├── services/ # Serviços/Solicitações do Provedor
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── [serviceId].tsx           # Detalhes de um serviço aceito/concluído
│   │   │   ├── index.tsx                 # Lista de serviços aceitos/pendentes
│   │   │   └── offer-details.tsx         # Tela para ver detalhes da oferta de serviço
│   │   │
│   │   ├── dashboard.tsx                 # Painel principal do provedor
│   │   ├── earnings.tsx                  # <--- Antigo earnings.tsx
│   │   ├── layout.tsx
│   │   ├── README.md
│   │   └── services/                     # <-- Considerar mover para services/globais ou refatorar
│   │       ├── authService.ts
│   │       └── clientService.ts
│   │
│   ├── (common)/ # Funcionalidades Comuns (cliente e provedor)
│   │   ├── api/
│   │   ├── components/
│   │   ├── help-center/                  # <-- NOVA: Estrutura para FAQ, artigos, chat de suporte
│   │   │   ├── index.tsx
│   │   │   ├── faq.tsx
│   │   │   ├── articles.tsx
│   │   │   └── support-chat.tsx          # Chat com suporte, não com outro usuário
│   │   ├── notifications.tsx             # Gerenciamento de notificações
│   │   ├── settings.tsx
│   │   ├── legal/                        # <-- NOVA: Política de Privacidade, Termos de Uso
│   │   │   ├── privacy-policy.tsx        # <--- Antigo privacidade.tsx
│   │   │   └── terms-of-service.tsx      # <--- Antigo termos.tsx
│   │   ├── contact-us.tsx                # <--- Antigo help.tsx (melhor nome)
│   │   └── disputes/                     # <-- NOVA: Para o fluxo de resolução de disputas
│   │       ├── index.tsx
│   │       ├── create-dispute.tsx
│   │       └── dispute-details.tsx
│   │
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── doc.md
│   ├── index.tsx
│   ├── README.md
│   └── welcome.tsx
│
├── assets/
│   ├── fonts/
│   ├── images/
│   ├── lottie/
│   └── icons/                            # Ícones para badges, etc.
│
├── components/ # Componentes de UI verdadeiramente reutilizáveis e atômicos (globais)
│   ├── layout/
│   ├── ui/
│   ├── modals/                           # Componentes de modais globais (ex: modal de confirmação de PIX)
│   └── shared/                           # Componentes pequenos usados em vários lugares (ex: RatingStars)
│
├── config/
│   ├── AppConfig.ts
│   ├── firebase.ts
│   ├── firebaseClient.ts
│   ├── api-config.ts                     # <-- NOVA: Configurações de API (base URL, timeouts)
│   └── security-config.ts                # <-- NOVA: Configs de segurança (chaves, etc.)
│
├── constants/
│   ├── Colors.ts
│   ├── routes.ts
│   ├── strings.ts
│   ├── theme.ts
│   └── app-settings.ts                   # <-- NOVA: Constantes como comissão, limites de seguro
│
├── contexts/
│   ├── AppContext.tsx
│   ├── AuthContext.tsx
│   ├── ProviderRegistrationContext.tsx
│   ├── BookingContext.tsx                # <-- NOVA: Para gerenciar o estado do agendamento multi-passo
│   └── FeedbackContext.tsx               # <-- NOVA: Para o sistema de feedback
│
├── documentation/
│   └── frontend-architecture.md          # Documentação da arquitetura frontend
│
├── hooks/
│   ├── useAuth.ts
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   ├── useFormValidation.ts
│   ├── useThemeColor.ts
│   ├── useBookingProcess.ts              # <-- NOVA: Hook para lógica do agendamento
│   └── useSecurityFeatures.ts            # <-- NOVA: Hook para câmera/biometria
│
├── node_modules/
├── scripts/
│   └── reset-project.js
│
├── services/ # Serviços para interagir com o backend
│   ├── api.ts
│   ├── authService.ts
│   ├── clientService.ts
│   ├── firebaseConfig.ts
│   ├── paymentService.ts
│   ├── providerService.ts
│   ├── verificationService.ts            # <-- NOVA: Para chamadas de API de verificação (antecedentes, facial)
│   ├── chatService.ts                    # <-- NOVA: Lógica de comunicação Socket.IO
│   ├── notificationService.ts            # <-- NOVA: Lógica de notificações
│   └── analyticsService.ts               # <-- NOVA: Para enviar eventos de IA/Análise
│
├── types/
│   ├── auth.ts
│   ├── booking.ts
│   ├── index.ts
│   ├── navigation.ts
│   ├── provider.ts
│   ├── service.ts
│   ├── types.ts
│   ├── user.ts
│   ├── review.ts                         # <-- NOVA: Tipos para avaliações
│   ├── verification.ts                   # <-- NOVA: Tipos para verificação de documentos/facial
│   ├── chat.ts                           # <-- NOVA: Tipos para mensagens/chat
│   └── payment.ts                        # <-- NOVA: Tipos mais detalhados para pagamentos/PIX
│
├── utils/
│   ├── helpers.ts
│   ├── permissions.ts
│   ├── storage.ts
│   ├── validation.ts                     # <-- NOVA: Funções de validação mais específicas
│   ├── image-processing.ts               # <-- NOVA: Para manipulação de imagens (verificação facial)
│   └── pix-utils.ts                      # <-- NOVA: Para formatação/validação de dados PIX
│
├── .env
├── .gitignore
├── app.json
├── babel.config.js
├── eas.json
├── eslint.config.js
├── expo-env.d.ts
├── LICENSE
├── metro.config.js
├── package-lock.json
├── package.json
├── README.md
└── tsconfig.json