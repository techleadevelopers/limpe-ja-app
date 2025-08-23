Users Module — README

Este documento descreve o módulo Users do backend (NestJS + Prisma) de forma completa e alinhada com a arquitetura atual do projeto. Ele cobre responsabilidades, modelo de dados, endpoints, regras de negócio, integrações (filas/notifications, providers, auth, missions), DTOs, respostas de erro, exemplos e dicas de testes.

Visão geral

Objetivo: Centralizar o ciclo de vida do usuário (CLIENT/PROVIDER/ADMIN), perfil, preferências e integrações transversais (notificações, filas, autenticação, providers).

Principais responsabilidades:

CRUD e perfil do usuário (nome, avatar, telefone, etc.)

Autenticação/Autorização por meio de Guards (JWT + Roles)

Preferências e tokens (ex.: FCM para push)

Integração com Providers (vínculo User ↔ Provider)

Integração com Queues/Notifications (mensagens assíncronas)

Gatilhos para Missions/Loyalty (quando aplicável em fluxos de onboarding/atualizações)

Suporte a remoção planejada (soft “deletionScheduledAt”), LGPD e segurança

Tecnologias: NestJS (Controllers/Services/Modules), Prisma (PostgreSQL), Swagger/OpenAPI, Bull (queues), JWT.

Dependências e Arquitetura
Imports do módulo

PrismaModule — acesso ao banco via PrismaService

NotificationsModule — envio de notificações (push/in-app)

QueuesModule — enfileiramento de jobs (ex.: boas-vindas, verificação)

AuthModule (via forwardRef) — autenticação JWT

ProvidersModule (via forwardRef) — operações que envolvem perfil de prestador

Exporta: UsersService (outros módulos podem consumir).

Guards & Decorators

JwtAuthGuard — requer Bearer token para endpoints protegidos

RolesGuard + @Roles(...) — restringe rotas por UserRole (CLIENT, PROVIDER, ADMIN)

Modelo de Dados (Prisma)
User

Campos relevantes (resumo):

id: String @id @default(uuid())

email: String @unique

phone?: String @unique

passwordHash?: String

role: UserRole (CLIENT por padrão)

fullName: String

avatarUrl?: String

firebaseUid?: String @unique

fcmToken?: String @unique

isPhoneVerified: Boolean

isVerified: Boolean

deletionScheduledAt?: DateTime (remoção programada)

createdAt, updatedAt

Relações:

client?, provider?

chat/notifications, referrals, disputes, loyalty, coupons usage, missions (missionProgress, missionEvents)

Observação: o profile completo de um usuário geralmente combina User + Client ou Provider (quando aplicável).

Regras de Negócio

Criação & Onboarding

Usuário começa com role=CLIENT (padrão).

Pode posteriormente se tornar PROVIDER (vinculado via ProvidersModule).

Em alguns fluxos, o módulo enfileira um job de boas-vindas (Queues) e/ou notificação.

Perfil

PATCH /users/me atualiza campos permitidos (ex.: fullName, phone).

Upload de avatar atualiza avatarUrl.

Atualizações sensíveis podem notificar o usuário.

Tokens & Preferências

PATCH /users/me/fcm-token registra/atualiza o token de push do usuário.

Segurança & LGPD

deletionScheduledAt permite agendar exclusão/retirada futura.

Rotas protegidas exigem JWT; algumas exigem @Roles(ADMIN).

Integrações

Providers: endpoints para expor perfis públicos de prestadores (leitura), ou para criar o vínculo (via Providers).

Queues & Notifications: disparos assíncronos (ex.: welcome, atualizações).

Missions: este módulo não dispara eventos diretamente por padrão, mas mudanças relevantes (como primeira atualização de perfil) podem ser integradas facilmente com MissionsService.trackEvent caso o projeto deseje gamificar onboarding. (Hoje a maioria dos eventos de missão vem de Bookings/Reviews/Referrals.)

Endpoints

Os nomes exatos podem variar levemente conforme seu controller, mas seguem o padrão abaixo.

Autenticados (JWT)
GET /users/me

Retorna dados do usuário autenticado (inclui relacionamentos essenciais para o app).

Response (exemplo):

{
  "id": "usr_123",
  "email": "john@doe.com",
  "role": "CLIENT",
  "fullName": "John Doe",
  "avatarUrl": null,
  "isVerified": false,
  "phone": "+55 11 99999-9999"
}

PATCH /users/me

Atualiza campos de perfil permitidos.

Body (exemplo):

{
  "fullName": "John D. Doe",
  "phone": "+55 11 98888-7777"
}

PATCH /users/me/avatar

Atualiza o avatarUrl (quando já hospedado) ou processa fluxo de upload (dependendo da infra do projeto).

Body (exemplo):

{ "avatarUrl": "https://cdn.app.com/u/avatars/usr_123.png" }

PATCH /users/me/fcm-token

Salva/atualiza token de push para notificações.

Body:

{ "fcmToken": "fcm_abcdef123" }

Acesso Administrativo

Requer @Roles(UserRole.ADMIN).

GET /users/:id

Busca um usuário por ID (visão administrativa).

GET /users

Listagem paginada/filtrável (útil p/ dashboard admin).

DELETE /users/:id

Apaga ou agenda exclusão (conforme política). Em geral recomenda-se soft delete (ex.: deletionScheduledAt) seguido de um worker que conclui a remoção.

DTOs principais

UpdateUserDto — campos permitidos para PATCH do próprio perfil

UserProfileDto — shape de resposta agregando dados úteis ao app

(Outros DTOs auxiliares, como para atualizar FCM token ou avatar)

O projeto segue validações class-validator e transformação com class-transformer.

Service — principais métodos

Nomes exatos podem variar; abaixo está o contrato típico no UsersService.

findById(userId: string)

findByEmail(email: string)

getMe(userId: string) — consolida dados do usuário logado

updateMe(userId: string, dto: UpdateUserDto)

setFcmToken(userId: string, token: string)

updateAvatar(userId: string, avatarUrl: string)

scheduleDeletion(userId: string, when?: Date) — agenda exclusão

Admin:

findAll(params: { page?; pageSize?; query?; role?; })

getByIdAdmin(id: string)

deleteByIdAdmin(id: string) (ou agenda)

Integrações internas (exemplos usuais):

NotificationsService.send(...) para avisos (ex.: perfil atualizado)

QueuesService.addNotificationJob(...) ou workers específicos

ProvidersService para compor perfis de prestadores

(Opcional) MissionsService.trackEvent(userId, 'user.profile_updated') se quiser gamificar onboarding

Autorização

GET /users/me, PATCH /users/me, PATCH /users/me/* → JwtAuthGuard

Rotas administrativas → JwtAuthGuard + RolesGuard(@Roles(ADMIN))

Erros comuns:

401 Unauthorized — token ausente/ inválido

403 Forbidden — sem permissão de role

404 Not Found — usuário não existe

409 Conflict — tentativas de atualizar campos únicos (ex.: phone) já usados

400 Bad Request — DTO inválido

Exemplos (cURL)

Obter “me”

curl -H "Authorization: Bearer <JWT>" \
  http://localhost:3000/users/me


Atualizar “me”

curl -X PATCH -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"fullName": "Jane Doe", "phone": "+55 21 90000-0000"}' \
  http://localhost:3000/users/me


Atualizar FCM

curl -X PATCH -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"fcmToken": "fcm_123"}' \
  http://localhost:3000/users/me/fcm-token


(Admin) Buscar usuário por ID

curl -H "Authorization: Bearer <ADMIN_JWT>" \
  http://localhost:3000/users/<userId>

Integrações com outros módulos

Auth: rota protegida via JWT; UsersService pode ser usado pelo Auth para carregar “me”.

Providers: criação/edição de dados do prestador exige vinculação com User (via userId).

Queues/Notifications: mensagens assíncronas (boas-vindas, alteração de perfil).

Missions: opcionalmente pode-se invocar MissionsService.trackEvent em marcos do usuário (ex.: completar perfil). Hoje, os principais eventos de missão vêm de Bookings/Reviews/Referrals.

Loyalty: normalmente gerido por Bookings/Reviews; o Users pode consultar pontos para UI se necessário.

Boas práticas & Segurança

Nunca retornar passwordHash.

Sanitize de campos de perfil (tamanho, encoding).

Para phone e email, validar formato e unicidade.

Evitar expor fcmToken publicamente.

Em deleção, preferir soft delete e “anônimização” quando exigido por LGPD.

Logar mudanças sensíveis (auditoria).

Testes (sugestões)

Unit:

updateMe() atualiza apenas campos permitidos.

conflito de phone/email dispara 409.

setFcmToken() persiste corretamente e aceita updates.

E2E:

GET /users/me com/sem JWT.

PATCH /users/me bloqueia campos não permitidos.

Rotas ADMIN respeitam RolesGuard.

Observabilidade

Logs no UsersService para trilhar ações críticas (atualizações de perfil).

Sentry integrado no app para rastrear exceções.

Métricas (se habilitadas): contagem de updates, erros 4xx/5xx.

Migrações & Dados

Prisma migrations incluem o modelo User e relações.

Caso adicione novos campos sensíveis (ex.: RG, data de nascimento),
atualize DTOs, validações e políticas LGPD.

Roadmap (opcional)

Preferências do usuário (notificação/email/push granular)

Integração mais profunda com Missions (ex.: evento ao completar onboarding)

Self-service account deletion com janela de arrependimento

Verificação de e-mail/telefone com fluxos dedicados