📌 Providers Module

O módulo Providers é responsável pela gestão dos prestadores de serviços da plataforma.
Ele centraliza toda a lógica de criação, atualização, busca, listagem e detalhamento dos prestadores, além de gerenciar informações de perfil e serviços oferecidos.

📂 Estrutura de Arquivos
src/providers/
│── providers.controller.ts      # Controlador: define endpoints REST para Providers
│── providers.module.ts          # Módulo principal do NestJS para Providers
│── providers.service.ts         # Camada de serviço: regras de negócio
│── provider.entity.ts           # Entidade que representa o modelo de Provider
│── provider-details.dto.ts      # DTO para retorno detalhado do provider
│── provider-search.dto.ts       # DTO para critérios de busca
│── provider-service-offering.dto.ts # DTO para vinculação de serviços oferecidos
│── update-provider-profile.dto.ts   # DTO para atualização de perfil do provider

🏗️ Arquitetura do Módulo

ProvidersModule
Registra ProvidersService, ProvidersController e importa dependências necessárias (como PrismaModule e outros módulos relacionados).
Também exporta o serviço para ser utilizado em outros módulos (Bookings, Verification, Missions etc).

ProvidersController
Responsável pelos endpoints expostos na API (/providers/...).
Recebe requisições HTTP, valida os DTOs e chama o ProvidersService.

ProvidersService
Camada de negócio.
Implementa toda a lógica de cadastro, atualização, busca e gerenciamento de prestadores.

ProviderEntity
Representa a entidade Provider no sistema.
Usada como base para mapear dados que vêm do Prisma e trafegam pela aplicação.

DTOs (Data Transfer Objects)
Garantem a validação e tipagem dos dados de entrada e saída.

📌 Funcionalidades Principais
1. Criar um Provider

Fluxo de registro de prestadores.

Normalmente chamado quando um usuário passa a oferecer serviços na plataforma.

Cria vínculo com o User e registra dados básicos do perfil.

2. Atualizar Perfil do Provider

Usa o UpdateProviderProfileDto.

Permite atualizar:

Nome e descrição profissional

Foto de perfil / branding

Dados de contato

Disponibilidade

3. Listar Providers

Suporte a paginação e filtros de busca (via ProviderSearchDto).

Pode filtrar por:

Localização (cidade, região)

Categoria de serviços

Classificação (ranking, reviews)

Status de disponibilidade

4. Buscar Detalhes do Provider

Retorna informações completas do prestador usando ProviderDetailsDto.

Inclui:

Perfil básico

Serviços oferecidos (ProviderServiceOfferingDto)

Avaliações / reviews

Ranking atual (conectado ao módulo Ranking)

Histórico de bookings

5. Serviços Oferecidos

Um provider pode ter múltiplos serviços cadastrados.

O vínculo é representado por ProviderServiceOfferingDto.

Permite:

Associar serviços disponíveis

Editar preços e condições

Definir tempo de execução

🔄 Fluxo de Negócio

Onboarding:

Usuário final decide se tornar provider.

Registro inicial feito no ProvidersService.create().

Customização de perfil:

Provider atualiza informações (foto, descrição, localização).

Pode incluir detalhes extras como áreas atendidas e preferências.

Cadastro de serviços:

O provider seleciona serviços (via ProviderServicesModule) e define preços.

Integração com bookings:

Providers são listados em buscas feitas por clientes.

Booking conecta um cliente a um provider selecionado.

Ranking e Reviews:

Após execução de serviços, reviews alimentam o RankingModule.

O ranking influencia os resultados de busca.

⚙️ Integrações com Outros Módulos

ProviderServicesModule → Define os serviços que podem ser oferecidos.

BookingsModule → Faz reservas entre cliente e provider.

RankingModule → Calcula ranking de providers baseado em avaliações.

NotificationsModule → Notifica provider sobre novas reservas ou alterações.

MissionsModule → Providers podem cumprir missões ligadas ao engajamento.

📊 Regras de Negócio

Unicidade: um usuário pode ter apenas um provider vinculado.

Visibilidade: apenas providers com perfil completo e pelo menos um serviço ativo aparecem em buscas.

Ranking: ordenação em listagens considera pontuação do módulo Ranking.

Notificações: provider é notificado em tempo real sobre novas reservas ou alterações.

🚀 Próximos Passos / Possíveis Melhorias

Adicionar geolocalização precisa para busca de providers próximos.

Criar lógica de promoções e descontos especiais por provider.

Expandir missões e gamificação para aumentar engajamento dos prestadores.

Conectar métricas de performance (ex: taxa de aceitação, tempo médio de resposta).