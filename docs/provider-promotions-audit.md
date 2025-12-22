# Auditoria: Provider Promotions

## 1. Panorama atual

- **Cupons:** `backend-cleaning/src/coupons/coupons.service.ts` valida status (`CouponStatus`), validade, limite (`maxUses`), escopo (`CouponTarget`) e primeira reserva (`firstBookingOnly`). O controlador `backend-cleaning/src/coupons/coupons.controller.ts` permite que apenas `UserRole.ADMIN` crie/edite cupons; clientes chamam `/coupons/apply` e `/coupons/resolve/:code`. O `schema.prisma` define `Coupon`, `CouponUsage` e `CouponReservation`, mas não há rota pública nem permissão para providers escreverem.
- **Missões & Loyalty:** `backend-cleaning/src/missions/missions.service.ts` rastreia progresso via `MissionsProgressService`, gera `MissionViewDto` e só autoriza resgate após `MissionStatus.COMPLETED`. `loyalty.service.ts` adiciona pontos com multiplicadores e transforma pontos em cupons (`redeemPoints` chama `CouponsService.create`). O fluxo atual já emite cupons para providers/clientes sem necessidade de permissão adicional.
- **Ganhos:** `earnings.service.ts` calcula `totalGrossSales`, `availableForWithdrawal` e empacota `ProviderEarningsViewDto`. Saques exigem `VerificationStatus.APPROVED` e validações rígidas no `payouts.service.ts`.
- **Front provider:** `app/provider/index.tsx`, `app/provider/schedule/index.tsx` e `components/provider/*` exibem agenda, ganhos e atalhos. O novo `ProviderNavBar` já aponta `/provider/promotions`, buscando o futuro endpoint.

## 2. Gaps identificados

- Não há endpoint que agregue cupons específicos do provider, missões e sinais de earnings em um só objeto para o app.
- Providers só consomem dados (sem criar cupons) e a UI existente não expõe uma central de leitura.
- O backend tem `CouponReservation` e `Coupon.target = SPECIFIC_PROVIDER`, mas nenhuma rota para listar cupons ativos por provider.
- O cliente continua consumindo `/coupons/apply`; qualquer mudança deve preservar esse contrato.

## 3. Riscos

- Criar cupons diretamente no app quebraria o modelo atual (admin-only). Qualquer promoção assinável deve vir de roles superiores.
- Regras de desconto são controladas em `CouponsService.applyCoupon`; duplicar lógica no frontend causaria divergências ao verificar `targetId`, `firstBookingOnly`, etc.
- Sem uma rota segura, providers poderiam ver cupons globais ou fora do escopo; o endpoint deve filtrar por `targetId = provider.id` e `status = ACTIVE`.
- As missões já retornam `MissionViewDto` com status; o frontend não deve interpretar enums.

## 4. Próximos passos para produção

- Criar endpoint GET `/providers/promotions-center` (JwtAuthGuard + RolesGuard + @Roles(PROVIDER)) que retorna `ProviderPromotionsCenterViewDto`.
- Reusar DTOs existentes (`MissionViewDto`, `ProviderEarningsViewDto`); adicionar apenas um resumo de cupons e loyalty.
- Garantir performance com uma única query de cupons + joins mínimos.
- Conectar a tela `app/(provider)/promotions` ao novo endpoint e manter `/provider/promotions` – UI apenas renderiza dados e usa `RefreshControl`.
