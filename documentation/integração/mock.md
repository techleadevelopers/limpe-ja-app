efinido. Ele garante que cada serviço adere ao contrato acordado e que as alterações em um serviço não comprometam outros que dependem dele.

No teste de contrato dirigido pelo consumidor (CDCT), o consumidor define os contratos, e o provedor de serviço implementa e verifica sua conformidade com esses contratos do consumidor. Esse processo frequentemente envolve a inicialização de um servidor mock durante os testes do consumidor. O CDCT pode ajudar a identificar e prevenir problemas que surgem quando múltiplos componentes são integrados, acelerar o desenvolvimento e reduzir os custos de infraestrutura.

Pact é uma ferramenta popular para teste de contrato, que utiliza as expectativas do consumidor para gerar o contrato final. O Pact Broker armazena e gerencia esses contratos, permitindo testes contra múltiplas versões de API.

Em arquiteturas de microsserviços, onde os mocks são frequentemente empregados, o risco de "desalinhamento do mock" é elevado. O teste de contrato, particularmente o dirigido pelo consumidor, atua como um mecanismo crítico para validar que o comportamento do mock (conforme definido pelas expectativas do consumidor) está alinhado com a implementação real do provedor. Isso fornece uma maneira formal e automatizada de garantir a fidelidade do mock em todas as fronteiras de serviço, reduzindo problemas de integração que os mocks sozinhos não conseguem identificar. Isso implica que, para sistemas complexos e distribuídos, os mocks são melhor utilizados em conjunto com o teste de contrato para manter alta confiança no sistema como um todo.

III. Estruturando Sua Documentação mock.md
A eficácia de um serviço mock é amplamente complementada pela clareza e organização de sua documentação. Esta seção orienta sobre como estruturar o arquivo mock.md de forma eficaz, aproveitando os recursos do Markdown para clareza, consistência e manutenibilidade.

Por Que Markdown é Ideal para Documentação de Serviços Mock
A sintaxe limpa e direta do Markdown permite que os desenvolvedores se concentrem na explicação da API sem se perderem em ferramentas de formatação complexas. Sua integração perfeita com fluxos de trabalho de controle de versão baseados em Git permite que as equipes rastreiem alterações, revisem atualizações e mantenham diferentes versões lado a lado com o código. Isso garante que a documentação evolua em sincronia com a API.

Arquivos Markdown são simplesmente texto, o que facilita a comparação (diff), a mesclagem e o gerenciamento dentro das cadeias de ferramentas de desenvolvimento padrão. Além disso, muitas ferramentas e plataformas de documentação suportam Markdown, tornando-o altamente portátil e versátil. A integração perfeita do Markdown com o controle de versão sugere que a documentação pode e deve ser tratada como código. Isso significa que ela pode fazer parte dos mesmos pipelines de CI/CD, passar por revisões de código e ser submetida a verificações automatizadas. Isso eleva a documentação de um trabalho pós-desenvolvimento para uma parte contínua e integrada do ciclo de vida de entrega de software, impactando diretamente sua precisão e utilidade.

Princípios Fundamentais para Documentação Clara, Consistente e Manutenível
Para que a documentação de um serviço mock seja verdadeiramente útil, ela deve aderir a princípios de design que priorizam a experiência do desenvolvedor.

Clareza e Concisão: A documentação deve ser clara e concisa. É importante evitar sobrecarregar a tela com excesso de informações, o que pode confundir o usuário.
Consistência: A utilização de layouts, elementos de design, navegação, padrões de cabeçalho e terminologia consistentes em toda a documentação é crucial. A mesma estrutura e formatação devem ser aplicadas a todos os endpoints semelhantes.
Legibilidade: A informação deve ser dividida usando cabeçalhos e listas para facilitar a leitura. Blocos de código e realce de sintaxe devem ser empregados para exemplos. Além disso, é importante fornecer texto alternativo para imagens e garantir contraste de cores adequado.
Organização Amigável ao Desenvolvedor: A estrutura dos arquivos de documentação deve ser lógica, espelhando a forma como os desenvolvedores pensam sobre a API. Links internos devem ser utilizados para conectar conceitos relacionados.
Mecanismos de Feedback: A documentação deve fornecer feedback claro após as ações do usuário. Para a documentação em si, isso se traduz em adicionar mecanismos de feedback e rastrear o engajamento do usuário.
A ênfase nas necessidades do usuário, consistência, clareza e mecanismos de feedback sugere que a documentação deve ser tratada como um produto em si, com seus próprios usuários (desenvolvedores) e métricas de qualidade. Isso implica aplicar princípios de gestão de produto à documentação: entender personas de usuário, otimizar o fluxo do usuário, coletar feedback e iterar com base no uso. Essa mudança de mentalidade é crucial para criar uma documentação verdadeiramente eficaz e adotada.

Estrutura e Hierarquia de Seções Recomendadas para mock.md
Uma estrutura padronizada e lógica para a documentação mock.md é essencial para sua usabilidade.

Títulos de Nível Superior (#): Utilizados para seções principais, como "Introdução", "Especificações de Endpoint", "Guia de Uso", "Limitações" e "Manutenção".
Subtítulos (##, ###): Criam uma estrutura lógica que guia os desenvolvedores. Por exemplo, ## Autenticação, ### Chaves de API.
Listas: Empregadas para parâmetros, objetos de resposta e etapas de configuração, podendo ser ordenadas ou não ordenadas.
Blocos de Código: Devem ser indentados ou usar crases para código inline, garantindo clareza.
Tabelas: Utilizadas para dados estruturados, como parâmetros, códigos de status e diferenças.
Uma estrutura consistente e lógica reduz a carga cognitiva sobre o usuário. Quando os desenvolvedores encontram uma nova seção ou endpoint na documentação, uma hierarquia padronizada significa que eles sabem instintivamente onde encontrar informações (por exemplo, parâmetros, respostas, erros). Essa previsibilidade economiza tempo e reduz a frustração, tornando a documentação mais intuitiva e amigável, muito parecido com uma interface de usuário bem projetada.

IV. Conteúdo Essencial para mock.md
Para que o arquivo mock.md seja abrangente, preciso e verdadeiramente útil para os desenvolvedores que interagem com o serviço mock, ele deve incluir um conjunto específico de informações.

Visão Geral do Serviço Mocked
Esta seção inicial deve fornecer o contexto fundamental sobre o mock.

Propósito e Escopo da Implementação Mock: Declarar claramente o que o serviço mock se propõe a simular e seus principais casos de uso (por exemplo, teste de unidade, teste de integração, desenvolvimento de frontend).
Relação Direta com o Serviço/API Real: Nomear explicitamente o serviço/API real que está sendo simulado e explicar o objetivo de "100% fiel". Destacar que o mock visa replicar o comportamento do serviço real, sem sua lógica subjacente ou dependências externas.
Informações de Versão e Changelog: Incluir a versão da documentação do mock e, crucialmente, a versão da API real que ele está mimetizando. Um changelog deve detalhar as atualizações no comportamento do mock, especialmente quando a API real é alterada.
O versionamento da documentação do mock e sua vinculação explícita à versão da API real são cruciais para gerenciar o "desalinhamento do mock". Isso estabelece um contrato claro sobre qual versão da API real o mock se destina a emular. Sem isso, os desenvolvedores podem usar um mock que está fora de sincronia com a versão da API real de destino, levando a falhas de integração. Isso implica a necessidade de processos automatizados de versionamento e liberação para a documentação, espelhando as liberações de código.

Especificações Detalhadas de Endpoint
Para cada endpoint simulado, a documentação deve ser granular e fornecer exemplos práticos.

Método, Caminho e Propósito para Cada Endpoint Mocked: Para cada endpoint simulado, especificar claramente o método HTTP (GET, POST, PUT, DELETE, etc.) e o caminho URL exato. Descrever o propósito do endpoint dentro do fluxo simulado.
Parâmetros de Requisição Esperados:
Documentar todos os parâmetros de consulta, parâmetros de caminho e campos do corpo da requisição esperados.
A tabela a seguir é fundamental para uma documentação de parâmetros inequívoca:
Parâmetro	Tipo	Obrigatório	Descrição	Padrão
user_id	string	Sim	Identificador único do usuário	Nenhum
page	int	Não	Número da página para paginação	1
product_name	string	Sim	Nome do produto (até 255 caracteres)	Nenhum

Exportar para as Planilhas
Esta tabela oferece uma referência rápida e escaneável para os desenvolvedores entenderem quais entradas o mock espera. Ela aborda diretamente a necessidade de "documentação de parâmetros inequívoca". Ao definir claramente Tipo, Obrigatório e Padrão, os desenvolvedores podem construir rapidamente requisições válidas para o mock, reduzindo tentativas e erros. Este formato estruturado é muito mais eficiente do que a prosa para definições de parâmetros.

Respostas Simuladas:
Cenários de Sucesso (Pares de Requisição/Resposta de Exemplo): Fornecer comandos curl completos ou exemplos de requisição semelhantes para chamadas bem-sucedidas, juntamente com os corpos de resposta JSON/XML correspondentes. Incluir cabeçalhos de autenticação, se aplicável.
Cenários de Erro (Pares de Requisição/Resposta de Exemplo): Crucialmente, documentar como o mock responde a várias condições de erro. Isso inclui exemplos para erros HTTP comuns (por exemplo, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error) com seus respectivos gatilhos de requisição e corpos de resposta.
A tabela de códigos de status HTTP e respostas simuladas, apresentada anteriormente na seção "Design de Respostas Mock Representativas", é um exemplo valioso para esta parte da documentação.

Guia de Uso e Configuração
Esta seção deve capacitar os usuários a interagir e configurar o mock.

Como Acessar e Executar o Serviço Mock: Fornecer instruções claras sobre como iniciar ou acessar o serviço mock. Isso pode incluir um URL do Servidor Mock, instruções de linha de comando para ferramentas autônomas ou chamadas de API para implantar um mock.
Autenticação: Detalhar quaisquer requisitos de autenticação para acessar o mock, como chaves de API. Especificar se o servidor mock é privado ou público.
Configurando o Comportamento Dinâmico do Mock: Explicar como os usuários podem configurar o mock para retornar respostas específicas. Isso pode envolver:
Definir atrasos de resposta personalizados.
Corresponder a códigos de resposta HTTP específicos (por exemplo, cabeçalho x-mock-response-code no Postman).
Corresponder a nomes ou IDs de exemplo específicos (por exemplo, x-mock-response-name, x-mock-response-id).
Habilitar a correspondência do corpo da requisição ou do cabeçalho.
Instruções para adicionar novos pares de requisição/resposta ao mock.
Pré-requisitos e Instruções de Configuração: Listar qualquer software, bibliotecas ou configurações necessárias para executar ou interagir com o mock (por exemplo, versão específica do Node.js, Docker, importação de coleção Postman).
Limitações Conhecidas e Desvios Intencionais
A transparência sobre as limitações do mock é tão importante quanto a documentação de suas capacidades.

Diferenças Explicitamente Documentadas em Relação ao Sistema Real: Isso é crucial para manter a transparência e gerenciar as expectativas em relação à afirmação de "100% fiel". Listar claramente quaisquer áreas onde o mock se desvia do comportamento do sistema real.
Cenários ou Comportamentos Não Totalmente Cobertos pelo Mock: Identificar comportamentos complexos, cadeias de dependência dinâmicas ou interações de API matizadas que são difíceis ou impossíveis de simular com fidelidade suficiente usando mocks.
Áreas que Exigem Interação com o Sistema Real: Especificar quaisquer testes ou cenários de desenvolvimento que não podem ser totalmente satisfeitos pelo mock e ainda exigem interação com o serviço real ou um ambiente/fake de maior fidelidade.
A tabela a seguir é um exemplo valioso para documentar as diferenças entre o mock e o sistema real:

Característica/Comportamento	Comportamento do Sistema Real	Comportamento/Limitação do Mocked	Impacto/Razão para o Desvio
Fluxo de Criação de Usuário	Envia e-mail de confirmação	Não envia e-mail (dependência externa)	Não é possível testar a confirmação de e-mail
Callback de Processamento de Pagamento	Realiza callback assíncrono para sistema externo	Não simula callback assíncrono	Teste de idempotência comprometido
Consistência de Dados (Múltiplas Requisições)	Garante consistência transacional entre endpoints	Respostas predefinidas podem não refletir estado real	Exige verificação manual para cenários complexos
Performance sob Carga	Responde em < 100ms para 1000 RPS	Resposta fixa, sem simulação de carga/latência	Características de desempenho não simuladas

Exportar para as Planilhas
Esta tabela aborda diretamente o potencial de "desalinhamento do mock" e "falsa confiança". Ao explicitar as limitações e desvios conhecidos, ela gerencia as expectativas do usuário e os orienta sobre quando não confiar exclusivamente no mock. Essa transparência é vital para construir confiança na documentação do mock e prevenir problemas inesperados durante a integração ou em produção. Ela ajuda os desenvolvedores a entender os limites do que o mock pode testar de forma confiável.

Manutenção e Garantia de Qualidade
A manutenção contínua da documentação do mock é tão importante quanto sua criação inicial.

Integrando mock.md ao Fluxo de Trabalho de Desenvolvimento:
Armazenar a documentação no mesmo repositório que o código da API.
Exigir atualizações de documentação nos mesmos pull requests que as alterações de código.
Incluir a documentação nas revisões de código.
Tornar a aprovação nas verificações de documentação um requisito para a mesclagem.
Diretrizes para Revisões e Atualizações Regulares:
Agendar revisões trimestrais da documentação.
Implementar o rastreamento de "débito de documentação" para identificar seções desatualizadas.
Adicionar carimbos de data/hora de "última atualização" às páginas de documentação.
Garantindo a Fidelidade da Documentação com as Alterações de Código:
Implementar automação para manter a qualidade, como linters de Markdown.
Criar testes automatizados que validem os exemplos da documentação em relação à API real ou ao mock. Este é um passo crítico para prevenir o desalinhamento do mock.
O conceito de que a "qualidade da documentação diminui com o tempo" representa um desafio significativo. A implementação de verificações automatizadas, linters e testes que validam os exemplos da documentação em relação ao mock ou API real transforma a documentação de um artefato estático em um ativo dinâmico e continuamente verificado. Essa automação atua como um "portão de qualidade" no pipeline de CI/CD, garantindo que a documentação permaneça precisa e atualizada com as alterações de código, combatendo diretamente o desalinhamento do mock e aumentando a confiança do desenvolvedor.

V. Conclusão
A criação de um serviço mock fiel e sua documentação abrangente, conforme detalhado no arquivo mock.md, são componentes cruciais para o desenvolvimento de software moderno e eficiente.

Principais Aprendizados para uma Documentação Eficaz de Serviços Mock
A análise apresentada reforça o valor inestimável dos mocks para testes isolados, o que acelera o desenvolvimento e permite um tratamento robusto de erros. A base para a fidelidade de um mock reside em uma profunda compreensão do sistema real e um design meticuloso das respostas simuladas. É fundamental reconhecer que o mock.md não é um documento estático, mas sim um artefato vivo que exige manutenção contínua e integração profunda no fluxo de trabalho de desenvolvimento. Para sistemas complexos, o teste de contrato desempenha um papel indispensável na validação da fidelidade do mock, garantindo que as simulações reflitam o comportamento real do serviço.

Considerações Futuras para a Evolução do Mocking e da Documentação
O futuro dos objetos mock está intrinsicamente ligado aos avanços em inteligência artificial, aprendizado de máquina e à crescente complexidade das arquiteturas de software, como os microsserviços. É provável que essa evolução aprimore as capacidades e aplicações dos objetos mock, potencialmente levando a mocks mais inteligentes e auto adaptáveis.

Paralelamente, as ferramentas de documentação continuarão a evoluir, oferecendo maior automação, interatividade e integração com ambientes de desenvolvimento. A pesquisa destaca a existência de inúmeras ferramentas para a criação de mocks (por exemplo, Postman, MockServer, Pact) e para a geração/gerenciamento de documentação (por exemplo, Docusaurus, GitBook, MkDocs, Apidog, Postman API Documentation, Swagger/OpenAPI). A tendência clara é para plataformas que combinam ambas as funcionalidades (por exemplo, Postman, Apidog, Stoplight). Isso sugere um futuro onde o ato de simular e documentar se tornará cada vez mais integrado e automatizado, reduzindo o esforço manual e aprimorando ainda mais a fidelidade. Isso implica que os desenvolvedores devem buscar ferramentas que ofereçam essa funcionalidade sinérgica para otimizar seu fluxo de trabalho.

mock-frontend-backend.md
Este documento detalha as interações mockadas entre o frontend do aplicativo LimpeJá (Expo/React Native) e seu backend (Firebase Cloud Functions), emulando as funcionalidades reais para fins de desenvolvimento e teste. Todas as interações são simuladas para replicar o comportamento esperado do backend real, sem a necessidade de uma infraestrutura Firebase ativa.

1. Interações Mockadas de Autenticação e Gerenciamento de Usuários
Este módulo simula o ciclo de vida do usuário, desde a criação da conta até a atualização de perfil e deleção.

Endpoints/Funções Mockadas:

loginUser (Callable Function)

Propósito: Simula o login de um usuário existente.
Requisição (Mocked):
JSON

{
  "email": "mockuser@example.com",
  "password": "mockpassword"
}
Cenário de Sucesso (200 OK):
JSON

{
  "uid": "mock-user-id-123",
  "email": "mockuser@example.com",
  "displayName": "Mock User",
  "role": "client",
  "token": "mock-jwt-token"
}
Cenário de Erro (401 Unauthorized - Credenciais inválidas):
JSON

{
  "code": "auth/invalid-credential",
  "message": "As credenciais fornecidas são inválidas."
}
Cenário de Erro (400 Bad Request - Campos ausentes):
JSON

{
  "code": "functions/invalid-argument",
  "message": "Email e senha são obrigatórios."
}
createUser (Callable Function)

Propósito: Simula o registro de um novo usuário.
Requisição (Mocked):
JSON

{
  "email": "newmockuser@example.com",
  "password": "securemockpassword",
  "displayName": "New Mock User",
  "phoneNumber": "+5511987654321",
  "role": "client"
}
Cenário de Sucesso (200 OK):
JSON

{
  "uid": "new-mock-user-id-456",
  "email": "newmockuser@example.com",
  "displayName": "New Mock User",
  "role": "client",
  "token": "new-mock-jwt-token"
}
Cenário de Erro (409 Conflict - E-mail já em uso):
JSON

{
  "code": "auth/email-already-in-use",
  "message": "O endereço de e-mail fornecido já está em uso."
}
updateUserProfile (Callable Function)

Propósito: Simula a atualização do perfil de um usuário.
Requisição (Mocked):
JSON

{
  "displayName": "Mock User Updated",
  "phoneNumber": "+5511999998888",
  "avatarUrl": "https://mock-storage.com/updated-avatar.jpg"
}
Cenário de Sucesso (200 OK):
JSON

{
  "uid": "mock-user-id-123",
  "displayName": "Mock User Updated",
  "phoneNumber": "+5511999998888",
  "avatarUrl": "https://mock-storage.com/updated-avatar.jpg"
}
addUserAddress (Callable Function)

Propósito: Simula a adição de um endereço ao perfil do usuário.
Requisição (Mocked):
JSON

{
  "street": "Rua Mocked",
  "number": "123",
  "neighborhood": "Bairro Mock",
  "city": "Cidade Mock",
  "state": "SP",
  "zipCode": "00000-000",
  "complement": "Apto 101"
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Endereço adicionado com sucesso."
}
Cenário de Erro (400 Bad Request - Dados incompletos):
JSON

{
  "code": "functions/invalid-argument",
  "message": "Todos os campos de endereço obrigatórios devem ser fornecidos."
}
2. Interações Mockadas de Prestadores
Este módulo simula o cadastro, perfil e serviços oferecidos pelos profissionais.

Endpoints/Funções Mockadas:

submitProviderRegistration (Callable Function)

Propósito: Simula o registro completo de um profissional.
Requisição (Mocked):
JSON

{
  "personalDetails": {
    "fullName": "Mock Professional",
    "cpf": "123.456.789-00",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+5511987654321",
    "address": {
      "street": "Rua dos Mockers",
      "number": "456",
      "neighborhood": "Bairro Dev",
      "city": "Cidade Teste",
      "state": "SP",
      "zipCode": "11111-111"
    }
  },
  "serviceDetails": {
    "experienceDescription": "Limpeza residencial e comercial há 5 anos.",
    "yearsOfExperience": 5,
    "offeredServices": [
      { "name": "Limpeza Padrão", "price": 80.00, "durationMinutes": 120 },
      { "name": "Limpeza Pesada", "price": 120.00, "durationMinutes": 180 }
    ],
    "priceStructure": "hourly",
    "serviceAreas": ["São Paulo"],
    "profilePictureUrl": "https://mock-storage.com/professional-avatar.jpg"
  },
  "weeklyAvailability": [
    { "dayOfWeek": "monday", "timeSlots": ["08:00-12:00", "13:00-17:00"] }
  ]
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Cadastro de profissional simulado com sucesso. Aguardando verificação."
}
Cenário de Erro (400 Bad Request - Dados incompletos):
JSON

{
  "code": "functions/invalid-argument",
  "message": "Dados de registro incompletos ou inválidos para o profissional."
}
updateOfferedServices (Callable Function)

Propósito: Simula a atualização dos serviços oferecidos por um profissional.
Requisição (Mocked):
JSON

{
  "offeredServices": [
    { "name": "Limpeza Padrão", "price": 90.00, "durationMinutes": 120 },
    { "name": "Limpeza de Vidros", "price": 50.00, "durationMinutes": 60 }
  ]
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Serviços oferecidos atualizados com sucesso."
}
updateWeeklyAvailability (Callable Function)

Propósito: Simula a atualização da disponibilidade semanal de um profissional.
Requisição (Mocked):
JSON

{
  "weeklyAvailability": [
    { "dayOfWeek": "monday", "timeSlots": ["09:00-13:00"] },
    { "dayOfWeek": "tuesday", "timeSlots": ["14:00-18:00"] }
  ]
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Disponibilidade semanal atualizada com sucesso."
}
updateBlockedDates (Callable Function)

Propósito: Simula o bloqueio de datas específicas na agenda de um profissional.
Requisição (Mocked):
JSON

{
  "blockedDates": ["2025-06-15", "2025-06-20"]
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Datas bloqueadas atualizadas com sucesso."
}
3. Interações Mockadas de Agendamentos
Este módulo simula a criação, status e interações relacionadas aos agendamentos de serviços.

Endpoints/Funções Mockadas:

createBooking (HTTP Endpoint POST /bookings)

Propósito: Simula a solicitação de um novo agendamento por um cliente.
Requisição (Mocked):
JSON

{
  "clientId": "mock-client-id-789",
  "providerId": "mock-provider-id-012",
  "serviceId": "mock-service-id-345",
  "scheduledDateTime": "2025-06-30T10:00:00Z",
  "address": {
    "street": "Rua do Cliente",
    "number": "456",
    "neighborhood": "Bairro do Mock",
    "city": "Cidade Mock",
    "state": "SP",
    "zipCode": "00000-000"
  },
  "serviceDetails": {
    "type": "Limpeza Padrão",
    "rooms": 2,
    "bathrooms": 1,
    "notes": "Foco na cozinha.",
    "price": 100.00
  }
}
Cenário de Sucesso (201 Created):
JSON

{
  "bookingId": "mock-booking-id-789",
  "status": "pending_provider_confirmation",
  "paymentStatus": "pending_payment",
  "message": "Agendamento simulado criado com sucesso."
}
Cenário de Erro (400 Bad Request - Dados inválidos):
JSON

{
  "code": "invalid_data",
  "message": "Dados de agendamento inválidos."
}
Cenário de Erro (404 Not Found - Serviço/Profissional não encontrado):
JSON

{
  "code": "not_found",
  "message": "Serviço ou profissional não encontrado."
}
getBookings (HTTP Endpoint GET /bookings/client, GET /bookings/provider)

Propósito: Simula a listagem de agendamentos para clientes ou profissionais.
Requisição (Mocked): (Para cliente) GET /bookings/client
Requisição (Mocked): (Para provedor) GET /bookings/provider
Cenário de Sucesso (200 OK - Lista de Cliente):
JSON

[
  {
    "bookingId": "mock-booking-id-1",
    "clientId": "mock-client-id-789",
    "providerId": "mock-provider-id-012",
    "serviceName": "Limpeza Padrão",
    "scheduledDateTime": "2025-06-30T10:00:00Z",
    "status": "confirmed",
    "paymentStatus": "paid",
    "providerName": "Mock Professional"
  },
  {
    "bookingId": "mock-booking-id-2",
    "clientId": "mock-client-id-789",
    "providerId": "mock-provider-id-333",
    "serviceName": "Limpeza Pesada",
    "scheduledDateTime": "2025-07-05T14:00:00Z",
    "status": "pending_provider_confirmation",
    "paymentStatus": "pending_payment",
    "providerName": "Another Mock Pro"
  }
]
Cenário de Sucesso (200 OK - Lista de Provedor):
JSON

[
  {
    "bookingId": "mock-booking-id-1",
    "clientId": "mock-client-id-789",
    "providerId": "mock-provider-id-012",
    "serviceName": "Limpeza Padrão",
    "scheduledDateTime": "2025-06-30T10:00:00Z",
    "status": "confirmed",
    "paymentStatus": "paid",
    "clientName": "Mock Client"
  }
]
Cenário de Erro (401 Unauthorized):
JSON

{
  "code": "unauthenticated",
  "message": "Autenticação necessária para listar agendamentos."
}
getBookingDetails (HTTP Endpoint GET /bookings/:bookingId)

Propósito: Simula a recuperação de detalhes de um agendamento específico.
Requisição (Mocked): GET /bookings/mock-booking-id-1
Cenário de Sucesso (200 OK):
JSON

{
  "bookingId": "mock-booking-id-1",
  "clientId": "mock-client-id-789",
  "providerId": "mock-provider-id-012",
  "serviceName": "Limpeza Padrão",
  "scheduledDateTime": "2025-06-30T10:00:00Z",
  "status": "confirmed",
  "paymentStatus": "paid",
  "address": {
    "street": "Rua do Cliente",
    "number": "456",
    "neighborhood": "Bairro do Mock",
    "city": "Cidade Mock",
    "state": "SP",
    "zipCode": "00000-000"
  },
  "serviceDetails": {
    "type": "Limpeza Padrão",
    "rooms": 2,
    "bathrooms": 1,
    "notes": "Foco na cozinha.",
    "price": 100.00
  },
  "clientName": "Mock Client",
  "providerName": "Mock Professional"
}
Cenário de Erro (404 Not Found):
JSON

{
  "code": "not_found",
  "message": "Agendamento não encontrado."
}
updateBookingStatus (HTTP Endpoint PATCH /bookings/:bookingId/status ou Callable Function)

Propósito: Simula a atualização do status de um agendamento (ex: cliente cancela, profissional confirma).
Requisição (Mocked - Cliente cancela): PATCH /bookings/mock-booking-id-1/status
JSON

{
  "status": "cancelled_by_client",
  "reason": "Mudei de planos."
}
Requisição (Mocked - Profissional confirma): PATCH /bookings/mock-booking-id-2/status
JSON

{
  "status": "confirmed"
}
Cenário de Sucesso (200 OK):
JSON

{
  "bookingId": "mock-booking-id-1",
  "status": "cancelled_by_client",
  "message": "Status do agendamento atualizado com sucesso."
}
Cenário de Erro (400 Bad Request - Transição de status inválida):
JSON

{
  "code": "invalid_status_transition",
  "message": "Não é possível transicionar para o status fornecido."
}
requestBookingReschedule (Callable Function)

Propósito: Simula a solicitação de reagendamento.
Requisição (Mocked):
JSON

{
  "bookingId": "mock-booking-id-1",
  "newScheduledDateTime": "2025-07-01T15:00:00Z",
  "reason": "Tive um imprevisto."
}
Cenário de Sucesso (200 OK):
JSON

{
  "rescheduleRequestId": "mock-reschedule-id-1",
  "message": "Solicitação de reagendamento enviada com sucesso."
}
acceptBookingReschedule (Callable Function)

Propósito: Simula a aceitação de um reagendamento pelo profissional.
Requisição (Mocked):
JSON

{
  "bookingId": "mock-booking-id-1",
  "rescheduleRequestId": "mock-reschedule-id-1"
}
Cenário de Sucesso (200 OK):
JSON

{
  "bookingId": "mock-booking-id-1",
  "status": "confirmed",
  "scheduledDateTime": "2025-07-01T15:00:00Z",
  "message": "Reagendamento aceito com sucesso."
}
4. Interações Mockadas de Pagamentos
Este módulo simula o processamento de pagamentos, webhooks e repasses para os prestadores.

Endpoints/Funções Mockadas:

createPixCharge (HTTP Endpoint POST /payments/create-pix-charge)

Propósito: Simula a criação de uma cobrança PIX.
Requisição (Mocked):
JSON

{
  "bookingId": "mock-booking-id-1",
  "amountInCents": 10000
}
Cenário de Sucesso (201 Created):
JSON

{
  "chargeId": "mock-pix-charge-id-abc",
  "qrCodeImage": "data:image/png;base64,mocked_qr_code_base64",
  "qrCodeText": "mock_pix_copy_paste_code",
  "paymentStatus": "awaiting_payment_confirmation",
  "expiresAt": "2025-05-30T10:00:00Z",
  "message": "Cobrança PIX simulada gerada."
}
Cenário de Erro (400 Bad Request - Valor inválido):
JSON

{
  "code": "invalid_amount",
  "message": "O valor da cobrança é inválido."
}
requestProviderPayout (Callable Function)

Propósito: Simula a solicitação de saque de ganhos por um profissional.
Requisição (Mocked):
JSON

{
  "amount": 500.00
}
Cenário de Sucesso (200 OK):
JSON

{
  "payoutRequestId": "mock-payout-id-xyz",
  "status": "pending_approval",
  "message": "Solicitação de saque simulada enviada."
}
Cenário de Erro (400 Bad Request - Saldo insuficiente):
JSON

{
  "code": "insufficient_balance",
  "message": "Saldo insuficiente para o saque."
}
getMyPaymentHistory (Callable Function)

Propósito: Simula a recuperação do histórico de pagamentos de um usuário.
Requisição (Mocked): {} (não exige payload)
Cenário de Sucesso (200 OK):
JSON

[
  {
    "id": "mock-booking-id-1",
    "type": "service_payment",
    "description": "Limpeza Padrão - Cliente Mock",
    "amount": 100.00,
    "timestamp": "2025-06-25T11:00:00Z",
    "status": "completed"
  },
  {
    "id": "mock-payout-id-xyz",
    "type": "payout",
    "description": "Saque solicitado",
    "amount": -500.00,
    "timestamp": "2025-06-28T16:00:00Z",
    "status": "pending_approval"
  }
]
5. Interações Mockadas de Avaliações
Este módulo simula a submissão e o processamento de avaliações.

Endpoints/Funções Mockadas:

submitReview (Callable Function)
Propósito: Simula a submissão de uma avaliação por um cliente ou profissional.
Requisição (Mocked):
JSON

{
  "bookingId": "mock-booking-id-1",
  "revieweeId": "mock-provider-id-012",
  "revieweeRole": "provider",
  "rating": 4.5,
  "comment": "Ótimo serviço, profissional muito atencioso.",
  "criteriaRatings": {
    "pontualidade": 5,
    "comunicacao": 4,
    "qualidade_limpeza": 4
  }
}
Cenário de Sucesso (200 OK):
JSON

{
  "reviewId": "mock-review-id-789",
  "message": "Avaliação simulada enviada com sucesso."
}
Cenário de Erro (400 Bad Request - Já avaliado):
JSON

{
  "code": "already_reviewed",
  "message": "Este agendamento já foi avaliado."
}
6. Interações Mockadas de Notificações
Este módulo simula o envio e gerenciamento de notificações.

Endpoints/Funções Mockadas:

markNotificationsAsRead (Callable Function)

Propósito: Simula a marcação de notificações como lidas.
Requisição (Mocked - Marcar todas):
JSON

{
  "all": true
}
Requisição (Mocked - Marcar por IDs):
JSON

{
  "notificationIds": ["notif-id-1", "notif-id-2"]
}
Cenário de Sucesso (200 OK):
JSON

{
  "message": "Notificações simuladas marcadas como lidas."
}
getNotificationsHistory (Callable Function)

Propósito: Simula a recuperação do histórico de notificações.
Requisição (Mocked): { "limit": 10, "startAfterId": null }
Cenário de Sucesso (200 OK):
JSON

[
  {
    "notificationId": "notif-id-1",
    "type": "booking_confirmation",
    "title": "Agendamento Confirmado!",
    "body": "Seu agendamento de Limpeza Padrão com Mock Professional foi confirmado para 30/06.",
    "timestamp": "2025-05-29T10:00:00Z",
    "read": false
  },
  {
    "notificationId": "notif-id-2",
    "type": "new_review",
    "title": "Nova Avaliação!",
    "body": "Você recebeu uma nova avaliação de 5 estrelas do cliente Mock Client.",
    "timestamp": "2025-05-28T15:30:00Z",
    "read": true
  }
]
7. Interações Mockadas de Chat
Este módulo simula a lógica de backend para o sistema de chat.

Endpoints/Funções Mockadas:

getChatRooms (Callable Function)

Propósito: Simula a listagem de salas de chat de um usuário.
Requisição (Mocked): {}
Cenário de Sucesso (200 OK):
JSON

[
  {
    "chatId": "mock-chat-room-1",
    "otherParticipantId": "mock-provider-id-012",
    "otherParticipantName": "Mock Professional",
    "lastMessageText": "Ok, estou a caminho!",
    "lastMessageTimestamp": "2025-05-29T11:30:00Z",
    "unreadMessagesCount": 1
  }
]
sendMessage (Callable Function)

Propósito: Simula o envio de uma nova mensagem em um chat.
Requisição (Mocked):
JSON

{
  "chatId": "mock-chat-room-1",
  "messageText": "Olá, estou aguardando o profissional."
}
Cenário de Sucesso (200 OK):
JSON

{
  "messageId": "mock-message-id-987",
  "timestamp": "2025-05-29T11:45:00Z",
  "message": "Mensagem simulada enviada."
}
8. Interações Mockadas de Serviços (Catálogo de Serviços)
Este módulo simula a listagem e detalhes dos serviços oferecidos na plataforma.

Endpoints/Funções Mockadas:

listAvailableServices (Callable Function)
Propósito: Simula a listagem de todos os serviços disponíveis na plataforma.
Requisição (Mocked): {}
Cenário de Sucesso (200 OK):
JSON

[
  {
    "serviceId": "mock-service-id-std",
    "name": "Limpeza Padrão",
    "description": "Limpeza geral de ambientes.",
    "basePrice": 80.00,
    "estimatedDurationMinutes": 120,
    "category": "Limpeza Residencial"
  },
  {
    "serviceId": "mock-service-id-hvy",
    "name": "Limpeza Pesada",
    "description": "Limpeza profunda com foco em detalhes.",
    "basePrice": 150.00,
    "estimatedDurationMinutes": 240,
    "category": "Limpeza Residencial"
  }
]
9. Interações Mockadas de Ofertas
Este módulo simula a recuperação de ofertas e promoções.

Endpoints/Funções Mockadas:

getOffers (Callable Function)
Propósito: Simula a recuperação de ofertas e promoções ativas.
Requisição (Mocked): {}
Cenário de Sucesso (200 OK):
JSON

[
  {
    "offerId": "mock-offer-id-promo1",
    "title": "Primeira Limpeza com 20% de Desconto!",
    "description": "Válido para novos clientes.",
    "discountPercentage": 20,
    "applicableServices": ["Limpeza Padrão", "Limpeza Pesada"],
    "startDate": "2025-05-01T00:00:00Z",
    "endDate": "2025-06-30T23:59:59Z",
    "imageUrl": "https://mock-storage.com/offer-banner.jpg"
  }
]
10. Interações Mockadas de Perfil do Cliente
Endpoints/Funções Mockadas:

profileService.ts (integração com updateUserProfile do módulo auth): Simula a atualização do perfil do cliente. (Ver seção 1)
11. Interações Mockadas de Perfil do Provedor
Endpoints/Funções Mockadas:

providerProfileService.ts (integração com updateOfferedServices, updateWeeklyAvailability, updateBlockedDates do módulo providers): Simula a atualização do perfil do provedor. (Ver seção 2)
getProviderProfile (Callable Function - parte do módulo providers/functions.ts)
Propósito: Simula a recuperação do perfil detalhado de um profissional.
Requisição (Mocked):
JSON

{
  "providerId": "mock-provider-id-012"
}
Cenário de Sucesso (200 OK):
JSON

{
  "uid": "mock-provider-id-012",
  "displayName": "Mock Professional",
  "email": "mock.pro@example.com",
  "phoneNumber": "+5511987654321",
  "avatarUrl": "https://mock-storage.com/professional-avatar.jpg",
  "role": "provider",
  "isProviderVerified": true,
  "bio": "Limpeza residencial e comercial com anos de experiência.",
  "averageRating": 4.8,
  "totalReviews": 50,
  "offeredServices": [
    { "name": "Limpeza Padrão", "price": 90.00, "durationMinutes": 120 },
    { "name": "Limpeza de Vidros", "price": 50.00, "durationMinutes": 60 }
  ],
  "weeklyAvailability": [
    { "dayOfWeek": "monday", "timeSlots": ["09:00-13:00", "14:00-18:00"] }
  ],
  "serviceAreas": ["São Paulo"],
  "pendingBalance": 250.00
}
Cenário de Erro (404 Not Found):
JSON

{
  "code": "provider_not_found",
  "message": "Perfil de profissional não encontrado."
}
12. Interações Mockadas de Ganhos (Profissional)
Endpoints/Funções Mockadas:

earningsService.ts (integração com getMyPaymentHistory, requestProviderPayout do módulo payments): Simula as operações relacionadas aos ganhos do profissional. (Ver seção 4)
13. Limitações Conhecidas do Mocking
Fluxos Transacionais Complexos: O mocking não simula a atomicidade de transações complexas de banco de dados (ex: db.runTransaction em Firestore). Embora as respostas do mock possam indicar sucesso, o estado real do banco de dados simulado não será atualizado.
Webhooks de Terceiros: A simulação de webhooks de gateways de pagamento (ex: pixWebhook) é limitada ao retorno de uma resposta HTTP esperada. O mock não pode emular a chamada real do PSP para o endpoint do backend.
Notificações Push Reais: O mock não enviará notificações push reais para dispositivos. Ele apenas simula a lógica de chamada interna para o serviço de notificação.
Sincronização de Calendário Externo: A integração com calendários externos (Google Calendar, Outlook) não é simulada.
Geolocalização e Roteamento: Cálculo de tempo de deslocamento e áreas de atuação com base em geolocalização real não são simulados.
Autenticação Avançada (Custom Claims): Embora o mock de loginUser e createUser retorne um role no token mockado, a validação completa de Custom Claims pelo Firebase Auth real não ocorre no ambiente mockado.
Concorrência: Cenários de alta concorrência (múltiplas requisições simultâneas para um mesmo recurso) não são simulados pelo mock padrão.
Latência e Performance: O mock responde instantaneamente. Não simula atrasos de rede ou variações de performance do backend real sob carga.
Upload de Arquivos para Firebase Storage: A função storageService.ts do frontend fará chamadas diretas ao SDK do Firebase Storage. O mock do backend não intercepta nem simula o upload real de arquivos.
14. Guia de Uso do Ambiente Mock
Para utilizar o ambiente mock para desenvolvimento e testes do frontend:

Configuração do Ambiente:
Certifique-se de que o backend Firebase Cloud Functions não esteja rodando localmente ou apontando para um ambiente de produção.
No arquivo de configuração do frontend (config/appConfig.ts), direcione as chamadas de API para o URL do seu servidor mock local (por exemplo, http://localhost:3000/mock-api/v1).
Para as funções Callable, configure o SDK do Firebase no frontend para apontar para um emulador de funções se estiver testando com emuladores de Firebase, ou utilize bibliotecas de mocking HTTP para interceptar as chamadas httpsCallable.
Execução do Servidor Mock:
Dependendo da sua ferramenta de mocking (Postman Mock Servers, MockServer, ou um script Node.js customizado), inicie o servidor mock.
Carregue as definições de endpoints e respostas mockadas conforme detalhado nas seções anteriores.
Testes no Frontend:
Execute o aplicativo Expo/React Native.
Todas as chamadas de API feitas pelos serviços do frontend (api/*.ts) serão interceptadas e respondidas pelo servidor mock, permitindo o desenvolvimento e teste da UI e da lógica de negócios do frontend sem dependências externas reais.
15. Manutenção da Documentação Mock
A documentação mock-frontend-backend.md deve ser revisada e atualizada regularmente para garantir que ela permaneça fiel às interações reais do backend.

Integração CI/CD: Inclua este documento no seu sistema de controle de versão (Git) e garanta que as revisões de código incluam a atualização deste mock.md quando houver alterações correspondentes no backend real.
Validação Automatizada: Se possível, crie testes de contrato (usando ferramentas como Pact) entre o frontend e o backend para validar que as interações simuladas no mock ainda correspondem ao comportamento do backend real.
Revisões Periódicas: Agende revisões trimestrais deste documento para garantir sua acurácia e relevância.

Fontes





