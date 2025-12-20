# Módulo Auth

O `AuthModule` é a fundação de segurança do backend Limpeja: expõe registro/login, gera JWTs, protege rotas com guardas e centraliza regras de negócios como geocoding de endereços, validação de CPF/telefone, envio de e-mail de reset e vinculação de indicações. Ele junta `PrismaModule`, `JwtModule` (configurado via `ConfigService`), `EmailModule`, `GeocodingModule` e `ReferralsModule` dentro do escopo de autenticação.

## Arquitetura e dependências

- **auth.module.ts** – importa `PrismaModule`, `PassportModule`, `JwtModule.registerAsync(...)` (segredo `JWT_SECRET`, `JWT_EXPIRATION_TIME`), `forwardRef` para `UsersModule`, `ProvidersModule`, `ReferralsModule` e provê `EmailModule`/`GeocodingModule`. Registra os guardas (`LocalStrategy`, `JwtStrategy`, `WsAuthGuard`) e exporta `AuthService`, `JwtModule` e `WsAuthGuard`.
- **auth.controller.ts** – define o prefixo `/auth`, usa `LocalAuthGuard` apenas no login e aplica `Logger` + Swagger (`ApiTags`, `ApiOperation`, `ApiResponse`). Expõe quatro endpoints principais (`register/client`, `register/provider`, `login`, `forgot-password`).
- **auth.service.ts** – encapsula toda a validação e persistência (Prisma), hashing com `bcrypt`, geração de JWTs (`JwtService`), envio de e-mail (`EmailService`), geocoding de endereço (`GeocodingService`), criação de perfis (User/Client/Provider), e integrações de indicação (`ReferralsService`).
- **Guards/Strategies/Decorators** – `local-auth.guard`, `jwt-auth.guard`, `roles.guard`, `ws-auth.guard`, `local.strategy`, `jwt.strategy`, `roles.decorator` (para endpoints administrativos). São reusados por outros módulos que dependem de autenticação.
- **DTOs** – `register-client.dto`, `register-provider.dto`, `login.dto`, `forgot-password.dto`, `phone-auth.dto`, `auth-response.dto` tipam todas as entradas/saídas dos endpoints.

## Endpoints principais (auth.controller.ts)

| Método | Rota | Guardas | Responsabilidade |
| --- | --- | --- | --- |
| `POST /auth/register/client` | registro de cliente | `Jwt` guard *não* usado (acesso público) | Valida e-mail/telefone/CPF únicos, gera `User/Client/Address`, salva geolocalização via `GeocodingService`, loga telemetria (`client_registered`) e retorna JWT+perfil. |
| `POST /auth/register/provider` | registro de provedor | público | Cria `User` → `Provider`, valida CPF/email/telefone, normaliza `latitude/longitude`, grava endereço com `location` geoespacial, define `VerificationStatus.PENDING_INITIAL_REVIEW`, logs para telemetria (`provider_registered`). |
| `POST /auth/login` | login e-mail/senha | `@UseGuards(LocalAuthGuard)` via passport local | Gera JWT com payload `{ email, sub, role }`, inclui dados de `client`/`provider` (bookings, reviews, services, loyalty, referrals) para o DTO, captura telemetria `user_logged_in`. |
| `POST /auth/forgot-password` | disparo de e-mail de reset | público (rate limiting opcional) | Gera token JWT com 1h de validade, monta `resetLink`, envia e-mail via `EmailService`, loga eventos `forgot_password_email_sent/failed`. |

## Fluxos críticos do AuthService

1. **Login** – usa `Prisma` para reconstruir o usuário (`client`, `provider`, `loyalty`, `referrals`), calcula `client.noShowCount/cancellationCount`, monta `UserProfileDto`, cria token com `JwtService` e telemetria.
2. **Registro de clientes** – valida unicidade (email, phone, CPF), hash com `bcrypt`, cria `User`+`Client`+`Address`, aplica `ST_GeomFromText` para persistir `location`, e dispara `handleReferralCode` quando `referralCode` presente.
3. **Registro de provedores** – valida `dateOfBirth`, dados obrigatórios e unicity, cria `User` simples primeiro, depois `Provider` e `Address`, ajusta `location` geoespacial, registra `VerificationStatus.PENDING_INITIAL_REVIEW`, e também chama `handleReferralCode`.
4. **Reset de senha** – monta um JWT de 1 hora, usa `appBaseUrl` do config para gerar link de reset no front, e envia e-mail em HTML/text/plain. Falhas de envio são logadas mas não quebram a rota.
5. **Indicações** – `handleReferralCode` resolve `myReferralCode`, protege o uso de códigos antigos (fallback apenas em dev via userId) e delega para `ReferralsService.createReferral`.

## Validação, erros e telemetria

- Usa `PrismaClientKnownRequestError` para mapear `P2002` (emails telefones/CPFs duplicados), `P2000` (dados inválidos), `P2025`/`P2021` e traduz para `ConflictException`, `BadRequestException`, `NotFoundException`.
- `Logger` captura inputs sensíveis (no máximo sem senha) e metas, e adiciona eventos `TELEMETRY` nos fluxos de registro/login/reset.
- `AuthController` prepara mensagens amigáveis (`UnauthorizedException` com log) e pode ser protegido por `ThrottlerGuard` no futuro para evitar brute force.

## Segurança e JWT

- `JwtModule` usa `JWT_SECRET` e `JWT_EXPIRATION_TIME` do `.env`.
- `LocalStrategy` valida `email/password` e expõe `request.user`.
- `JwtStrategy` verifica `Authorization: Bearer <token>` e preenche `req.user`.
- `WsAuthGuard` garante que conexões WebSocket aproveitem o mesmo token e reúsese `JwtStrategy`.
- Possível expansão: `RolesGuard` + `@Roles` podem restringir rotas sensíveis (ex: `admin`).

## Integrações e utilitários

- **PrismaService** – manipula `User`, `Client`, `Provider`, `Address`, `Booking`, `Review` e `Referral` com includes preparados (`loginProviderInclude`, `loginClientInclude`).
- **GeocodingService** – transforma endereços em coordenadas e atualiza `Address.location` via SQL geoespacial (PostGIS `ST_GeomFromText`). Loga normalização de lat/lng e falhas.
- **EmailService** – usado pelo `forgotPassword` para enviar e-mail text/html com link de reset e TTL visível (1h).
- **ReferralsService** – registra vínculos de indicação com `createReferral`, respeitando `myReferralCode`; fallback para `userId` só em dev para compatibilidade.
- **ConfigService** – fornece `jwt.expirationTime`, `appBaseUrl`, `NODE_ENV`.

## Recomendações

1. Proteja `/auth/login` e `/auth/forgot-password` com `ThrottlerGuard` ou rate limiting antes de expor ao público, evitando brute force.
2. Valide `referralCode` no front-end priorizando `myReferralCode` (não userId) para manter a auditoria limpa.
3. Documente os campos obrigatórios no DTO de registro (ex: `dateOfBirth` para provedores) para evitar `BadRequestException` no backend.
