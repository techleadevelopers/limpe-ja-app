# UI Spec — Componentes de Growth & Conforto (LimpeJá MVP)

> **Objetivo:** definir **quais componentes criar agora** (Tier 0) e **como** devem se comportar para suportar **Cupons, Missões, Referrals, Ranking, Safety e Notificações**, seguindo os **Princípios de Motion & Conforto** fornecidos. Foco em **mobile‑first** (React Native/Expo) com **Reanimated** e estados acessíveis.

---

## 0) Princípios (tokens resumidos)

* **Motion**: `md=250ms` entradas (fade + slide‑up 16), `stagger=50–60ms` listas, **press** scale‑in `0.96` (spring), **count‑up** `380–520ms`.
* **Acessibilidade**: "Reduzir movimento" ⇒ limitar durações a `≤120ms`, remover loops decorativos.
* **Cores**: CTA primário `#4A90E2` (pressed `#2A72E7`), sucesso `#28A745`, atenção `#FFC107`, erro `#D32F2F`, neutros `#FFF/#F5F5F5`.
* **Cards**: fundo branco, raio `16–24`, sombra leve `rgba(0,0,0,0.06–0.12)`.

---

## 1) Cupons

### 1.1 `CouponWelcomeCard`

**Onde**: `app/(client)/explore/index.tsx`, abaixo do header e acima do `BannerCarousel`.

**Trigger**: `GET /offers` com `target=NEW_CUSTOMER` **e** elegibilidade confirmada via `GET /coupons/resolve/:code` (`firstBookingOnly`, `expiresAt`).

**Props**

```ts
type CouponWelcomeCardProps = {
  code: string;                // ex: BEMVINDO20
  title: string;               // ex: 20% OFF na 1ª faxina (cap R$50)
  subtitle?: string;           // ex: Válido por 7 dias
  expiresAt?: string;          // ISO p/ countdown opcional
  onUseNow: (code: string) => void; // deep‑link para schedule com param ?couponCode=
  onDismiss: () => void;            // minimiza em pill
};
```

**Motion**: **fade‑in + slide‑up 16** (`250ms`, easing *decel*). **Press**: scale `0.96` (spring). **Stagger** entre título/subtítulo/CTA `50ms`.

**UX**: aparece **1× por sessão**; botão **"Usar agora"**; link **"Regras"** (sheet). **Dismiss** vira `CouponPill` (flutuante).

**Telemetry**: `coupon_viewed`, `coupon_copied`, `coupon_applied` (no schedule), `coupon_redeemed` (pós‑booking).

**Edge**: se `resolve` falhar, não renderiza; se expirado, não mostra. Respeitar **reduzir movimento**.

---

### 1.2 `CouponPill`

**Onde**: flutuante discreto na home.

**Props**: `{ code, onOpenCard }`.

**Motion**: scale‑in sutil `0.98→1.0` (`180ms`).

---

### 1.3 `ReturnCouponCard`

**Onde**: `app/(client)/bookings/success.tsx` (pós‑serviço).

**Trigger**: emissão automática **retorno 7d** no back.

**Props**

```ts
type ReturnCouponCardProps = {
  code: string;
  title: string;         // "R$30 para usar em até 7 dias"
  expiresAt: string;     // ISO
  onBookAgain: (code: string) => void; // re‑agenda com cupom
};
```

**Motion**: fade‑in + slide‑up; **count‑down** discreto.

**Telemetry**: `coupon_viewed`, `coupon_applied` (no novo schedule).

---

### 1.4 `CouponApplyInline`

**Onde**: `app/(client)/schedule-service.tsx` (checkout/quote).

**Props**: `{ couponCode?: string, onResolve, resolving, error }`.

**UX**: input + botão **Aplicar**; mostra economia; estados: `valid/invalid/expired/firstBookingOnly`.

**Motion**: feedback **success** (scale `1.0→1.03→1.0`, `180ms`) e **erro** (shake leve `8px`, `140ms`).

**A11y**: anunciar estado via *accessibilityLiveRegion*.

---

## 2) Missões

### 2.1 `MissionReminderCard`

**Onde**: `bookings/success.tsx` + `app/(client)/home`.

**Caso principal**: **WITHIN\_WINDOW (avaliar em 48h)**.

**Props**

```ts
type MissionReminderCardProps = {
  missionId: string;
  title: string;     // "Avalie seu serviço"
  deadlineAt: string; // agora+48h
  reward: { kind: 'COUPON'|'POINTS'; value: number; };
  onGo: () => void;  // deep‑link p/ tela de avaliação
  onDismiss: () => void;
};
```

**Motion**: fade‑in; **pulse convidativo** discreto no CTA (`1.5–2.0s`). Respeitar "reduzir movimento".

**Telemetry**: `mission_started`, `mission_progress_updated`, `mission_claimed`.

---

### 2.2 `MissionProgressSnack`

**Onde**: home e `missions/index.tsx`.

**Caso**: **COUNT\_EVENT** ("3 reservas neste mês").

**Props**: `{ current: number, goal: number, onView }`.

**Motion**: **count‑up** de `current`, scale‑in de badge.

---

## 3) Referrals

### 3.1 `ReferralBanner`

**Onde**: home, aba *Benefícios*.

**Props**

```ts
type ReferralBannerProps = {
  code: string;              // do usuário
  rewardReferrer: string;    // "Ganhe R$20 ou +300 pts"
  rewardReferred: string;    // "Seu amigo ganha 20% na 1ª"
  onShare: () => void;       // share sheet
  onHowItWorks: () => void;  // abre sheet
};
```

**Motion**: fade + slide; botão share com **press‑in**.

**Telemetry**: `referral_created` (share), `referral_converted` (pós 1ª compra do amigo).

---

### 3.2 `ReferralSheet`

Sheet com explicação, **anti‑fraude** resumo e termos (LGPD).

---

## 4) Ranking & Performance (provedor)

### 4.1 `RankingBadge`

**Onde**: cards do provedor, perfil.

**Props**: `{ type: 'TOP_NEIGHBORHOOD'|'STREAK_10'|'SLA_90', until?: string }`.

**Motion**: **scale‑in sutil** (`0.98→1.0`, `180ms`); **shine** diagonal lento (2–3s) opcional.

**Atenção**: respeitar modo reduzido (sem shine).

---

### 4.2 `SLAResponseChip`

**Onde**: chat e perfil.

**Props**: `{ rate: number; avgResponseMin: number }`.

**Motion**: **respiração** mínima (1.0↔1.02, 3s) quando `rate≥90%`.

---

## 5) Safety & Suporte

### 5.1 `PanicBanner`

**Onde**: tela do booking (cliente e provedor) enquanto ativo.

**Props**: `{ onPanic: () => void }`.

**Motion**: nenhum loop; **botão** com press‑in/out. Estados: `ACKED/IN_ATTENDANCE` retornados via socket.

**A11y**: alta prioridade, contraste AA/AAA.

---

### 5.2 `SupportTicketStatus`

**Onde**: área de suporte.

**Props**: `{ status, slaETA }`.

**Motion**: **accordion** para timeline de ações.

---

## 6) Notificações

### 6.1 `NoticeToast`

**Onde**: global.

**Usos**: cupom emitido, cupom expirando, missão pronta pra claim.

**Props**: `{ kind: 'SUCCESS'|'INFO'|'WARNING', title, subtitle?, cta?: { label, onPress } }`.

**Motion**: slide‑down curto (top) `220ms`; **press** scale.

**Rate‑limit**: agrupar duplicadas; opção **digest** (Tier 1).

---

### 6.2 `NotificationCenterItem`

**Onde**: inbox de notificações.

**Props**: `{ icon, title, body, timeAgo, action? }`.

**Motion**: **stagger** na lista `50–60ms` por item.

---

## 7) Comuns (infra de UI)

### 7.1 `Sheet`

Bottom‑sheet padrão com backdrop; usado em regras de cupom, how‑it‑works, termos.

### 7.2 `Skeleton`

Listas/cards com shimmer `1.3–1.6s`.

### 7.3 `KPIValue`

**Count‑up** numérico com máscara locale; usado em ganhos, pontos, etc.

### 7.4 `EmptyState`

Estados vazios com CTA.

---

## 8) Integração com lógica de negócio (resumo)

* **Coupons**: `resolve/:code` (eligibilidade) → `apply` no schedule. Pós‑booking: `issueReturnCoupon`. Eventos: `coupon_*`.
* **Missions**: `trackEvent` (booking/review) → `claim` gera cupom/pontos. UI mostra prazo e progresso.
* **Referrals**: `generateCode` + share; conversão no `first_booking_completed`.
* **Ranking**: badges e SLA chip refletem boosts ativos.
* **Safety/Support**: pânico com ACK, incidentes com timeline.
* **Notifications**: toasts + inbox com deep‑link (ex.: abrir schedule com cupom aplicado).

---

## 9) Acessibilidade

* Áreas tocáveis `≥44px`.
* Anunciar estados (sucesso/erro) via *live region*.
* **Reduzir movimento**: durações `≤120ms`, remover loops; sem shine.
* Contraste AA em botões/links, principalmente em Safety/erro.

---

## 10) Telemetria (mapeamento por componente)

* `CouponWelcomeCard` → `coupon_viewed/clicked/applied`.
* `ReturnCouponCard` → `coupon_viewed/applied`.
* `MissionReminderCard` → `mission_started/claimed`.
* `MissionProgressSnack` → `mission_progress_updated`.
* `ReferralBanner` → `referral_created`.
* `RankingBadge` → `badge_viewed` (opcional).
* `NoticeToast` → `notification_clicked`.

---

## 11) QA checklist (Tier 0)

* **Cupons**: novo cliente, 1º booking, expirado, inválido, pill → card.
* **Missão 48h**: janela, claim em tempo, sem duplicidade.
* **Referrals**: share + conversão + antifraude básico.
* **Ranking**: badge + SLA chip variando com métricas.
* **Safety**: pânico ACK ≤5min; estados corretos no banner.
* **Acessibilidade**: reduzir movimento, labels, leitura por screen reader.

---

## 12) Estrutura de pastas (sugestão)

```
app/
  (client)/explore/index.tsx
  (client)/schedule-service.tsx
  (client)/bookings/success.tsx
  (client)/missions/index.tsx
components/
  coupons/CouponWelcomeCard.tsx
  coupons/CouponPill.tsx
  coupons/ReturnCouponCard.tsx
  coupons/CouponApplyInline.tsx
  missions/MissionReminderCard.tsx
  missions/MissionProgressSnack.tsx
  referrals/ReferralBanner.tsx
  referrals/ReferralSheet.tsx
  ranking/RankingBadge.tsx
  ranking/SLAResponseChip.tsx
  safety/PanicBanner.tsx
  support/SupportTicketStatus.tsx
  ui/NoticeToast.tsx
  ui/Sheet.tsx
  ui/Skeleton.tsx
  ui/KPIValue.tsx
  ui/EmptyState.tsx
```

---

## 13) Feature flags & Config

* `coupons.welcome.enabled`
* `coupons.return.enabled`
* `missions.review48h.enabled`
* `referrals.simple.enabled`
* `ranking.boosts.enabled`
* `notifications.digest.enabled` (Tier 1)

---

## 14) Roadmap visual (Tier 0 → 1)

* **Semana 1 (go‑live)**: `CouponWelcomeCard`, `CouponApplyInline`, `ReturnCouponCard`, `MissionReminderCard`, `ReferralBanner`, `RankingBadge`, `SLAResponseChip`, `NoticeToast`, `PanicBanner`.
* **Semanas 2–4**: `MissionProgressSnack`, `NotificationCenterItem`, `ReferralSheet`, `KPIValue`, `Skeleton` refinado, `SupportTicketStatus` completo.

---

## 15) Notas finais

* Siga **temporalidade previsível** e **hierarquia guiada por movimento**; nada deve saltar de forma inesperada.
* Todos os CTAs críticos devem ter **press‑in/ou** com spring suave (sem overshoot visível).
* Em testes A/B, **não altere** simultaneamente copy **e** motion — isole variáveis.
