# Providers Module

`ProvidersModule` centralizes all provider-facing flows: discovery, profile management, search/ranking, avatar uploads, settings (radius), metrics, offers and admin controls. Ele injeta `PrismaModule`, `UsersModule`, `VerificationModule`, `CacheModule`, `DocumentProcessingModule` e `SettingsModule` para compor dados ricos e proteger os endpoints (JWT + roles).

## Arquitetura e dependências

- **Module** – `providers.module.ts` importa os módulos auxiliares necessários (usuário, verificação, cache, documentação e settings) e exporta `ProvidersService`.
- **Controller** – `ProvidersController` aplica `JwtAuthGuard` para rotas autenticadas e `RolesGuard` com `@Roles` para trechos `PROVIDER`/`ADMIN`; usa `swagger` para documentar queries geoespaciais, filtros e upload de avatar.
- **Service** – `ProvidersService` orquestra `PrismaService` (incluindo `providerServices`, `availability`, `reviewsReceived`, `bookings`), `CacheService`, `DocumentProcessingService`, `SettingsService`, e lógica de geocoding para manter dados consistentes (avatar, radius, metrics).
- **DTOs/Models** – `ProviderDetailsDto`, `ProviderSearchDto`, `UpdateProviderProfileDto`, `ProviderMetricsDto`, `ProviderSettingsDto`, além de utilitários como `ProviderWithIncludes` e `ProviderWithCalculatedRating`.

## Endpoints principais (`providers.controller.ts`)

| Método | Rota | Guardas | Responsabilidade |
| --- | --- | --- | --- |
| `GET /providers/recommended` | público | nenhum | `findTopRatedOrExperiencedProviders` calcula distância (opcional) e retorna cards com rating/nextAvailable. Fallback garantido para evitar 500. |
| `GET /providers/nearby` | público | nenhum | Recebe `latitude/longitude/radius/sortBy` e delega a `findAllProviders` (limite 10) com coerção de query params. |
| `GET /providers` | público | nenhum | Busca geral com filtros textuais, `serviceId`, `location`, `minRating`, `limit/offset`, `sortBy`, `radius`; mapeia resultado para `ProviderDetailsDto`. |
| `GET /providers/me` | `JwtAuthGuard` + `RolesGuard` + `@Roles(PROVIDER)` | Puxa perfil autenticado (`findByUserId`), loga e devolve DTO atualizado (metrics recalculados). |
| `PATCH /providers/me` | mesmo guard | Atualiza via `updateByUserId`, valida `userId`, sanitiza bio e radius, recalcula caches e DTO final. |
| `POST /providers/me/avatar` | `JwtAuthGuard` + `RolesGuard` + `@Roles(PROVIDER)` | Upload Multipart via `FileInterceptor`, chama `updateAvatar(file)` (DocumentProcessing -> getSignedUrl) e retorna URL. |
| `PUT /providers/me/settings` | `JwtAuthGuard` + `RolesGuard` + `@Roles(PROVIDER)` | Persiste raio com `settingsService.setProviderRadiusKm` (1..200 km). |
| `GET /providers/me/settings` | same guard | Recupera raio com fallback 15 km via `SettingsService`. |
| `GET /providers/:providerId/metrics` | público | Retorna `ProviderMetricsDto` (via service). |
| `GET /providers/:providerId/offers` | público | Retorna ofertas (`OfferDetailsDto`) mapeadas a partir de `PrismaOffer`. |
| `PATCH /providers/:id` | admin | `@Roles(ADMIN)` | Atualiza perfil de qualquer provider (via `updateById`). |
| `GET /providers/:id` | público | | Mostra `ProviderDetailsDto` com métricas/distance/badges. |
| `DELETE /providers/:id` | `@Roles(ADMIN)` | Remove provider (delegando `remove`). |

## Fluxos do `ProvidersService` (`providers.service.ts`)

1. **Recomendações e geocoding** – `findTopRatedOrExperiencedProviders` e `findAllProviders` aceitam coordenadas, calculam distância e nextAvailable usando `availability`, e enriquecem com `nextAvailable`, `badges`, `rating`, `acceptanceRate` (aproveitando `ProviderWithIncludes` com reviews/bookings). Campos sensíveis passam por sanitização (bio/fullName) e `DocumentationProcessingService` fornece `avatarUrl`.
2. **Busca** – `search` avalia `ProviderSearchDto` (`searchTerm`, `serviceId`, `location`, `minRating`, `sortBy`, `radius`, `page`, `pageSize`) e combina `RankingService` (ranking score) com consultas geoespaciais e `CacheService` para acelerar. Resultados são mapeados para `ProviderDetailsDto` com `ProviderServiceOfferingDto`.
3. **Perfil do provedor logado** – `findByUserId`, `updateByUserId`, `updateAvatar` usam `Prisma` para encontrar provider pelo `userId`, persistem mudanças (fullName, bio, radiusKm, cityIds), fazem geocoding (quando endereço manipulado) e invalidam caches se necessário; `updateAvatar` faz upload via `DocumentProcessingService.uploadProviderAvatar` e retorna URL.
4. **Admin/metrics/offers** – `updateById` (admin) reutiliza a mesma validação; `getProviderPerformanceMetrics` agrega contadores (acceptanceRate, responseTime, bookings, reviews) e `getProviderOffers` retorna `PrismaOffer[]` para o DTO.
5. **Settings (radius)** – `saveMySettings`/`getMySettings` utilizam `SettingsService` para armazenar individualmente cada provider (chave `settings:provider:radius_km:{providerId}`) com limites 1..200 km.
6. **Remoção** – `remove` apaga o provider (usa Prisma) e atualiza logs; utilizado por admins.

## DTOs e modelos

- **`ProviderDetailsDto`** – combina dados de `Provider`, `providerServices`, `reviewsReceived`, `bookings`, `availability`, `DocumentProcessing` (avatar) e `ProviderMetricsDto`.
- **`ProviderSearchDto`** – encapsula filtros geoespaciais e de ranking, usado por `search`.
- **`UpdateProviderProfileDto`** – aceita `fullName`, `bio`, `avatar`, `baseCity`, `radiusKm`, `cityIds`.
- **`ProviderMetricsDto`** – expõe métricas (rating, acceptance rate, response time, completed jobs).
- **`ProviderSettingsDto`** – apenas `serviceRadiusKm`.
- **`ProviderWithIncludes`** – Prisma payload com `user`, `address`, `providerServices`, `reviewsReceived`, `bookings`, `availability`.

## Observabilidade e segurança

- **Guards + Roles** – JWT protege endpoints /self/ e admin, `RolesGuard` aplica papéis (`PROVIDER`, `ADMIN`).
- **Logging** – o controller e o service usam `Logger` para rastrear fluxos (busca, atualizações, uploads) e tratar fallback de recomendações sem breaking errors.
- **Cache + Settings** – `CacheService` acelera buscas e `SettingsService` mantém raio por provider. `DocumentProcessingService` gera URLs assinadas e sanitiza inputs (bio/etc.).
- **Rate limiting e sanitização** – `search` captura `limit/offset`, `radius` com `Number(...)`, `updateProfile` valida `radiusKm`, `avatar` precisa ser multipart file.

## Recomendações

1. Garanta que `SettingsModule` esteja configurado (TTL/idade) antes de expor `/providers/me/settings`; o README aponta limite 1..200 km para evitar overfetch de buscas.  
2. Mantenha `DocumentProcessingService` e Storage em sincronia (avatar signed URLs) para que `updateAvatar` nunca retorne 404.  
3. Para novas métricas, atualize tanto `ProviderDetailsDto` quanto `ProviderMetricsDto` e reflita os campos nos endpoints `/:providerId/metrics` e `/recommended`.
