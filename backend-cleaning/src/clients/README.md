# Módulo Clients

O `ClientsModule` expõe APIs para clientes acessarem seu dashboard, atualizarem o perfil e permite que administradores consultem/alterem registros. Ele injeta `PrismaModule` para persistência e usa `forwardRef` com `UsersModule` para resolver dependências circulares relacionadas a identidade/autenticação.

## Arquitetura e dependências

- **clients.module.ts** – importa `PrismaModule` e `forwardRef(() => UsersModule)`; registra o controller e o service e exporta o `ClientsService`.
- **clients.controller.ts** – aplica `JwtAuthGuard` + `RolesGuard` com `@Roles` (`CLIENT` para operações próprias, `ADMIN` para suporte) e loga cada operação por meio de `Logger`.
- **clients.service.ts** – centraliza lógica de leitura/atualização: busca clientes (`findClientById`, `findClientByUserId`), atualiza perfis (com geocoding `geocodeAddress`, tratamento de `Address`, `ST_SetSRID`), monta o dashboard (bookings, reviews, popular services) e adiciona telemetria (`client_profile_updated`).
- **DTOs/Entities** – `UpdateClientProfileDto`, `ClientDashboardDto`, `ClientEntity` modelam entradas e saídas; o service transforma dados PRISMA para resposta.
- **Utilitários** – `geocodeAddress` (em `utils/geocoding.service.ts`) ajuda a normalizar lat/lon quando o cliente envia endereço parcial.

## Endpoints (`clients.controller.ts`)

| Método | Rota | Guardas + Papel | Responsabilidade |
| --- | --- | --- | --- |
| `GET /clients/me/dashboard` | dashboard do cliente logado | `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.CLIENT)` | Busca `client` via `userId`, valida existência, e retorna `ClientDashboardDto` aglomerando bookings pendentes/completos, próximo booking, listagem recente, serviços populares e reviews pendentes. |
| `PATCH /clients/me` | atualizar perfil do logado | mesmos guardas acima | Valida `userId`, busca `client`, normaliza os dados (phone, fullName) e delega `clientsService.updateClient` (faz upsert em endereço, geocode e atualiza campo `location`). |
| `GET /clients/:id` | buscar cliente por ID (admin) | `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.ADMIN)` | Retorna `ClientEntity` após buscar por PK; lança `NotFoundException` quando não existe. |
| `PATCH /clients/:id` | atualizar cliente por ID (admin) | mesmo bloqueio | Reutiliza `clientsService.updateClient` para aplicar `UpdateClientProfileDto` e devolver entidade atualizada. |

## Fluxos do ClientsService (`clients.service.ts`)

1. **`findClientById` / `findClientByUserId`** – usam Prisma (`include user, address, bookings, reviewsMade, _count`) e registram logs/avisos se não encontrarem o cliente.
2. **`updateClient`** – busca o cliente, prepara `addressUpsert` se o DTO contém endereço, usa `geocodeAddress` para buscar lat/lon, aplica fallback (mantém valores recebidos quando presente), atualiza `client` com dados simples e faz `ST_SetSRID(ST_MakePoint())` no `Address.location` quando as coordenadas existem; loga o evento e emite telemetria `client_profile_updated`.
3. **`getClientDashboardData`** – consulta o cliente com bookings+reviews, separa bookings pendentes/completos, calcula `nextBooking`, `recentBookings` (até 5), compila `popularServices` (placeholders hard-coded) e `pendingReviews` com base em bookings finalizados sem review; cria `ClientDashboardDto` contendo esses blocos e loga o resultado.

## Modelos e DTOs

- **`UpdateClientProfileDto`** – permita `fullName`, `phone`, `cpf`, `address` (street/number/complement/neighborhood/city/state/cep/lat/lon) e `marketingOptIn`. O controller aceita esse payload e o service decide o que persiste; note que o serviço atual só manipula `fullName`, `phone` e endereço (sem `cpf`, `marketingOptIn` ainda no código atual).
- **`ClientDashboardDto`** – contém `fullName`, contadores (`pendingBookingsCount`, `completedBookingsCount`), `nextBooking`, `recentBookings`, `popularServices` e `pendingReviews`; cada item é do tipo Prisma `Booking`/`Review` transformado para `BookingEntity`/`ReviewEntity`.
- **`ClientEntity`** – decorado para Swagger, representa o cliente retornado (campos do Prisma `Client` + relacionamentos).

## Observabilidade e segurança

- **Guardiões** – `JwtAuthGuard` e `RolesGuard` garantem que apenas usuários autenticados e com o papel adequado acessem os endpoints. O controller lança `NotFoundException` quando falta `userId` no token.
- **Logger** – cada método do controller e do serviço registra passos críticos (busca, atualização, erros) para facilitar auditoria.
- **Telemetria** – o serviço emite logs estruturados `"[TELEMETRY] client_profile_updated"` logo após atualizar os dados.
- **Geodados** – o service atualiza `Address.location` via raw SQL PostGIS (`ST_SetSRID(ST_MakePoint(...), 4326)`), então dependências geoespaciais devem estar preparadas (PostgreSQL + PostGIS).

## Recomendações e próximos passos

1. Harmonizar `UpdateClientProfileDto` com os campos tratados no service (CPF, marketingOptIn) antes de expor para o app mobile/web.  
2. Expandir `ClientDashboardDto` criando caches curtos (`clients:dashboard:{clientId}`) se o número de bookings crescer; atualize o cliente via eventos de booking/coupon/mission.  
3. Considerar locks/idempotência ao atualizar perfis (ex: `client:update:{clientId}`) para evitar race conditions quando há múltiplos dispositivos.
