Entendido, cara! Você quer uma documentação focada no que falta fazer para conectar o frontend ao backend que esboçamos, quais testes são necessários, e os passos para o lançamento, visando a versão final onde o LimpeJá pode gerar lucro. Chega de planejar a estrutura do zero, vamos focar em finalizar!

Você está certo, já fizemos muito do planejamento. Agora é hora de detalhar a "reta final" da integração e preparação para o mercado.

🚀 LimpeJá: Roteiro Final para Conexão, Testes e Lançamento
Este documento foca nos passos cruciais para integrar o frontend do LimpeJá com o backend (Firebase Cloud Functions), realizar os testes necessários e preparar o aplicativo para o lançamento nas lojas, com o objetivo de habilitar a monetização através da comissão sobre serviços.

1. Conexão Efetiva Frontend-Backend
Embora já tenhamos definido a arquitetura, a implementação real da comunicação é o próximo passo.

Frontend (Pasta LimpeJaApp/services/):

api.ts:
A Fazer: Configurar a instância do Axios (ou Workspace) para apontar para os URLs base das suas Cloud Functions (HTTP Triggers). Para Callable Functions, o SDK do Firebase lida com o endpoint.
A Fazer: Implementar interceptors no Axios para:
Anexar automaticamente o token de autenticação (ID Token do Firebase Auth) a todas as requisições para endpoints protegidos. O token deve ser obtido do AuthContext.
Lidar com erros de autenticação (ex: token expirado) e, idealmente, implementar uma lógica de refresh de token se o backend suportar, ou deslogar o usuário.
authService.ts:
A Fazer: Implementar as chamadas reais às funções de autenticação do Firebase (SDK Cliente) para login e cadastro de cliente.
A Fazer: Implementar a chamada à Cloud Function (provavelmente Callable) submitProviderRegistration para o cadastro de prestador, enviando os dados coletados nas múltiplas etapas do formulário frontend.
A Fazer: Implementar a lógica de signOut no frontend chamando o firebase.auth().signOut().
clientService.ts, providerService.ts, commonService.ts (ou nomes similares):
A Fazer: Implementar todas as funções que farão chamadas às Cloud Functions (HTTP ou Callable) que criamos os esqueletos para (ex: updateUserProfile, addUserAddress, getProviderDetails, createBooking, updateBookingStatus, requestProviderPayout, getMyPaymentHistory, retryBookingPayment, submitReview, markNotificationsAsRead, getNotificationsHistory, etc.).
Cada função deve lidar com o envio dos dados corretos e o tratamento da resposta (sucesso ou erro) do backend.
Backend (Pasta LimpeJaApp/functions/src/):

Finalizar Lógica das Cloud Functions:
A Fazer (CRUCIAL): Substituir todos os // TODO: e simulações pela lógica de negócios real em todos os arquivos .ts (auth/, users/, providers/, bookings/, payments/, reviews/, notifications/, admin/).
Validação de Dados: Implementar validação robusta (ex: com Zod, Joi, ou validações manuais) para todos os dados recebidos em Cloud Functions HTTP e Callable.
Tratamento de Erros: Garantir tratamento de erro consistente e significativo em todas as functions.
Segurança: Implementar assertRole (ou verificações equivalentes) em todas as Callable Functions e proteger adequadamente os endpoints HTTP.
Regras de Segurança do Firestore (firestore.rules):
A Fazer (CRUCIAL): Escrever regras de segurança detalhadas para proteger todas as suas coleções no Firestore. As regras padrão do "modo de teste" são inseguras para produção. Defina quem pode ler, escrever, atualizar e deletar quais documentos. Use request.auth.uid e request.auth.token.role nas suas regras.
Regras de Segurança do Storage (storage.rules):
A Fazer: Definir regras para quem pode fazer upload e download de arquivos (ex: fotos de perfil, documentos de verificação).
Configuração de Variáveis de Ambiente (Gateway de Pagamento PIX):
A Fazer: Usar firebase functions:config:set pix_provider.apikey="SUA_CHAVE" ... para configurar as chaves de API do seu PSP de PIX e o segredo do webhook.
Testar com Emuladores: Use firebase emulators:start extensivamente para testar suas functions localmente.
2. Testes Necessários (Frontend e Backend)
Testar é fundamental antes de lançar.

Testes Unitários (Backend):
A Fazer: Escrever testes unitários para a lógica de negócios dentro das suas Cloud Functions, especialmente para as partes críticas (cálculo de comissão, transições de status de agendamento, lógica de permissão). O Firebase fornece ferramentas para testes unitários de functions offline.
Testes de Integração (Backend <> Frontend):
A Fazer: Com o frontend conectado aos emuladores do Firebase (Auth, Firestore, Functions):
Testar todos os fluxos de usuário de ponta a ponta.
Fluxo de Cadastro (Cliente e Prestador): Todas as etapas, validações, criação de perfil no Firestore e Auth, definição de role.
Fluxo de Login e Autenticação: Acesso a rotas protegidas, persistência da sessão.
Fluxo do Cliente: Busca de prestadores, visualização de perfil, agendamento (chamada para createPixCharge), visualização de agendamentos, cancelamento, chat, avaliação.
Fluxo do Prestador: Visualização da agenda, gerenciamento de disponibilidade, aceite/recusa de agendamentos, visualização de ganhos, solicitação de repasse, chat, edição de perfil/serviços.
Fluxo de Pagamento PIX: Geração do QR Code/Copia e Cola no frontend, simulação de pagamento (se o PSP tiver sandbox), verificação do webhook no backend e atualização do status do agendamento.
Fluxo de Comissão e Repasse: Verificação (nos dados do Firestore Emulator) se a comissão é calculada corretamente e se o saldo do prestador é atualizado.
Notificações: Testar se as notificações push e in-app (se houver) são disparadas e recebidas corretamente para os eventos planejados.
Testes de UI/UX (Frontend):
A Fazer: Garantir que todas as telas "finais e sofisticadas" que criamos estão responsivas, sem quebras de layout, e que a navegação é fluida e intuitiva em diferentes dispositivos (se possível).
Testar o KeyboardAvoidingView em todas as telas com inputs.
Verificar a clareza das informações e a facilidade de uso.
Testes de Segurança:
A Fazer: Testar as regras do Firestore tentando acessar/modificar dados sem a permissão correta (pode ser feito com scripts ou testes automatizados).
Verificar a segurança dos endpoints HTTP das Cloud Functions.
3. Preparação para Lançamento na Play Store
Finalizar Conteúdo:
A Fazer: Substituir todos os textos "Lorem Ipsum", dados mockados e placeholders por conteúdo real e profissional (Termos de Serviço, Política de Privacidade, FAQs, descrições).
Assets Gráficos Finais:
A Fazer: Usar o ícone final do app (icon.png, adaptive-icon.png) e a tela de splash (splash.png) com a identidade visual do LimpeJá. O ícone deve ser quadrado (1024x1024px recomendado).
Configuração do app.json para Produção:
Revisar name, slug, version (começar com 1.0.0).
ios.bundleIdentifier e android.package: Devem ser os identificadores finais e únicos da sua aplicação nas lojas.
extra.eas.projectId: Deve estar com o ID correto do seu projeto EAS.
Configurar permissions para Android se necessário (ex: CAMERA, READ_EXTERNAL_STORAGE para upload de foto, LOCATION se usado). O expo-location e expo-image-picker já adicionam algumas permissões, mas revise.
Configuração do eas.json para Produção:
Perfil production:
distribution: "store"
Para Android, o padrão é buildType: "app-bundle" (AAB), que é o formato correto para a Play Store.
Configurar variáveis de ambiente de produção (ex: URL da API de produção do seu PSP PIX) usando eas build:configure ou editando eas.json e depois eas secret:create NOME_DA_VARIAVEL.
Construir o App Bundle (AAB) para Produção:
Comando: eas build -p android --profile production
Assinatura (Keystore): O EAS Build cuidará da assinatura. Se for o primeiro build de produção, ele te guiará para criar ou fazer upload de uma keystore. É crucial guardar bem essa keystore e suas senhas, ou deixar o EAS gerenciá-la.
Testar o Build de Produção:
Antes de enviar para a loja, instale o AAB gerado (ou o APK se você gerou um de release) em dispositivos de teste para uma última verificação. A Google Play Console permite testes internos/fechados com AABs.
Criar Conta de Desenvolvedor na Google Play Console:
Se ainda não tem, você precisará de uma conta de desenvolvedor Google Play (há uma taxa única de registro).
Preparar Materiais da Loja:
Screenshots do aplicativo em diferentes tamanhos de tela.
Ícone de alta resolução (512x512 para Play Store).
Gráfico de destaque.
Descrição curta e completa do aplicativo.
Vídeo promocional (opcional).
Política de Privacidade (URL obrigatória).
Enviar para a Google Play Store:
Use o eas submit -p android --profile production (após configurar o perfil de submit no eas.json com sua chave de API do Google Play Developer) ou faça o upload manual do AAB na Google Play Console.
Preencha todos os detalhes da listagem do app, classificação de conteúdo, política de privacidade, etc.
Envie para revisão.
4. Habilitando os Ganhos (Estratégia de Comissão)
Para que a estratégia de ganhos com comissão funcione:

Backend (payments/triggers.ts e paymentGateway.service.ts):
A Fazer (CRUCIAL): A lógica em onBookingFinalizedProcessPayment (ou a lógica chamada pelo webhook PIX) deve:
Receber a confirmação de pagamento do PSP.
Buscar o booking correspondente.
Calcular a comissão do LimpeJá (ex: 20% do booking.totalPrice).
Calcular o providerEarnings (ganho do prestador).
Atualizar o documento booking com commissionValue, providerEarnings, e mudar o paymentStatus para payout_pending.
Atualizar o pendingBalance no providerProfile do prestador.
Backend (payments/callable.ts e/ou admin/callable.ts):
A Fazer: Implementar a lógica para processar repasses (payouts) para os prestadores.
A função requestProviderPayout permite que o prestador solicite.
Uma função de admin (ou um processo agendado) aprovaria e iniciaria a transferência PIX real para a chave PIX do prestador (usando a API do seu PSP e os dados em providerProfile.bankAccount).
Após o repasse ser confirmado pelo PSP, atualizar o paymentStatus no booking para payout_completed (ou similar) e o pendingBalance do prestador.
Frontend (Prestador):
A tela app/(provider)/earnings.tsx deve mostrar o pendingBalance, totalEarnedHistorical, e um histórico de repasses.
Permitir que o prestador chame requestProviderPayout.
Termos e Condições:
A Fazer: Seus Termos de Serviço para Prestadores devem ser muito claros sobre a taxa de comissão, como e quando os pagamentos são processados e repassados.

Entendido, cara! Você quer uma documentação focada no que falta fazer para conectar o frontend ao backend que esboçamos, quais testes são necessários, e os passos para o lançamento, visando a versão final onde o LimpeJá pode gerar lucro. Chega de planejar a estrutura do zero, vamos focar em finalizar!

Você está certo, já fizemos muito do planejamento. Agora é hora de detalhar a "reta final" da integração e preparação para o mercado.

🚀 LimpeJá: Roteiro Final para Conexão, Testes e Lançamento
Este documento foca nos passos cruciais para integrar o frontend do LimpeJá com o backend (Firebase Cloud Functions), realizar os testes necessários e preparar o aplicativo para o lançamento nas lojas, com o objetivo de habilitar a monetização através da comissão sobre serviços.

1. Conexão Efetiva Frontend-Backend
Embora já tenhamos definido a arquitetura, a implementação real da comunicação é o próximo passo.

Frontend (Pasta LimpeJaApp/services/):

api.ts:
A Fazer: Configurar a instância do Axios (ou Workspace) para apontar para os URLs base das suas Cloud Functions (HTTP Triggers). Para Callable Functions, o SDK do Firebase lida com o endpoint.
A Fazer: Implementar interceptors no Axios para:
Anexar automaticamente o token de autenticação (ID Token do Firebase Auth) a todas as requisições para endpoints protegidos. O token deve ser obtido do AuthContext.
Lidar com erros de autenticação (ex: token expirado) e, idealmente, implementar uma lógica de refresh de token se o backend suportar, ou deslogar o usuário.
authService.ts:
A Fazer: Implementar as chamadas reais às funções de autenticação do Firebase (SDK Cliente) para login e cadastro de cliente.
A Fazer: Implementar a chamada à Cloud Function (provavelmente Callable) submitProviderRegistration para o cadastro de prestador, enviando os dados coletados nas múltiplas etapas do formulário frontend.
A Fazer: Implementar a lógica de signOut no frontend chamando o firebase.auth().signOut().
clientService.ts, providerService.ts, commonService.ts (ou nomes similares):
A Fazer: Implementar todas as funções que farão chamadas às Cloud Functions (HTTP ou Callable) que criamos os esqueletos para (ex: updateUserProfile, addUserAddress, getProviderDetails, createBooking, updateBookingStatus, requestProviderPayout, getMyPaymentHistory, retryBookingPayment, submitReview, markNotificationsAsRead, getNotificationsHistory, etc.).
Cada função deve lidar com o envio dos dados corretos e o tratamento da resposta (sucesso ou erro) do backend.
Backend (Pasta LimpeJaApp/functions/src/):

Finalizar Lógica das Cloud Functions:
A Fazer (CRUCIAL): Substituir todos os // TODO: e simulações pela lógica de negócios real em todos os arquivos .ts (auth/, users/, providers/, bookings/, payments/, reviews/, notifications/, admin/).
Validação de Dados: Implementar validação robusta (ex: com Zod, Joi, ou validações manuais) para todos os dados recebidos em Cloud Functions HTTP e Callable.
Tratamento de Erros: Garantir tratamento de erro consistente e significativo em todas as functions.
Segurança: Implementar assertRole (ou verificações equivalentes) em todas as Callable Functions e proteger adequadamente os endpoints HTTP.
Regras de Segurança do Firestore (firestore.rules):
A Fazer (CRUCIAL): Escrever regras de segurança detalhadas para proteger todas as suas coleções no Firestore. As regras padrão do "modo de teste" são inseguras para produção. Defina quem pode ler, escrever, atualizar e deletar quais documentos. Use request.auth.uid e request.auth.token.role nas suas regras.
Regras de Segurança do Storage (storage.rules):
A Fazer: Definir regras para quem pode fazer upload e download de arquivos (ex: fotos de perfil, documentos de verificação).
Configuração de Variáveis de Ambiente (Gateway de Pagamento PIX):
A Fazer: Usar firebase functions:config:set pix_provider.apikey="SUA_CHAVE" ... para configurar as chaves de API do seu PSP de PIX e o segredo do webhook.
Testar com Emuladores: Use firebase emulators:start extensivamente para testar suas functions localmente.
2. Testes Necessários (Frontend e Backend)
Testar é fundamental antes de lançar.

Testes Unitários (Backend):
A Fazer: Escrever testes unitários para a lógica de negócios dentro das suas Cloud Functions, especialmente para as partes críticas (cálculo de comissão, transições de status de agendamento, lógica de permissão). O Firebase fornece ferramentas para testes unitários de functions offline.
Testes de Integração (Backend <> Frontend):
A Fazer: Com o frontend conectado aos emuladores do Firebase (Auth, Firestore, Functions):
Testar todos os fluxos de usuário de ponta a ponta.
Fluxo de Cadastro (Cliente e Prestador): Todas as etapas, validações, criação de perfil no Firestore e Auth, definição de role.
Fluxo de Login e Autenticação: Acesso a rotas protegidas, persistência da sessão.
Fluxo do Cliente: Busca de prestadores, visualização de perfil, agendamento (chamada para createPixCharge), visualização de agendamentos, cancelamento, chat, avaliação.
Fluxo do Prestador: Visualização da agenda, gerenciamento de disponibilidade, aceite/recusa de agendamentos, visualização de ganhos, solicitação de repasse, chat, edição de perfil/serviços.
Fluxo de Pagamento PIX: Geração do QR Code/Copia e Cola no frontend, simulação de pagamento (se o PSP tiver sandbox), verificação do webhook no backend e atualização do status do agendamento.
Fluxo de Comissão e Repasse: Verificação (nos dados do Firestore Emulator) se a comissão é calculada corretamente e se o saldo do prestador é atualizado.
Notificações: Testar se as notificações push e in-app (se houver) são disparadas e recebidas corretamente para os eventos planejados.
Testes de UI/UX (Frontend):
A Fazer: Garantir que todas as telas "finais e sofisticadas" que criamos estão responsivas, sem quebras de layout, e que a navegação é fluida e intuitiva em diferentes dispositivos (se possível).
Testar o KeyboardAvoidingView em todas as telas com inputs.
Verificar a clareza das informações e a facilidade de uso.
Testes de Segurança:
A Fazer: Testar as regras do Firestore tentando acessar/modificar dados sem a permissão correta (pode ser feito com scripts ou testes automatizados).
Verificar a segurança dos endpoints HTTP das Cloud Functions.
3. Preparação para Lançamento na Play Store
Finalizar Conteúdo:
A Fazer: Substituir todos os textos "Lorem Ipsum", dados mockados e placeholders por conteúdo real e profissional (Termos de Serviço, Política de Privacidade, FAQs, descrições).
Assets Gráficos Finais:
A Fazer: Usar o ícone final do app (icon.png, adaptive-icon.png) e a tela de splash (splash.png) com a identidade visual do LimpeJá. O ícone deve ser quadrado (1024x1024px recomendado).
Configuração do app.json para Produção:
Revisar name, slug, version (começar com 1.0.0).
ios.bundleIdentifier e android.package: Devem ser os identificadores finais e únicos da sua aplicação nas lojas.
extra.eas.projectId: Deve estar com o ID correto do seu projeto EAS.
Configurar permissions para Android se necessário (ex: CAMERA, READ_EXTERNAL_STORAGE para upload de foto, LOCATION se usado). O expo-location e expo-image-picker já adicionam algumas permissões, mas revise.
Configuração do eas.json para Produção:
Perfil production:
distribution: "store"
Para Android, o padrão é buildType: "app-bundle" (AAB), que é o formato correto para a Play Store.
Configurar variáveis de ambiente de produção (ex: URL da API de produção do seu PSP PIX) usando eas build:configure ou editando eas.json e depois eas secret:create NOME_DA_VARIAVEL.
Construir o App Bundle (AAB) para Produção:
Comando: eas build -p android --profile production
Assinatura (Keystore): O EAS Build cuidará da assinatura. Se for o primeiro build de produção, ele te guiará para criar ou fazer upload de uma keystore. É crucial guardar bem essa keystore e suas senhas, ou deixar o EAS gerenciá-la.
Testar o Build de Produção:
Antes de enviar para a loja, instale o AAB gerado (ou o APK se você gerou um de release) em dispositivos de teste para uma última verificação. A Google Play Console permite testes internos/fechados com AABs.
Criar Conta de Desenvolvedor na Google Play Console:
Se ainda não tem, você precisará de uma conta de desenvolvedor Google Play (há uma taxa única de registro).
Preparar Materiais da Loja:
Screenshots do aplicativo em diferentes tamanhos de tela.
Ícone de alta resolução (512x512 para Play Store).
Gráfico de destaque.
Descrição curta e completa do aplicativo.
Vídeo promocional (opcional).
Política de Privacidade (URL obrigatória).
Enviar para a Google Play Store:
Use o eas submit -p android --profile production (após configurar o perfil de submit no eas.json com sua chave de API do Google Play Developer) ou faça o upload manual do AAB na Google Play Console.
Preencha todos os detalhes da listagem do app, classificação de conteúdo, política de privacidade, etc.
Envie para revisão.
4. Habilitando os Ganhos (Estratégia de Comissão)
Para que a estratégia de ganhos com comissão funcione:

Backend (payments/triggers.ts e paymentGateway.service.ts):
A Fazer (CRUCIAL): A lógica em onBookingFinalizedProcessPayment (ou a lógica chamada pelo webhook PIX) deve:
Receber a confirmação de pagamento do PSP.
Buscar o booking correspondente.
Calcular a comissão do LimpeJá (ex: 20% do booking.totalPrice).
Calcular o providerEarnings (ganho do prestador).
Atualizar o documento booking com commissionValue, providerEarnings, e mudar o paymentStatus para payout_pending.
Atualizar o pendingBalance no providerProfile do prestador.
Backend (payments/callable.ts e/ou admin/callable.ts):
A Fazer: Implementar a lógica para processar repasses (payouts) para os prestadores.
A função requestProviderPayout permite que o prestador solicite.
Uma função de admin (ou um processo agendado) aprovaria e iniciaria a transferência PIX real para a chave PIX do prestador (usando a API do seu PSP e os dados em providerProfile.bankAccount).
Após o repasse ser confirmado pelo PSP, atualizar o paymentStatus no booking para payout_completed (ou similar) e o pendingBalance do prestador.
Frontend (Prestador):
A tela app/(provider)/earnings.tsx deve mostrar o pendingBalance, totalEarnedHistorical, e um histórico de repasses.
Permitir que o prestador chame requestProviderPayout.
Termos e Condições:
A Fazer: Seus Termos de Serviço para Prestadores devem ser muito claros sobre a taxa de comissão, como e quando os pagamentos são processados e repassados.